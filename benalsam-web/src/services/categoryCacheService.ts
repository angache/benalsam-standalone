import { Category } from 'benalsam-shared-types';
import { apiClient } from '@/lib/apiClient';

// Cache configuration
const CACHE_KEY = 'benalsam_categories_v1.2.0';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const RATE_LIMIT = 60 * 1000; // 1 minute between API calls

interface CachedData {
  data: Category[];
  timestamp: number;
  version: string;
}

class CategoryCacheService {
  private lastFetchTime = 0;
  private isFetching = false;

  /**
   * Get categories from cache or API
   */
  async getCategories(): Promise<Category[]> {
    try {
      // Check if we're already fetching
      if (this.isFetching) {
        console.log('⏳ Category fetch already in progress, waiting...');
        // Wait for current fetch to complete
        await this.waitForFetch();
        return this.getCachedData();
      }

      // Check rate limiting
      const now = Date.now();
      if (now - this.lastFetchTime < RATE_LIMIT) {
        console.log('⏱️ Rate limit active, using cached data');
        return this.getCachedData();
      }

      // Try to get from cache first
      const cached = this.getCachedData();
      if (cached && cached.length > 0) {
        console.log('📦 Categories loaded from cache');
        return cached;
      }

      // Fetch from API
      return await this.fetchFromAPI();
    } catch (error) {
      console.error('❌ Error in getCategories:', error);
      
      // Fallback to cached data if available
      const cached = this.getCachedData();
      if (cached && cached.length > 0) {
        console.log('🔄 Falling back to cached data');
        return cached;
      }
      
      throw error;
    }
  }

  /**
   * Fetch categories from API
   */
  private async fetchFromAPI(): Promise<Category[]> {
    this.isFetching = true;
    this.lastFetchTime = Date.now();

    try {
      console.log('🌐 Fetching categories from API...');
      
      const response = await apiClient.get('/categories');
      
      if (!response.success) {
        throw new Error(response.error?.message || 'API returned error');
      }
      
      const categories = response.data;
      
      // Cache the data
      this.setCachedData(categories);
      
      console.log(`✅ Fetched ${categories.length} categories from API`);
      return categories;
    } catch (error) {
      console.error('❌ Error fetching from API:', error);
      throw error;
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Get cached data from localStorage
   */
  private getCachedData(): Category[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsed: CachedData = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - parsed.timestamp > CACHE_TTL) {
        console.log('⏰ Cache expired, will fetch fresh data');
        return null;
      }

      // Check version compatibility
      if (parsed.version !== 'v1.2.0') {
        console.log('🔄 Cache version mismatch, clearing cache');
        this.clearCache();
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('❌ Error reading cache:', error);
      this.clearCache();
      return null;
    }
  }

  /**
   * Set data in cache
   */
  private setCachedData(categories: Category[]): void {
    try {
      const cacheData: CachedData = {
        data: categories,
        timestamp: Date.now(),
        version: 'v1.2.0'
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 Categories cached successfully');
    } catch (error) {
      console.error('❌ Error setting cache:', error);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('🗑️ Category cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  /**
   * Refresh cache (force fetch from API)
   */
  async refresh(): Promise<Category[]> {
    console.log('🔄 Forcing category refresh...');
    this.clearCache();
    this.lastFetchTime = 0;
    return await this.fetchFromAPI();
  }

  /**
   * Wait for current fetch to complete
   */
  private async waitForFetch(): Promise<void> {
    return new Promise((resolve) => {
      const checkFetching = () => {
        if (!this.isFetching) {
          resolve();
        } else {
          setTimeout(checkFetching, 100);
        }
      };
      checkFetching();
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hasCache: boolean; cacheAge: number | null; cacheSize: number } {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        return { hasCache: false, cacheAge: null, cacheSize: 0 };
      }

      const parsed: CachedData = JSON.parse(cached);
      const cacheAge = Date.now() - parsed.timestamp;
      const cacheSize = cached.length;

      return {
        hasCache: true,
        cacheAge,
        cacheSize
      };
    } catch (error) {
      return { hasCache: false, cacheAge: null, cacheSize: 0 };
    }
  }
}

// Export singleton instance
export const categoryCacheService = new CategoryCacheService();
export default categoryCacheService;
