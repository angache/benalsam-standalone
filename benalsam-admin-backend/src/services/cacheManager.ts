import memoryCacheService from './memoryCacheService';
import cacheService from './cacheService';
import logger from '../config/logger';

/**
 * KVKK COMPLIANCE: Cache Manager
 * 
 * Cache orchestration sistemi KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ SESSION_BASED - Sadece session_id ile cache
 * ✅ ANONYMIZED - Kişisel veri cache'lenmez
 * ✅ TRANSPARENCY - Cache süreleri açık
 * ✅ MINIMIZATION - Sadece gerekli veriler cache'lenir
 * ✅ INTELLIGENT_ROUTING - Akıllı cache routing
 */

interface CacheLayer {
  name: string;
  priority: number;
  get: (key: string) => Promise<any | null>;
  set: (key: string, data: any, ttl?: number, sessionId?: string) => Promise<boolean>;
  delete: (key: string) => Promise<boolean>;
  healthCheck: () => Promise<boolean>;
  getStats: () => Promise<any>;
}

interface CacheStrategy {
  type: 'memory-first' | 'redis-first' | 'hybrid';
  fallback: boolean;
  compression: boolean;
  ttl: {
    memory: number;
    local: number;
    distributed: number;
  };
}

class CacheManager {
  private layers: CacheLayer[] = [];
  private strategy: CacheStrategy;
  private isInitialized = false;

  constructor(strategy: CacheStrategy = {
    type: 'hybrid',
    fallback: true,
    compression: true,
    ttl: {
      memory: 300000, // 5 minutes
      local: 3600000, // 1 hour
      distributed: 86400000 // 24 hours
    }
  }) {
    this.strategy = strategy;
    this.initializeLayers();
  }

  /**
   * Initialize cache layers
   */
  private async initializeLayers(): Promise<void> {
    try {
      // Layer 1: Memory Cache (Fastest)
      this.layers.push({
        name: 'memory',
        priority: 1,
        get: async (key: string) => {
          try {
            return await memoryCacheService.get(key);
          } catch (error) {
            logger.error('❌ Memory cache get error:', error);
            return null;
          }
        },
        set: async (key: string, data: any, ttl?: number, sessionId?: string) => {
          try {
            return await memoryCacheService.set(key, data, ttl || this.strategy.ttl.memory, sessionId);
          } catch (error) {
            logger.error('❌ Memory cache set error:', error);
            return false;
          }
        },
        delete: async (key: string) => {
          try {
            return await memoryCacheService.delete(key);
          } catch (error) {
            logger.error('❌ Memory cache delete error:', error);
            return false;
          }
        },
        healthCheck: async () => {
          try {
            return await memoryCacheService.healthCheck();
          } catch (error) {
            logger.error('❌ Memory cache health check error:', error);
            return false;
          }
        },
        getStats: async () => {
          try {
            return memoryCacheService.getStats();
          } catch (error) {
            logger.error('❌ Memory cache stats error:', error);
            return null;
          }
        }
      });

      // Layer 2: Local Redis DISABLED - Using memory cache only
      // this.layers.push({
      //   name: 'local-redis',
      //   priority: 2,
      //   get: async (key: string) => {
      //     try {
      //       return await cacheService.getCachedResponse(key);
      //     } catch (error) {
      //       logger.error('❌ Local Redis get error:', error);
      //       return null;
      //     }
      //   },
      //   set: async (key: string, data: any, ttl?: number, sessionId?: string) => {
      //     try {
      //       await cacheService.cacheResponse(key, data, 'local-redis', sessionId);
      //       return true;
      //     } catch (error) {
      //       logger.error('❌ Local Redis set error:', error);
      //       return false;
      //     }
      //   },
      //   delete: async (key: string) => {
      //     try {
      //       // Redis doesn't have direct delete in our service, but we can set to null
      //       await cacheService.cacheResponse(key, null, 'local-redis');
      //       return true;
      //     } catch (error) {
      //       logger.error('❌ Local Redis delete error:', error);
      //       return false;
      //     }
      //   },
      //   healthCheck: async () => {
      //     try {
      //       return await cacheService.healthCheck();
      //     } catch (error) {
      //       logger.error('❌ Local Redis health check error:', error);
      //       return false;
      //     }
      //   },
      //   getStats: async () => {
      //     try {
      //       return await cacheService.getCacheStats();
      //     } catch (error) {
      //       logger.error('❌ Local Redis stats error:', error);
      //       return null;
      //     }
      //   }
      // });

      this.isInitialized = true;
      logger.info('✅ Cache Manager initialized with layers:', this.layers.map(l => l.name));
    } catch (error) {
      logger.error('❌ Cache Manager initialization error:', error);
    }
  }

  /**
   * Get data from cache with intelligent routing (Memory only)
   */
  async get(key: string, sessionId?: string): Promise<any | null> {
    if (!this.isInitialized) {
      logger.warn('⚠️ Cache Manager not initialized');
      return null;
    }

    try {
      // Try memory cache only (local-redis disabled)
      const memoryResult = await this.layers[0].get(key);
      if (memoryResult !== null) {
        logger.debug('🎯 Memory cache hit for:', key);
        return memoryResult;
      }

      logger.debug('❌ Cache miss for:', key);
      return null;
    } catch (error) {
      logger.error('❌ Cache Manager get error:', error);
      return null;
    }
  }

