import { createClient } from '@supabase/supabase-js';
import { Client } from '@elastic/elasticsearch';
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
  data: any[];
  totalCount: number;
  searchEngine: 'elasticsearch' | 'supabase';
  responseTime: number;
  cached: boolean;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
  metadata: {
    query?: string;
    filters: any;
    timestamp: string;
  };
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
      const elasticsearchUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
      this.elasticsearchClient = new Client({ node: elasticsearchUrl });
      await this.elasticsearchClient.ping();
      this.isElasticsearchAvailable = true;
      logger.info('✅ Elasticsearch client initialized', { url: elasticsearchUrl });
    } catch (error) {
      logger.warn('⚠️ Elasticsearch not available, using Supabase fallback', { error: error instanceof Error ? error.message : 'Unknown error' });
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

      const index = process.env.ELASTICSEARCH_INDEX || 'benalsam_listings';
      const from = (page - 1) * pageSize;

      // Build Elasticsearch query
      const esQuery: any = {
        bool: {
          must: [
            { term: { status: 'active' } }
          ],
          filter: []
        }
      };

      // Text search
      if (query && query.trim()) {
        esQuery.bool.must.push({
          multi_match: {
            query: query.trim(),
            fields: ['title^3', 'description^2', 'search_keywords'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      }

      // Category filter
      if (categories && categories.length > 0) {
        esQuery.bool.filter.push({
          terms: { category_id: categories.map(Number) }
        });
      }

      // Location filter
      if (location) {
        esQuery.bool.filter.push({
          match: { 'location.province': location }
        });
      }

      // Urgency filter
      if (urgency && urgency !== 'Tümü') {
        esQuery.bool.filter.push({
          term: { urgency: urgency }
        });
      }

      // Price range filter
      if (minPrice || maxPrice) {
        const priceRange: any = {};
        if (minPrice) priceRange.gte = minPrice;
        if (maxPrice) priceRange.lte = maxPrice;
        esQuery.bool.filter.push({
          range: { budget: priceRange }
        });
      }

      // Attributes filter
      if (attributes && Object.keys(attributes).length > 0) {
        Object.entries(attributes).forEach(([key, values]) => {
          if (values && values.length > 0) {
            esQuery.bool.filter.push({
              terms: { [`attributes.${key}`]: values }
            });
          }
        });
      }

      // Sort
      const sort: any[] = [];
      if (sortBy === 'created_at') {
        sort.push({ created_at: { order: sortOrder } });
      } else if (sortBy === 'budget') {
        sort.push({ budget: { order: sortOrder } });
      } else if (sortBy === 'popularity_score') {
        sort.push({ popularity_score: { order: sortOrder } });
      } else {
        sort.push({ created_at: { order: 'desc' } });
      }

      // Execute search
      const response = await this.elasticsearchClient.search({
        index,
        body: {
          query: esQuery,
          sort,
          from,
          size: pageSize,
          _source: [
            'id', 'title', 'description', 'category', 'category_id', 'category_path',
            'budget', 'location', 'urgency', 'attributes', 'user_id', 'status',
            'created_at', 'updated_at', 'popularity_score', 'main_image_url'
          ]
        }
      });

      const hits = response.body.hits.hits;
      const total = response.body.hits.total.value;

      // Transform results
      const data = hits.map((hit: any) => ({
        id: hit._source.id,
        title: hit._source.title,
        description: hit._source.description,
        category: hit._source.category,
        category_id: hit._source.category_id,
        category_path: hit._source.category_path,
        budget: hit._source.budget,
        location: hit._source.location,
        urgency: hit._source.urgency,
        attributes: hit._source.attributes,
        user_id: hit._source.user_id,
        status: hit._source.status,
        created_at: hit._source.created_at,
        updated_at: hit._source.updated_at,
        popularity_score: hit._source.popularity_score || 0,
        main_image_url: hit._source.main_image_url,
        _score: hit._score
      }));

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
        data,
        totalCount: total,
        searchEngine: 'elasticsearch',
        responseTime: 0,
        cached: false,
        pagination: {
          page,
          pageSize,
          totalPages
        },
        metadata: {
          query,
          filters: { categories, location, urgency, minPrice, maxPrice, attributes },
          timestamp: new Date().toISOString()
        }
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
          data: [],
          totalCount: 0,
          searchEngine: 'supabase',
          responseTime: 0,
          cached: false,
          pagination: {
            page,
            pageSize,
            totalPages: 0
          },
          metadata: {
            query,
            filters: { categories, location, urgency, minPrice, maxPrice, attributes },
            timestamp: new Date().toISOString()
          }
        };
      }

      const totalCount = data[0]?.total_count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
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
        totalCount,
        searchEngine: 'supabase',
        responseTime: 0,
        cached: false,
        pagination: {
          page,
          pageSize,
          totalPages
        },
        metadata: {
          query,
          filters: { categories, location, urgency, minPrice, maxPrice, attributes },
          timestamp: new Date().toISOString()
        }
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
    if (!this.redisClient) return null;

    try {
      const cacheKey = `search:${JSON.stringify(params)}`;
      const cached = await this.redisClient.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn('Cache get error:', error);
      return null;
    }
  }

  /**
   * Cache search result
   */
  private async cacheResult(params: SearchParams, result: SearchResult, sessionId?: string): Promise<void> {
    if (!this.redisClient) return;

    try {
      const cacheKey = `search:${JSON.stringify(params)}`;
      const ttl = parseInt(process.env.SEARCH_CACHE_TTL || '300'); // 5 minutes default
      await this.redisClient.setEx(cacheKey, ttl, JSON.stringify(result));
    } catch (error) {
      logger.warn('Cache set error:', error);
    }
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