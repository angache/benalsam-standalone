// Shared Rate Limiting Service with Redis
// Cross-platform rate limiting for login security

import { createClient } from 'redis';
// Local type definitions (will be moved to shared-types later)
interface RateLimitData {
  email: string;
  attempts: number;
  first_attempt: number;
  last_attempt: number;
  blocked: boolean;
  block_expiry?: number;
}

interface RateLimitResult {
  allowed: boolean;
  error?: 'PROGRESSIVE_DELAY' | 'TOO_MANY_ATTEMPTS' | 'ACCOUNT_LOCKED';
  timeRemaining: number;
  message?: string;
  attempts?: number;
}

interface RateLimitConfig {
  maxAttemptsPerWindow: number;
  windowMinutes: number;
  progressiveDelaySeconds: number;
  tempBlockMinutes: number;
  accountLockHours: number;
}

// Configuration
const RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxAttemptsPerWindow: 5,      // Max attempts in 5 minutes
  windowMinutes: 5,             // Time window in minutes
  progressiveDelaySeconds: 3,   // Delay after 2nd attempt
  tempBlockMinutes: 15,         // Block for 15 minutes after max attempts
  accountLockHours: 2           // Lock account for 2 hours after repeated blocks
};

const REDIS_KEY_PREFIX = 'rate_limit:';
const REDIS_BLOCK_PREFIX = 'rate_limit_block:';

