import { supabase } from '../config/database';
import { logger } from '../config/logger';
import CacheService from '../utils/cacheService';
import { databaseCircuitBreaker, cacheCircuitBreaker } from '../utils/circuitBreaker';
import {
  Category,
  CategoryAttribute,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateAttributeRequest,
  UpdateAttributeRequest,
  CategoryTree,
  CategoryStats,
  PaginationParams,
  CategoryFilters
} from '../types/category';

/**
 * Categories Service - Handles all category-related operations
 */
export class CategoryService {
  /**
   * Get all categories with tree structure
   */
  async getCategories(): Promise<Category[]> {
    return await databaseCircuitBreaker.execute(async () => {
      try {
        // Try cache first
        const cachedResult = await cacheCircuitBreaker.execute(async () => {
          return await CacheService.get(CacheService.getKeys.categories());
        }, 'cache-get-categories');
        
        if (cachedResult) {
          logger.info('📦 Returning cached categories', { service: 'categories-service' });
          return cachedResult;
        }

        logger.info('🔄 Fetching categories from database', { service: 'categories-service' });
        
        const { data: categories, error } = await supabase
          .from('categories')
          .select(`
            *,
            category_attributes (*)
          `)
          .order('sort_order', { ascending: true });

        if (error) {
          logger.error('Error fetching categories:', { error, service: 'categories-service' });
          throw error;
        }

        const tree = this.buildCategoryTree(categories || []);
        
        // Cache for 24 hours
        await cacheCircuitBreaker.execute(async () => {
          await CacheService.set(CacheService.getKeys.categories(), tree, 24 * 60 * 60);
        }, 'cache-set-categories');
        
        logger.info(`✅ Fetched ${tree.length} main categories`, { service: 'categories-service' });
        return tree;

      } catch (error) {
        logger.error('Error in getCategories:', { error, service: 'categories-service' });
        throw error;
      }
    }, 'get-categories');
  }

