import Redis from 'ioredis';
import logger from '../config/logger';

interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix: string;
  version: string;
}

class CachingStrategy {
  private redis: Redis;
  private config: CacheConfig;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.config = {
      ttl: 300, // 5 minutes default
      prefix: 'benalsam:',
      version: 'v1'
    };

    this.setupRedisListeners();
  }

  private setupRedisListeners() {
    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    this.redis.on('ready', () => {
      logger.info('Redis is ready');
    });
  }

  // Generate cache key with prefix and version
  private generateKey(key: string): string {
    return `${this.config.prefix}${this.config.version}:${key}`;
  }

  // Set cache with TTL
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.generateKey(key);
      const serializedValue = JSON.stringify(value);
      const cacheTtl = ttl || this.config.ttl;

      await this.redis.setex(cacheKey, cacheTtl, serializedValue);
      
      logger.debug('Cache set successfully', {
        key: cacheKey,
        ttl: cacheTtl,
        size: serializedValue.length
      });
    } catch (error) {
      logger.error('Failed to set cache', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get cache value
  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key);
      const cachedValue = await this.redis.get(cacheKey);

      if (cachedValue) {
        const parsedValue = JSON.parse(cachedValue);
        logger.debug('Cache hit', { key: cacheKey });
        return parsedValue;
      }

      logger.debug('Cache miss', { key: cacheKey });
      return null;
    } catch (error) {
      logger.error('Failed to get cache', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  // Delete cache key
  async delete(key: string): Promise<void> {
    try {
      const cacheKey = this.generateKey(key);
      await this.redis.del(cacheKey);
      
      logger.debug('Cache deleted', { key: cacheKey });
    } catch (error) {
      logger.error('Failed to delete cache', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Clear all cache with pattern
  async clearPattern(pattern: string): Promise<void> {
    try {
      const cachePattern = this.generateKey(pattern);
      const keys = await this.redis.keys(cachePattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info('Cache pattern cleared', {
          pattern: cachePattern,
          deletedKeys: keys.length
        });
      }
    } catch (error) {
      logger.error('Failed to clear cache pattern', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Cache wrapper for functions
  async cacheFunction<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl);
    
    return result;
  }

  // Specific caching strategies for different data types

  // Listings cache with pagination
  async cacheListings(page: number, limit: number, filters?: any, ttl: number = 300) {
    const key = `listings:${page}:${limit}:${JSON.stringify(filters || {})}`;
    return this.get(key);
  }

  async setListingsCache(page: number, limit: number, filters: any, data: any, ttl: number = 300) {
    const key = `listings:${page}:${limit}:${JSON.stringify(filters || {})}`;
    await this.set(key, data, ttl);
  }

  // User cache
  async cacheUser(userId: string, ttl: number = 600) {
    const key = `user:${userId}`;
    return this.get(key);
  }

  async setUserCache(userId: string, userData: any, ttl: number = 600) {
    const key = `user:${userId}`;
    await this.set(key, userData, ttl);
  }

  // Analytics cache
  async cacheAnalytics(type: string, ttl: number = 1800) {
    const key = `analytics:${type}`;
    return this.get(key);
  }

  async setAnalyticsCache(type: string, data: any, ttl: number = 1800) {
    const key = `analytics:${type}`;
    await this.set(key, data, ttl);
  }

  // Health check cache (short TTL)
  async cacheHealthCheck(ttl: number = 30) {
    const key = 'health:status';
    return this.get(key);
  }

  async setHealthCache(data: any, ttl: number = 30) {
    const key = 'health:status';
    await this.set(key, data, ttl);
  }

  // Session cache
  async cacheSession(sessionId: string, ttl: number = 3600) {
    const key = `session:${sessionId}`;
    return this.get(key);
  }

  async setSessionCache(sessionId: string, sessionData: any, ttl: number = 3600) {
    const key = `session:${sessionId}`;
    await this.set(key, sessionData, ttl);
  }

  // Cache invalidation strategies
  async invalidateListingsCache() {
    await this.clearPattern('listings:*');
    logger.info('Listings cache invalidated');
  }

  async invalidateUserCache(userId: string) {
    await this.delete(`user:${userId}`);
    logger.info('User cache invalidated', { userId });
  }

  async invalidateAnalyticsCache() {
    await this.clearPattern('analytics:*');
    logger.info('Analytics cache invalidated');
  }

  // Cache statistics
  async getCacheStats() {
    try {
      const info = await this.redis.info();
      const keys = await this.redis.keys(`${this.config.prefix}*`);
      
      return {
        totalKeys: keys.length,
        memoryUsage: info.match(/used_memory_human:(\S+)/)?.[1] || 'unknown',
        hitRate: 'calculated from monitoring',
        version: this.config.version
      };
    } catch (error) {
      logger.error('Failed to get cache stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  // Cache warming for critical data
  async warmCache() {
    try {
      logger.info('Starting cache warming...');
      
      // Warm listings cache
      await this.setListingsCache(1, 20, {}, { listings: [], pagination: {} }, 300);
      
      // Warm analytics cache
      await this.setAnalyticsCache('dashboard', { users: 0, listings: 0 }, 1800);
      
      // Warm health check cache
      await this.setHealthCache({ status: 'warming' }, 30);
      
      logger.info('Cache warming completed');
    } catch (error) {
      logger.error('Cache warming failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Close Redis connection
  async close() {
    try {
      await this.redis.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Failed to close Redis connection', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default CachingStrategy;
