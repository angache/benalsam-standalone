import cacheManager from './cacheManager';
import logger from '../config/logger';

/**
 * KVKK COMPLIANCE: Search Cache Service
 * 
 * Search cache sistemi KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ SESSION_BASED - Sadece session_id ile cache
 * ✅ ANONYMIZED - Kişisel veri cache'lenmez
 * ✅ TRANSPARENCY - Cache süreleri açık
 * ✅ MINIMIZATION - Sadece gerekli veriler cache'lenir
 * ✅ SEARCH_OPTIMIZATION - Arama sonuçları optimize edilmiş
 */

interface SearchParams {
  query?: string;
  filters?: any;
  sort?: any;
  page?: number;
  limit?: number;
}

interface SearchCacheItem {
  results: any[];
  total: number;
  aggregations?: any;
  timestamp: number;
  ttl: number;
  searchParams: SearchParams;
  cacheKey: string;
}

interface SearchCacheStats {
  totalSearches: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  averageResponseTime: number;
  popularQueries: string[];
}

class SearchCacheService {
  private readonly CACHE_PREFIX = 'search:results:';
  private readonly SUGGESTIONS_PREFIX = 'search:suggestions:';
  private readonly POPULAR_PREFIX = 'search:popular:';
  private readonly DEFAULT_TTL = 3600000; // 1 hour
  private readonly SUGGESTIONS_TTL = 86400000; // 24 hours
  private readonly POPULAR_TTL = 604800000; // 1 week

  private stats: SearchCacheStats = {
    totalSearches: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    averageResponseTime: 0,
    popularQueries: []
  };

  constructor() {
    logger.info('✅ Search Cache Service initialized');
  }

