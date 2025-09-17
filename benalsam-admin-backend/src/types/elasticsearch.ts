// Elasticsearch Types for Admin Backend
// Enterprise-grade type definitions for Elasticsearch operations

import { Client } from '@elastic/elasticsearch';
import { SearchOptimizedListing } from 'benalsam-shared-types';

// Supabase Client Type - Simplified for compatibility
export interface SupabaseClient {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: unknown) => {
        single: () => Promise<{ data: unknown; error: unknown }>;
        limit: (count: number) => {
          order: (column: string, options?: { ascending?: boolean }) => {
            execute: () => Promise<{ data: unknown[]; error: unknown }>;
          };
        };
      };
      gte: (column: string, value: unknown) => {
        lte: (column: string, value: unknown) => {
          order: (column: string, options?: { ascending?: boolean }) => {
            execute: () => Promise<{ data: unknown[]; error: unknown }>;
          };
        };
      };
      order: (column: string, options?: { ascending?: boolean }) => {
        limit: (count: number) => {
          execute: () => Promise<{ data: unknown[]; error: unknown }>;
        };
      };
    };
    insert: (data: unknown) => Promise<{ data: unknown; error: unknown }>;
    update: (data: unknown) => {
      eq: (column: string, value: unknown) => Promise<{ data: unknown; error: unknown }>;
    };
    delete: () => {
      eq: (column: string, value: unknown) => Promise<{ data: unknown; error: unknown }>;
    };
  };
}

// Elasticsearch Index Mapping - Simplified for compatibility
export interface ElasticsearchIndexMapping {
  settings: {
    analysis: {
      analyzer: {
        turkish_analyzer: {
          type: string;
        };
      };
    };
    number_of_shards: number;
    number_of_replicas: number;
  };
  mappings: {
    properties: Record<string, unknown>;
    dynamic?: boolean;
  };
}

// Search Query Types
export interface SearchQuery {
  query: {
    bool?: {
      must?: Array<{
        match?: {
          [key: string]: string | { query: string; fuzziness?: string };
        };
        range?: {
          [key: string]: {
            gte?: number;
            lte?: number;
          };
        };
        term?: {
          [key: string]: string | number | boolean;
        };
        terms?: {
          [key: string]: string[] | number[];
        };
        wildcard?: {
          [key: string]: string;
        };
        exists?: {
          field: string;
        };
      }>;
      should?: Array<{
        match?: {
          [key: string]: string | { query: string; fuzziness?: string };
        };
        range?: {
          [key: string]: {
            gte?: number;
            lte?: number;
          };
        };
        term?: {
          [key: string]: string | number | boolean;
        };
        terms?: {
          [key: string]: string[] | number[];
        };
        wildcard?: {
          [key: string]: string;
        };
        exists?: {
          field: string;
        };
      }>;
      filter?: Array<{
        match?: {
          [key: string]: string | { query: string; fuzziness?: string };
        };
        range?: {
          [key: string]: {
            gte?: number;
            lte?: number;
          };
        };
        term?: {
          [key: string]: string | number | boolean;
        };
        terms?: {
          [key: string]: string[] | number[];
        };
        wildcard?: {
          [key: string]: string;
        };
        exists?: {
          field: string;
        };
      }>;
    };
    match_all?: Record<string, never>;
  };
  sort?: Array<{
    [key: string]: {
      order: 'asc' | 'desc';
    };
  }>;
  from?: number;
  size?: number;
  _source?: string[] | boolean;
}

// Search Response Types
export interface ElasticsearchSearchResponse<T = unknown> {
  took: number;
  timed_out: boolean;
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number | null;
    hits: Array<{
      _index: string;
      _type: string;
      _id: string;
      _score: number | null;
      _source: T;
      sort?: unknown[];
    }>;
  };
  aggregations?: {
    [key: string]: {
      buckets?: Array<{
        key: string | number;
        doc_count: number;
      }>;
      value?: number;
    };
  };
}

