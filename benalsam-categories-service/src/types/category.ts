// Category Types for Categories Service

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
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateAttributeRequest {
  category_id: number;
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

export interface CategoryTree {
  categories: Category[];
  totalCount: number;
  maxLevel: number;
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  categoriesWithSubcategories: number;
  categoriesWithAttributes: number;
  maxDepth: number;
  averageSubcategories: number;
  averageAttributes: number;
}

export interface CategoryResponse {
  success: boolean;
  data?: Category | Category[] | CategoryTree | CategoryStats | CategoryAttribute[] | CategoryAttribute;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export interface CategoryFilters {
  is_active?: boolean | undefined;
  parent_id?: number | undefined;
  level?: number | undefined;
  search?: string | undefined;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
  };
  cache: {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
  };
  circuitBreakers?: {
    database: {
      state: string;
      failureCount: number;
      successCount: number;
      lastFailureTime: number;
      nextAttemptTime: number;
      isHealthy: boolean;
    };
    cache: {
      state: string;
      failureCount: number;
      successCount: number;
      lastFailureTime: number;
      nextAttemptTime: number;
      isHealthy: boolean;
    };
    externalService: {
      state: string;
      failureCount: number;
      successCount: number;
      lastFailureTime: number;
      nextAttemptTime: number;
      isHealthy: boolean;
    };
  };
}
