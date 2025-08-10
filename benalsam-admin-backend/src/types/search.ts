// Search Types for Benalsam Project

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  sort?: SearchSort[];
  page?: number;
  limit?: number;
  aggregations?: string[];
}

export interface SearchFilters {
  category?: string | string[];
  budget?: {
    min?: number;
    max?: number;
  };
  location?: {
    lat: number;
    lon: number;
    distance?: string; // "10km", "50mi"
  };
  condition?: string | string[];
  urgency?: string | string[];
  status?: string | string[];
  is_premium?: boolean;
  created_after?: string; // ISO date string
  created_before?: string; // ISO date string
  user_id?: string;
  tags?: string[];
}

export interface SearchSort {
  field: string;
  order: 'asc' | 'desc';
}

export interface SearchResult<T = any> {
  hits: SearchHit<T>[];
  total: number;
  page: number;
  limit: number;
  aggregations?: SearchAggregations;
  took: number; // milliseconds
}

export interface SearchHit<T = any> {
  id: string;
  score: number;
  source: T;
  highlights?: Record<string, string[]>;
}

export interface SearchAggregations {
  price_ranges?: {
    buckets: Array<{
      key: string;
      doc_count: number;
      from?: number;
      to?: number;
    }>;
  };
  categories?: {
    buckets: Array<{
      key: string;
      doc_count: number;
    }>;
  };
  locations?: {
    buckets: Array<{
      key: string;
      doc_count: number;
    }>;
  };
  conditions?: {
    buckets: Array<{
      key: string;
      doc_count: number;
    }>;
  };
  [key: string]: any;
}

export interface SearchSuggestion {
  text: string;
  score: number;
  category?: string;
}

export interface SearchSuggestions {
  listings: SearchSuggestion[];
  categories: SearchSuggestion[];
  tags: SearchSuggestion[];
}

// Elasticsearch specific types
export interface ElasticsearchIndexMapping {
  properties: Record<string, any>;
  settings?: Record<string, any>;
}

export interface ElasticsearchIndexSettings {
  number_of_shards: number;
  number_of_replicas: number;
  analysis?: {
    analyzer?: Record<string, any>;
    filter?: Record<string, any>;
    tokenizer?: Record<string, any>;
  };
}

export interface ElasticsearchHealth {
  cluster_name: string;
  status: 'green' | 'yellow' | 'red';
  number_of_nodes: number;
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

export interface ElasticsearchIndexStats {
  index: string;
  docs: {
    count: number;
    deleted: number;
  };
  store: {
    size_in_bytes: number;
    total_data_set_size_in_bytes: number;
  };
  indexing: {
    index_total: number;
    index_time_in_millis: number;
    index_current: number;
    index_failed: number;
  };
  search: {
    query_total: number;
    query_time_in_millis: number;
    query_current: number;
    fetch_total: number;
    fetch_time_in_millis: number;
    fetch_current: number;
  };
} 