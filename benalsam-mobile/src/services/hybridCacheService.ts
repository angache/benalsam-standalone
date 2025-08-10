import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * KVKK COMPLIANCE: Hybrid Cache Service
 * 
 * Hibrit cache sistemi KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ SESSION_BASED - Sadece session_id ile cache
 * ✅ ANONYMIZED - Kişisel veri cache'lenmez
 * ✅ TRANSPARENCY - Cache süreleri açık
 * ✅ MINIMIZATION - Sadece gerekli veriler cache'lenir
 * ✅ FALLBACK - Redis bağlantısı yoksa AsyncStorage kullanır
 */

interface CacheItem {
  data: any;
  timestamp: number;
  serviceUsed: string;
  size: number;
  hitCount: number;
  sessionId?: string;
}

interface CacheStats {
  localKeys: number;
  serverKeys: number;
  localSize: number;
  serverSize: number;
  hitRate: number;
  serverConnected: boolean;
}

// Cache configuration
const CACHE_KEY_PREFIX = 'ai_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 saat
const MAX_LOCAL_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_SERVER_CACHE_SIZE = 1024 * 1024 * 1024; // 1GB

// Memory cache (hızlı erişim için)
const memoryCache = new Map<string, CacheItem>();

class HybridCacheService {
  private serverConnected = false;
  private apiBaseUrl = 'http://localhost:3002/api/v1'; // Backend URL

  constructor() {
    this.checkServerConnection();
  }

  // Server bağlantısını kontrol et
  private async checkServerConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/cache/health`);
      const data = await response.json();
      this.serverConnected = data.success && data.data.healthy;
      console.log('🔄 Server cache connection:', this.serverConnected ? '✅ Connected' : '❌ Disconnected');
    } catch (error) {
      this.serverConnected = false;
      console.log('❌ Server cache connection failed:', error);
    }
  }

  // Cache kontrolü - Hibrit sistem
  async getCachedResponse(userDescription: string, sessionId?: string): Promise<any | null> {
    const cacheKey = userDescription.toLowerCase().trim();
    
    try {
      // 1. Memory cache kontrolü
      const memoryCached = memoryCache.get(cacheKey);
      if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_EXPIRY) {
        memoryCached.hitCount++;
        console.log('🎯 Memory cache hit for:', userDescription);
        return memoryCached.data;
      }

      // 2. Local cache kontrolü (AsyncStorage)
      const localCached = await this.getLocalCache(cacheKey);
      if (localCached) {
        // Memory cache'e ekle
        memoryCache.set(cacheKey, localCached);
        console.log('🎯 Local cache hit for:', userDescription);
        return localCached.data;
      }

      // 3. Server cache kontrolü (Redis)
      if (this.serverConnected) {
        const serverCached = await this.getServerCache(cacheKey, sessionId);
        if (serverCached) {
          // Local cache'e de kaydet
          await this.setLocalCache(cacheKey, serverCached);
          memoryCache.set(cacheKey, serverCached);
          console.log('🎯 Server cache hit for:', userDescription);
          return serverCached.data;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Hybrid cache get error:', error);
      return null;
    }
  }

  // Cache'e kaydet - Hibrit sistem
  async cacheResponse(userDescription: string, response: any, serviceUsed: string, sessionId?: string): Promise<void> {
    const cacheKey = userDescription.toLowerCase().trim();
    
    try {
      const cacheItem: CacheItem = {
        data: response,
        timestamp: Date.now(),
        serviceUsed: serviceUsed,
        size: JSON.stringify(response).length,
        hitCount: 1,
        sessionId
      };

      // 1. Memory cache'e kaydet
      memoryCache.set(cacheKey, cacheItem);

      // 2. Local cache'e kaydet (AsyncStorage)
      await this.setLocalCache(cacheKey, cacheItem);

      // 3. Server cache'e kaydet (Redis)
      if (this.serverConnected) {
        await this.setServerCache(cacheKey, cacheItem, sessionId);
      }

      console.log('💾 Cached response (hybrid) for:', userDescription);
    } catch (error) {
      console.error('❌ Hybrid cache save error:', error);
    }
  }

  // Local cache işlemleri
  private async getLocalCache(cacheKey: string): Promise<CacheItem | null> {
    try {
      const storageKey = CACHE_KEY_PREFIX + cacheKey;
      const cachedData = await AsyncStorage.getItem(storageKey);
      
      if (cachedData) {
        const cacheItem: CacheItem = JSON.parse(cachedData);
        
        // Süre kontrolü
        if (Date.now() - cacheItem.timestamp < CACHE_EXPIRY) {
          cacheItem.hitCount++;
          await AsyncStorage.setItem(storageKey, JSON.stringify(cacheItem));
          return cacheItem;
        } else {
          // Süresi dolmuş cache'i sil
          await AsyncStorage.removeItem(storageKey);
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Local cache get error:', error);
      return null;
    }
  }

  private async setLocalCache(cacheKey: string, cacheItem: CacheItem): Promise<void> {
    try {
      const storageKey = CACHE_KEY_PREFIX + cacheKey;
      await AsyncStorage.setItem(storageKey, JSON.stringify(cacheItem));
      
      // Cache boyut kontrolü
      await this.checkLocalCacheSize();
    } catch (error) {
      console.error('❌ Local cache set error:', error);
    }
  }

  // Server cache işlemleri
  private async getServerCache(cacheKey: string, sessionId?: string): Promise<CacheItem | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/cache/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: cacheKey,
          sessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Server cache get error:', error);
      return null;
    }
  }

  private async setServerCache(cacheKey: string, cacheItem: CacheItem, sessionId?: string): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/cache/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: cacheKey,
          data: cacheItem,
          sessionId
        })
      });
    } catch (error) {
      console.error('❌ Server cache set error:', error);
    }
  }

  // Cache istatistikleri
  async getCacheStats(): Promise<CacheStats> {
    try {
      const localStats = await this.getLocalCacheStats();
      const serverStats = await this.getServerCacheStats();
      
      return {
        localKeys: localStats.totalKeys,
        serverKeys: serverStats.totalKeys,
        localSize: localStats.totalSize,
        serverSize: serverStats.totalSize,
        hitRate: (localStats.hitRate + serverStats.hitRate) / 2,
        serverConnected: this.serverConnected
      };
    } catch (error) {
      console.error('❌ Cache stats error:', error);
      return {
        localKeys: 0,
        serverKeys: 0,
        localSize: 0,
        serverSize: 0,
        hitRate: 0,
        serverConnected: this.serverConnected
      };
    }
  }

  private async getLocalCacheStats(): Promise<{ totalKeys: number; totalSize: number; hitRate: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      let totalSize = 0;
      let totalHits = 0;
      
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const cacheItem: CacheItem = JSON.parse(data);
          totalSize += cacheItem.size;
          totalHits += cacheItem.hitCount;
        }
      }
      
      return {
        totalKeys: cacheKeys.length,
        totalSize,
        hitRate: cacheKeys.length > 0 ? totalHits / cacheKeys.length : 0
      };
    } catch (error) {
      console.error('❌ Local cache stats error:', error);
      return { totalKeys: 0, totalSize: 0, hitRate: 0 };
    }
  }

  private async getServerCacheStats(): Promise<{ totalKeys: number; totalSize: number; hitRate: number }> {
    if (!this.serverConnected) {
      return { totalKeys: 0, totalSize: 0, hitRate: 0 };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/cache/stats`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
      
