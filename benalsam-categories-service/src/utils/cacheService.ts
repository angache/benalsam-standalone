import axios from 'axios';
import logger from '../config/logger';

const CACHE_SERVICE_URL = process.env.CACHE_SERVICE_URL || 'http://localhost:3014';

/**
 * Cache Service'e istek yapmak için helper function
 */
async function makeCacheServiceRequest(
  method: 'GET' | 'POST' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<any> {
  try {
    const url = `${CACHE_SERVICE_URL}/api/v1/cache${endpoint}`;
    
    const config = {
      method,
      url,
      ...(data && { data }),
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    logger.error('Cache Service request failed:', {
      method,
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'categories-service'
    });
    throw error;
  }
}

/**
 * Cache Service integration for Categories Service
 */
export class CacheService {
  private static readonly CACHE_PREFIX = 'categories:';
  private static readonly DEFAULT_TTL = 300; // 5 minutes

  /**
   * Get data from cache
   */
  static async get(key: string): Promise<any> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${key}`;
      const result = await makeCacheServiceRequest('POST', '/get', { key: cacheKey });
      
      if (result.success && result.data) {
        logger.debug('Cache hit', { key: cacheKey, service: 'categories-service' });
        return result.data;
      }
      
      logger.debug('Cache miss', { key: cacheKey, service: 'categories-service' });
      return null;
    } catch (error) {
      logger.warn('Cache get failed, proceeding without cache', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'categories-service'
      });
      return null;
    }
  }

  /**
   * Set data in cache
   */
  static async set(key: string, data: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${key}`;
      await makeCacheServiceRequest('POST', '/set', { key: cacheKey, data, ttl });
      
      logger.debug('Cache set', { key: cacheKey, ttl, service: 'categories-service' });
    } catch (error) {
      logger.warn('Cache set failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'categories-service'
      });
    }
  }

  /**
   * Delete data from cache
   */
  static async delete(key: string): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${key}`;
      await makeCacheServiceRequest('DELETE', '/delete', { key: cacheKey });
      
      logger.debug('Cache delete', { key: cacheKey, service: 'categories-service' });
    } catch (error) {
      logger.warn('Cache delete failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'categories-service'
      });
    }
  }

  /**
   * Invalidate cache by pattern
   */
  static async invalidate(pattern: string): Promise<void> {
    try {
      const cachePattern = `${this.CACHE_PREFIX}${pattern}`;
      await makeCacheServiceRequest('POST', '/invalidate', { pattern: cachePattern });
      
      logger.debug('Cache invalidate', { pattern: cachePattern, service: 'categories-service' });
    } catch (error) {
      logger.warn('Cache invalidate failed', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'categories-service'
      });
    }
  }

  /**
   * Cache key generators
   */
  static getKeys = {
    categories: () => 'categories:all',
    category: (id: number) => `category:${id}`,
    categoryTree: () => 'categories:tree',
    categoryAttributes: (categoryId: number) => `category:${categoryId}:attributes`,
    categoryStats: () => 'categories:stats',
    categoryByPath: (path: string) => `category:path:${path}`,
    categorySubcategories: (categoryId: number) => `category:${categoryId}:subcategories`
  };

  /**
   * Health check for cache service
   */
  static async healthCheck(): Promise<{ status: string; responseTime: number }> {
    try {
      const startTime = Date.now();
      await makeCacheServiceRequest('GET', '/health');
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: 0
      };
    }
  }
}

export default CacheService;
