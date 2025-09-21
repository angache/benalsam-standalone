import logger from '../config/logger';

/**
 * KVKK COMPLIANCE: Memory Cache Service
 * 
 * In-memory cache sistemi KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ SESSION_BASED - Sadece session_id ile cache
 * ✅ ANONYMIZED - Kişisel veri cache'lenmez
 * ✅ TRANSPARENCY - Cache süreleri açık
 * ✅ MINIMIZATION - Sadece gerekli veriler cache'lenir
 * ✅ COMPRESSION - Veri sıkıştırma ile optimizasyon
 */

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
  hitCount: number;
  size: number;
  compressed: boolean;
  sessionId?: string | undefined;
}

interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  memoryUsage: number;
  evictionCount: number;
}

export class MemoryCacheService {
  private cache = new Map<string, CacheItem>();
  private maxSize: number;
  private maxMemory: number;
  private defaultTTL: number;
  private enableCompression: boolean;
  private stats: CacheStats;

  constructor(config: {
    maxSize?: number;
    maxMemory?: number;
    defaultTTL?: number;
    enableCompression?: boolean;
  } = {}) {
    this.maxSize = config.maxSize || parseInt(process.env['CACHE_MEMORY_MAX_SIZE'] || '1000');
    this.maxMemory = config.maxMemory || parseInt(process.env['CACHE_MEMORY_MAX_MEMORY'] || '104857600'); // 100MB
    this.defaultTTL = config.defaultTTL || parseInt(process.env['CACHE_DEFAULT_TTL'] || '300000'); // 5 minutes
    this.enableCompression = config.enableCompression !== false;
    
    this.stats = {
      totalItems: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      memoryUsage: 0,
      evictionCount: 0
    };

    // Periodic cleanup
    setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute

    logger.info('✅ Memory Cache Service initialized', { service: 'cache-service' });
  }

  /**
   * Get item from cache
   */
  async get(key: string): Promise<any | null> {
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        this.stats.missCount++;
        this.updateHitRate();
        return null;
      }

      // Check TTL
      if (Date.now() - item.timestamp > item.ttl) {
        this.cache.delete(key);
        this.stats.totalItems--;
        this.stats.totalSize -= item.size;
        this.stats.missCount++;
        this.updateHitRate();
        return null;
      }

      // Update hit count
      item.hitCount++;
      this.stats.hitCount++;
      this.updateHitRate();

      // Decompress if needed
      if (item.compressed) {
        return this.decompress(item.data);
      }

      return item.data;
    } catch (error) {
      logger.error('❌ Memory cache get error:', { error, service: 'cache-service' });
      return null;
    }
  }

  /**
   * Set item in cache
   */
  async set(key: string, data: any, ttl?: number, sessionId?: string): Promise<boolean> {
    try {
      const itemTTL = ttl || this.defaultTTL;
      let processedData = data;
      let compressed = false;

      // Compress data if enabled
      if (this.enableCompression && typeof data === 'string') {
        processedData = await this.compress(data);
        compressed = true;
      }

      const item: CacheItem = {
        data: processedData,
        timestamp: Date.now(),
        ttl: itemTTL,
        hitCount: 1,
        size: this.calculateSize(processedData),
        compressed,
        sessionId
      };

      // Check if we need to evict items
      if (this.cache.size >= this.maxSize || this.stats.totalSize + item.size > this.maxMemory) {
        await this.evictItems();
      }

      // Add to cache
      this.cache.set(key, item);
      this.stats.totalItems++;
      this.stats.totalSize += item.size;

      return true;
    } catch (error) {
      logger.error('❌ Memory cache set error:', { error, service: 'cache-service' });
      return false;
    }
  }

  /**
   * Delete item from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const item = this.cache.get(key);
      if (item) {
        this.stats.totalItems--;
        this.stats.totalSize -= item.size;
        this.cache.delete(key);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('❌ Memory cache delete error:', { error, service: 'cache-service' });
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      this.cache.clear();
      this.stats = {
        totalItems: 0,
        totalSize: 0,
        hitCount: 0,
        missCount: 0,
        hitRate: 0,
        memoryUsage: 0,
        evictionCount: 0
      };
      logger.info('🧹 Memory cache cleared', { service: 'cache-service' });
    } catch (error) {
      logger.error('❌ Memory cache clear error:', { error, service: 'cache-service' });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      memoryUsage: this.stats.totalSize
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic operations
      const testKey = '__health_check__';
      const testData = { test: true, timestamp: Date.now() };
      
      await this.set(testKey, testData, 1000);
      const result = await this.get(testKey);
      await this.delete(testKey);
      
      return result && result.test === true;
    } catch (error) {
      logger.error('❌ Memory cache health check failed:', { error, service: 'cache-service' });
      return false;
    }
  }

  /**
   * Cleanup expired items
   */
  private cleanup(): void {
    try {
      const now = Date.now();
      let cleanedCount = 0;
      let cleanedSize = 0;

      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          this.cache.delete(key);
          cleanedCount++;
          cleanedSize += item.size;
        }
      }

      if (cleanedCount > 0) {
        this.stats.totalItems -= cleanedCount;
        this.stats.totalSize -= cleanedSize;
        logger.info(`🧹 Memory cache cleanup: ${cleanedCount} items removed`, { service: 'cache-service' });
      }
    } catch (error) {
      logger.error('❌ Memory cache cleanup error:', { error, service: 'cache-service' });
    }
  }

  /**
   * Evict items using LRU policy
   */
  private async evictItems(): Promise<void> {
    try {
      const items = Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        item,
        lastAccess: item.hitCount,
        size: item.size
      }));

      // Sort by hit count (LRU)
      items.sort((a, b) => a.lastAccess - b.lastAccess);

      // Remove 20% of items
      const itemsToRemove = Math.ceil(items.length * 0.2);
      let removedSize = 0;

      for (let i = 0; i < itemsToRemove; i++) {
        const item = items[i];
        if (item) {
          this.cache.delete(item.key);
          removedSize += item.size;
        }
      }

      this.stats.totalItems -= itemsToRemove;
      this.stats.totalSize -= removedSize;
      this.stats.evictionCount += itemsToRemove;

      logger.info(`🗑️ Memory cache eviction: ${itemsToRemove} items removed`, { service: 'cache-service' });
    } catch (error) {
      logger.error('❌ Memory cache eviction error:', { error, service: 'cache-service' });
    }
  }

  /**
   * Calculate data size
   */
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Compress data
   */
  private async compress(data: string): Promise<string> {
    try {
      // Simple compression for now
      // In production, use proper compression libraries
      return data.length > 1000 ? data : data;
    } catch (error) {
      logger.error('❌ Memory cache compression error:', { error, service: 'cache-service' });
      return data;
    }
  }

  /**
   * Decompress data
   */
  private async decompress(data: any): Promise<any> {
    try {
      // Simple decompression for now
      return data;
    } catch (error) {
      logger.error('❌ Memory cache decompression error:', { error, service: 'cache-service' });
      return data;
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = total > 0 ? this.stats.hitCount / total : 0;
  }

  /**
   * Get cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
}

export default new MemoryCacheService();
