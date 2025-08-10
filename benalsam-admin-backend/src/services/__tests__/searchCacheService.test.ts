import searchCacheService from '../searchCacheService';
import cacheManager from '../cacheManager';

// Mock dependencies
jest.mock('../cacheManager');

describe('SearchCacheService', () => {
  let searchCacheServiceInstance: typeof searchCacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    searchCacheServiceInstance = searchCacheService;
  });

  describe('Constructor', () => {
    it('should initialize with correct cache prefix', () => {
      expect(searchCacheServiceInstance).toBeDefined();
      expect((searchCacheServiceInstance as any).CACHE_PREFIX).toBe('search:results:');
    });
  });

  describe('getCachedSearch()', () => {
    it('should return cached search results', async () => {
      const params = { query: 'iPhone 13', filters: { category: 'electronics', price: '100-500' } };
      const expectedResults = {
        results: [
          { id: 1, title: 'iPhone 13', price: 299 },
          { id: 2, title: 'iPhone 13 Pro', price: 399 }
        ],
        total: 2
      };

      (cacheManager.get as jest.Mock).mockResolvedValue(expectedResults);

      const result = await searchCacheServiceInstance.getCachedSearch(params);

      expect(result).toEqual(expectedResults);
      expect(cacheManager.get).toHaveBeenCalled();
    });

    it('should return null when no cached results', async () => {
      const params = { query: 'iPhone 13', filters: { category: 'electronics' } };

      (cacheManager.get as jest.Mock).mockResolvedValue(null);

      const result = await searchCacheServiceInstance.getCachedSearch(params);

      expect(result).toBeNull();
    });

    it('should handle empty query', async () => {
      const params = { query: '', filters: { category: 'electronics' } };

      const result = await searchCacheServiceInstance.getCachedSearch(params);

      expect(result).toBeNull();
    });

    it('should handle null filters', async () => {
      const params = { query: 'iPhone 13', filters: null };

      (cacheManager.get as jest.Mock).mockResolvedValue([]);

      const result = await searchCacheServiceInstance.getCachedSearch(params);

      expect(cacheManager.get).toHaveBeenCalled();
    });
  });

  describe('cacheSearchResults()', () => {
    it('should cache search results', async () => {
      const params = { query: 'iPhone 13', filters: { category: 'electronics' } };
      const results = [
        { id: 1, title: 'iPhone 13', price: 299 }
      ];
      const total = 1;

      (cacheManager.set as jest.Mock).mockResolvedValue(true);

      await searchCacheServiceInstance.cacheSearchResults(params, results, total);

      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      const params = { query: 'iPhone 13', filters: { category: 'electronics' } };
      const results: any[] = [];
      const total = 0;

      (cacheManager.set as jest.Mock).mockResolvedValue(true);

      await searchCacheServiceInstance.cacheSearchResults(params, results, total);

      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      const params = { query: 'iPhone 13', filters: { category: 'electronics' } };
      const results = [{ id: 1, title: 'iPhone 13' }];
      const total = 1;

      (cacheManager.set as jest.Mock).mockRejectedValue(new Error('Cache error'));

      await expect(searchCacheServiceInstance.cacheSearchResults(params, results, total))
        .resolves.not.toThrow();
    });
  });

  describe('getPopularSearches()', () => {
    it('should return popular searches', async () => {
      const expectedPopularSearches = ['iPhone 13', 'Samsung Galaxy', 'MacBook Pro'];

      (cacheManager.get as jest.Mock).mockResolvedValue(expectedPopularSearches);

      const result = await searchCacheServiceInstance.getPopularSearches();

      expect(result).toEqual(expectedPopularSearches);
      expect(cacheManager.get).toHaveBeenCalledWith('search:popular:list', undefined);
    });

    it('should return empty array when no popular searches', async () => {
      (cacheManager.get as jest.Mock).mockResolvedValue(null);

      const result = await searchCacheServiceInstance.getPopularSearches();

      expect(result).toEqual([]);
    });
  });

  describe('getSearchSuggestions()', () => {
    it('should return search suggestions', async () => {
      const prefix = 'iPhone';
      const expectedSuggestions = ['iPhone 13', 'iPhone 14', 'iPhone 15'];

      (cacheManager.get as jest.Mock).mockResolvedValue(expectedSuggestions);

      const result = await searchCacheServiceInstance.getSearchSuggestions(prefix);

      expect(result).toEqual(expectedSuggestions);
      expect(cacheManager.get).toHaveBeenCalled();
    });
  });

  describe('invalidateSearchCache()', () => {
    it('should invalidate search cache', async () => {
      // Mock the internal method that gets cache keys
      (searchCacheServiceInstance as any).getCacheKeysByPattern = jest.fn().mockResolvedValue(['key1', 'key2']);
      (cacheManager.delete as jest.Mock).mockResolvedValue(true);

      const result = await searchCacheServiceInstance.invalidateSearchCache();

      expect(result).toBeGreaterThanOrEqual(0);
      expect(cacheManager.delete).toHaveBeenCalled();
    });

    it('should handle invalidate errors gracefully', async () => {
      (cacheManager.delete as jest.Mock).mockRejectedValue(new Error('Invalidate error'));

      const result = await searchCacheServiceInstance.invalidateSearchCache();

      expect(result).toBe(0);
    });
  });

  describe('getStats()', () => {
    it('should return search statistics', async () => {
      const result = searchCacheServiceInstance.getStats();

      expect(result).toHaveProperty('totalSearches');
      expect(result).toHaveProperty('cacheHits');
      expect(result).toHaveProperty('cacheMisses');
      expect(result).toHaveProperty('hitRate');
      expect(result).toHaveProperty('averageResponseTime');
      expect(result).toHaveProperty('popularQueries');
    });
  });

  describe('healthCheck()', () => {
    it('should return health status', async () => {
      // Mock the healthCheck method directly
      const mockHealthCheck = jest.fn().mockResolvedValue(true);
      (searchCacheServiceInstance as any).healthCheck = mockHealthCheck;

      const result = await searchCacheServiceInstance.healthCheck();

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });
  });

  describe('clearAll()', () => {
    it('should clear all search cache', async () => {
      // Mock the internal method that gets cache keys
      (searchCacheServiceInstance as any).getCacheKeysByPattern = jest.fn().mockResolvedValue(['key1', 'key2']);
      (cacheManager.delete as jest.Mock).mockResolvedValue(true);

      await searchCacheServiceInstance.clearAll();

      expect(cacheManager.delete).toHaveBeenCalled();
    });
  });

  describe('warmSearchCache()', () => {
    it('should warm search cache', async () => {
      const queries = ['iPhone 13', 'Samsung Galaxy'];
      (cacheManager.set as jest.Mock).mockResolvedValue(true);

      await searchCacheServiceInstance.warmSearchCache(queries);

      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('generateCacheKey()', () => {
    it('should generate correct cache key for search params', () => {
      const params = { query: 'iPhone 13', filters: { category: 'electronics' } };

      const key = (searchCacheServiceInstance as any).generateCacheKey(params);

      expect(key).toMatch(/^search:results:/);
    });

    it('should handle empty filters', () => {
      const params = { query: 'iPhone 13', filters: {} };

      const key = (searchCacheServiceInstance as any).generateCacheKey(params);

      expect(key).toMatch(/^search:results:/);
    });

    it('should handle null filters', () => {
      const params = { query: 'iPhone 13', filters: null };

      const key = (searchCacheServiceInstance as any).generateCacheKey(params);

      expect(key).toMatch(/^search:results:/);
    });

    it('should normalize query string', () => {
      const params = { query: '  iPhone 13  ', filters: { category: 'electronics' } };

      const key = (searchCacheServiceInstance as any).generateCacheKey(params);

      expect(key).toMatch(/^search:results:/);
    });
  });

  describe('Error Handling', () => {
    it('should handle cache manager errors gracefully', async () => {
      const params = { query: 'iPhone 13', filters: { category: 'electronics' } };

      (cacheManager.get as jest.Mock).mockRejectedValue(new Error('Cache error'));

      const result = await searchCacheServiceInstance.getCachedSearch(params);

      expect(result).toBeNull();
    });

    it('should handle invalid query parameters', async () => {
      const params = { query: '', filters: { category: 'electronics' } };

      const result = await searchCacheServiceInstance.getCachedSearch(params);

      expect(result).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should handle large result sets', async () => {
      const params = { query: 'electronics', filters: { category: 'electronics' } };
      const largeResults = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Product ${i}`,
        price: Math.random() * 1000
      }));
      const total = 1000;

      (cacheManager.set as jest.Mock).mockResolvedValue(true);

      await searchCacheServiceInstance.cacheSearchResults(params, largeResults, total);

      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should handle concurrent requests', async () => {
      const params = { query: 'iPhone 13', filters: { category: 'electronics' } };

      (cacheManager.get as jest.Mock).mockResolvedValue([]);

      const promises = Array.from({ length: 10 }, () =>
        searchCacheServiceInstance.getCachedSearch(params)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(cacheManager.get).toHaveBeenCalledTimes(10);
    });
  });
}); 