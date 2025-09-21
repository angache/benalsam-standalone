import { 
  ICategoryService, 
  IDatabaseService, 
  ICacheService, 
  ILogger,
  Category,
  CategoryAttribute,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateAttributeRequest,
  UpdateAttributeRequest,
  CategoryFilters,
  PaginationParams
} from '../interfaces/ICategoryService';
import { supabase } from '../config/database';

/**
 * Refactored Category Service
 * Dependency Injection ile test edilebilir
 */
export class CategoryServiceRefactored implements ICategoryService {
  constructor(
    private databaseService: IDatabaseService,
    private cacheService: ICacheService,
    private logger: ILogger
  ) {}

  async getCategories(): Promise<Category[]> {
    try {
      this.logger.info('Getting all categories');

      // Try cache first
      const cacheKey = 'categories:all';
      const cached = await this.cacheService.get(cacheKey);
      
      if (cached) {
        this.logger.info('Cache hit for categories');
        return JSON.parse(cached);
      }

      // Fetch from database
      const { data: categories, error } = await supabase
        .from('categories')
        .select(`
          *,
          attributes:category_attributes(*)
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        this.logger.error('Error fetching categories:', error);
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      // Build tree structure
      const categoryTree = this.buildCategoryTree(categories || []);

      // Cache the result
      await this.cacheService.set(cacheKey, JSON.stringify(categoryTree), 300); // 5 minutes

      return categoryTree;
    } catch (error) {
      this.logger.error('Error in getCategories:', error);
      throw error;
    }
  }

  async getCategoriesFlat(
    filters?: CategoryFilters, 
    pagination?: PaginationParams
  ): Promise<{ data: Category[]; total: number; page: number; pageSize: number; totalPages: number }> {
    try {
      this.logger.info('Getting categories flat', { filters, pagination });

      let query = supabase
        .from('categories')
        .select(`
          *,
          attributes:category_attributes(*)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters?.parent_id !== undefined) {
        query = query.eq('parent_id', filters.parent_id);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.level !== undefined) {
        query = query.eq('level', filters.level);
      }

      // Apply pagination
      const page = pagination?.page || 1;
      const pageSize = pagination?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.range(from, to);

      // Apply sorting
      const sortBy = pagination?.sortBy || 'sort_order';
      const sortOrder = pagination?.sortOrder || 'asc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data: categories, error, count } = await query;

      if (error) {
        this.logger.error('Error fetching categories flat:', error);
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: categories || [],
        total,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      this.logger.error('Error in getCategoriesFlat:', error);
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<Category | null> {
    try {
      this.logger.info('Getting category by ID', { id });

      const { data: category, error } = await supabase
        .from('categories')
        .select(`
          *,
          attributes:category_attributes(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        this.logger.error('Error fetching category by ID:', error);
        throw new Error(`Failed to fetch category: ${error.message}`);
      }

      return category;
    } catch (error) {
      this.logger.error('Error in getCategoryById:', error);
      throw error;
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      this.logger.info('Getting category by slug', { slug });

      const { data: category, error } = await supabase
        .from('categories')
        .select(`
          *,
          attributes:category_attributes(*)
        `)
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        this.logger.error('Error fetching category by slug:', error);
        throw new Error(`Failed to fetch category: ${error.message}`);
      }

      return category;
    } catch (error) {
      this.logger.error('Error in getCategoryBySlug:', error);
      throw error;
    }
  }

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    try {
      this.logger.info('Creating category', { data });

      // Calculate level and path
      const level = data.parent_id ? await this.calculateLevel(data.parent_id) + 1 : 0;
      const path = data.parent_id ? await this.calculatePath(data.parent_id) + '/' + data.slug : data.slug;

      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          name: data.name,
          slug: data.slug,
          description: data.description,
          parent_id: data.parent_id,
          level,
          path,
          is_active: data.is_active ?? true,
          sort_order: data.sort_order ?? 0
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Error creating category:', error);
        throw new Error(`Failed to create category: ${error.message}`);
      }

      // Clear cache
      await this.cacheService.del('categories:all');

      return category;
    } catch (error) {
      this.logger.error('Error in createCategory:', error);
      throw error;
    }
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    try {
      this.logger.info('Updating category', { id, data });

      const updateData: any = { ...data };
      
      // Recalculate level and path if parent_id changed
      if (data.parent_id !== undefined) {
        const level = data.parent_id ? await this.calculateLevel(data.parent_id) + 1 : 0;
        const path = data.parent_id ? await this.calculatePath(data.parent_id) + '/' + data.slug : data.slug;
        updateData.level = level;
        updateData.path = path;
      }

      const { data: category, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error('Error updating category:', error);
        throw new Error(`Failed to update category: ${error.message}`);
      }

      // Clear cache
      await this.cacheService.del('categories:all');

      return category;
    } catch (error) {
      this.logger.error('Error in updateCategory:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      this.logger.info('Deleting category', { id });

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        this.logger.error('Error deleting category:', error);
        throw new Error(`Failed to delete category: ${error.message}`);
      }

      // Clear cache
      await this.cacheService.del('categories:all');
    } catch (error) {
      this.logger.error('Error in deleteCategory:', error);
      throw error;
    }
  }

  async getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
    try {
      this.logger.info('Getting category attributes', { categoryId });

      const { data: attributes, error } = await supabase
        .from('category_attributes')
        .select('*')
        .eq('category_id', categoryId)
        .order('sort_order', { ascending: true });

      if (error) {
        this.logger.error('Error fetching category attributes:', error);
        throw new Error(`Failed to fetch attributes: ${error.message}`);
      }

      return attributes || [];
    } catch (error) {
      this.logger.error('Error in getCategoryAttributes:', error);
      throw error;
    }
  }

  async createAttribute(categoryId: string, data: CreateAttributeRequest): Promise<CategoryAttribute> {
    try {
      this.logger.info('Creating attribute', { categoryId, data });

      const { data: attribute, error } = await supabase
        .from('category_attributes')
        .insert({
          category_id: categoryId,
          name: data.name,
          type: data.type,
          is_required: data.is_required ?? false,
          is_filterable: data.is_filterable ?? false,
          is_searchable: data.is_searchable ?? false,
          options: data.options,
          validation_rules: data.validation_rules,
          sort_order: data.sort_order ?? 0
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Error creating attribute:', error);
        throw new Error(`Failed to create attribute: ${error.message}`);
      }

      return attribute;
    } catch (error) {
      this.logger.error('Error in createAttribute:', error);
      throw error;
    }
  }

  async updateAttribute(categoryId: string, attributeId: string, data: UpdateAttributeRequest): Promise<CategoryAttribute> {
    try {
      this.logger.info('Updating attribute', { categoryId, attributeId, data });

      const { data: attribute, error } = await supabase
        .from('category_attributes')
        .update(data)
        .eq('id', attributeId)
        .eq('category_id', categoryId)
        .select()
        .single();

      if (error) {
        this.logger.error('Error updating attribute:', error);
        throw new Error(`Failed to update attribute: ${error.message}`);
      }

      return attribute;
    } catch (error) {
      this.logger.error('Error in updateAttribute:', error);
      throw error;
    }
  }

  async deleteAttribute(categoryId: string, attributeId: string): Promise<void> {
    try {
      this.logger.info('Deleting attribute', { categoryId, attributeId });

      const { error } = await supabase
        .from('category_attributes')
        .delete()
        .eq('id', attributeId)
        .eq('category_id', categoryId);

      if (error) {
        this.logger.error('Error deleting attribute:', error);
        throw new Error(`Failed to delete attribute: ${error.message}`);
      }
    } catch (error) {
      this.logger.error('Error in deleteAttribute:', error);
      throw error;
    }
  }

  async getCategoryTree(): Promise<Category[]> {
    try {
      this.logger.info('Getting category tree');

      const { data: categories, error } = await supabase
        .from('categories')
        .select(`
          *,
          attributes:category_attributes(*)
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        this.logger.error('Error fetching category tree:', error);
        throw new Error(`Failed to fetch category tree: ${error.message}`);
      }

      return this.buildCategoryTree(categories || []);
    } catch (error) {
      this.logger.error('Error in getCategoryTree:', error);
      throw error;
    }
  }

  async getCategoryPath(categoryId: string): Promise<Category[]> {
    try {
      this.logger.info('Getting category path', { categoryId });

      const category = await this.getCategoryById(categoryId);
      if (!category) {
        return [];
      }

      const pathParts = category.path.split('/');
      const pathCategories: Category[] = [];

      for (const slug of pathParts) {
        const pathCategory = await this.getCategoryBySlug(slug);
        if (pathCategory) {
          pathCategories.push(pathCategory);
        }
      }

      return pathCategories;
    } catch (error) {
      this.logger.error('Error in getCategoryPath:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{
    status: string;
    database: { status: string; responseTime: number };
    cache: { status: string; responseTime: number };
  }> {
    try {
      const [databaseHealth, cacheHealth] = await Promise.all([
        this.databaseService.healthCheck(),
        this.cacheService.healthCheck()
      ]);

      const overallStatus = 
        databaseHealth.status === 'healthy' && 
        cacheHealth.status === 'healthy'
          ? 'healthy'
          : 'degraded';

      return {
        status: overallStatus,
        database: databaseHealth,
        cache: cacheHealth
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        database: { status: 'unhealthy', responseTime: 0 },
        cache: { status: 'unhealthy', responseTime: 0 }
      };
    }
  }

  private buildCategoryTree(categories: Category[]): Category[] {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Create a map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Build the tree structure
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  }

  private async calculateLevel(parentId: string): Promise<number> {
    const parent = await this.getCategoryById(parentId);
    return parent ? parent.level : 0;
  }

  private async calculatePath(parentId: string): Promise<string> {
    const parent = await this.getCategoryById(parentId);
    return parent ? parent.path : '';
  }
}
