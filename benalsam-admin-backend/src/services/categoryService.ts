import { createClient } from '@supabase/supabase-js';
import logger from '../config/logger';
import axios from 'axios';

const CACHE_SERVICE_URL = process.env['CACHE_SERVICE_URL'] || 'http://localhost:3014';

/**
 * Cache Service'e istek yapmak için helper function
 */
async function makeCacheServiceRequest(
  method: 'GET' | 'POST' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<any> {
  try {
    const url = `${CACHE_SERVICE_URL}/api/v1/cache${endpoint}`;
    
    const config = {
      method,
      url,
      ...(data && { data }),
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    logger.error('Cache Service request failed:', {
      method,
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Lazy Supabase client
let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

// Types
export interface CategoryAttribute {
  id: number;
  category_id: number;
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  options?: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  path: string;
  parent_id?: number;
  level: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subcategories?: Category[];
  attributes?: CategoryAttribute[];
  stats?: {
    subcategoryCount: number;
    totalSubcategories: number;
    attributeCount: number;
    totalAttributes: number;
  };
}

export interface CreateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateAttributeRequest {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  options?: string[];
  sort_order?: number;
}

export interface UpdateAttributeRequest {
  key?: string;
  label?: string;
  type?: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  options?: string[];
  sort_order?: number;
}

export const categoryService = {
  // Get all categories with tree structure
  async getCategories(): Promise<Category[]> {
    try {
      const cacheKey = 'categories_tree';
      try {
        const cachedResult = await makeCacheServiceRequest('POST', '/get', { key: cacheKey });
        
        if (cachedResult.success && cachedResult.data) {
          logger.info('📦 Returning cached categories');
          return cachedResult.data;
        }
      } catch (error) {
        logger.warn('Cache get failed, proceeding with database query', { error });
      }

      logger.info('🔄 Fetching categories from database');
      
      const { data: categories, error } = await getSupabaseClient()
        .from('categories')
        .select(`
          *,
          category_attributes (*)
        `)
        .order('sort_order', { ascending: true });

      if (error) {
        logger.error('Error fetching categories:', error);
        throw error;
      }

      const tree = this.buildCategoryTree(categories || []);
      
      // Cache for 24 hours
      try {
        await makeCacheServiceRequest('POST', '/set', { key: cacheKey, data: tree, ttl: 24 * 60 * 60 });
      } catch (error) {
        logger.warn('Cache set failed', { error });
      }
      
      logger.info(`✅ Fetched ${tree.length} main categories`);
      return tree;

    } catch (error) {
      logger.error('Error in getCategories:', error);
      throw error;
    }
  },

  // Get ALL categories (flat list)
  async getAllCategories(): Promise<Category[]> {
    try {
      logger.info('🔄 Fetching ALL categories from database');
      
      const { data: categories, error } = await getSupabaseClient()
        .from('categories')
        .select(`
          *,
          category_attributes (*)
        `)
        .order('sort_order', { ascending: true });

      if (error) {
        logger.error('Error fetching all categories:', error);
        throw error;
      }

      logger.info(`✅ Fetched ${categories?.length || 0} total categories`);
      return categories || [];

    } catch (error) {
      logger.error('Error in getAllCategories:', error);
      throw error;
    }
  },

  // Get single category by ID
  async getCategory(id: string | number): Promise<Category | null> {
    try {
      const categoryId = typeof id === 'string' ? parseInt(id, 10) : id;
      logger.info(`Fetching category with ID: ${categoryId}`);

      const { data: category, error } = await getSupabaseClient()
        .from('categories')
        .select(`
          *,
          category_attributes (*)
        `)
        .eq('id', categoryId)
        .single();

      if (error) {
        logger.error('Error fetching category:', error);
        throw error;
      }

      if (!category) {
        logger.warn(`Category not found with ID: ${categoryId}`);
        return null;
      }

      logger.info(`Found category: ${category.name} (ID: ${category.id})`);
      return category;

    } catch (error) {
      logger.error('Error in getCategory:', error);
      throw error;
    }
  },

  // Get category by path (supports both slash and arrow separators)
  async getCategoryByPath(path: string): Promise<Category | null> {
    try {
      logger.info(`Fetching category with path: ${path}`);
      
      // Convert arrow separators to slash separators
      const normalizedPath = path.replace(/\s*>\s*/g, '/');
      logger.info(`Normalized path: ${normalizedPath}`);

      const { data: category, error } = await getSupabaseClient()
        .from('categories')
        .select(`
          *,
          category_attributes (*)
        `)
        .eq('path', normalizedPath)
        .single();

      if (error) {
        logger.error('Error fetching category by path:', error);
        throw error;
      }

      if (!category) {
        logger.warn(`Category not found for path: ${normalizedPath}`);
        return null;
      }

      // Get subcategories
      const { data: subcategories } = await getSupabaseClient()
        .from('categories')
        .select(`
          *,
          category_attributes (*)
        `)
        .eq('parent_id', category.id)
        .order('sort_order', { ascending: true });

      // Get attributes for the current category
      const { data: attributes } = await getSupabaseClient()
        .from('category_attributes')
        .select('*')
        .eq('category_id', category.id)
        .order('sort_order', { ascending: true });

      // Parse options for attributes
      const parsedAttributes = (attributes || []).map((attr: any) => ({
        ...attr,
        options: attr.options ? JSON.parse(attr.options) : null
      }));

      const categoryWithSubcategories = {
        ...category,
        subcategories: subcategories || [],
        attributes: parsedAttributes,
        stats: this.calculateCategoryStats({
          ...category,
          subcategories: subcategories || [],
          attributes: parsedAttributes
        })
      };

      logger.info(`Found category: ${category.name} (ID: ${category.id})`);
      return categoryWithSubcategories;

    } catch (error) {
      logger.error('Error in getCategoryByPath:', error);
      throw error;
    }
  },

  // Get category attributes by path
  async getCategoryAttributes(path: string): Promise<CategoryAttribute[]> {
    try {
      logger.info(`Fetching attributes for category path: ${path}`);
      
      // Önce kategoriyi path ile bul
      const category = await this.getCategoryByPath(path);
      
      if (!category) {
        logger.warn(`Category not found for path: ${path}`);
        return [];
      }
      
      // Kategori ID'si ile attribute'ları getir
      const { data: attributes, error } = await getSupabaseClient()
        .from('category_attributes')
        .select('*')
        .eq('category_id', category.id)
        .order('sort_order', { ascending: true });
      
      if (error) {
        logger.error('Error fetching category attributes:', error);
        throw error;
      }
      
      logger.info(`Found ${attributes?.length || 0} attributes for category: ${path}`);
      
      return attributes || [];
    } catch (error) {
      logger.error('Error in getCategoryAttributes:', error);
      throw error;
    }
  },

  // Create new category
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    try {
      logger.info('Creating new category:', data);

      // Generate path if parent_id is provided
      let path = data.name;
      let level = 0;

      if (data.parent_id) {
        const parent = await this.getCategory(data.parent_id);
        if (!parent) {
          throw new Error('Parent category not found');
        }
        path = `${parent.path} > ${data.name}`;
        level = parent.level + 1;
      }

      const { data: category, error } = await getSupabaseClient()
        .from('categories')
        .insert({
          ...data,
          path,
          level,
          sort_order: data.sort_order || 0,
          is_active: data.is_active !== false
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating category:', error);
        throw error;
      }

      logger.info('Category created successfully:', category.id);
      return category;

    } catch (error) {
      logger.error('Error in createCategory:', error);
      throw error;
    }
  },

  // Update category
  async updateCategory(id: string | number, data: UpdateCategoryRequest): Promise<Category> {
    try {
      const categoryId = typeof id === 'string' ? parseInt(id, 10) : id;
      logger.info(`Updating category with ID: ${categoryId}`);

      const { data: category, error } = await getSupabaseClient()
        .from('categories')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating category:', error);
        throw error;
      }

      logger.info('Category updated successfully:', category.id);
      return category;

    } catch (error) {
      logger.error('Error in updateCategory:', error);
      throw error;
    }
  },

  // Delete category
  async deleteCategory(id: string | number): Promise<void> {
    try {
      const categoryId = typeof id === 'string' ? parseInt(id, 10) : id;
      logger.info(`Deleting category with ID: ${categoryId}`);

      // Check if category has subcategories
      const { data: subcategories } = await getSupabaseClient()
        .from('categories')
        .select('id')
        .eq('parent_id', categoryId);

      if (subcategories && subcategories.length > 0) {
        throw new Error('Cannot delete category with subcategories');
      }

      const { error } = await getSupabaseClient()
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        logger.error('Error deleting category:', error);
        throw error;
      }

      logger.info('Category deleted successfully:', categoryId);

    } catch (error) {
      logger.error('Error in deleteCategory:', error);
      throw error;
    }
  },

  // Create attribute
  async createAttribute(categoryId: string, data: CreateAttributeRequest): Promise<CategoryAttribute> {
    try {
      const catId = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
      logger.info(`Creating attribute for category ${catId}:`, data);

      const { data: attribute, error } = await getSupabaseClient()
        .from('category_attributes')
        .insert({
          category_id: catId,
          ...data,
          options: data.options ? JSON.stringify(data.options) : null,
          sort_order: data.sort_order || 0
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating attribute:', error);
        throw error;
      }

      logger.info('Attribute created successfully:', attribute.id);
      return attribute;

    } catch (error) {
      logger.error('Error in createAttribute:', error);
      throw error;
    }
  },

  // Update attribute
  async updateAttribute(id: string, data: UpdateAttributeRequest): Promise<CategoryAttribute> {
    try {
      const attributeId = typeof id === 'string' ? parseInt(id, 10) : id;
      logger.info(`Updating attribute with ID: ${attributeId}`);

      const { data: attribute, error } = await getSupabaseClient()
        .from('category_attributes')
        .update({
          ...data,
          options: data.options ? JSON.stringify(data.options) : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', attributeId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating attribute:', error);
        throw error;
      }

      logger.info('Attribute updated successfully:', attribute.id);
      return attribute;

    } catch (error) {
      logger.error('Error in updateAttribute:', error);
      throw error;
    }
  },

  // Delete attribute
  async deleteAttribute(id: string): Promise<void> {
    try {
      const attributeId = typeof id === 'string' ? parseInt(id, 10) : id;
      logger.info(`Deleting attribute with ID: ${attributeId}`);

      const { error } = await getSupabaseClient()
        .from('category_attributes')
        .delete()
        .eq('id', attributeId);

      if (error) {
        logger.error('Error deleting attribute:', error);
        throw error;
      }

      logger.info('Attribute deleted successfully:', attributeId);

    } catch (error) {
      logger.error('Error in deleteAttribute:', error);
      throw error;
    }
  },

  // Build category tree
  buildCategoryTree(categories: any[]): Category[] {
    const categoryMap = new Map();
    const rootCategories: Category[] = [];

    // Create map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        subcategories: [],
        attributes: category.category_attributes || []
      });
    });

    // Build tree structure
    categories.forEach(category => {
      const categoryWithSubcategories = categoryMap.get(category.id);
      
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        const parent = categoryMap.get(category.parent_id);
        parent.subcategories.push(categoryWithSubcategories);
      } else {
        rootCategories.push(categoryWithSubcategories);
      }
    });

    return rootCategories;
  },

  // Calculate category stats
  calculateCategoryStats(category: Category): {
    subcategoryCount: number;
    totalSubcategories: number;
    attributeCount: number;
    totalAttributes: number;
  } {
    const countRecursive = (cat: Category, level: number = 0) => {
      let subcategoryCount = cat.subcategories?.length || 0;
      let totalSubcategories = subcategoryCount;
      let attributeCount = cat.attributes?.length || 0;
      let totalAttributes = attributeCount;

      if (cat.subcategories) {
        for (const subcategory of cat.subcategories) {
          const subStats = countRecursive(subcategory, level + 1);
          totalSubcategories += subStats.totalSubcategories;
          totalAttributes += subStats.totalAttributes;
        }
      }

      return {
        subcategoryCount,
        totalSubcategories,
        attributeCount,
        totalAttributes
      };
    };

    return countRecursive(category);
  },

  // Cache invalidation methods
  async invalidateCategoriesCache(): Promise<void> {
    try {
      await makeCacheServiceRequest('DELETE', '/delete', { key: 'categories_tree' });
      logger.info('🗑️ Categories cache invalidated');
    } catch (error) {
      logger.error('Error invalidating categories cache:', error);
    }
  },

  async invalidateCategoryCache(categoryId: number): Promise<void> {
    try {
      await makeCacheServiceRequest('DELETE', '/delete', { key: `category_${categoryId}` });
      await makeCacheServiceRequest('DELETE', '/delete', { key: 'categories_tree' });
      logger.info(`🗑️ Category ${categoryId} cache invalidated`);
    } catch (error) {
      logger.error('Error invalidating category cache:', error);
    }
  },

  async invalidateAllCategoryCaches(): Promise<void> {
    try {
      await makeCacheServiceRequest('DELETE', '/delete', { key: 'categories_tree' });
      await makeCacheServiceRequest('DELETE', '/delete', { key: 'category_counts' });
      logger.info('🗑️ All category caches invalidated');
    } catch (error) {
      logger.error('Error invalidating all category caches:', error);
    }
  }
};
