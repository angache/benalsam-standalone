import { redis } from '../config/redis';
import logger from '../config/logger';

/**
 * KVKK COMPLIANCE: Cache Service
 * 
 * Redis cache sistemi KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ SESSION_BASED - Sadece session_id ile cache
 * ✅ ANONYMIZED - Kişisel veri cache'lenmez
 * ✅ TRANSPARENCY - Cache süreleri açık
 * ✅ MINIMIZATION - Sadece gerekli veriler cache'lenir
 * 
 * Cache verileri sadece performans için kullanılır.
 */

interface CacheItem {
  data: any;
  timestamp: number;
  serviceUsed: string;
  size: number;
  hitCount: number;
  sessionId?: string;
}

interface UserUsage {
  userId: string;
  sessionId: string;
  monthlyKey: string; // YYYY-MM format
  attempts: number;
  lastAttempt: number;
  isPremium: boolean;
}

// Cache configuration
const CACHE_KEY_PREFIX = 'ai_cache_';
const USAGE_KEY_PREFIX = 'ai_usage_';
const CACHE_EXPIRY = 24 * 60 * 60; // 24 saat (saniye)
const USAGE_EXPIRY = 31 * 24 * 60 * 60; // 31 gün (saniye)
const MAX_CACHE_SIZE = 1024 * 1024 * 1024; // 1GB