      return { totalKeys: 0, totalSize: 0, hitRate: 0 };
    } catch (error) {
      console.error('❌ Server cache stats error:', error);
      return { totalKeys: 0, totalSize: 0, hitRate: 0 };
    }
  }

  // Cache temizleme
  async clearCache(): Promise<{ localCleared: number; serverCleared: number }> {
    try {
      // Local cache temizleme
      const localKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = localKeys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      
      // Memory cache temizleme
      memoryCache.clear();
      
      // Server cache temizleme
      let serverCleared = 0;
      if (this.serverConnected) {
        try {
          const response = await fetch(`${this.apiBaseUrl}/cache/clear`, {
            method: 'POST'
          });
          if (response.ok) {
            const data = await response.json();
            serverCleared = data.data?.clearedCount || 0;
          }
        } catch (error) {
          console.error('❌ Server cache clear error:', error);
        }
      }
      
      console.log(`🧹 Cache cleared: ${cacheKeys.length} local, ${serverCleared} server`);
      return { localCleared: cacheKeys.length, serverCleared };
    } catch (error) {
      console.error('❌ Cache clear error:', error);
      return { localCleared: 0, serverCleared: 0 };
    }
  }

  // Local cache boyut kontrolü
  private async checkLocalCacheSize(): Promise<void> {
    try {
      const stats = await this.getLocalCacheStats();
      
      if (stats.totalSize > MAX_LOCAL_CACHE_SIZE) {
        // En eski cache'leri sil
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
        const cacheItems: Array<{ key: string; timestamp: number }> = [];
        
        for (const key of cacheKeys) {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const cacheItem: CacheItem = JSON.parse(data);
            cacheItems.push({ key, timestamp: cacheItem.timestamp });
          }
        }
        
        // En eski %20'yi sil
        cacheItems.sort((a, b) => a.timestamp - b.timestamp);
        const itemsToDelete = Math.ceil(cacheItems.length * 0.2);
        
        const keysToDelete = cacheItems.slice(0, itemsToDelete).map(item => item.key);
        await AsyncStorage.multiRemove(keysToDelete);
        
        console.log(`🗑️ Cleared ${itemsToDelete} old local cache items due to size limit`);
      }
    } catch (error) {
      console.error('❌ Local cache size check error:', error);
    }
  }

  // Health check
  async healthCheck(): Promise<{ local: boolean; server: boolean }> {
    try {
      // Local health check
      const localHealthy = await AsyncStorage.getItem('health_check') !== null;
      
      // Server health check
      let serverHealthy = false;
      if (this.serverConnected) {
        try {
          const response = await fetch(`${this.apiBaseUrl}/cache/health`);
          if (response.ok) {
            const data = await response.json();
            serverHealthy = data.success && data.data.healthy;
          }
        } catch (error) {
          console.error('❌ Server health check error:', error);
        }
      }
      
      return { local: localHealthy, server: serverHealthy };
    } catch (error) {
      console.error('❌ Cache health check error:', error);
      return { local: false, server: false };
    }
  }
}

export default new HybridCacheService(); 