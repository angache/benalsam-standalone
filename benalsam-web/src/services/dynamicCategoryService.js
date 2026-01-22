/**
 * 🚀 Dinamik Kategori Service
 * Backend'den kategorileri çeker ve cache'ler
 */

// Use apiClient instead of direct fetch
import { apiClient } from '@/lib/apiClient';

const CATEGORIES_SERVICE_URL = import.meta.env.VITE_CATEGORIES_SERVICE_URL || 'http://localhost:3015';

// Cache keys
const CATEGORIES_CACHE_KEY = 'dynamic_categories_cache_v1';
const CATEGORY_TREE_CACHE_KEY = 'dynamic_category_tree_cache_v1';
const CACHE_TTL = 30 * 60 * 1000; // 30 dakika

// Icon mapping - backend'den gelen kategori isimlerine göre
const ICON_MAPPING = {
  'Elektronik': 'Smartphone',
  'Telefon': 'Smartphone',
  'Bilgisayar': 'Laptop',
  'Oyun Konsolu': 'Gamepad2',
  'Kamera & Fotoğraf': 'Camera',
  'TV & Ses Sistemleri': 'Music',
  'Diğer Elektronik': 'Wrench',
  'Araç & Vasıta': 'Car',
  'Otomobil': 'Car',
  'Motosiklet': 'Car',
  'Bisiklet': 'Car',
  'Ticari Araçlar': 'Car',
  'Yedek Parça & Aksesuar': 'Wrench',
  'Emlak': 'Building',
  'Konut': 'Home',
  'Ticari': 'Building',
  'Arsa': 'Building',
  'Bina': 'Building',
  'Turistik Tesis': 'Building',
  'Moda': 'Shirt',
  'Giyim': 'Shirt',
  'Ayakkabı': 'Shirt',
  'Aksesuar': 'Shirt',
  'Ev & Yaşam': 'Home',
  'Mobilya': 'Home',
  'Dekorasyon': 'Home',
  'Ev Aletleri': 'Wrench',
  'Spor & Outdoor': 'Dumbbell',
  'Eğitim & Kitap': 'GraduationCap',
  'Hizmetler': 'Briefcase',
  'Sanat & Hobi': 'Palette',
  'Anne & Bebek': 'Baby',
  'Oyun & Eğlence': 'Gamepad2',
  'Sağlık & Güzellik': 'Heart',
  'İş & Endüstri': 'Briefcase',
  'Seyahat': 'Plane',
  'Kripto & Finans': 'Bitcoin',
  'Koleksiyon & Değerli Eşyalar': 'Star',
  'Yemek & İçecek': 'Utensils',
  'Hayvanlar': 'Heart',
  'Bahçe & Tarım': 'Home',
  'Teknoloji': 'Smartphone',
  'Müzik': 'Music',
  'Kitap': 'Book',
  'Film & TV': 'Camera',
  'Spor': 'Dumbbell',
  'Araç': 'Car',
  'Giyim': 'Shirt',
  'Ev': 'Home',
  'İş': 'Briefcase',
  'Eğitim': 'GraduationCap',
  'Sağlık': 'Heart',
  'Seyahat': 'Plane',
  'Eğlence': 'Gamepad2',
  'Diğer': 'MoreHorizontal'
};

// Color mapping
const COLOR_MAPPING = {
  'Elektronik': 'from-blue-500 to-cyan-500',
  'Araç & Vasıta': 'from-red-500 to-pink-500',
  'Emlak': 'from-orange-400 to-amber-600',
  'Moda': 'from-pink-500 to-rose-500',
  'Ev & Yaşam': 'from-green-500 to-emerald-500',
  'Spor & Outdoor': 'from-green-600 to-emerald-600',
  'Eğitim & Kitap': 'from-blue-600 to-indigo-600',
  'Hizmetler': 'from-purple-500 to-violet-500',
  'Sanat & Hobi': 'from-purple-600 to-pink-600',
  'Anne & Bebek': 'from-pink-400 to-rose-400',
  'Oyun & Eğlence': 'from-yellow-500 to-orange-500',
  'Sağlık & Güzellik': 'from-red-400 to-pink-400',
  'İş & Endüstri': 'from-gray-600 to-slate-600',
  'Seyahat': 'from-blue-400 to-cyan-400',
  'Kripto & Finans': 'from-yellow-600 to-amber-600',
  'Koleksiyon & Değerli Eşyalar': 'from-yellow-400 to-orange-400',
  'Yemek & İçecek': 'from-orange-500 to-red-500',
  'Hayvanlar': 'from-green-400 to-emerald-400',
  'Bahçe & Tarım': 'from-green-500 to-emerald-500',
  'Teknoloji': 'from-blue-500 to-indigo-500',
  'Müzik': 'from-purple-500 to-pink-500',
  'Kitap': 'from-brown-500 to-amber-500',
  'Film & TV': 'from-red-500 to-pink-500',
  'Spor': 'from-green-500 to-emerald-500',
  'Araç': 'from-red-500 to-pink-500',
  'Giyim': 'from-pink-500 to-rose-500',
  'Ev': 'from-green-500 to-emerald-500',
  'İş': 'from-gray-600 to-slate-600',
  'Eğitim': 'from-blue-600 to-indigo-600',
  'Sağlık': 'from-red-400 to-pink-400',
  'Seyahat': 'from-blue-400 to-cyan-400',
  'Eğlence': 'from-yellow-500 to-orange-500',
  'Diğer': 'from-gray-500 to-slate-500'
};

