import { createClient } from '@supabase/supabase-js';
import logger from '../config/logger';

// Types
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

export class SearchService {
  private supabase: any = null;
  private elasticsearchClient: any = null;
  private redisClient: any = null;
  private isElasticsearchAvailable: boolean = false;

  constructor() {
    // Initialize Elasticsearch client (will be implemented later)
    this.initializeElasticsearch();
    
    // Initialize Redis client (will be implemented later)
    this.initializeRedis();
  }

  private getSupabaseClient() {
    if (!this.supabase) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase configuration missing. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
      }
      
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
    return this.supabase;
  }

  private async initializeElasticsearch() {
    try {
      // TODO: Implement Elasticsearch client initialization
      // this.elasticsearchClient = new Client({ node: process.env.ELASTICSEARCH_URL });
      // await this.elasticsearchClient.ping();
      // this.isElasticsearchAvailable = true;
      logger.info('Elasticsearch client initialized');
    } catch (error) {
      logger.warn('Elasticsearch not available, using Supabase fallback');
      this.isElasticsearchAvailable = false;
    }
  }

  private async initializeRedis() {
    try {
      // TODO: Implement Redis client initialization
      // this.redisClient = createClient({ url: process.env.REDIS_URL });
      // await this.redisClient.connect();
      logger.info('Redis client initialized');
    } catch (error) {
      logger.warn('Redis not available, caching disabled');
    }
  }

  /**
   * Main search method with fallback
   */
  async searchListings(params: SearchParams, sessionId?: string): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cached = await this.getCachedResult(params, sessionId);
      if (cached) {
        return {
          ...cached,
          responseTime: Date.now() - startTime,
          cached: true
        };
      }

      // Try Elasticsearch first
      if (this.isElasticsearchAvailable) {
        try {
          const result = await this.elasticsearchSearch(params);
          await this.cacheResult(params, result);
          return {
            ...result,
            responseTime: Date.now() - startTime,
            cached: false
          };
        } catch (error) {
          logger.warn('Elasticsearch search failed, falling back to Supabase:', error);
        }
      }

      // Fallback to Supabase
      const result = await this.supabaseSearch(params);
      await this.cacheResult(params, result, sessionId);
      
      return {
        ...result,
        responseTime: Date.now() - startTime,
        cached: false
      };

    } catch (error) {
      logger.error('Search failed:', error);
      throw new Error('Search operation failed');
    }
  }

  /**
   * Elasticsearch search implementation
   */
  private async elasticsearchSearch(params: SearchParams): Promise<SearchResult> {
    // TODO: Implement Elasticsearch search
    throw new Error('Elasticsearch not implemented yet');
  }

  /**
   * Supabase search implementation (fallback)
   */
  private async supabaseSearch(params: SearchParams): Promise<SearchResult> {
    try {
      const {
        query,
        categories,
        location,
        urgency = 'Tümü',
        minPrice,
        maxPrice,
        page = 1,
        pageSize = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        attributes
      } = params;

      // Prepare RPC parameters
      const rpcParams = {
        search_query: query || null,
        p_categories: categories || null,
        p_location: location || null,
        p_urgency: urgency,
        min_price: minPrice || null,
        max_price: maxPrice || null,
        p_attributes: attributes ? JSON.stringify(attributes) : null,
        p_page: page,
        p_page_size: pageSize,
        sort_key: sortBy,
        sort_direction: sortOrder
      };

      logger.info('Searching with Supabase RPC:', rpcParams);

      const { data, error } = await this.getSupabaseClient().rpc('search_listings_with_attributes', rpcParams);

      if (error) {
        logger.error('Supabase search error:', error);
        throw new Error(`Supabase search failed: ${error.message}`);
      }

       if (!data || data.length === 0) {
         return {
           success: true,
           data: [],
           total: 0,
           page,
           pageSize,
           totalPages: 0,
           responseTime: 0,
           cached: false,
           query,
           filters: { categories, location, urgency, minPrice, maxPrice, attributes }
         };
       }

       const total = data[0]?.total_count || 0;
       const totalPages = Math.ceil(total / pageSize);

       return {
         success: true,
         data: data.map((item: any) => ({
           id: item.id,
           title: item.title,
           description: item.description,
           category: item.category,
           budget: item.budget,
           location: item.location,
           urgency: item.urgency,
           main_image_url: item.main_image_url,
           additional_image_urls: item.additional_image_urls,
           status: item.status,
           views_count: item.views_count,
           offers_count: item.offers_count,
           favorites_count: item.favorites_count,
           created_at: item.created_at,
           updated_at: item.updated_at,
           expires_at: item.expires_at,
           is_featured: item.is_featured,
           is_urgent_premium: item.is_urgent_premium,
           is_showcase: item.is_showcase,
           has_bold_border: item.has_bold_border
         })),
         total,
         page,
         pageSize,
         totalPages,
         responseTime: 0,
         cached: false,
         query,
         filters: { categories, location, urgency, minPrice, maxPrice, attributes }
       };

    } catch (error) {
      logger.error('Supabase search error:', error);
      throw error;
    }
  }

   /**
    * Get cached search result
    */
   private async getCachedResult(params: SearchParams, sessionId?: string): Promise<SearchResult | null> {
     // For now, return null (cache disabled)
     return null;
   }

   /**
    * Cache search result
    */
   private async cacheResult(params: SearchParams, result: SearchResult, sessionId?: string): Promise<void> {
     // For now, do nothing (cache disabled)
   }

  /**
   * Get search suggestions
   */
  async getSuggestions(query: string): Promise<string[]> {
    try {
      // TODO: Implement search suggestions
      return [];
    } catch (error) {
      logger.error('Get suggestions error:', error);
      return [];
    }
  }

  /**
   * Get search analytics
   */
  async getAnalytics(): Promise<any> {
    try {
      // TODO: Implement search analytics
      return {
        totalSearches: 0,
        popularQueries: [],
        averageResponseTime: 0,
        cacheHitRate: 0
      };
    } catch (error) {
      logger.error('Get analytics error:', error);
      return {};
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    elasticsearch: boolean;
    redis: boolean;
    supabase: boolean;
  }> {
    return {
      elasticsearch: this.isElasticsearchAvailable,
      redis: !!this.redisClient,
      supabase: !!this.supabase
    };
  }
}

// Export singleton instance
export const searchService = new SearchService(); 