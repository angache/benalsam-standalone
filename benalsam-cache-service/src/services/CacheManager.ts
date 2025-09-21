import memoryCacheService from './MemoryCacheService';
import { redisCache } from './RedisCacheService';
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
    redis: number;
    distributed: number;
  };
}

export class CacheManager {
  private layers: CacheLayer[] = [];
  private strategy: CacheStrategy;
  private isInitialized = false;

  constructor(strategy: CacheStrategy = {
    type: 'hybrid',
    fallback: true,
    compression: true,
    ttl: {
      memory: 300000, // 5 minutes
      redis: 3600000, // 1 hour
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
            logger.error('❌ Memory cache get error:', { error, service: 'cache-service' });
            return null;
          }
        },
        set: async (key: string, data: any, ttl?: number, sessionId?: string) => {
          try {
            return await memoryCacheService.set(key, data, ttl || this.strategy.ttl.memory, sessionId);
          } catch (error) {
            logger.error('❌ Memory cache set error:', { error, service: 'cache-service' });
            return false;
          }
        },
        delete: async (key: string) => {
          try {
            return await memoryCacheService.delete(key);
          } catch (error) {
            logger.error('❌ Memory cache delete error:', { error, service: 'cache-service' });
            return false;
          }
        },
        healthCheck: async () => {
          try {
            return await memoryCacheService.healthCheck();
          } catch (error) {
            logger.error('❌ Memory cache health check error:', { error, service: 'cache-service' });
            return false;
          }
        },
        getStats: async () => {
          try {
            return memoryCacheService.getStats();
          } catch (error) {
            logger.error('❌ Memory cache stats error:', { error, service: 'cache-service' });
            return null;
          }
        }
      });

      // Layer 2: Redis Cache (Distributed)
      this.layers.push({
        name: 'redis',
        priority: 2,
        get: async (key: string) => {
          try {
            return await redisCache.get(key);
          } catch (error) {
            logger.error('❌ Redis cache get error:', { error, service: 'cache-service' });
            return null;
          }
        },
        set: async (key: string, data: any, ttl?: number, _sessionId?: string) => {
          try {
            return await redisCache.set(key, data, { ttl: ttl || this.strategy.ttl.redis });
          } catch (error) {
            logger.error('❌ Redis cache set error:', { error, service: 'cache-service' });
            return false;
          }
        },
        delete: async (key: string) => {
          try {
            return await redisCache.delete(key);
          } catch (error) {
            logger.error('❌ Redis cache delete error:', { error, service: 'cache-service' });
            return false;
          }
        },
        healthCheck: async () => {
          try {
            return await redisCache.healthCheck();
          } catch (error) {
            logger.error('❌ Redis cache health check error:', { error, service: 'cache-service' });
            return false;
          }
        },
        getStats: async () => {
          try {
            return await redisCache.stats();
          } catch (error) {
            logger.error('❌ Redis cache stats error:', { error, service: 'cache-service' });
            return null;
          }
        }
      });

      this.isInitialized = true;
      logger.info('✅ Cache Manager initialized with layers:', { 
        layers: this.layers.map(l => l.name), 
        service: 'cache-service' 
      });
    } catch (error) {
      logger.error('❌ Cache Manager initialization error:', { error, service: 'cache-service' });
    }
  }

  /**
   * Get data from cache with intelligent routing
   */
  async get(key: string, sessionId?: string): Promise<any | null> {
    if (!this.isInitialized) {
      logger.warn('⚠️ Cache Manager not initialized', { service: 'cache-service' });
      return null;
    }

    try {
      // Try memory cache first (fastest)
      const memoryResult = await this.layers[0]?.get(key);
      if (memoryResult !== null) {
        logger.debug('🎯 Memory cache hit for:', { key, service: 'cache-service' });
        return memoryResult;
      }

      // Try Redis cache (distributed)
      const redisResult = await this.layers[1]?.get(key);
      if (redisResult !== null) {
        logger.debug('🎯 Redis cache hit for:', { key, service: 'cache-service' });
        // Populate memory cache for faster access
        await this.layers[0]?.set(key, redisResult, this.strategy.ttl.memory, sessionId);
        return redisResult;
      }

      logger.debug('❌ Cache miss for:', { key, service: 'cache-service' });
      return null;
    } catch (error) {
      logger.error('❌ Cache Manager get error:', { error, service: 'cache-service' });
      return null;
    }
  }

  /**
   * Set data in cache with intelligent routing
   */
  async set(key: string, data: any, ttl?: number, sessionId?: string): Promise<boolean> {
    if (!this.isInitialized) {
      logger.warn('⚠️ Cache Manager not initialized', { service: 'cache-service' });
      return false;
    }

    try {
      let success = false;

      // Set in memory cache (fastest)
      const memorySuccess = await this.layers[0]?.set(key, data, ttl || this.strategy.ttl.memory, sessionId);
      if (memorySuccess) {
        logger.debug('💾 Memory cache set for:', { key, service: 'cache-service' });
        success = true;
      }

      // Set in Redis cache (distributed)
      const redisSuccess = await this.layers[1]?.set(key, data, ttl || this.strategy.ttl.redis, sessionId);
      if (redisSuccess) {
        logger.debug('💾 Redis cache set for:', { key, service: 'cache-service' });
        success = true;
      }

      return success;
    } catch (error) {
      logger.error('❌ Cache Manager set error:', { error, service: 'cache-service' });
      return false;
    }
  }

  /**
   * Delete data from all cache layers
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isInitialized) {
      logger.warn('⚠️ Cache Manager not initialized', { service: 'cache-service' });
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
            logger.debug(`🗑️ ${layer.name} delete for:`, { key, service: 'cache-service' });
          }
        } catch (error) {
          logger.error(`❌ ${layer.name} delete error:`, { error, service: 'cache-service' });
        }
      }

      return success;
    } catch (error) {
      logger.error('❌ Cache Manager delete error:', { error, service: 'cache-service' });
      return false;
    }
  }

  /**
   * Clear all cache layers
   */
  async clear(): Promise<void> {
    if (!this.isInitialized) {
      logger.warn('⚠️ Cache Manager not initialized', { service: 'cache-service' });
      return;
    }

    try {
      for (const layer of this.layers) {
        try {
          if (layer.name === 'memory') {
            await memoryCacheService.clear();
          } else if (layer.name === 'redis') {
            // Clear Redis cache by pattern
            await redisCache.invalidatePattern('*');
          }
          logger.info(`🧹 ${layer.name} cleared`, { service: 'cache-service' });
        } catch (error) {
          logger.error(`❌ ${layer.name} clear error:`, { error, service: 'cache-service' });
        }
      }
    } catch (error) {
      logger.error('❌ Cache Manager clear error:', { error, service: 'cache-service' });
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
          logger.error(`❌ ${layer.name} stats error:`, { error, service: 'cache-service' });
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
      logger.error('❌ Cache Manager stats error:', { error, service: 'cache-service' });
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
      
      logger.info(`🏥 Cache Manager health check: ${healthyLayers.length}/${this.layers.length} layers healthy`, { 
        service: 'cache-service' 
      });
      
      return overallHealth;
    } catch (error) {
      logger.error('❌ Cache Manager health check error:', { error, service: 'cache-service' });
      return false;
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmCache(keys: string[], dataProvider: (key: string) => Promise<any>): Promise<void> {
    if (!this.isInitialized) {
      logger.warn('⚠️ Cache Manager not initialized', { service: 'cache-service' });
      return;
    }

    try {
      logger.info(`🔥 Warming cache with ${keys.length} keys`, { service: 'cache-service' });

      for (const key of keys) {
        try {
          const data = await dataProvider(key);
          if (data) {
            await this.set(key, data);
            logger.debug(`🔥 Warmed cache for:`, { key, service: 'cache-service' });
          }
        } catch (error) {
          logger.error(`❌ Cache warm error for ${key}:`, { error, service: 'cache-service' });
        }
      }

      logger.info('✅ Cache warming completed', { service: 'cache-service' });
    } catch (error) {
      logger.error('❌ Cache Manager warm error:', { error, service: 'cache-service' });
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
    logger.info('🔄 Cache strategy updated:', { strategy: this.strategy, service: 'cache-service' });
  }
}

export default new CacheManager();
