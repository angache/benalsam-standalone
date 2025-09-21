/**
 * Category Service Interfaces
 * Test edilebilirlik için abstraction layer
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  level: number;
  path: string;
  is_active: boolean;
  sort_order: number;
  attributes: CategoryAttribute[];
  children?: Category[];
  created_at: string;
  updated_at: string;
}

export interface CategoryAttribute {
  id: string;
  category_id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'file';
  is_required: boolean;
  is_filterable: boolean;
  is_searchable: boolean;
  options?: string[];
  validation_rules?: Record<string, any>;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  is_active?: boolean;
  sort_order?: number;
  attributes?: CreateAttributeRequest[];
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface CreateAttributeRequest {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'file';
  is_required?: boolean;
  is_filterable?: boolean;
  is_searchable?: boolean;
  options?: string[];
  validation_rules?: Record<string, any>;
  sort_order?: number;
}

export interface UpdateAttributeRequest {
  name?: string;
  type?: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'file';
  is_required?: boolean;
  is_filterable?: boolean;
  is_searchable?: boolean;
  options?: string[];
  validation_rules?: Record<string, any>;
  sort_order?: number;
}

export interface CategoryResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryFilters {
  search?: string;
  parent_id?: string;
  is_active?: boolean;
  level?: number;
}

export interface IDatabaseService {
  query(sql: string, params?: any[]): Promise<any>;
  healthCheck(): Promise<{ status: string; responseTime: number }>;
}

export interface ICacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  healthCheck(): Promise<{ status: string; responseTime: number }>;
}

export interface ILogger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export interface ICategoryService {
  getCategories(): Promise<Category[]>;
  getCategoriesFlat(filters?: CategoryFilters, pagination?: PaginationParams): Promise<{ data: Category[]; total: number; page: number; pageSize: number; totalPages: number }>;
  getCategoryById(id: string): Promise<Category | null>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  createCategory(data: CreateCategoryRequest): Promise<Category>;
  updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]>;
  createAttribute(categoryId: string, data: CreateAttributeRequest): Promise<CategoryAttribute>;
  updateAttribute(categoryId: string, attributeId: string, data: UpdateAttributeRequest): Promise<CategoryAttribute>;
  deleteAttribute(categoryId: string, attributeId: string): Promise<void>;
  getCategoryTree(): Promise<Category[]>;
  getCategoryPath(categoryId: string): Promise<Category[]>;
  healthCheck(): Promise<{
    status: string;
    database: { status: string; responseTime: number };
    cache: { status: string; responseTime: number };
  }>;
}
