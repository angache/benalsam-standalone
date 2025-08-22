import { Category } from 'benalsam-shared-types';

class CategoryCacheService {
  private readonly CACHE_KEY = 'categories_v1.1.0';
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 saat

  // Cache'den kategorileri al
  async getCategories(): Promise<Category[]> {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.CACHE_TTL) {
          console.log('📦 Categories loaded from cache');
          return data;
        }
      }
      
      // Cache yoksa veya expired ise API'den çek
      console.log('🔄 Fetching categories from API...');
      return await this.fetchCategoriesFromAPI();
    } catch (error) {
      console.error('❌ Category cache error:', error);
      return await this.fetchCategoriesFromAPI();
    }
  }

  // API'den kategorileri çek ve cache'le
  private async fetchCategoriesFromAPI(): Promise<Category[]> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/categories`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Cache'e kaydet
        localStorage.setItem(this.CACHE_KEY, JSON.stringify({
          data: result.data,
          timestamp: Date.now()
        }));
        
        console.log('✅ Categories cached successfully');
        return result.data;
      }
      
      throw new Error('Failed to fetch categories from API');
    } catch (error) {
      console.error('❌ API fetch error:', error);
      throw error;
    }
  }

  // Cache'i temizle
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    console.log('🗑️ Category cache cleared');
  }

  // Cache durumunu kontrol et
  isCached(): boolean {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (!cached) return false;
    
    try {
      const { timestamp } = JSON.parse(cached);
      return Date.now() - timestamp < this.CACHE_TTL;
    } catch {
      return false;
    }
  }

  // Cache'deki veriyi getir (API çağrısı yapmadan)
  getCachedData(): Category[] | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < this.CACHE_TTL) {
        return data;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  // Cache TTL'ini kontrol et
  getCacheAge(): number {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return -1;
      
      const { timestamp } = JSON.parse(cached);
      return Date.now() - timestamp;
    } catch {
      return -1;
    }
  }
}

export const categoryCacheService = new CategoryCacheService();