// Search Parameters
export interface SearchParameters {
  query?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc';
  page?: number;
  limit?: number;
  filters?: {
    [key: string]: string | number | boolean | string[] | number[];
  };
}

// Search Result
export interface SearchResult {
  listings: SearchOptimizedListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  aggregations?: {
    categories?: Array<{
      key: string;
      count: number;
    }>;
    locations?: Array<{
      key: string;
      count: number;
    }>;
    priceRanges?: Array<{
      key: string;
      count: number;
    }>;
  };
}

// Index Management Types
export interface IndexStats {
  name: string;
  status: 'green' | 'yellow' | 'red';
  docs: {
    count: number;
    deleted: number;
  };
  store: {
    size_in_bytes: number;
  };
  search: {
    query_total: number;
    query_time_in_millis: number;
  };
}

export interface IndexHealth {
  cluster_name: string;
  status: 'green' | 'yellow' | 'red';
  timed_out: boolean;
  number_of_nodes: number;
  number_of_data_nodes: number;
  active_primary_shards: number;
  active_shards: number;
  relocating_shards: number;
  initializing_shards: number;
  unassigned_shards: number;
  delayed_unassigned_shards: number;
  number_of_pending_tasks: number;
  number_of_in_flight_fetch: number;
  task_max_waiting_in_queue_millis: number;
  active_shards_percent_as_number: number;
}

// Sync Operations
export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  listingId: string;
  data?: SearchOptimizedListing;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface SyncStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  successRate: number;
  averageProcessingTime: number;
}

// Error Types
export interface ElasticsearchError {
  type: string;
  reason: string;
  index?: string;
  shard?: number;
  caused_by?: {
    type: string;
    reason: string;
  };
}

export interface ElasticsearchResponseError {
  error: ElasticsearchError;
  status: number;
}

// Configuration Types
export interface ElasticsearchConfig {
  node: string;
  username?: string;
  password?: string;
  defaultIndexName: string;
  maxRetries: number;
  requestTimeout: number;
  pingTimeout: number;
  tls?: {
    rejectUnauthorized: boolean;
  };
}

// Health Check Types
export interface HealthCheckResult {
  isHealthy: boolean;
  status: 'green' | 'yellow' | 'red';
  responseTime: number;
  error?: string;
  details: {
    cluster: string;
    nodes: number;
    activeShards: number;
    unassignedShards: number;
  };
}

// Constants
export const ELASTICSEARCH_INDEXES = {
  LISTINGS: 'listings',
  USERS: 'users',
  CATEGORIES: 'categories',
  SEARCH_LOGS: 'search_logs'
} as const;

export const ELASTICSEARCH_ANALYZERS = {
  TURKISH: 'turkish_analyzer',
  STANDARD: 'standard',
  KEYWORD: 'keyword'
} as const;

export const ELASTICSEARCH_SORT_OPTIONS = {
  RELEVANCE: 'relevance',
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
  DATE_DESC: 'date_desc',
  DATE_ASC: 'date_asc'
} as const;

// Type guards
export const isElasticsearchError = (obj: unknown): obj is ElasticsearchResponseError => {
  return typeof obj === 'object' && obj !== null && 'error' in obj && 'status' in obj;
};

export const isSearchResult = (obj: unknown): obj is SearchResult => {
  return typeof obj === 'object' && obj !== null && 
    'listings' in obj && 
    'total' in obj && 
    'page' in obj && 
    'limit' in obj;
};

export const isIndexStats = (obj: unknown): obj is IndexStats => {
  return typeof obj === 'object' && obj !== null &&
    'name' in obj &&
    'status' in obj &&
    'docs' in obj &&
    'store' in obj;
};

// Export types
export type ElasticsearchClient = Client;
export type SearchQueryType = SearchQuery;
export type SearchResponseType<T = unknown> = ElasticsearchSearchResponse<T>;
export type SearchParametersType = SearchParameters;
export type SearchResultType = SearchResult;
export type IndexStatsType = IndexStats;
export type HealthCheckResultType = HealthCheckResult;
