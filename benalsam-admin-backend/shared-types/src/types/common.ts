// ===========================
// API RESPONSE TYPES
// ===========================

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ===========================
// COMMON TYPES
// ===========================

export type ID = string;

export interface Pagination {
  page: number;
  limit: number;
  total?: number;
}

export interface QueryFilters {
  search?: string;
  category?: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  urgency?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  attributes?: Record<string, string[]>; // Attribute filters for category-specific filtering
}

// ===========================
// CONFIG TYPES
// ===========================

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  apiVersion: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface SecurityConfig {
  bcryptRounds: number;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ===========================
// API PARAMETER TYPES
// ===========================

export interface GetListingsParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: {
    status?: string;
    category?: string;
    userId?: string;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

// ===========================
// ERROR TYPES
// ===========================

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// ===========================
// LOCATION TYPES
// ===========================

export interface District {
  code: string;
  name: string;
}

export interface Province {
  code: string;
  name: string;
  districts: District[];
}

// ===========================
// INTERNATIONALIZATION TYPES
// ===========================

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

// ===========================
// CATEGORY TYPES (DEPRECATED - Use category.ts instead)
// ===========================

// @deprecated Use Category from './category' instead
export interface LegacyCategory {
  code: string;
  name: string;
  icon: any; // IconType will be imported from enums
} 