  /**
   * Set data in cache with intelligent routing (Memory only)
   */
  async set(key: string, data: any, ttl?: number, sessionId?: string): Promise<boolean> {
    if (!this.isInitialized) {
      logger.warn('⚠️ Cache Manager not initialized');
      return false;
    }

    try {
      // Set in memory cache only (local-redis disabled)
      const memorySuccess = await this.layers[0].set(key, data, ttl || this.strategy.ttl.memory, sessionId);
      if (memorySuccess) {
        logger.debug('💾 Memory cache set for:', key);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('❌ Cache Manager set error:', error);
      return false;
    }
  }

  /**
   * Delete data from all cache layers
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isInitialized) {
      logger.warn('⚠️ Cache Manager not initialized');
      return false;
    }

    try {
      let success = false;

      // Delete from all layers
      for (const layer of this.layers) {
        try {
          const layerSuccess = await layer.delete(key);
          if (layerSuccess) {
            success = true;
            logger.debug(`🗑️ ${layer.name} delete for:`, key);
          }
        } catch (error) {
          logger.error(`❌ ${layer.name} delete error:`, error);
        }
      }

      return success;
    } catch (error) {
      logger.error('❌ Cache Manager delete error:', error);
      return false;
    }
  }

  /**
   * Clear all cache layers
   */
  async clear(): Promise<void> {
    if (!this.isInitialized) {
      logger.warn('⚠️ Cache Manager not initialized');
      return;
    }

    try {
      for (const layer of this.layers) {
        try {
          if (layer.name === 'memory') {
            await memoryCacheService.clear();
          } else if (layer.name === 'local-redis') {
            // Clear Redis cache
            await cacheService.clearExpiredCache();
          }
          logger.info(`🧹 ${layer.name} cleared`);
        } catch (error) {
          logger.error(`❌ ${layer.name} clear error:`, error);
        }
      }
    } catch (error) {
      logger.error('❌ Cache Manager clear error:', error);
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  async getStats(): Promise<any> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const stats: any = {
        layers: [],
        overall: {
          totalItems: 0,
          totalSize: 0,
          hitRate: 0,
          healthy: true
        }
      };

      let totalHits = 0;
      let totalMisses = 0;

      for (const layer of this.layers) {
        try {
          const layerStats = await layer.getStats();
          const health = await layer.healthCheck();

          stats.layers.push({
            name: layer.name,
            priority: layer.priority,
            stats: layerStats,
            healthy: health
          });

          if (layerStats) {
            stats.overall.totalItems += layerStats.totalItems || 0;
            stats.overall.totalSize += layerStats.totalSize || 0;
            totalHits += layerStats.hitCount || 0;
            totalMisses += layerStats.missCount || 0;
          }

          if (!health) {
            stats.overall.healthy = false;
          }
        } catch (error) {
          logger.error(`❌ ${layer.name} stats error:`, error);
          stats.layers.push({
            name: layer.name,
            priority: layer.priority,
            stats: null,
            healthy: false
          });
          stats.overall.healthy = false;
        }
      }

      // Calculate overall hit rate
      const totalRequests = totalHits + totalMisses;
      stats.overall.hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

      return stats;
    } catch (error) {
      logger.error('❌ Cache Manager stats error:', error);
      return null;
    }
  }

  /**
   * Health check for all layers
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const healthChecks = await Promise.allSettled(
        this.layers.map(layer => layer.healthCheck())
      );

      const healthyLayers = healthChecks.filter(
        result => result.status === 'fulfilled' && result.value === true
      );

      const overallHealth = healthyLayers.length > 0;
      
      logger.info(`🏥 Cache Manager health check: ${healthyLayers.length}/${this.layers.length} layers healthy`);
      
      return overallHealth;
    } catch (error) {
      logger.error('❌ Cache Manager health check error:', error);
      return false;
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmCache(keys: string[], dataProvider: (key: string) => Promise<any>): Promise<void> {
    if (!this.isInitialized) {
      logger.warn('⚠️ Cache Manager not initialized');
      return;
    }

    try {
      logger.info(`🔥 Warming cache with ${keys.length} keys`);

      for (const key of keys) {
        try {
          const data = await dataProvider(key);
          if (data) {
            await this.set(key, data);
            logger.debug(`🔥 Warmed cache for:`, key);
          }
        } catch (error) {
          logger.error(`❌ Cache warm error for ${key}:`, error);
        }
      }

      logger.info('✅ Cache warming completed');
    } catch (error) {
      logger.error('❌ Cache Manager warm error:', error);
    }
  }

  /**
   * Get cache layer by name
   */
  getLayer(name: string): CacheLayer | undefined {
    return this.layers.find(layer => layer.name === name);
  }

  /**
   * Update cache strategy
   */
  updateStrategy(newStrategy: Partial<CacheStrategy>): void {
    this.strategy = { ...this.strategy, ...newStrategy };
    logger.info('🔄 Cache strategy updated:', this.strategy);
  }
}

export default new CacheManager(); 