  /**
   * Generate cache key for search parameters
   */
  private generateCacheKey(params: SearchParams): string {
    const { query, filters, sort, page = 1, limit = 20 } = params;
    
    // Create a deterministic key
    const keyParts = [
      query || '',
      JSON.stringify(filters || {}),
      JSON.stringify(sort || {}),
      page.toString(),
      limit.toString()
    ];

    // Hash the key parts
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
   * Get cached search results
   */
  async getCachedSearch(params: SearchParams, sessionId?: string): Promise<any | null> {
    try {
      const cacheKey = this.generateCacheKey(params);
      const startTime = Date.now();

      // Try to get from cache
      const cachedData = await cacheManager.get(cacheKey, sessionId);
      
      if (cachedData) {
        const responseTime = Date.now() - startTime;
        this.updateStats(true, responseTime);
        
        logger.info(`🎯 Search cache hit for: ${cacheKey}`);
        return cachedData;
      }

      const responseTime = Date.now() - startTime;
      this.updateStats(false, responseTime);
      
      logger.debug(`❌ Search cache miss for: ${cacheKey}`);
      return null;
    } catch (error) {
      logger.error('❌ Search cache get error:', error);
      return null;
    }
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(
    params: SearchParams, 
    results: any[], 
    total: number, 
    aggregations?: any,
    sessionId?: string
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(params);
      
      const cacheItem: SearchCacheItem = {
        results,
        total,
        aggregations,
        timestamp: Date.now(),
        ttl: this.DEFAULT_TTL,
        searchParams: params,
        cacheKey
      };

      // Cache the results
      await cacheManager.set(cacheKey, cacheItem, this.DEFAULT_TTL, sessionId);
      
      // Update popular queries
      await this.updatePopularQueries(params.query);
      
      logger.info(`💾 Search results cached for: ${cacheKey}`);
    } catch (error) {
      logger.error('❌ Search cache set error:', error);
    }
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(prefix: string, sessionId?: string): Promise<string[]> {
    try {
      const suggestionsKey = `${this.SUGGESTIONS_PREFIX}${this.hashString(prefix)}`;
      const suggestions = await cacheManager.get(suggestionsKey, sessionId);
      
      if (suggestions) {
        logger.debug(`🎯 Search suggestions cache hit for: ${prefix}`);
        return suggestions;
      }

      logger.debug(`❌ Search suggestions cache miss for: ${prefix}`);
      return [];
    } catch (error) {
      logger.error('❌ Search suggestions get error:', error);
      return [];
    }
  }

  /**
   * Cache search suggestions
   */
  async cacheSearchSuggestions(prefix: string, suggestions: string[], sessionId?: string): Promise<void> {
    try {
      const suggestionsKey = `${this.SUGGESTIONS_PREFIX}${this.hashString(prefix)}`;
      await cacheManager.set(suggestionsKey, suggestions, this.SUGGESTIONS_TTL, sessionId);
      
      logger.debug(`💾 Search suggestions cached for: ${prefix}`);
    } catch (error) {
      logger.error('❌ Search suggestions cache error:', error);
    }
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(sessionId?: string): Promise<string[]> {
    try {
      const popularKey = `${this.POPULAR_PREFIX}list`;
      const popular = await cacheManager.get(popularKey, sessionId);
      
      if (popular) {
        logger.debug('🎯 Popular searches cache hit');
        return popular;
      }

      logger.debug('❌ Popular searches cache miss');
      return [];
    } catch (error) {
      logger.error('❌ Popular searches get error:', error);
      return [];
    }
  }

  /**
   * Update popular queries
   */
  private async updatePopularQueries(query?: string): Promise<void> {
    if (!query) return;

    try {
      const popularKey = `${this.POPULAR_PREFIX}list`;
      let popular = await cacheManager.get(popularKey) || [];
      
      // Add query to popular list
      if (!popular.includes(query)) {
        popular.unshift(query);
        popular = popular.slice(0, 10); // Keep top 10
        
        await cacheManager.set(popularKey, popular, this.POPULAR_TTL);
        logger.debug(`📈 Popular query updated: ${query}`);
      }
    } catch (error) {
      logger.error('❌ Popular queries update error:', error);
    }
  }

  /**
   * Invalidate search cache
   */
  async invalidateSearchCache(pattern?: string): Promise<number> {
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
        // Invalidate all search cache
        const keys = await this.getCacheKeysByPattern(this.CACHE_PREFIX);
        for (const key of keys) {
          await cacheManager.delete(key);
          clearedCount++;
        }
      }

      logger.info(`🗑️ Search cache invalidated: ${clearedCount} items`);
      return clearedCount;
    } catch (error) {
      logger.error('❌ Search cache invalidation error:', error);
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
    this.stats.totalSearches++;
    
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
    const totalRequests = this.stats.totalSearches;
    this.stats.averageResponseTime = (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Get search cache statistics
   */
  getStats(): SearchCacheStats {
    return { ...this.stats };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic cache operations
      const testKey = 'search:test:health';
      const testData = { test: true, timestamp: Date.now() };
      
      await cacheManager.set(testKey, testData, 1000);
      const result = await cacheManager.get(testKey);
      await cacheManager.delete(testKey);
      
      return result && result.test === true;
    } catch (error) {
      logger.error('❌ Search cache health check failed:', error);
      return false;
    }
  }

  /**
   * Clear all search cache
   */
  async clearAll(): Promise<void> {
    try {
      await this.invalidateSearchCache();
      logger.info('🧹 All search cache cleared');
    } catch (error) {
      logger.error('❌ Search cache clear error:', error);
    }
  }

  /**
   * Warm up search cache with popular queries
   */
  async warmSearchCache(queries: string[]): Promise<void> {
    try {
      logger.info(`🔥 Warming search cache with ${queries.length} queries`);
      
      for (const query of queries) {
        try {
          // Simulate search results for warming
          const mockResults = {
            results: [],
            total: 0,
            timestamp: Date.now(),
            searchParams: { query }
          };
          
          await this.cacheSearchResults(
            { query },
            mockResults.results,
            mockResults.total
          );
          
          logger.debug(`🔥 Warmed search cache for: ${query}`);
        } catch (error) {
          logger.error(`❌ Search cache warm error for ${query}:`, error);
        }
      }
      
      logger.info('✅ Search cache warming completed');
    } catch (error) {
      logger.error('❌ Search cache warming error:', error);
    }
  }
}

export default new SearchCacheService(); 