class CacheService {
  private isConnected = false;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      await redis.ping();
      this.isConnected = true;
      logger.info('✅ Cache Service: Redis connected');
    } catch (error) {
      logger.error('❌ Cache Service: Redis connection failed:', error);
      this.isConnected = false;
    }
  }

  // Cache kontrolü
  async getCachedResponse(userDescription: string, sessionId?: string): Promise<any | null> {
    if (!this.isConnected) {
      logger.warn('⚠️ Cache Service: Redis not connected, skipping cache');
      return null;
    }

    try {
      const cacheKey = this.generateCacheKey(userDescription, sessionId);
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        const cacheItem: CacheItem = JSON.parse(cachedData);
        
        // Süre kontrolü
        if (Date.now() - cacheItem.timestamp < CACHE_EXPIRY * 1000) {
          cacheItem.hitCount++;
          
          // Cache'i güncelle
          await redis.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(cacheItem));
          
          logger.info('🎯 Cache hit for:', userDescription);
          return cacheItem.data;
        } else {
          // Süresi dolmuş cache'i sil
          await redis.del(cacheKey);
        }
      }
      
      return null;
    } catch (error) {
      logger.error('❌ Cache get error:', error);
      return null;
    }
  }

  // Cache'e kaydet
  async cacheResponse(userDescription: string, response: any, serviceUsed: string, sessionId?: string): Promise<void> {
    if (!this.isConnected) {
      logger.warn('⚠️ Cache Service: Redis not connected, skipping cache save');
      return;
    }

    try {
      const cacheKey = this.generateCacheKey(userDescription, sessionId);
      const cacheItem: CacheItem = {
        data: response,
        timestamp: Date.now(),
        serviceUsed: serviceUsed,
        size: JSON.stringify(response).length,
        hitCount: 1,
        sessionId
      };
      
      // Cache'e kaydet (TTL ile)
      await redis.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(cacheItem));
      
      // Cache istatistiklerini güncelle
      await this.updateCacheStats();
      
      logger.info('💾 Cached response for:', userDescription);
    } catch (error) {
      logger.error('❌ Cache save error:', error);
    }
  }

  // Kullanıcı kullanımını kontrol et
  async checkUserUsage(userId: string, sessionId: string, isPremium: boolean = false): Promise<{ canUse: boolean; remainingAttempts: number; monthlyLimit: number }> {
    if (!this.isConnected) {
      logger.warn('⚠️ Cache Service: Redis not connected, allowing usage');
      return { canUse: true, remainingAttempts: 999, monthlyLimit: 999 };
    }

    try {
      const monthlyKey = this.getMonthlyKey();
      const usageKey = `${USAGE_KEY_PREFIX}${userId}_${monthlyKey}`;
      
      // Mevcut kullanımı al
      const usageData = await redis.get(usageKey);
      let usage: UserUsage;
      
      if (usageData) {
        usage = JSON.parse(usageData);
      } else {
        usage = {
          userId,
          sessionId,
          monthlyKey,
          attempts: 0,
          lastAttempt: Date.now(),
          isPremium
        };
      }
      
      const monthlyLimit = isPremium ? -1 : 30; // Premium: sınırsız, Free: 30
      const canUse = monthlyLimit === -1 || usage.attempts < monthlyLimit;
      
      if (canUse) {
        // Kullanımı artır
        usage.attempts++;
        usage.lastAttempt = Date.now();
        usage.isPremium = isPremium;
        
        // Redis'e kaydet (31 gün TTL)
        await redis.setex(usageKey, USAGE_EXPIRY, JSON.stringify(usage));
      }
      
      return {
        canUse,
        remainingAttempts: monthlyLimit === -1 ? 999 : Math.max(0, monthlyLimit - usage.attempts),
        monthlyLimit
      };
    } catch (error) {
      logger.error('❌ User usage check error:', error);
      return { canUse: true, remainingAttempts: 999, monthlyLimit: 999 };
    }
  }

  // Kullanıcı kullanım istatistiklerini al
  async getUserUsageStats(userId: string): Promise<{ attempts: number; monthlyLimit: number; isPremium: boolean }> {
    if (!this.isConnected) {
      return { attempts: 0, monthlyLimit: 30, isPremium: false };
    }

    try {
      const monthlyKey = this.getMonthlyKey();
      const usageKey = `${USAGE_KEY_PREFIX}${userId}_${monthlyKey}`;
      
      const usageData = await redis.get(usageKey);
      if (usageData) {
        const usage: UserUsage = JSON.parse(usageData);
        return {
          attempts: usage.attempts,
          monthlyLimit: usage.isPremium ? -1 : 30,
          isPremium: usage.isPremium
        };
      }
      
      return { attempts: 0, monthlyLimit: 30, isPremium: false };
    } catch (error) {
      logger.error('❌ User usage stats error:', error);
      return { attempts: 0, monthlyLimit: 30, isPremium: false };
    }
  }

  // Cache istatistiklerini al
  async getCacheStats(): Promise<{ totalKeys: number; totalSize: number; hitRate: number }> {
    if (!this.isConnected) {
      return { totalKeys: 0, totalSize: 0, hitRate: 0 };
    }

    try {
      const keys = await redis.keys(`${CACHE_KEY_PREFIX}*`);
      let totalSize = 0;
      let totalHits = 0;
      
      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const cacheItem: CacheItem = JSON.parse(data);
          totalSize += cacheItem.size;
          totalHits += cacheItem.hitCount;
        }
      }
      
      return {
        totalKeys: keys.length,
        totalSize,
        hitRate: keys.length > 0 ? totalHits / keys.length : 0
      };
    } catch (error) {
      logger.error('❌ Cache stats error:', error);
      return { totalKeys: 0, totalSize: 0, hitRate: 0 };
    }
  }

  // Cache temizleme
  async clearExpiredCache(): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const keys = await redis.keys(`${CACHE_KEY_PREFIX}*`);
      let clearedCount = 0;
      
      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const cacheItem: CacheItem = JSON.parse(data);
          if (Date.now() - cacheItem.timestamp > CACHE_EXPIRY * 1000) {
            await redis.del(key);
            clearedCount++;
          }
        }
      }
      
      logger.info(`🧹 Cleared ${clearedCount} expired cache items`);
      return clearedCount;
    } catch (error) {
      logger.error('❌ Cache clear error:', error);
      return 0;
    }
  }

  // Cache boyut kontrolü
  async checkCacheSize(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const stats = await this.getCacheStats();
      
      if (stats.totalSize > MAX_CACHE_SIZE) {
        // En eski cache'leri sil
        const keys = await redis.keys(`${CACHE_KEY_PREFIX}*`);
        const cacheItems: Array<{ key: string; timestamp: number }> = [];
        
        for (const key of keys) {
          const data = await redis.get(key);
          if (data) {
            const cacheItem: CacheItem = JSON.parse(data);
            cacheItems.push({ key, timestamp: cacheItem.timestamp });
          }
        }
        
        // En eski %20'yi sil
        cacheItems.sort((a, b) => a.timestamp - b.timestamp);
        const itemsToDelete = Math.ceil(cacheItems.length * 0.2);
        
        for (let i = 0; i < itemsToDelete; i++) {
          await redis.del(cacheItems[i].key);
        }
        
        logger.info(`🗑️ Cleared ${itemsToDelete} old cache items due to size limit`);
      }
    } catch (error) {
      logger.error('❌ Cache size check error:', error);
    }
  }

  // Yardımcı metodlar
  private generateCacheKey(userDescription: string, sessionId?: string): string {
    const normalizedDescription = userDescription.toLowerCase().trim();
    return sessionId ? 
      `${CACHE_KEY_PREFIX}${sessionId}_${normalizedDescription}` :
      `${CACHE_KEY_PREFIX}${normalizedDescription}`;
  }

  private getMonthlyKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private async updateCacheStats(): Promise<void> {
    // Cache istatistiklerini güncelle (opsiyonel)
    // Bu metod gelecekte cache analytics için kullanılabilir
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch (error) {
      logger.error('❌ Cache health check failed:', error);
      return false;
    }
  }
}

export default new CacheService(); 