class SharedRateLimitService {
  private redis: any;
  private isConnected = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      // Redis connection with Docker container name
      const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || '6379'}`;
      
      console.log('🔍 [Redis] Environment variables:');
      console.log('🔍 [Redis] REDIS_URL:', process.env.REDIS_URL);
      console.log('🔍 [Redis] REDIS_HOST:', process.env.REDIS_HOST);
      console.log('🔍 [Redis] REDIS_PORT:', process.env.REDIS_PORT);
      console.log('🔍 [Redis] Final URL:', redisUrl);
      
      this.redis = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              console.error('🔴 [Redis] Max retry attempts reached');
              return false;
            }
            const delay = Math.min(retries * 100, 3000);
            console.log(`🔄 [Redis] Reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
          }
        }
      });

      this.redis.on('error', (err: any) => {
        console.error('🔴 [Redis] Error:', err);
        this.isConnected = false;
      });

      this.redis.on('connect', () => {
        console.log('🟢 [Redis] Connected for rate limiting');
        this.isConnected = true;
      });

      await this.redis.connect();
    } catch (error) {
      console.error('🔴 [Redis] Failed to initialize:', error);
      this.isConnected = false;
    }
  }

  private getRedisKey(email: string): string {
    return `${REDIS_KEY_PREFIX}${email.toLowerCase()}`;
  }

  private getBlockKey(email: string): string {
    return `${REDIS_BLOCK_PREFIX}${email.toLowerCase()}`;
  }

  async checkRateLimit(email: string): Promise<RateLimitResult> {
    // Fallback to allow if Redis is not available
    if (!this.isConnected) {
      console.warn('⚠️ [RateLimit] Redis not connected, allowing request');
      return {
        allowed: true,
        timeRemaining: 0,
        attempts: 0
      };
    }

    try {
      const now = Date.now();
      const redisKey = this.getRedisKey(email);
      const blockKey = this.getBlockKey(email);

      // Check if account is blocked
      const blockData = await this.redis.get(blockKey);
      if (blockData) {
        const block = JSON.parse(blockData);
        const timeRemaining = Math.ceil((block.expiry - now) / 1000);
        
        if (timeRemaining > 0) {
          return {
            allowed: false,
            error: block.type === 'ACCOUNT_LOCKED' ? 'ACCOUNT_LOCKED' : 'TOO_MANY_ATTEMPTS',
            timeRemaining,
            attempts: block.attempts || 0,
            message: block.type === 'ACCOUNT_LOCKED' 
              ? `Hesabınız ${RATE_LIMIT_CONFIG.accountLockHours} saat kilitlendi. ${Math.ceil(timeRemaining / 60)} dakika kaldı.`
              : `Çok fazla deneme! ${Math.ceil(timeRemaining / 60)} dakika bekleyin.`
          };
        } else {
          // Block expired, remove it
          await this.redis.del(blockKey);
        }
      }

      // Get current attempts in the time window
      const windowStart = now - (RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000);
      
      // Get all attempts in the current window
      const attempts = await this.redis.zRangeByScore(redisKey, windowStart, now);
      const currentAttempts = attempts.length;

      console.log(`🛡️ [RateLimit] Check for ${email}: ${currentAttempts}/${RATE_LIMIT_CONFIG.maxAttemptsPerWindow} attempts`);
      console.log(`🛡️ [RateLimit] Window: ${new Date(windowStart).toISOString()} to ${new Date(now).toISOString()}`);

      // Check for progressive delay (after 2nd attempt)
      if (currentAttempts >= 2) {
        try {
          const lastAttemptData = await this.redis.zRange(redisKey, -1, -1, { REV: true, WITHSCORES: true });
          if (lastAttemptData.length > 0 && lastAttemptData[0] && lastAttemptData[0].score) {
            const lastTime = parseInt(lastAttemptData[0].score.toString());
            const timeSinceLastAttempt = now - lastTime;
            const requiredDelay = RATE_LIMIT_CONFIG.progressiveDelaySeconds * 1000;
            
            if (timeSinceLastAttempt < requiredDelay) {
              const timeRemaining = Math.ceil((requiredDelay - timeSinceLastAttempt) / 1000);
              return {
                allowed: false,
                error: 'PROGRESSIVE_DELAY',
                timeRemaining,
                attempts: currentAttempts,
                message: `Çok hızlı deneme! ${timeRemaining} saniye bekleyin.`
              };
            }
          }
        } catch (progressiveError) {
          console.warn('🔴 [RateLimit] Progressive delay check failed:', progressiveError);
          // Continue without progressive delay if there's an error
        }
      }

      // Check if max attempts reached
      if (currentAttempts >= RATE_LIMIT_CONFIG.maxAttemptsPerWindow) {
        // Create temporary block
        const blockExpiry = now + (RATE_LIMIT_CONFIG.tempBlockMinutes * 60 * 1000);
        await this.redis.setEx(
          blockKey,
          RATE_LIMIT_CONFIG.tempBlockMinutes * 60,
          JSON.stringify({
            type: 'TOO_MANY_ATTEMPTS',
            expiry: blockExpiry,
            attempts: currentAttempts
          })
        );

        return {
          allowed: false,
          error: 'TOO_MANY_ATTEMPTS',
          timeRemaining: RATE_LIMIT_CONFIG.tempBlockMinutes * 60,
          attempts: currentAttempts,
          message: `Çok fazla deneme! ${RATE_LIMIT_CONFIG.tempBlockMinutes} dakika bekleyin.`
        };
      }

      return {
        allowed: true,
        timeRemaining: 0,
        attempts: currentAttempts
      };

    } catch (error) {
      console.error('🔴 [RateLimit] Check error:', error);
      // Fallback to allow on error
      return {
        allowed: true,
        timeRemaining: 0,
        attempts: 0
      };
    }
  }

  async recordFailedAttempt(email: string): Promise<void> {
    if (!this.isConnected) {
      console.warn('⚠️ [RateLimit] Redis not connected, skipping record');
      return;
    }

    try {
      const now = Date.now();
      const redisKey = this.getRedisKey(email);
      
      // Add failed attempt to sorted set with timestamp as score
      await this.redis.zAdd(redisKey, { score: now, value: `attempt_${now}` });
      
      // Set expiry for the key (cleanup old data)
      await this.redis.expire(redisKey, RATE_LIMIT_CONFIG.windowMinutes * 60);
      
      // Clean old attempts outside the window
      const windowStart = now - (RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000);
      await this.redis.zRemRangeByScore(redisKey, 0, windowStart);

      console.log(`🚨 [RateLimit] Failed attempt recorded for ${email}`);

    } catch (error) {
      console.error('🔴 [RateLimit] Record error:', error);
    }
  }

  async resetRateLimit(email: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const redisKey = this.getRedisKey(email);
      const blockKey = this.getBlockKey(email);
      
      // Remove all failed attempts and blocks
      await Promise.all([
        this.redis.del(redisKey),
        this.redis.del(blockKey)
      ]);

      console.log(`✅ [RateLimit] Reset for successful login: ${email}`);

    } catch (error) {
      console.error('🔴 [RateLimit] Reset error:', error);
    }
  }

  async getRateLimitStatus(email: string): Promise<{
    attempts: number;
    blocked: boolean;
    timeRemaining: number;
    nextResetTime: number;
  }> {
    if (!this.isConnected) {
      return {
        attempts: 0,
        blocked: false,
        timeRemaining: 0,
        nextResetTime: 0
      };
    }

    try {
      const now = Date.now();
      const redisKey = this.getRedisKey(email);
      const blockKey = this.getBlockKey(email);

      // Check if blocked
      const blockData = await this.redis.get(blockKey);
      if (blockData) {
        const block = JSON.parse(blockData);
        const timeRemaining = Math.max(0, Math.ceil((block.expiry - now) / 1000));
        
        return {
          attempts: block.attempts || 0,
          blocked: timeRemaining > 0,
          timeRemaining,
          nextResetTime: block.expiry
        };
      }

      // Get current attempts
      const windowStart = now - (RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000);
      const attempts = await this.redis.zRangeByScore(redisKey, windowStart, now);
      
      return {
        attempts: attempts.length,
        blocked: false,
        timeRemaining: 0,
        nextResetTime: windowStart + (RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000)
      };

    } catch (error) {
      console.error('🔴 [RateLimit] Status error:', error);
      return {
        attempts: 0,
        blocked: false,
        timeRemaining: 0,
        nextResetTime: 0
      };
    }
  }

  async cleanup(): Promise<void> {
    if (this.redis && this.isConnected) {
      await this.redis.quit();
    }
  }
}

export { SharedRateLimitService };
export const sharedRateLimitService = new SharedRateLimitService();