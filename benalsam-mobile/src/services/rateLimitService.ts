// Rate Limiting Service for Mobile Login Security
// Prevents brute force attacks with progressive delays and account lockout

import AsyncStorage from '@react-native-async-storage/async-storage';

interface RateLimitData {
  email: string;
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
  blockExpiry?: number;
}

interface RateLimitResult {
  allowed: boolean;
  error?: 'PROGRESSIVE_DELAY' | 'TOO_MANY_ATTEMPTS' | 'ACCOUNT_LOCKED';
  timeRemaining: number;
  message?: string;
  attempts?: number;
}

const RATE_LIMIT_KEY_PREFIX = 'rate_limit_';

// Configuration
const MAX_ATTEMPTS_PER_5MIN = 5;     // Max attempts in 5 minutes
const MAX_ATTEMPTS_PER_HOUR = 10;    // Max attempts in 1 hour  
const PROGRESSIVE_DELAY_SECONDS = 3; // Delay after 2nd attempt
const TEMP_BLOCK_MINUTES = 15;       // Block for 15 minutes after 5 attempts
const ACCOUNT_LOCK_HOURS = 2;        // Lock account for 2 hours after 10 attempts

class RateLimitService {
  
  private getStorageKey(email: string): string {
    return RATE_LIMIT_KEY_PREFIX + email.toLowerCase();
  }

  private async getRateLimitData(email: string): Promise<RateLimitData> {
    try {
      const stored = await AsyncStorage.getItem(this.getStorageKey(email));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading rate limit data:', error);
    }
    
    return {
      email: email.toLowerCase(),
      attempts: 0,
      firstAttempt: Date.now(),
      lastAttempt: 0,
      blocked: false
    };
  }

  private async saveRateLimitData(email: string, data: RateLimitData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.getStorageKey(email), JSON.stringify(data));
    } catch (error) {
      console.error('Error saving rate limit data:', error);
    }
  }

  async checkRateLimit(email: string): Promise<RateLimitResult> {
    const now = Date.now();
    const data = await this.getRateLimitData(email);
    
    console.log('🛡️ [RateLimit] Checking for:', email, {
      attempts: data.attempts,
      blocked: data.blocked,
      lastAttempt: new Date(data.lastAttempt).toLocaleTimeString()
    });

    // Check if account is permanently locked
    if (data.blocked && data.blockExpiry && now < data.blockExpiry) {
      const timeRemaining = Math.ceil((data.blockExpiry - now) / 1000);
      return {
        allowed: false,
        error: 'ACCOUNT_LOCKED',
        timeRemaining,
        attempts: data.attempts,
        message: `Hesabınız güvenlik nedeniyle kilitlendi. ${Math.ceil(timeRemaining / 60)} dakika sonra tekrar deneyin.`
      };
    }

    // Reset block if expired
    if (data.blocked && data.blockExpiry && now >= data.blockExpiry) {
      data.blocked = false;
      data.blockExpiry = undefined;
      data.attempts = 0;
      await this.saveRateLimitData(email, data);
    }

    // Check 5-minute window
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    if (data.firstAttempt < fiveMinutesAgo) {
      // Reset counter if outside 5-minute window
      data.attempts = 0;
      data.firstAttempt = now;
    }

    // Check recent attempts for account lockout
    const recentAttempts = data.attempts;

    // Account lockout check (10+ attempts in 1 hour)
    if (recentAttempts >= MAX_ATTEMPTS_PER_HOUR) {
      data.blocked = true;
      data.blockExpiry = now + (ACCOUNT_LOCK_HOURS * 60 * 60 * 1000);
      await this.saveRateLimitData(email, data);
      
              return {
          allowed: false,
          error: 'ACCOUNT_LOCKED',
          timeRemaining: ACCOUNT_LOCK_HOURS * 60 * 60,
          attempts: data.attempts,
          message: `Çok fazla başarısız deneme! Hesabınız ${ACCOUNT_LOCK_HOURS} saat kilitlendi.`
        };
    }

    // Temporary block check (5+ attempts in 5 minutes)
    if (recentAttempts >= MAX_ATTEMPTS_PER_5MIN) {
      const timeSinceFirst = now - data.firstAttempt;
      const blockTime = TEMP_BLOCK_MINUTES * 60 * 1000;
      
      if (timeSinceFirst < blockTime) {
        const timeRemaining = Math.ceil((blockTime - timeSinceFirst) / 1000);
        return {
          allowed: false,
          error: 'TOO_MANY_ATTEMPTS',
          timeRemaining,
          attempts: data.attempts,
          message: `Çok fazla deneme! ${Math.ceil(timeRemaining / 60)} dakika bekleyin.`
        };
      }
    }

    // Progressive delay check (after 2nd attempt)
    if (recentAttempts >= 2) {
      const timeSinceLastAttempt = now - data.lastAttempt;
      const requiredDelay = PROGRESSIVE_DELAY_SECONDS * 1000;
      
      if (timeSinceLastAttempt < requiredDelay) {
        const timeRemaining = Math.ceil((requiredDelay - timeSinceLastAttempt) / 1000);
        return {
          allowed: false,
          error: 'PROGRESSIVE_DELAY',
          timeRemaining,
          attempts: data.attempts,
          message: `Çok hızlı deneme! ${timeRemaining} saniye bekleyin.`
        };
      }
    }

    return {
      allowed: true,
      timeRemaining: 0,
      attempts: data.attempts
    };
  }

  async recordFailedAttempt(email: string): Promise<void> {
    const now = Date.now();
    const data = await this.getRateLimitData(email);
    
    data.attempts += 1;
    data.lastAttempt = now;
    
    // Reset first attempt time if outside 5-minute window
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    if (data.firstAttempt < fiveMinutesAgo) {
      data.firstAttempt = now;
      data.attempts = 1; // Reset to 1 (current attempt)
    }
    
    await this.saveRateLimitData(email, data);
    
    console.log('🚨 [RateLimit] Failed attempt recorded:', email, {
      attempts: data.attempts,
      window: '5min'
    });
  }

  async resetRateLimit(email: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getStorageKey(email));
      console.log('✅ [RateLimit] Reset for successful login:', email);
    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  }

  // Clear all rate limit data (for development/testing)
  async clearAllRateLimits(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rateLimitKeys = keys.filter(key => 
        key.startsWith(RATE_LIMIT_KEY_PREFIX)
      );
      
      await AsyncStorage.multiRemove(rateLimitKeys);
      console.log('🧹 [RateLimit] Cleared all rate limit data');
    } catch (error) {
      console.error('Error clearing rate limits:', error);
    }
  }

  // Get current rate limit status for a user
  async getRateLimitStatus(email: string): Promise<{
    attempts: number;
    blocked: boolean;
    timeRemaining: number;
    nextResetTime: number;
  }> {
    const data = await this.getRateLimitData(email);
    const now = Date.now();
    
    let timeRemaining = 0;
    let nextResetTime = 0;
    
    if (data.blocked && data.blockExpiry) {
      timeRemaining = Math.max(0, data.blockExpiry - now);
      nextResetTime = data.blockExpiry;
    } else {
      // Next reset is 5 minutes from first attempt
      nextResetTime = data.firstAttempt + (5 * 60 * 1000);
      timeRemaining = Math.max(0, nextResetTime - now);
    }
    
    return {
      attempts: data.attempts,
      blocked: data.blocked,
      timeRemaining: Math.ceil(timeRemaining / 1000),
      nextResetTime
    };
  }
}

export const rateLimitService = new RateLimitService();