// Default icon ve color
const DEFAULT_ICON = 'MoreHorizontal';
const DEFAULT_COLOR = 'from-gray-500 to-slate-500';

class DynamicCategoryService {
  constructor() {
    this.categories = null;
    this.categoryTree = null;
    this.isLoading = false;
  }

  // Cache functions
  getCachedData(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp > CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      
      // Veri kontrolü - boş array varsa cache'i geçersiz say
      if (Array.isArray(data) && data.length === 0) {
        console.log('⚠️ Empty data in cache, treating as invalid');
        localStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  setCachedData(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  // Backend'den kategorileri çek
  async fetchCategories(retryCount = 0) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 saniye

    try {
      console.log(`📥 Fetching categories from backend... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      const response = await apiClient.get('/categories');
            
      if (!response.success) {
        throw new Error(response.error?.message || 'API returned error');
      }
            
      if (!response.data) {
        throw new Error('Invalid response format');
      }
            
      // Veri kontrolü - boş array veya null ise hata say
      if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new Error('Empty categories data received');
      }
            
      console.log(`✅ Fetched ${response.data.length} categories from backend`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching categories (attempt ${retryCount + 1}):`, error);
      
      // Retry mekanizması
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`🔄 Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.fetchCategories(retryCount + 1);
      }
      
      throw error;
    }
  }

  // Kategori verilerini zenginleştir (icon, color ekle)
  enrichCategoryData(categories) {
    return categories.map(category => ({
      ...category,
      icon: this.getIconForCategory(category.name),
      color: this.getColorForCategory(category.name),
      // Alt kategorileri de zenginleştir
      subcategories: category.subcategories ? 
        this.enrichCategoryData(category.subcategories) : []
    }));
  }

  // Kategori ismine göre icon al
  getIconForCategory(categoryName) {
    return ICON_MAPPING[categoryName] || DEFAULT_ICON;
  }

  // Kategori ismine göre color al
  getColorForCategory(categoryName) {
    return COLOR_MAPPING[categoryName] || DEFAULT_COLOR;
  }

  // Flat kategori listesi al
  async getCategories() {
    // Cache'den kontrol et
    const cached = this.getCachedData(CATEGORIES_CACHE_KEY);
    if (cached) {
      console.log('📦 Categories loaded from cache');
      this.categories = cached;
      return cached;
    }

    // Backend'den çek
    if (this.isLoading) {
      // Eğer zaten yükleniyorsa bekle
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.categories;
    }

    this.isLoading = true;
    
    try {
      const categories = await this.fetchCategories();
      const enrichedCategories = this.enrichCategoryData(categories);
      
      // Cache'e kaydet
      this.setCachedData(CATEGORIES_CACHE_KEY, enrichedCategories);
      
      this.categories = enrichedCategories;
      console.log('✅ Categories loaded and cached');
      
      return enrichedCategories;
    } catch (error) {
      console.error('❌ Failed to load categories:', error);
      return [];
    } finally {
      this.isLoading = false;
    }
  }

  // Kategori ağacı al (hierarchical structure)
  async getCategoryTree() {
    const startTime = Date.now();
    console.log('🌳 [PERF] getCategoryTree started', { 
      timestamp: new Date().toISOString() 
    });

    // Direkt flat cache'i kullan (çünkü orada zaten subkategoriler var)
    const cacheStart = Date.now();
    const flatCached = this.getCachedData(CATEGORIES_CACHE_KEY);
    const cacheTime = Date.now() - cacheStart;
    
    console.log('📦 [PERF] Cache check completed', { 
      cacheTime: `${cacheTime}ms`,
      cacheHit: !!flatCached
    });

    if (flatCached) {
      console.log('📦 [PERF] Using flat cache for tree', { 
        categoryCount: flatCached.length,
        totalTime: `${Date.now() - startTime}ms`
      });
      this.categoryTree = flatCached;
      return flatCached;
    }

    console.log('🔄 [PERF] Cache miss - fetching from backend', { 
      cacheTime: `${cacheTime}ms` 
    });

    // Eğer cache yoksa backend'den çek
    const fetchStart = Date.now();
    const categories = await this.getCategories();
    const fetchTime = Date.now() - fetchStart;
    
    console.log('📥 [PERF] Categories fetched from backend', { 
      categoryCount: categories.length,
      fetchTime: `${fetchTime}ms`
    });
    
    // Flat listeyi tree yapısına çevir
    const treeStart = Date.now();
    const tree = this.buildCategoryTree(categories);
    const treeTime = Date.now() - treeStart;
    
    console.log('🌳 [PERF] Category tree built', { 
      treeCategoryCount: tree.length,
      treeTime: `${treeTime}ms`
    });
    
    // Tree'yi zenginleştir (icon, color ekle)
    const enrichStart = Date.now();
    const enrichedTree = this.enrichCategoryData(tree);
    const enrichTime = Date.now() - enrichStart;
    
    console.log('✨ [PERF] Category data enriched', { 
      enrichTime: `${enrichTime}ms`
    });
    
    // Cache'e kaydet
    const cacheSetStart = Date.now();
    this.setCachedData(CATEGORY_TREE_CACHE_KEY, enrichedTree);
    const cacheSetTime = Date.now() - cacheSetStart;
    
    const totalTime = Date.now() - startTime;
    console.log('✅ [PERF] getCategoryTree completed', { 
      totalTime: `${totalTime}ms`,
      breakdown: {
        cacheCheck: `${cacheTime}ms`,
        backendFetch: `${fetchTime}ms`,
        treeBuilding: `${treeTime}ms`,
        dataEnrichment: `${enrichTime}ms`,
        cacheSet: `${cacheSetTime}ms`
      },
      categoryCount: enrichedTree.length
    });
    
    this.categoryTree = enrichedTree;
    return enrichedTree;
  }

  // Flat listeyi tree yapısına çevir
  buildCategoryTree(categories) {
    const categoryMap = new Map();
    const rootCategories = [];

    // Önce tüm kategorileri map'e ekle
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, subcategories: [] });
    });

    // Parent-child ilişkilerini kur
    categories.forEach(category => {
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        // Alt kategori
        const parent = categoryMap.get(category.parent_id);
        parent.subcategories.push(categoryMap.get(category.id));
      } else {
        // Root kategori
        rootCategories.push(categoryMap.get(category.id));
      }
    });

    return rootCategories;
  }

  // Kategori ID'sine göre kategori bul
  findCategoryById(categories, id) {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.subcategories) {
        const found = this.findCategoryById(category.subcategories, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Kategori ismine göre kategori bul
  findCategoryByName(categories, name) {
    for (const category of categories) {
      if (category.name === name) {
        return category;
      }
      if (category.subcategories) {
        const found = this.findCategoryByName(category.subcategories, name);
        if (found) return found;
      }
    }
    return null;
  }

  // Cache'i temizle
  clearCache() {
    localStorage.removeItem(CATEGORIES_CACHE_KEY);
    localStorage.removeItem(CATEGORY_TREE_CACHE_KEY);
    this.categories = null;
    this.categoryTree = null;
    console.log('🗑️ Category cache cleared');
  }

  // Kategori için attributes'ları getir
  getAttributesForCategory(mainCategory, subCategory, subSubCategory) {
    try {
      const categories = this.getCachedData(CATEGORIES_CACHE_KEY) || [];
      
      console.log('🔍 DEBUG: getAttributesForCategory called', {
        mainCategory,
        subCategory,
        subSubCategory,
        categoriesCount: categories.length,
        firstCategory: categories[0]?.name
      });
      
      // Ana kategoriyi bul
      const mainCat = categories.find(cat => cat.name === mainCategory);
      if (!mainCat) {
        console.log('❌ Main category not found:', mainCategory);
        return [];
      }

      // Sub kategoriyi bul
      let currentCategory = mainCat;
      if (subCategory) {
        const subCat = mainCat.subcategories?.find(sub => sub.name === subCategory);
        if (subCat) {
          currentCategory = subCat;
          
          // Sub-sub kategoriyi bul
          if (subSubCategory) {
            const subSubCat = subCat.subcategories?.find(subSub => subSub.name === subSubCategory);
            if (subSubCat) {
              currentCategory = subSubCat;
            }
          }
        }
      }

      // Attributes'ları döndür
      const attributes = currentCategory.attributes || [];
      console.log('✅ Attributes found', {
        categoryName: currentCategory.name,
        attributesCount: attributes.length,
        attributes: attributes
      });
      return attributes;
    } catch (error) {
      console.error('Error getting attributes for category:', error);
      return [];
    }
  }

  // Cache'i yenile
  async refreshCache() {
    this.clearCache();
    return await this.getCategories();
  }
}

// Singleton instance
const dynamicCategoryService = new DynamicCategoryService();

export default dynamicCategoryService;
