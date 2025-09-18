import jwt, { SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms';
import crypto from 'crypto';
import { redis } from '../config/redis';
import logger from '../config/logger';
import { jwtConfig } from '../config/app';

export interface JwtSecurityConfig {
  currentSecret: string;
  previousSecret?: string;
  rotationInterval: number; // milliseconds
  lastRotation: Date;
  nextRotation: Date;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: any;
  error?: string;
  needsRefresh?: boolean;
  rotationRequired?: boolean;
}

export interface SecretRotationResult {
  success: boolean;
  newSecret: string;
  previousSecret: string;
  rotationTime: Date;
  error?: string;
}

/**
 * JWT Security Service with secret rotation and enhanced security
 */
export class JwtSecurityService {
  private config: JwtSecurityConfig;
  private readonly REDIS_KEY_PREFIX = 'jwt:security:';
  private readonly CONFIG_KEY = `${this.REDIS_KEY_PREFIX}config`;
  private readonly BLACKLIST_KEY = `${this.REDIS_KEY_PREFIX}blacklist:`;
  private readonly ROTATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.config = {
      currentSecret: jwtConfig.secret,
      rotationInterval: this.ROTATION_INTERVAL,
      lastRotation: new Date(),
      nextRotation: new Date(Date.now() + this.ROTATION_INTERVAL)
    };
  }

  /**
   * Initialize JWT security service
   */
  async initialize(): Promise<void> {
    try {
      // Load config from Redis if available
      const storedConfig = await redis.get(this.CONFIG_KEY);
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        this.config = {
          ...this.config,
          ...parsed,
          lastRotation: new Date(parsed.lastRotation),
          nextRotation: new Date(parsed.nextRotation)
        };
      }

      // Check if rotation is needed
      if (this.shouldRotateSecret()) {
        await this.rotateSecret();
      }

      logger.info('JWT Security Service initialized', {
        lastRotation: this.config.lastRotation,
        nextRotation: this.config.nextRotation,
        rotationInterval: this.config.rotationInterval
      });
    } catch (error) {
      logger.error('Failed to initialize JWT Security Service:', error);
      throw error;
    }
  }

  /**
   * Generate a cryptographically secure secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Check if secret rotation is needed
   */
  private shouldRotateSecret(): boolean {
    return Date.now() >= this.config.nextRotation.getTime();
  }

  /**
   * Rotate JWT secret
   */
  async rotateSecret(): Promise<SecretRotationResult> {
    try {
      const previousSecret = this.config.currentSecret;
      const newSecret = this.generateSecret();
      const rotationTime = new Date();

      // Update config
      this.config.previousSecret = previousSecret;
      this.config.currentSecret = newSecret;
      this.config.lastRotation = rotationTime;
      this.config.nextRotation = new Date(Date.now() + this.config.rotationInterval);

      // Store config in Redis
      await redis.setex(
        this.CONFIG_KEY,
        Math.ceil(this.config.rotationInterval / 1000) * 2, // 2x rotation interval
        JSON.stringify({
          ...this.config,
          lastRotation: this.config.lastRotation.toISOString(),
          nextRotation: this.config.nextRotation.toISOString()
        })
      );

      logger.info('JWT secret rotated successfully', {
        rotationTime: rotationTime.toISOString(),
        nextRotation: this.config.nextRotation.toISOString()
      });

      return {
        success: true,
        newSecret,
        previousSecret,
        rotationTime
      };
    } catch (error) {
      logger.error('Failed to rotate JWT secret:', error);
      return {
        success: false,
        newSecret: '',
        previousSecret: '',
        rotationTime: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sign JWT token with current secret
   */
  sign(payload: any, options: SignOptions = {}): string {
    const defaultOptions: SignOptions = {
      expiresIn: jwtConfig.expiresIn as StringValue,
      issuer: 'benalsam-admin',
      audience: 'benalsam-admin-api',
      algorithm: 'HS256'
    };

    return jwt.sign(payload, this.config.currentSecret, {
      ...defaultOptions,
      ...options
    });
  }

  /**
   * Sign refresh token with longer expiration
   */
  signRefresh(payload: any, options: SignOptions = {}): string {
    const defaultOptions: SignOptions = {
      expiresIn: jwtConfig.refreshExpiresIn as StringValue,
      issuer: 'benalsam-admin',
      audience: 'benalsam-admin-refresh',
      algorithm: 'HS256'
    };

    return jwt.sign(payload, this.config.currentSecret, {
      ...defaultOptions,
      ...options
    });
  }

  /**
   * Verify JWT token with fallback to previous secret
   */
  async verify(token: string): Promise<TokenValidationResult> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return {
          valid: false,
          error: 'Token is blacklisted'
        };
      }

      // Try with current secret first
      try {
        const payload = jwt.verify(token, this.config.currentSecret, {
          issuer: 'benalsam-admin',
          audience: ['benalsam-admin-api', 'benalsam-admin-refresh']
        });

        return {
          valid: true,
          payload
        };
      } catch (currentError) {
        // If current secret fails and we have a previous secret, try that
        if (this.config.previousSecret) {
          try {
            const payload = jwt.verify(token, this.config.previousSecret, {
              issuer: 'benalsam-admin',
              audience: ['benalsam-admin-api', 'benalsam-admin-refresh']
            });

            // Token is valid but needs refresh due to secret rotation
            return {
              valid: true,
              payload,
              needsRefresh: true,
              rotationRequired: true
            };
          } catch (previousError) {
            return {
              valid: false,
              error: 'Invalid token signature'
            };
          }
        }

        return {
          valid: false,
          error: currentError instanceof Error ? currentError.message : 'Token verification failed'
        };
      }
    } catch (error) {
      logger.error('Token verification error:', error);
      return {
        valid: false,
        error: 'Token verification failed'
      };
    }
  }

  /**
   * Blacklist a token
   */
  async blacklistToken(token: string, expirationTime?: number): Promise<void> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const ttl = expirationTime || 7 * 24 * 60 * 60; // 7 days default

      await redis.setex(`${this.BLACKLIST_KEY}${tokenHash}`, ttl, '1');
      
      logger.info('Token blacklisted', {
        tokenHash: tokenHash.substring(0, 8) + '...',
        ttl
      });
    } catch (error) {
      logger.error('Failed to blacklist token:', error);
      throw error;
    }
  }

  /**
   * Check if token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const result = await redis.get(`${this.BLACKLIST_KEY}${tokenHash}`);
      return result === '1';
    } catch (error) {
      logger.error('Failed to check token blacklist:', error);
      return false; // Fail open for availability
    }
  }

  /**
   * Get security status
   */
  async getSecurityStatus(): Promise<any> {
    try {
      const blacklistCount = await redis.keys(`${this.BLACKLIST_KEY}*`);
      
      return {
        currentSecret: this.config.currentSecret.substring(0, 8) + '...',
        hasPreviousSecret: !!this.config.previousSecret,
        lastRotation: this.config.lastRotation,
        nextRotation: this.config.nextRotation,
        rotationInterval: this.config.rotationInterval,
        blacklistedTokens: blacklistCount.length,
        timeUntilRotation: this.config.nextRotation.getTime() - Date.now()
      };
    } catch (error) {
      logger.error('Failed to get security status:', error);
      throw error;
    }
  }

  /**
   * Force secret rotation (for testing or emergency)
   */
  async forceRotation(): Promise<SecretRotationResult> {
    logger.warn('Forcing JWT secret rotation');
    return await this.rotateSecret();
  }

  /**
   * Clean up expired blacklisted tokens
   */
  async cleanupBlacklist(): Promise<number> {
    try {
      const keys = await redis.keys(`${this.BLACKLIST_KEY}*`);
      let cleaned = 0;

      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl <= 0) {
          await redis.del(key);
          cleaned++;
        }
      }

      logger.info('Blacklist cleanup completed', { cleaned });
      return cleaned;
    } catch (error) {
      logger.error('Failed to cleanup blacklist:', error);
      return 0;
    }
  }
}

// Singleton instance
export const jwtSecurityService = new JwtSecurityService();
