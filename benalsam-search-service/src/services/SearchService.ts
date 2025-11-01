import { createClient } from '@supabase/supabase-js';
import { logger } from '../config/logger';
import { elasticsearchCircuitBreaker, supabaseCircuitBreaker, cacheCircuitBreaker } from '../utils/circuitBreaker';

// Types
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
  // 🆕 Advanced filters
  dateRange?: string; // 'all' | '24h' | '7d' | '30d'
  featured?: boolean;
  showcase?: boolean;
  urgent?: boolean;
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
      const { Client } = await import('@elastic/elasticsearch');
      const elasticsearchUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
      const elasticsearchUsername = process.env.ELASTICSEARCH_USERNAME;
      const elasticsearchPassword = process.env.ELASTICSEARCH_PASSWORD;
      
      // Build client config
      const clientConfig: any = { 
        node: elasticsearchUrl,
        maxRetries: 5,
        requestTimeout: 30000, // 30 saniye
        pingTimeout: 10000, // 10 saniye
        sniffOnStart: false,
        sniffOnConnectionFault: false,
        resurrectStrategy: 'ping'
      };
      
      // Add authentication if credentials are provided
      if (elasticsearchUsername && elasticsearchPassword) {
        clientConfig.auth = {
          username: elasticsearchUsername,
          password: elasticsearchPassword
        };
      }
      
      this.elasticsearchClient = new Client(clientConfig);
      await this.elasticsearchClient.ping();
      this.isElasticsearchAvailable = true;
      
      logger.info('✅ Elasticsearch client initialized', { 
        url: elasticsearchUrl,
        hasAuth: !!(elasticsearchUsername && elasticsearchPassword)
      });
    } catch (error) {
      logger.warn('⚠️ Elasticsearch not available, using Supabase fallback', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
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
      const cached = await cacheCircuitBreaker.execute(async () => {
        return await this.getCachedResult(params, sessionId);
      }, 'cache-get-search-result');
      
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
          const result = await elasticsearchCircuitBreaker.execute(async () => {
            return await this.elasticsearchSearch(params);
          }, 'elasticsearch-search');
          
          await cacheCircuitBreaker.execute(async () => {
            await this.cacheResult(params, result);
          }, 'cache-set-search-result');
          
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
      const result = await supabaseCircuitBreaker.execute(async () => {
        return await this.supabaseSearch(params);
      }, 'supabase-search');
      
      await cacheCircuitBreaker.execute(async () => {
        await this.cacheResult(params, result, sessionId);
      }, 'cache-set-search-result');
      
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
    try {
      const {
        query,
        categories,
        categoryIds,
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

      const indexName = 'benalsam_listings'; // Use the correct index
      const from = (page - 1) * pageSize;

      // Build Elasticsearch query with filters
      const mustQueries = [];
      const filterQueries = [];

      // Text search query
      if (query && query.trim()) {
        mustQueries.push({
          multi_match: {
            query: query,
            fields: ['title^2', 'description', 'location'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      }

      // Category filter using category_path for efficient filtering
      if (categoryIds && categoryIds.length > 0) {
        // Use category_path to match any of the selected category IDs
        // This allows filtering by parent categories (e.g., if user selects "Emlak", 
        // it will match all listings with "Emlak" in their category_path)
        const categoryPathFilters = categoryIds.map(categoryId => ({
          terms: {
            category_path: [categoryId]
          }
        }));

        filterQueries.push({
          bool: {
            should: categoryPathFilters,
            minimum_should_match: 1
          }
        });
      } else if (categories && categories.length > 0) {
        // Fallback to category name matching if categoryIds not provided
        const categoryFilters = categories.map(categoryName => ({
          wildcard: {
            category: {
              value: `*${categoryName}*`,
              case_insensitive: true
            }
          }
        }));

        filterQueries.push({
          bool: {
            should: categoryFilters,
            minimum_should_match: 1
          }
        });
      }

      // Location filter
      if (location && location.trim()) {
        filterQueries.push({
          match: {
            location: location
          }
        });
      }

      // Urgency filter
      if (urgency && urgency !== 'Tümü') {
        filterQueries.push({
          term: {
            urgency: urgency
          }
        });
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        const priceRange: any = {};
        if (minPrice !== undefined) priceRange.gte = minPrice;
        if (maxPrice !== undefined) priceRange.lte = maxPrice;
        
        filterQueries.push({
          range: {
            budget: priceRange
          }
        });
      }

      // 🆕 Date Range filter
      if (params.dateRange && params.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (params.dateRange) {
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0); // Beginning of time
        }
        
        filterQueries.push({
          range: {
            created_at: {
              gte: startDate.toISOString()
            }
          }
        });
      }

      // 🆕 Premium filters
      if (params.featured) {
        filterQueries.push({ term: { is_featured: true } });
      }
      if (params.showcase) {
        filterQueries.push({ term: { is_showcase: true } });
      }
      if (params.urgent) {
        filterQueries.push({ term: { is_urgent_premium: true } });
      }

      // Build final query
      const esQuery: any = {
        query: {
          bool: {
            must: mustQueries.length > 0 ? mustQueries : [{ match_all: {} }],
            filter: filterQueries
          }
        },
        from,
        size: pageSize
      };

      // Add sorting
      if (sortBy && sortOrder) {
        esQuery.sort = [{
          [sortBy]: {
            order: sortOrder
          }
        }];
      }

      // Execute search
      const response = await this.elasticsearchClient.search({
        index: indexName,
        body: esQuery
      });

      // Parse response (try both response.body.hits and response.hits for compatibility)
      const hits = response.body?.hits?.hits || response.hits?.hits || [];
      const total = response.body?.hits?.total?.value || response.hits?.total?.value || 0;

      // Transform results
      const data = hits.map((hit: any) => hit._source);

      const totalPages = Math.ceil(total / pageSize);

      logger.info('🔍 Elasticsearch search completed', {
        query,
        total,
        page,
        pageSize,
        totalPages,
        categories,
        location,
        urgency
      });

      return {
        success: true,
        data,
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
      logger.error('❌ Elasticsearch search failed:', error);
      throw new Error(`Elasticsearch search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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