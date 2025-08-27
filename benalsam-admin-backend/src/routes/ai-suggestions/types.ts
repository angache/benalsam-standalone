// ===========================
// AI SUGGESTIONS TYPES
// ===========================

export interface AISuggestion {
  id: string;
  text: string;
  type: 'elasticsearch' | 'category' | 'trending' | 'popular';
  score: number;
  metadata: {
    suggestionType?: string;
    isApproved?: boolean;
    categoryId?: number;
    categoryName?: string;
    usageCount?: number;
    confidenceScore?: number;
    lastUsed?: string;
    createdAt?: string;
  };
}

export interface SuggestionQuery {
  query?: string;
  categoryId?: number;
  limit?: number;
  minScore?: number;
}

export interface SuggestionResponse {
  success: boolean;
  data: {
    suggestions: AISuggestion[];
    total: number;
    query?: string | null;
    source: 'elasticsearch' | 'database' | 'hybrid';
  };
  message?: string;
  error?: string;
}

export interface ElasticsearchSuggestion {
  _id: string;
  _score: number;
  _source: {
    id: number;
    suggestion_data: {
      keywords?: string[];
      brand?: string;
      model?: string;
      description?: string;
    };
    category_name?: string;
    confidence_score: number;
    is_approved: boolean;
  };
}

export interface CategorySuggestion {
  id: number;
  category_id: number;
  suggestion_type: 'keywords' | 'title' | 'description';
  suggestion_data: {
    suggestions: string[];
    keywords?: string[];
    brand?: string;
    model?: string;
  };
  confidence_score: number;
  is_approved: boolean;
  categories?: {
    name: string;
    path: string[];
    level: number;
  };
}

export interface TrendingSuggestion {
  id: number;
  suggestion_text: string;
  usage_count: number;
  last_used: string;
  category_id: number;
  confidence_score: number;
  categories?: {
    name: string;
    path: string[];
  };
}

export interface PopularSuggestion {
  id: number;
  suggestion_text: string;
  usage_count: number;
  confidence_score: number;
  category_id: number;
  categories?: {
    name: string;
    path: string[];
  };
}

export interface ElasticsearchQuery {
  min_score: number;
  query: {
    bool: {
      should: Array<{
        multi_match: {
          query: string;
          fields: string[];
          type: string;
          boost?: number;
          fuzziness?: string;
          minimum_should_match?: string;
        };
      }>;
      filter: Array<{
        term?: { [key: string]: any };
        range?: { [key: string]: any };
      }>;
    };
  };
  sort: Array<{
    [key: string]: { order: string };
  }>;
  size: number;
}

export interface SuggestionProcessorOptions {
  removeDuplicates?: boolean;
  limit?: number;
  minScore?: number;
  sortBy?: 'score' | 'usage' | 'confidence';
}

export interface SuggestionServiceConfig {
  elasticsearchUrl: string;
  indexName: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  defaultLimit: number;
  minScore: number;
}

export interface SuggestionAnalytics {
  totalRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  topQueries: Array<{
    query: string;
    count: number;
  }>;
  suggestionsByType: {
    elasticsearch: number;
    category: number;
    trending: number;
    popular: number;
  };
}
