/**
 * Cache Manager
 * Centralized caching for admin operations
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
  forceRefresh?: boolean; // Force refresh cache
}

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  expiresAt: number;
}

export interface CacheStats {
  totalKeys: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  memoryUsage: number;
  oldestKey?: string;
  newestKey?: string;
}

/**
 * Cache Manager for admin operations
 */
export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheItem> = new Map();
  private stats = {
    hitCount: 0,
    missCount: 0,
  };

  private constructor() {
    // Clean expired items every 5 minutes
    setInterval(() => {
      this.cleanExpired();
    }, 5 * 60 * 1000);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Generate cache key
   */
  private generateKey(prefix: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return prefix;
    }

    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');

    return `${prefix}:${sortedParams}`;
  }

  /**
   * Set cache item
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    const expiresAt = Date.now() + ttl;
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      expiresAt,
    };

    this.cache.set(key, cacheItem);
  }

  /**
   * Get cache item
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.missCount++;
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.missCount++;
      return null;
    }

    this.stats.hitCount++;
    return item.data as T;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete cache item
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalKeys = this.cache.size;
    const hitRate = this.stats.hitCount + this.stats.missCount > 0 
      ? this.stats.hitCount / (this.stats.hitCount + this.stats.missCount) 
      : 0;

    let oldestKey: string | undefined;
    let newestKey: string | undefined;
    let oldestTime = Infinity;
    let newestTime = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
      if (item.timestamp > newestTime) {
        newestTime = item.timestamp;
        newestKey = key;
      }
    }

    return {
      totalKeys,
      hitCount: this.stats.hitCount,
      missCount: this.stats.missCount,
      hitRate,
      memoryUsage: this.estimateMemoryUsage(),
      oldestKey,
      newestKey,
    };
  }

  /**
   * Clean expired cache items
   */
  private cleanExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cache cleanup: ${cleanedCount} expired items removed`);
    }
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, item] of this.cache.entries()) {
      // Rough estimation: key length + JSON stringified data length
      totalSize += key.length + JSON.stringify(item.data).length;
    }
    
    return totalSize;
  }

  /**
   * Cache wrapper for async functions
   */
  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = 5 * 60 * 1000, forceRefresh = false } = options;
    const cacheKey = options.key || key;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Execute function and cache result
    try {
      const result = await fn();
      this.set(cacheKey, result, ttl);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: string): number {
    let invalidatedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    return invalidatedCount;
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache item details
   */
  getItemDetails(key: string): (CacheItem & { isExpired: boolean; timeUntilExpiry: number }) | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    return {
      ...item,
      isExpired: Date.now() > item.expiresAt,
      timeUntilExpiry: Math.max(0, item.expiresAt - Date.now()),
    };
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance(); 