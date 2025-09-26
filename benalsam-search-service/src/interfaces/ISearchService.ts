/**
 * Search Service Interfaces
 * Test edilebilirlik için abstraction layer
 */

export interface SearchParams {
  query?: string;
  categories?: string[];
  categoryIds?: number[];
  location?: string;
  urgency?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  attributes?: Record<string, string[]>;
}

export interface SearchResult {
  success: boolean;
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  responseTime: number;
  cached: boolean;
  query?: string;
  filters?: any;
}

export interface IElasticsearchService {
  isAvailable(): boolean;
  search(index: string, query: any): Promise<any>;
  healthCheck(): Promise<{ status: string; responseTime: number }>;
}

export interface IRedisService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  healthCheck(): Promise<{ status: string; responseTime: number }>;
}

export interface ISupabaseService {
  searchListings(params: SearchParams): Promise<SearchResult>;
  healthCheck(): Promise<{ status: string; responseTime: number }>;
}

export interface ILogger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export interface ISearchService {
  searchListings(params: SearchParams): Promise<SearchResult>;
  getAnalytics(): Promise<any>;
  healthCheck(): Promise<{
    status: string;
    elasticsearch: { status: string; responseTime: number };
    redis: { status: string; responseTime: number };
    supabase: { status: string; responseTime: number };
  }>;
}
