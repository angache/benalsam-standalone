import { redis } from '../config/redis';
import logger from '../config/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string;
  serialize?: boolean;
}

export class RedisCacheService {
  private static instance: RedisCacheService;
  private readonly defaultTTL = parseInt(process.env['CACHE_DEFAULT_TTL'] || '300'); // 5 minutes
  private readonly namespace = 'benalsam:cache:';

  private constructor() {}

  public static getInstance(): RedisCacheService {
    if (!RedisCacheService.instance) {
      RedisCacheService.instance = new RedisCacheService();
    }
    return RedisCacheService.instance;
  }

  /**
   * Set a value in cache
   */
  async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.namespace);
      const ttl = options.ttl || this.defaultTTL;
      
      let serializedValue: string;
      if (options.serialize !== false) {
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = value as string;
      }

      await redis.setex(fullKey, ttl, serializedValue);
      
      logger.debug('Cache set', {
        key: fullKey,
        ttl,
        namespace: options.namespace || 'default',
        service: 'cache-service'
      });
      
      return true;
    } catch (error) {
      logger.error('Cache set failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'cache-service'
      });
      return false;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options.namespace);
      const value = await redis.get(fullKey);
      
      if (!value) {
        logger.debug('Cache miss', { key: fullKey, service: 'cache-service' });
        return null;
      }

      logger.debug('Cache hit', { key: fullKey, service: 'cache-service' });
      
      if (options.serialize !== false) {
        return JSON.parse(value) as T;
      } else {
        return value as T;
      }
    } catch (error) {
      logger.error('Cache get failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'cache-service'
      });
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.namespace);
      const result = await redis.del(fullKey);
      
      logger.debug('Cache delete', { 
        key: fullKey, 
        deleted: result > 0,
        service: 'cache-service'
      });
      
      return result > 0;
    } catch (error) {
      logger.error('Cache delete failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'cache-service'
      });
      return false;
    }
  }

  /**
   * Delete multiple keys with pattern
   */
  async deletePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern, options.namespace);
      const keys = await redis.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await redis.del(...keys);
      
      logger.debug('Cache delete pattern', {
        pattern: fullPattern,
        keysFound: keys.length,
        deleted: result,
        service: 'cache-service'
      });
      
      return result;
    } catch (error) {
      logger.error('Cache delete pattern failed', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'cache-service'
      });
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.namespace);
      const result = await redis.exists(fullKey);
      
      return result === 1;
    } catch (error) {
      logger.error('Cache exists failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'cache-service'
      });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memory: string;
    keyspace: Record<string, string>;
    connected: boolean;
  }> {
    try {
      const info = await redis.info('memory');
      const keyspace = await redis.info('keyspace');
      
      return {
        memory: info,
        keyspace: this.parseKeyspace(keyspace),
        connected: redis.status === 'ready'
      };
    } catch (error) {
      logger.error('Cache stats failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'cache-service'
      });
      return {
        memory: 'N/A',
        keyspace: {},
        connected: false
      };
    }
  }

  /**
   * Cache with fallback function
   */
  async getOrSet<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Cache miss, execute fallback function
    try {
      const result = await fallbackFn();
      
      // Store in cache
      await this.set(key, result, options);
      
      return result;
    } catch (error) {
      logger.error('Cache getOrSet fallback failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'cache-service'
      });
      throw error;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    return this.deletePattern(pattern, options);
  }

  /**
   * Build full cache key with namespace
   */
  private buildKey(key: string, namespace?: string): string {
    const ns = namespace ? `${this.namespace}${namespace}:` : this.namespace;
    return `${ns}${key}`;
  }

  /**
   * Parse keyspace info from Redis
   */
  private parseKeyspace(keyspace: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = keyspace.split('\r\n');
    
    for (const line of lines) {
      if (line.startsWith('db')) {
        const [db, info] = line.split(':');
        if (db && info) {
          result[db] = info;
        }
      }
    }
    
    return result;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = '__health_check__';
      const testData = { test: true, timestamp: Date.now() };
      
      await this.set(testKey, testData, { ttl: 10 });
      const result = await this.get(testKey);
      await this.delete(testKey);
      
      return !!(result && (result as any).test === true);
    } catch (error) {
      logger.error('Redis cache health check failed:', { error, service: 'cache-service' });
      return false;
    }
  }
}

// Export singleton instance
export const redisCacheService = RedisCacheService.getInstance();

// Export convenience functions
export const redisCache = {
  set: <T>(key: string, value: T, options?: CacheOptions) => 
    redisCacheService.set(key, value, options),
  
  get: <T>(key: string, options?: CacheOptions) => 
    redisCacheService.get<T>(key, options),
  
  delete: (key: string, options?: CacheOptions) => 
    redisCacheService.delete(key, options),
  
  getOrSet: <T>(key: string, fallbackFn: () => Promise<T>, options?: CacheOptions) => 
    redisCacheService.getOrSet(key, fallbackFn, options),
  
  invalidatePattern: (pattern: string, options?: CacheOptions) => 
    redisCacheService.invalidatePattern(pattern, options),
  
  exists: (key: string, options?: CacheOptions) => 
    redisCacheService.exists(key, options),
  
  stats: () => redisCacheService.getStats(),
  
  healthCheck: () => redisCacheService.healthCheck()
};
