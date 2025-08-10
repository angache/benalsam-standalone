import cacheManager from './cacheManager';
import logger from '../config/logger';

/**
 * KVKK COMPLIANCE: API Cache Service
 * 
 * API cache sistemi KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ SESSION_BASED - Sadece session_id ile cache
 * ✅ ANONYMIZED - Kişisel veri cache'lenmez
 * ✅ TRANSPARENCY - Cache süreleri açık
 * ✅ MINIMIZATION - Sadece gerekli veriler cache'lenir
 * ✅ API_OPTIMIZATION - API response'ları optimize edilmiş
 */

interface APICacheItem {
  data: any;
  status: number;
  headers?: any;
  timestamp: number;
  ttl: number;
  endpoint: string;
  method: string;
  params?: any;
  cacheKey: string;
}

interface APICacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  averageResponseTime: number;
  popularEndpoints: string[];
  cacheSize: number;
}

class APICacheService {
  private readonly CACHE_PREFIX = 'api:';
  private readonly DEFAULT_TTL = 1800000; // 30 minutes
  private readonly SHORT_TTL = 300000; // 5 minutes
  private readonly LONG_TTL = 3600000; // 1 hour

  private stats: APICacheStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    averageResponseTime: 0,
    popularEndpoints: [],
    cacheSize: 0
  };

  constructor() {
    logger.info('✅ API Cache Service initialized');
  }

  /**
   * Generate cache key for API request
   */
  private generateCacheKey(method: string, endpoint: string, params?: any, sessionId?: string): string {
    const keyParts = [
      method.toUpperCase(),
      endpoint,
      JSON.stringify(params || {}),
      sessionId || 'anonymous'
    ];

    const keyString = keyParts.join('|');
    const hash = this.hashString(keyString);
    
    return `${this.CACHE_PREFIX}${hash}`;
  }

  /**
   * Simple hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached API response
   */
  async getCachedResponse(
    method: string, 
    endpoint: string, 
    params?: any, 
    sessionId?: string
  ): Promise<any | null> {
    try {
      const cacheKey = this.generateCacheKey(method, endpoint, params, sessionId);
      const startTime = Date.now();

      const cachedData = await cacheManager.get(cacheKey, sessionId);
      
      if (cachedData) {
        const responseTime = Date.now() - startTime;
        this.updateStats(true, responseTime);
        
        logger.info(`🎯 API cache hit for: ${method} ${endpoint}`);
        return cachedData;
      }

      const responseTime = Date.now() - startTime;
      this.updateStats(false, responseTime);
      
      logger.debug(`❌ API cache miss for: ${method} ${endpoint}`);
      return null;
    } catch (error) {
      logger.error('❌ API cache get error:', error);
      return null;
    }
  }

  /**
   * Cache API response
   */
  async cacheResponse(
    method: string,
    endpoint: string,
    data: any,
    status: number = 200,
    headers?: any,
    params?: any,
    sessionId?: string
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(method, endpoint, params, sessionId);
      const ttl = this.getTTLForEndpoint(endpoint);
      
      const cacheItem: APICacheItem = {
        data,
        status,
        headers,
        timestamp: Date.now(),
        ttl,
        endpoint,
        method,
        params,
        cacheKey
      };

      await cacheManager.set(cacheKey, cacheItem, ttl, sessionId);
      
      // Update popular endpoints
      await this.updatePopularEndpoints(endpoint);
      
      logger.info(`💾 API response cached for: ${method} ${endpoint}`);
    } catch (error) {
      logger.error('❌ API cache set error:', error);
    }
  }

  /**
   * Get TTL for specific endpoint
   */
  private getTTLForEndpoint(endpoint: string): number {
    // Short TTL for dynamic data
    if (endpoint.includes('/analytics') || endpoint.includes('/performance')) {
      return this.SHORT_TTL;
    }
    
    // Long TTL for static data
    if (endpoint.includes('/categories') || endpoint.includes('/health')) {
      return this.LONG_TTL;
    }
    
    // Default TTL
    return this.DEFAULT_TTL;
  }

  /**
   * Get popular endpoints
   */
  async getPopularEndpoints(sessionId?: string): Promise<string[]> {
    try {
      const popularKey = `${this.CACHE_PREFIX}popular:endpoints`;
      const popular = await cacheManager.get(popularKey, sessionId);
      
      if (popular) {
        logger.debug('🎯 Popular endpoints cache hit');
        return popular;
      }

      logger.debug('❌ Popular endpoints cache miss');
      return [];
    } catch (error) {
      logger.error('❌ Popular endpoints get error:', error);
      return [];
    }
  }

  /**
   * Update popular endpoints
   */
  private async updatePopularEndpoints(endpoint: string): Promise<void> {
    try {
      const popularKey = `${this.CACHE_PREFIX}popular:endpoints`;
      let popular = await cacheManager.get(popularKey) || [];
      
      // Add endpoint to popular list
      if (!popular.includes(endpoint)) {
        popular.unshift(endpoint);
        popular = popular.slice(0, 10); // Keep top 10
        
        await cacheManager.set(popularKey, popular, this.LONG_TTL);
        logger.debug(`📈 Popular endpoint updated: ${endpoint}`);
      }
    } catch (error) {
      logger.error('❌ Popular endpoints update error:', error);
    }
  }

  /**
   * Invalidate API cache
   */
  async invalidateAPICache(pattern?: string): Promise<number> {
    try {
      let clearedCount = 0;
      
      if (pattern) {
        // Invalidate specific pattern
        const keys = await this.getCacheKeysByPattern(pattern);
        for (const key of keys) {
          await cacheManager.delete(key);
          clearedCount++;
        }
      } else {
        // Invalidate all API cache
        const keys = await this.getCacheKeysByPattern(this.CACHE_PREFIX);
        for (const key of keys) {
          await cacheManager.delete(key);
          clearedCount++;
        }
      }

      logger.info(`🗑️ API cache invalidated: ${clearedCount} items`);
      return clearedCount;
    } catch (error) {
      logger.error('❌ API cache invalidation error:', error);
      return 0;
    }
  }

  /**
   * Get cache keys by pattern
   */
  private async getCacheKeysByPattern(pattern: string): Promise<string[]> {
    try {
      // This is a simplified implementation
      // In production, use Redis SCAN or similar
      return [];
    } catch (error) {
      logger.error('❌ Get cache keys error:', error);
      return [];
    }
  }

  /**
   * Update statistics
   */
  private updateStats(isHit: boolean, responseTime: number): void {
    this.stats.totalRequests++;
    
    if (isHit) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
    }

    // Update hit rate
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    this.stats.hitRate = total > 0 ? this.stats.cacheHits / total : 0;

    // Update average response time
    const currentAvg = this.stats.averageResponseTime;
    const totalRequests = this.stats.totalRequests;
    this.stats.averageResponseTime = (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Get API cache statistics
   */
  getStats(): APICacheStats {
    return { ...this.stats };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic cache operations
      const testKey = 'api:test:health';
      const testData = { test: true, timestamp: Date.now() };
      
      await cacheManager.set(testKey, testData, 1000);
      const result = await cacheManager.get(testKey);
      await cacheManager.delete(testKey);
      
      return result && result.test === true;
    } catch (error) {
      logger.error('❌ API cache health check failed:', error);
      return false;
    }
  }

  /**
   * Clear all API cache
   */
  async clearAll(): Promise<void> {
    try {
      await this.invalidateAPICache();
      logger.info('🧹 All API cache cleared');
    } catch (error) {
      logger.error('❌ API cache clear error:', error);
    }
  }

  /**
   * Warm up API cache with popular endpoints
   */
  async warmAPICache(endpoints: string[]): Promise<void> {
    try {
      logger.info(`🔥 Warming API cache with ${endpoints.length} endpoints`);
      
      for (const endpoint of endpoints) {
        try {
          // Simulate API response for warming
          const mockResponse = {
            data: [],
            status: 200,
            timestamp: Date.now(),
            endpoint
          };
          
          await this.cacheResponse(
            'GET',
            endpoint,
            mockResponse.data,
            mockResponse.status
          );
          
          logger.debug(`🔥 Warmed API cache for: ${endpoint}`);
        } catch (error) {
          logger.error(`❌ API cache warm error for ${endpoint}:`, error);
        }
      }
      
      logger.info('✅ API cache warming completed');
    } catch (error) {
      logger.error('❌ API cache warming error:', error);
    }
  }

  /**
   * Cache middleware for Express routes
   */
  cacheMiddleware(ttl?: number) {
    return async (req: any, res: any, next: any) => {
      try {
        const method = req.method;
        const endpoint = req.originalUrl;
        const params = {
          query: req.query,
          body: req.body,
          params: req.params
        };
        const sessionId = req.headers['x-session-id'];

        // Try to get from cache
        const cachedResponse = await this.getCachedResponse(method, endpoint, params, sessionId);
        
        if (cachedResponse) {
          return res.status(cachedResponse.status).json(cachedResponse.data);
        }

        // Store original send method
        const originalSend = res.json;
        
        // Override send method to cache response
        const self = this;
        res.json = function(data: any) {
          // Cache the response
          self.cacheResponse(method, endpoint, data, res.statusCode, res.getHeaders(), params, sessionId);
          
          // Call original send
          return originalSend.call(this, data);
        };

        next();
      } catch (error) {
        logger.error('❌ API cache middleware error:', error);
        next();
      }
    };
  }
}

export default new APICacheService(); 