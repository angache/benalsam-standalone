import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category } from '../types/category';

// Cache keys
const CATEGORIES_CACHE_KEY = 'categories_cache';
const CATEGORIES_VERSION_KEY = 'categories_version';

// API endpoints
const getBackendUrl = () => {
  const backendUrl = process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL;
  if (!backendUrl) {
    throw new Error('EXPO_PUBLIC_ADMIN_BACKEND_URL is not configured');
  }
  return backendUrl;
};

// Cache management
const getCachedData = async (key: string): Promise<any | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;
    
    const { data, version } = JSON.parse(cached);
    return { data, version };
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

const setCachedData = async (key: string, data: any, version: number): Promise<void> => {
  try {
    const cacheData = { data, version };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

// Version check
const checkVersion = async (): Promise<number> => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/v1/categories/version`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'API returned error');
    }
    
    return result.version || 0;
  } catch (error) {
    console.error('Error checking version:', error);
    return 0;
  }
};

// Category service
export const categoryService = {
  // Get all categories with tree structure
  async getCategories(): Promise<Category[]> {
    try {
      console.log('🔄 Fetching categories...');
      
      // Check version first
      const serverVersion = await checkVersion();
      const cached = await getCachedData(CATEGORIES_CACHE_KEY);
      
      // If we have cached data and version matches, use cache
      if (cached && cached.version === serverVersion) {
        console.log('📦 Categories loaded from cache (version match)');
        return cached.data;
      }
      
      // Fetch new data from API
      console.log('🌐 Fetching categories from API...');
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/categories`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API returned error');
      }
      
      const categories = result.data;
      
      // Cache the new data
      await setCachedData(CATEGORIES_CACHE_KEY, categories, serverVersion);
      
      console.log(`✅ Fetched ${categories.length} categories from API`);
      return categories;
      
    } catch (error) {
      console.error('❌ Error in getCategories:', error);
      
      // Fallback to cached data if available
      const cached = await getCachedData(CATEGORIES_CACHE_KEY);
      if (cached && cached.data) {
        console.log('🔄 Falling back to cached data');
        return cached.data;
      }
      
      throw error;
    }
  },

  // Get ALL categories (main + subcategories) as flat list
  async getAllCategories(): Promise<Category[]> {
    try {
      console.log('🔄 Fetching all categories (flat list)...');
      
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/categories/all`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API returned error');
      }
      
      console.log(`✅ Fetched ${result.data.length} total categories`);
      return result.data;
      
    } catch (error) {
      console.error('❌ Error in getAllCategories:', error);
      throw error;
    }
  },

  // Get single category by ID
  async getCategory(id: string | number): Promise<Category | null> {
    try {
      console.log(`🔄 Fetching category with ID: ${id}`);
      
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/categories/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API returned error');
      }
      
      console.log(`✅ Fetched category: ${result.data.name}`);
      return result.data;
      
    } catch (error) {
      console.error('❌ Error in getCategory:', error);
      throw error;
    }
  },

  // Get category by path
  async getCategoryByPath(path: string): Promise<Category | null> {
    try {
      console.log(`🔄 Fetching category by path: ${path}`);
      
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/categories/path/${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API returned error');
      }
      
      console.log(`✅ Fetched category by path: ${result.data.name}`);
      return result.data;
      
    } catch (error) {
      console.error('❌ Error in getCategoryByPath:', error);
      throw error;
    }
  },

  // Clear cache
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CATEGORIES_CACHE_KEY);
      await AsyncStorage.removeItem(CATEGORIES_VERSION_KEY);
      console.log('🗑️ Category cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Get cached version
  async getCachedVersion(): Promise<number> {
    try {
      const cached = await getCachedData(CATEGORIES_CACHE_KEY);
      return cached?.version || 0;
    } catch (error) {
      console.error('Error getting cached version:', error);
      return 0;
    }
  }
};
