import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number; // Time to live in milliseconds
  cleanupInterval: number;
  enableCompression?: boolean;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  averageAccessTime: number;
  oldestEntry: number;
  newestEntry: number;
}

class SearchCache {
  private static instance: SearchCache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    totalAccesses: 0,
  };

  private constructor() {
    this.config = {
      maxSize: 100, // Maximum number of cache entries
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 10 * 60 * 1000, // 10 minutes
      enableCompression: false,
    };
    
    this.loadCache();
    this.startCleanupInterval();
  }

  static getInstance(): SearchCache {
    if (!SearchCache.instance) {
      SearchCache.instance = new SearchCache();
    }
    return SearchCache.instance;
  }

  // Set cache entry
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const expiresAt = Date.now() + (ttl || this.config.defaultTTL);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Check if cache is full
    if (this.cache.size >= this.config.maxSize) {
      await this.evictLeastUsed();
    }

    this.cache.set(key, entry);
    await this.saveCache();
    
    console.log(`💾 SearchCache: Cached "${key}" (expires in ${Math.round(ttl || this.config.defaultTTL / 1000)}s)`);
  }

  // Get cache entry
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.stats.totalAccesses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.totalAccesses++;
      await this.saveCache();
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.stats.totalAccesses++;
    
    await this.saveCache();
    return entry.data;
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    return Date.now() <= entry.expiresAt;
  }

  // Delete cache entry
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      await this.saveCache();
      console.log(`💾 SearchCache: Deleted "${key}"`);
    }
    return deleted;
  }

  // Clear all cache
  async clear(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem('searchCache');
    console.log('💾 SearchCache: Cleared all cache');
  }

  // Get cache statistics
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(entry => entry.timestamp);
    const accessTimes = entries.map(entry => entry.lastAccessed - entry.timestamp);
    
    return {
      totalEntries: this.cache.size,
      totalSize: this.getCacheSize(),
      hitRate: this.stats.totalAccesses > 0 ? this.stats.hits / this.stats.totalAccesses : 0,
      missRate: this.stats.totalAccesses > 0 ? this.stats.misses / this.stats.totalAccesses : 0,
      averageAccessTime: accessTimes.length > 0 ? accessTimes.reduce((sum, time) => sum + time, 0) / accessTimes.length : 0,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };
  }

  // Get cache keys
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get cache size in bytes (approximate)
  getCacheSize(): number {
    let size = 0;
    for (const [key, entry] of this.cache) {
      size += key.length;
      size += JSON.stringify(entry.data).length;
    }
    return size;
  }

  // Set cache configuration
  setConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('💾 SearchCache: Updated configuration');
  }

  // Cache search results with query as key
  async cacheSearchResults(query: string, results: any[], ttl?: number): Promise<void> {
    const key = `search:${query.toLowerCase().trim()}`;
    await this.set(key, results, ttl);
  }

  // Get cached search results
  async getCachedSearchResults(query: string): Promise<any[] | null> {
    const key = `search:${query.toLowerCase().trim()}`;
    return await this.get(key);
  }

  // Cache suggestions with query as key
  async cacheSuggestions(query: string, suggestions: string[], ttl?: number): Promise<void> {
    const key = `suggestions:${query.toLowerCase().trim()}`;
    await this.set(key, suggestions, ttl);
  }

  // Get cached suggestions
  async getCachedSuggestions(query: string): Promise<string[] | null> {
    const key = `suggestions:${query.toLowerCase().trim()}`;
    return await this.get(key);
  }

  // Private methods
  private async evictLeastUsed(): Promise<void> {
    const entries = Array.from(this.cache.entries());
    
    // Sort by access count and last accessed time
    entries.sort((a, b) => {
      if (a[1].accessCount !== b[1].accessCount) {
        return a[1].accessCount - b[1].accessCount;
      }
      return a[1].lastAccessed - b[1].lastAccessed;
    });

    // Remove 20% of least used entries
    const toRemove = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    console.log(`💾 SearchCache: Evicted ${toRemove} least used entries`);
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      await this.saveCache();
      console.log(`💾 SearchCache: Cleaned up ${cleanedCount} expired entries`);
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private async loadCache(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('searchCache');
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data.cache || []);
        this.stats = data.stats || { hits: 0, misses: 0, totalAccesses: 0 };
        console.log(`💾 SearchCache: Loaded ${this.cache.size} entries`);
      }
    } catch (error) {
      console.error('Failed to load search cache:', error);
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        stats: this.stats,
      };
      await AsyncStorage.setItem('searchCache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save search cache:', error);
    }
  }
}

export default SearchCache; 