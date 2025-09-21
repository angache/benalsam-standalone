import { 
  ISearchService, 
  IElasticsearchService, 
  IRedisService, 
  ISupabaseService, 
  ILogger,
  SearchParams, 
  SearchResult 
} from '../interfaces/ISearchService';

/**
 * Refactored Search Service
 * Dependency Injection ile test edilebilir
 */
export class SearchServiceRefactored implements ISearchService {
  constructor(
    private elasticsearchService: IElasticsearchService,
    private redisService: IRedisService,
    private supabaseService: ISupabaseService,
    private logger: ILogger
  ) {}

  async searchListings(params: SearchParams): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting search operation', { params });

      // Try cache first
      const cacheKey = this.generateCacheKey(params);
      const cachedResult = await this.getCachedResult(cacheKey);
      
      if (cachedResult) {
        this.logger.info('Cache hit', { cacheKey });
        return {
          ...cachedResult,
          responseTime: Date.now() - startTime,
          cached: true
        };
      }

      // Try Elasticsearch first
      let result: SearchResult;
      
      if (this.elasticsearchService.isAvailable()) {
        this.logger.info('Using Elasticsearch for search');
        result = await this.elasticsearchSearch(params);
      } else {
        this.logger.info('Elasticsearch not available, using Supabase fallback');
        result = await this.supabaseService.searchListings(params);
      }

      // Cache the result
      await this.cacheResult(cacheKey, result);

      return {
        ...result,
        responseTime: Date.now() - startTime,
        cached: false
      };

    } catch (error) {
      this.logger.error('Search operation failed:', error);
      
      // Fallback to Supabase
      try {
        this.logger.info('Falling back to Supabase search');
        const fallbackResult = await this.supabaseService.searchListings(params);
        
        return {
          ...fallbackResult,
          responseTime: Date.now() - startTime,
          cached: false
        };
      } catch (fallbackError) {
        this.logger.error('Fallback search also failed:', fallbackError);
        throw new Error('Search operation failed');
      }
    }
  }

  async getAnalytics(): Promise<any> {
    try {
      // Return basic analytics
      return {
        totalSearches: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        elasticsearchAvailable: this.elasticsearchService.isAvailable(),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Analytics retrieval failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{
    status: string;
    elasticsearch: { status: string; responseTime: number };
    redis: { status: string; responseTime: number };
    supabase: { status: string; responseTime: number };
  }> {
    try {
      const [elasticsearchHealth, redisHealth, supabaseHealth] = await Promise.all([
        this.elasticsearchService.healthCheck(),
        this.redisService.healthCheck(),
        this.supabaseService.healthCheck()
      ]);

      const overallStatus = 
        elasticsearchHealth.status === 'healthy' && 
        redisHealth.status === 'healthy' && 
        supabaseHealth.status === 'healthy'
          ? 'healthy'
          : 'degraded';

      return {
        status: overallStatus,
        elasticsearch: elasticsearchHealth,
        redis: redisHealth,
        supabase: supabaseHealth
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        elasticsearch: { status: 'unhealthy', responseTime: 0 },
        redis: { status: 'unhealthy', responseTime: 0 },
        supabase: { status: 'unhealthy', responseTime: 0 }
      };
    }
  }

  private async elasticsearchSearch(params: SearchParams): Promise<SearchResult> {
    try {
      const indexName = process.env['ELASTICSEARCH_DEFAULT_INDEX'] || 'listings';
      
      // Simple query for testing
      const query = {
        query: {
          match_all: {}
        },
        size: params.pageSize || 20,
        from: ((params.page || 1) - 1) * (params.pageSize || 20)
      };

      const response = await this.elasticsearchService.search(indexName, query);
      
      return {
        success: true,
        data: response.hits?.hits?.map((hit: any) => hit._source) || [],
        total: response.hits?.total?.value || 0,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        totalPages: Math.ceil((response.hits?.total?.value || 0) / (params.pageSize || 20)),
        responseTime: 0,
        cached: false,
        query: params.query
      };
    } catch (error) {
      this.logger.error('Elasticsearch search failed:', error);
      throw error;
    }
  }

  private generateCacheKey(params: SearchParams): string {
    return `search:${JSON.stringify(params)}`;
  }

  private async getCachedResult(cacheKey: string): Promise<SearchResult | null> {
    try {
      const cached = await this.redisService.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.error('Cache retrieval failed:', error);
      return null;
    }
  }

  private async cacheResult(cacheKey: string, result: SearchResult): Promise<void> {
    try {
      const ttl = 300; // 5 minutes
      await this.redisService.set(cacheKey, JSON.stringify(result), ttl);
    } catch (error) {
      this.logger.error('Cache storage failed:', error);
      // Don't throw - caching failure shouldn't break the search
    }
  }
}
