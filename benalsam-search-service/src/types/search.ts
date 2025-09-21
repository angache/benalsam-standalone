export interface SearchParams {
  query?: string;
  categories?: string[];
  location?: string;
  urgency?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  attributes?: Record<string, any>;
  filters?: Record<string, any>;
}

export interface SearchResult {
  success: boolean;
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  responseTime: number;
  cached?: boolean;
  query?: string;
  filters?: Record<string, any>;
  suggestions?: string[];
  facets?: Record<string, any>;
}

export interface SearchQuery {
  query: any;
  size?: number;
  from?: number;
  sort?: any[];
  _source?: string[] | boolean;
  aggs?: any;
  highlight?: any;
}

export interface SearchOptimizationOptions {
  size?: number;
  from?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  includeHighlights?: boolean;
  includeSuggestions?: boolean;
  includeFacets?: boolean;
}

export interface ElasticsearchSearchResponse {
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
    max_score: number;
    hits: Array<{
      _index: string;
      _type: string;
      _id: string;
      _score: number;
      _source: any;
      highlight?: any;
    }>;
  };
  aggregations?: any;
  suggestions?: any;
}

export interface SearchStats {
  totalSearches: number;
  averageResponseTime: number;
  cacheHitRate: number;
  elasticsearchAvailable: boolean;
  lastSearchTime?: Date;
  popularQueries: Array<{
    query: string;
    count: number;
  }>;
}

export interface SearchSuggestion {
  text: string;
  score: number;
  contexts?: Record<string, string[]>;
}

export interface SearchFacet {
  name: string;
  type: 'terms' | 'range' | 'date_range';
  values: Array<{
    key: string;
    doc_count: number;
  }>;
}
