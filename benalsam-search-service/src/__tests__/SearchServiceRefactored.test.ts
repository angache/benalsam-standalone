import { SearchServiceRefactored } from '../services/SearchServiceRefactored';
import { 
  IElasticsearchService, 
  IRedisService, 
  ISupabaseService, 
  ILogger,
  SearchParams,
  SearchResult 
} from '../interfaces/ISearchService';

// Mock implementations
const mockElasticsearchService: jest.Mocked<IElasticsearchService> = {
  isAvailable: jest.fn(),
  search: jest.fn(),
  healthCheck: jest.fn()
};

const mockRedisService: jest.Mocked<IRedisService> = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  healthCheck: jest.fn()
};

const mockSupabaseService: jest.Mocked<ISupabaseService> = {
  searchListings: jest.fn(),
  healthCheck: jest.fn()
};

const mockLogger: jest.Mocked<ILogger> = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

describe('SearchServiceRefactored', () => {
  let searchService: SearchServiceRefactored;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockElasticsearchService.isAvailable.mockReturnValue(true);
    mockElasticsearchService.healthCheck.mockResolvedValue({ 
      status: 'healthy', 
      responseTime: 100 
    });
    mockRedisService.healthCheck.mockResolvedValue({ 
      status: 'healthy', 
      responseTime: 50 
    });
    mockSupabaseService.healthCheck.mockResolvedValue({ 
      status: 'healthy', 
      responseTime: 200 
    });
    
    // Create new instance
    searchService = new SearchServiceRefactored(
      mockElasticsearchService,
      mockRedisService,
      mockSupabaseService,
      mockLogger
    );
  });

  describe('searchListings', () => {
    it('should search using Elasticsearch when available', async () => {
      // Arrange
      const params: SearchParams = { query: 'test', page: 1, pageSize: 10 };
      const mockElasticsearchResponse = {
        hits: {
          hits: [{ _source: { id: 1, title: 'Test Listing' } }],
          total: { value: 1 }
        }
      };
      
      mockElasticsearchService.search.mockResolvedValue(mockElasticsearchResponse);
      mockRedisService.get.mockResolvedValue(null); // Cache miss

      // Act
      const result = await searchService.searchListings(params);

      // Assert
      expect(mockElasticsearchService.isAvailable).toHaveBeenCalled();
      expect(mockElasticsearchService.search).toHaveBeenCalledWith(
        'listings',
        expect.objectContaining({
          query: { match_all: {} },
          size: 10,
          from: 0
        })
      );
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.cached).toBe(false);
    });

    it('should use cache when available', async () => {
      // Arrange
      const params: SearchParams = { query: 'test' };
      const cachedResult: SearchResult = {
        success: true,
        data: [{ id: 1, title: 'Cached Result' }],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        responseTime: 50,
        cached: false,
        query: 'test'
      };
      
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedResult));

      // Act
      const result = await searchService.searchListings(params);

      // Assert
      expect(mockRedisService.get).toHaveBeenCalled();
      expect(result.cached).toBe(true);
      expect(result.data).toEqual(cachedResult.data);
      expect(mockElasticsearchService.search).not.toHaveBeenCalled();
    });

    it('should fallback to Supabase when Elasticsearch is unavailable', async () => {
      // Arrange
      const params: SearchParams = { query: 'test' };
      const supabaseResult: SearchResult = {
        success: true,
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
        responseTime: 0,
        cached: false,
        query: 'test'
      };
      
      mockElasticsearchService.isAvailable.mockReturnValue(false);
      mockSupabaseService.searchListings.mockResolvedValue(supabaseResult);
      mockRedisService.get.mockResolvedValue(null);

      // Act
      const result = await searchService.searchListings(params);

      // Assert
      expect(mockElasticsearchService.isAvailable).toHaveBeenCalled();
      expect(mockSupabaseService.searchListings).toHaveBeenCalledWith(params);
      expect(mockElasticsearchService.search).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle Elasticsearch failure and fallback to Supabase', async () => {
      // Arrange
      const params: SearchParams = { query: 'test' };
      const supabaseResult: SearchResult = {
        success: true,
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
        responseTime: 0,
        cached: false,
        query: 'test'
      };
      
      mockElasticsearchService.search.mockRejectedValue(new Error('Elasticsearch error'));
      mockSupabaseService.searchListings.mockResolvedValue(supabaseResult);
      mockRedisService.get.mockResolvedValue(null);

      // Act
      const result = await searchService.searchListings(params);

      // Assert
      expect(mockElasticsearchService.search).toHaveBeenCalled();
      expect(mockSupabaseService.searchListings).toHaveBeenCalledWith(params);
      expect(result.success).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Search operation failed:', 
        expect.any(Error)
      );
    });

    it('should handle complete failure gracefully', async () => {
      // Arrange
      const params: SearchParams = { query: 'test' };
      
      mockElasticsearchService.search.mockRejectedValue(new Error('Elasticsearch error'));
      mockSupabaseService.searchListings.mockRejectedValue(new Error('Supabase error'));
      mockRedisService.get.mockResolvedValue(null);

      // Act & Assert
      await expect(searchService.searchListings(params)).rejects.toThrow('Search operation failed');
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      // Act
      const analytics = await searchService.getAnalytics();

      // Assert
      expect(analytics).toEqual({
        totalSearches: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        elasticsearchAvailable: true,
        lastUpdated: expect.any(String)
      });
    });

    it('should handle analytics failure', async () => {
      // Arrange
      const originalGetAnalytics = searchService.getAnalytics;
      searchService.getAnalytics = jest.fn().mockRejectedValue(new Error('Analytics error'));

      // Act & Assert
      await expect(searchService.getAnalytics()).rejects.toThrow('Analytics error');
      
      // Restore
      searchService.getAnalytics = originalGetAnalytics;
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when all services are healthy', async () => {
      // Act
      const health = await searchService.healthCheck();

      // Assert
      expect(health.status).toBe('healthy');
      expect(health.elasticsearch.status).toBe('healthy');
      expect(health.redis.status).toBe('healthy');
      expect(health.supabase.status).toBe('healthy');
    });

    it('should return degraded status when one service is unhealthy', async () => {
      // Arrange
      mockElasticsearchService.healthCheck.mockResolvedValue({ 
        status: 'unhealthy', 
        responseTime: 0 
      });

      // Act
      const health = await searchService.healthCheck();

      // Assert
      expect(health.status).toBe('degraded');
      expect(health.elasticsearch.status).toBe('unhealthy');
    });

    it('should handle health check failure', async () => {
      // Arrange
      mockElasticsearchService.healthCheck.mockRejectedValue(new Error('Health check failed'));

      // Act
      const health = await searchService.healthCheck();

      // Assert
      expect(health.status).toBe('unhealthy');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Health check failed:', 
        expect.any(Error)
      );
    });
  });

  describe('cache operations', () => {
    it('should cache search results', async () => {
      // Arrange
      const params: SearchParams = { query: 'test' };
      const mockResponse = {
        hits: { hits: [], total: { value: 0 } }
      };
      
      mockElasticsearchService.search.mockResolvedValue(mockResponse);
      mockRedisService.get.mockResolvedValue(null);

      // Act
      await searchService.searchListings(params);

      // Assert
      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining('search:'),
        expect.any(String),
        300
      );
    });

    it('should handle cache failure gracefully', async () => {
      // Arrange
      const params: SearchParams = { query: 'test' };
      const mockResponse = {
        hits: { hits: [], total: { value: 0 } }
      };
      
      mockElasticsearchService.search.mockResolvedValue(mockResponse);
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockRejectedValue(new Error('Cache error'));

      // Act
      const result = await searchService.searchListings(params);

      // Assert
      expect(result.success).toBe(true); // Should not fail due to cache error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Cache storage failed:', 
        expect.any(Error)
      );
    });
  });
});