  /**
   * Get ALL categories (flat list)
   */
  async getAllCategories(filters?: CategoryFilters, pagination?: PaginationParams): Promise<Category[]> {
    try {
      logger.info('🔄 Fetching ALL categories from database', { service: 'categories-service' });
      
      let query = supabase
        .from('categories')
        .select(`
          *,
          category_attributes (*)
        `);

      // Apply filters
      if (filters) {
        if (filters.is_active !== undefined) {
          query = query.eq('is_active', filters.is_active);
        }
        if (filters.parent_id !== undefined) {
          query = query.eq('parent_id', filters.parent_id);
        }
        if (filters.level !== undefined) {
          query = query.eq('level', filters.level);
        }
        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }
      }

      // Apply pagination
      if (pagination) {
        const { page = 1, limit = 50, sortBy = 'sort_order', sortOrder = 'asc' } = pagination;
        const offset = (page - 1) * limit;
        
        query = query
          .order(sortBy, { ascending: sortOrder === 'asc' })
          .range(offset, offset + limit - 1);
      } else {
        query = query.order('sort_order', { ascending: true });
      }

      const { data: categories, error } = await query;

      if (error) {
        logger.error('Error fetching all categories:', { error, service: 'categories-service' });
        throw error;
      }

      logger.info(`✅ Fetched ${categories?.length || 0} total categories`, { service: 'categories-service' });
      return categories || [];

    } catch (error) {
      logger.error('Error in getAllCategories:', { error, service: 'categories-service' });
      throw error;
    }
  }

  /**
   * Get single category by ID
   */
  async getCategory(id: string | number): Promise<Category | null> {
    try {
      const categoryId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      // Try cache first
      const cachedResult = await CacheService.get(CacheService.getKeys.category(categoryId));
      if (cachedResult) {
        logger.info('📦 Returning cached category', { categoryId, service: 'categories-service' });
        return cachedResult;
      }

      logger.info(`Fetching category with ID: ${categoryId}`, { service: 'categories-service' });

      const { data: category, error } = await supabase
        .from('categories')
        .select(`
          *,
          category_attributes (*)
        `)
        .eq('id', categoryId)
        .single();

      if (error) {
        logger.error('Error fetching category:', { error, categoryId, service: 'categories-service' });
        throw error;
      }

      if (!category) {
        logger.warn(`Category not found with ID: ${categoryId}`, { service: 'categories-service' });
        return null;
      }

      // Cache for 1 hour
      await CacheService.set(CacheService.getKeys.category(categoryId), category, 3600);

      logger.info(`Found category: ${category.name} (ID: ${category.id})`, { service: 'categories-service' });
      return category;

    } catch (error) {
      logger.error('Error in getCategory:', { error, service: 'categories-service' });
      throw error;
    }
  }

  /**
   * Get category by path
   */
  async getCategoryByPath(path: string): Promise<Category | null> {
    try {
      // Try cache first
      const cachedResult = await CacheService.get(CacheService.getKeys.categoryByPath(path));
      if (cachedResult) {
        logger.info('📦 Returning cached category by path', { path, service: 'categories-service' });
        return cachedResult;
      }

      logger.info(`Fetching category with path: ${path}`, { service: 'categories-service' });
      
      // Convert arrow separators to slash separators
      const normalizedPath = path.replace(/\s*>\s*/g, '/');
      logger.info(`Normalized path: ${normalizedPath}`, { service: 'categories-service' });

      const { data: category, error } = await supabase
        .from('categories')
        .select(`
          *,
          category_attributes (*)
        `)
        .eq('path', normalizedPath)
        .single();

      if (error) {
        logger.error('Error fetching category by path:', { error, path, service: 'categories-service' });
        throw error;
      }

      if (!category) {
        logger.warn(`Category not found for path: ${normalizedPath}`, { service: 'categories-service' });
        return null;
      }

      // Get subcategories
      const { data: subcategories } = await supabase
        .from('categories')
        .select(`
          *,
          category_attributes (*)
        `)
        .eq('parent_id', category.id)
        .order('sort_order', { ascending: true });

      // Get attributes for the current category
      const { data: attributes } = await supabase
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

      // Cache for 1 hour
      await CacheService.set(CacheService.getKeys.categoryByPath(path), categoryWithSubcategories, 3600);

      logger.info(`Found category by path: ${category.name} (ID: ${category.id})`, { service: 'categories-service' });
      return categoryWithSubcategories;

    } catch (error) {
      logger.error('Error in getCategoryByPath:', { error, service: 'categories-service' });
      throw error;
    }
  }

  /**
   * Create new category
   */
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    try {
      logger.info('Creating new category', { data, service: 'categories-service' });

      // Generate path
      const path = await this.generateCategoryPath(data.name, data.parent_id);

      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          name: data.name,
          icon: data.icon,
          color: data.color,
          parent_id: data.parent_id,
          path,
          level: data.parent_id ? await this.getCategoryLevel(data.parent_id) + 1 : 0,
          sort_order: data.sort_order || 1000,
          is_active: data.is_active !== false
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating category:', { error, data, service: 'categories-service' });
        throw error;
      }

      // Invalidate cache
      await this.invalidateCategoryCache();

      logger.info(`✅ Created category: ${category.name} (ID: ${category.id})`, { service: 'categories-service' });
      return category;

    } catch (error) {
      logger.error('Error in createCategory:', { error, service: 'categories-service' });
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(id: number, data: UpdateCategoryRequest): Promise<Category> {
    try {
      logger.info('Updating category', { id, data, service: 'categories-service' });

      const updateData: any = { ...data };

      // If name is being updated, regenerate path
      if (data.name) {
        const existingCategory = await this.getCategory(id);
        if (existingCategory) {
          updateData.path = await this.generateCategoryPath(data.name, existingCategory.parent_id);
        }
      }

      const { data: category, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating category:', { error, id, data, service: 'categories-service' });
        throw error;
      }

      // Invalidate cache
      await this.invalidateCategoryCache();

      logger.info(`✅ Updated category: ${category.name} (ID: ${category.id})`, { service: 'categories-service' });
      return category;

    } catch (error) {
      logger.error('Error in updateCategory:', { error, service: 'categories-service' });
      throw error;
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(id: number): Promise<boolean> {
    try {
      logger.info('Deleting category', { id, service: 'categories-service' });

      // Check if category has subcategories
      const { data: subcategories } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', id);

      if (subcategories && subcategories.length > 0) {
        throw new Error('Cannot delete category with subcategories');
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting category:', { error, id, service: 'categories-service' });
        throw error;
      }

      // Invalidate cache
      await this.invalidateCategoryCache();

      logger.info(`✅ Deleted category with ID: ${id}`, { service: 'categories-service' });
      return true;

    } catch (error) {
      logger.error('Error in deleteCategory:', { error, service: 'categories-service' });
      throw error;
    }
  }

  /**
   * Get category attributes
   */
  async getCategoryAttributes(categoryId: number): Promise<CategoryAttribute[]> {
    try {
      // Try cache first
      const cachedResult = await CacheService.get(CacheService.getKeys.categoryAttributes(categoryId));
      if (cachedResult) {
        logger.info('📦 Returning cached category attributes', { categoryId, service: 'categories-service' });
        return cachedResult;
      }

      logger.info(`Fetching attributes for category: ${categoryId}`, { service: 'categories-service' });

      const { data: attributes, error } = await supabase
        .from('category_attributes')
        .select('*')
        .eq('category_id', categoryId)
        .order('sort_order', { ascending: true });

      if (error) {
        logger.error('Error fetching category attributes:', { error, categoryId, service: 'categories-service' });
        throw error;
      }

      // Parse options for attributes
      const parsedAttributes = (attributes || []).map((attr: any) => ({
        ...attr,
        options: attr.options ? JSON.parse(attr.options) : null
      }));

      // Cache for 1 hour
      await CacheService.set(CacheService.getKeys.categoryAttributes(categoryId), parsedAttributes, 3600);

      logger.info(`✅ Fetched ${parsedAttributes.length} attributes for category: ${categoryId}`, { service: 'categories-service' });
      return parsedAttributes;

    } catch (error) {
      logger.error('Error in getCategoryAttributes:', { error, service: 'categories-service' });
      throw error;
    }
  }

  /**
   * Create category attribute
   */
  async createCategoryAttribute(data: CreateAttributeRequest): Promise<CategoryAttribute> {
    try {
      logger.info('Creating category attribute', { data, service: 'categories-service' });

      const { data: attribute, error } = await supabase
        .from('category_attributes')
        .insert({
          category_id: data.category_id,
          key: data.key,
          label: data.label,
          type: data.type,
          required: data.required || false,
          options: data.options ? JSON.stringify(data.options) : null,
          sort_order: data.sort_order || 1000
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating category attribute:', { error, data, service: 'categories-service' });
        throw error;
      }

      // Invalidate cache
      await CacheService.invalidate(`category:${data.category_id}:*`);

      logger.info(`✅ Created attribute: ${attribute.label} (ID: ${attribute.id})`, { service: 'categories-service' });
      return {
        ...attribute,
        options: attribute.options ? JSON.parse(attribute.options) : null
      };

    } catch (error) {
      logger.error('Error in createCategoryAttribute:', { error, service: 'categories-service' });
      throw error;
    }
  }

  /**
   * Update category attribute
   */
  async updateCategoryAttribute(id: number, data: UpdateAttributeRequest): Promise<CategoryAttribute> {
    try {
      logger.info('Updating category attribute', { id, data, service: 'categories-service' });

      const updateData: any = { ...data };
      if (data.options) {
        updateData.options = JSON.stringify(data.options);
      }

      const { data: attribute, error } = await supabase
        .from('category_attributes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating category attribute:', { error, id, data, service: 'categories-service' });
        throw error;
      }

      // Invalidate cache
      await CacheService.invalidate(`category:${attribute.category_id}:*`);

      logger.info(`✅ Updated attribute: ${attribute.label} (ID: ${attribute.id})`, { service: 'categories-service' });
      return {
        ...attribute,
        options: attribute.options ? JSON.parse(attribute.options) : null
      };

    } catch (error) {
      logger.error('Error in updateCategoryAttribute:', { error, service: 'categories-service' });
      throw error;
    }
  }

  /**
   * Delete category attribute
   */
  async deleteCategoryAttribute(id: number): Promise<boolean> {
    try {
      logger.info('Deleting category attribute', { id, service: 'categories-service' });

      // Get attribute to know which category to invalidate cache for
      const { data: attribute } = await supabase
        .from('category_attributes')
        .select('category_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('category_attributes')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting category attribute:', { error, id, service: 'categories-service' });
        throw error;
      }

      // Invalidate cache
      if (attribute) {
        await CacheService.invalidate(`category:${attribute.category_id}:*`);
      }

      logger.info(`✅ Deleted attribute with ID: ${id}`, { service: 'categories-service' });
      return true;

    } catch (error) {
      logger.error('Error in deleteCategoryAttribute:', { error, service: 'categories-service' });
      throw error;
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<CategoryStats> {
    try {
      // Try cache first
      const cachedResult = await CacheService.get(CacheService.getKeys.categoryStats());
      if (cachedResult) {
        logger.info('📦 Returning cached category stats', { service: 'categories-service' });
        return cachedResult;
      }

      logger.info('Calculating category statistics', { service: 'categories-service' });

      const { data: categories } = await supabase
        .from('categories')
        .select('id, parent_id, is_active');

      const { data: attributes } = await supabase
        .from('category_attributes')
        .select('category_id');

      const stats: CategoryStats = {
        totalCategories: categories?.length || 0,
        activeCategories: categories?.filter(c => c.is_active).length || 0,
        inactiveCategories: categories?.filter(c => !c.is_active).length || 0,
        categoriesWithSubcategories: categories?.filter(c => 
          categories.some(sub => sub.parent_id === c.id)
        ).length || 0,
        categoriesWithAttributes: new Set(attributes?.map(a => a.category_id) || []).size,
        maxDepth: this.calculateMaxDepth(categories || []),
        averageSubcategories: this.calculateAverageSubcategories(categories || []),
        averageAttributes: this.calculateAverageAttributes(categories || [], attributes || [])
      };

      // Cache for 1 hour
      await CacheService.set(CacheService.getKeys.categoryStats(), stats, 3600);

      logger.info('✅ Calculated category statistics', { stats, service: 'categories-service' });
      return stats;

    } catch (error) {
      logger.error('Error in getCategoryStats:', { error, service: 'categories-service' });
      throw error;
    }
  }

  /**
   * Build category tree structure
   */
  private buildCategoryTree(categories: Category[]): Category[] {
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];

    // First pass: create map and add stats
    categories.forEach(category => {
      const categoryWithStats = {
        ...category,
        subcategories: [],
        stats: this.calculateCategoryStats(category)
      };
      categoryMap.set(category.id, categoryWithStats);
    });

    // Second pass: build tree
    categories.forEach(category => {
      const categoryWithStats = categoryMap.get(category.id)!;
      
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.subcategories = parent.subcategories || [];
          parent.subcategories.push(categoryWithStats);
        }
      } else {
        rootCategories.push(categoryWithStats);
      }
    });

    return rootCategories;
  }

  /**
   * Calculate category statistics
   */
  private calculateCategoryStats(category: Category): any {
    return {
      subcategoryCount: category.subcategories?.length || 0,
      totalSubcategories: this.countTotalSubcategories(category),
      attributeCount: category.attributes?.length || 0,
      totalAttributes: category.attributes?.length || 0
    };
  }

  /**
   * Count total subcategories recursively
   */
  private countTotalSubcategories(category: Category): number {
    let count = category.subcategories?.length || 0;
    if (category.subcategories) {
      category.subcategories.forEach(sub => {
        count += this.countTotalSubcategories(sub);
      });
    }
    return count;
  }

  /**
   * Generate category path
   */
  private async generateCategoryPath(name: string, parentId?: number): Promise<string> {
    if (!parentId) {
      return name.toLowerCase().replace(/\s+/g, '-');
    }

    const parent = await this.getCategory(parentId);
    if (!parent) {
      throw new Error('Parent category not found');
    }

    return `${parent.path}/${name.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Get category level
   */
  private async getCategoryLevel(categoryId: number): Promise<number> {
    const category = await this.getCategory(categoryId);
    return category?.level || 0;
  }

  /**
   * Calculate max depth
   */
  private calculateMaxDepth(categories: any[]): number {
    let maxDepth = 0;
    categories.forEach(category => {
      if (!category.parent_id) {
        const depth = this.calculateDepth(category, categories);
        maxDepth = Math.max(maxDepth, depth);
      }
    });
    return maxDepth;
  }

  /**
   * Calculate depth recursively
   */
  private calculateDepth(category: any, categories: any[]): number {
    const children = categories.filter(c => c.parent_id === category.id);
    if (children.length === 0) return 1;
    
    let maxChildDepth = 0;
    children.forEach(child => {
      const childDepth = this.calculateDepth(child, categories);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    });
    
    return 1 + maxChildDepth;
  }

  /**
   * Calculate average subcategories
   */
  private calculateAverageSubcategories(categories: any[]): number {
    const categoriesWithChildren = categories.filter(c => 
      categories.some(sub => sub.parent_id === c.id)
    );
    
    if (categoriesWithChildren.length === 0) return 0;
    
    const totalSubcategories = categoriesWithChildren.reduce((sum, category) => {
      return sum + categories.filter(c => c.parent_id === category.id).length;
    }, 0);
    
    return totalSubcategories / categoriesWithChildren.length;
  }

  /**
   * Calculate average attributes
   */
  private calculateAverageAttributes(categories: any[], attributes: any[]): number {
    if (categories.length === 0) return 0;
    
    const totalAttributes = attributes.length;
    return totalAttributes / categories.length;
  }

  /**
   * Invalidate category cache
   */
  private async invalidateCategoryCache(): Promise<void> {
    try {
      await CacheService.invalidate('categories:*');
      logger.info('✅ Category cache invalidated', { service: 'categories-service' });
    } catch (error) {
      logger.warn('Failed to invalidate category cache', { error, service: 'categories-service' });
    }
  }
}

export default new CategoryService();
