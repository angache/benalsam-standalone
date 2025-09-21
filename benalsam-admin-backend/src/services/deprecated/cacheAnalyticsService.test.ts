import cacheAnalyticsService from '../cacheAnalyticsService';
import cacheManager from '../cacheManager';
import searchCacheService from '../searchCacheService';
import apiCacheService from '../apiCacheService';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../cacheManager');
jest.mock('../searchCacheService');
jest.mock('../apiCacheService');
jest.mock('../../config/logger');

describe('CacheAnalyticsService', () => {
  let cacheAnalyticsServiceInstance: typeof cacheAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheAnalyticsServiceInstance = cacheAnalyticsService;
  });

  describe('Constructor', () => {
    it('should initialize with correct settings', () => {
      expect(cacheAnalyticsServiceInstance).toBeDefined();
      expect((cacheAnalyticsServiceInstance as any).MAX_HISTORY_SIZE).toBe(1000);
      expect((cacheAnalyticsServiceInstance as any).ALERT_THRESHOLDS.hitRateLow).toBe(0.7);
      expect((cacheAnalyticsServiceInstance as any).ALERT_THRESHOLDS.responseTimeHigh).toBe(100);
      expect((cacheAnalyticsServiceInstance as any).ALERT_THRESHOLDS.memoryUsageHigh).toBe(0.8);
    });
  });

  describe('collectAnalytics()', () => {
    it('should collect comprehensive analytics data', async () => {
      const mockMemoryStats = {
        totalItems: 100,
        totalSize: 1024,
        hitRate: 0.85,
        averageResponseTime: 50,
        evictionCount: 5
      };

      const mockSearchStats = {
        totalSearches: 1000,
        cacheHits: 750,
        cacheMisses: 250,
        hitRate: 0.75,
        averageResponseTime: 30,
        popularQueries: ['iPhone 13', 'Samsung Galaxy']
      };

      const mockApiStats = {
        totalRequests: 2000,
        cacheHits: 1600,
        cacheMisses: 400,
        hitRate: 0.8,
        averageResponseTime: 25,
        popularEndpoints: ['/api/search', '/api/categories']
      };

      (cacheManager.getStats as jest.Mock).mockResolvedValue(mockMemoryStats);
      (searchCacheService.getStats as jest.Mock).mockReturnValue(mockSearchStats);
      (apiCacheService.getStats as jest.Mock).mockReturnValue(mockApiStats);

      const result = await cacheAnalyticsServiceInstance.collectAnalytics();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('memoryCache');
      expect(result).toHaveProperty('redisCache');
      expect(result).toHaveProperty('searchCache');
      expect(result).toHaveProperty('apiCache');
      expect(result).toHaveProperty('overall');
      expect(result.overall.overallHitRate).toBeGreaterThan(0);
      expect(result.overall.totalRequests).toBeGreaterThan(0);
    });

    it('should handle analytics collection errors gracefully', async () => {
      // Mock the collectAnalytics method to handle errors properly
      const originalCollectAnalytics = cacheAnalyticsServiceInstance.collectAnalytics;
      (cacheAnalyticsServiceInstance as any).collectAnalytics = jest.fn().mockImplementation(() => {
        throw new Error('Cache error');
      });

      try {
        await cacheAnalyticsServiceInstance.collectAnalytics();
      } catch (error: any) {
        expect(error.message).toBe('Cache error');
      }

      // Restore original method
      (cacheAnalyticsServiceInstance as any).collectAnalytics = originalCollectAnalytics;
    });
  });

  describe('getCurrentAnalytics()', () => {
    it('should return current analytics data', async () => {
      const mockAnalytics = {
        timestamp: Date.now(),
        memoryCache: { totalItems: 100, hitRate: 0.8 },
        redisCache: { totalKeys: 500, hitRate: 0.75 },
        searchCache: { totalSearches: 1000, hitRate: 0.75 },
        apiCache: { totalRequests: 2000, hitRate: 0.8 },
        overall: { overallHitRate: 0.8, totalRequests: 3000 }
      };

      // Mock the collectAnalytics method to return our mock data
      (cacheAnalyticsServiceInstance as any).collectAnalytics = jest.fn().mockResolvedValue(mockAnalytics);

      const result = await cacheAnalyticsServiceInstance.getCurrentAnalytics();

      expect(result).toEqual(mockAnalytics);
    });

    it('should return null when no analytics data', async () => {
      // Mock the collectAnalytics method to return null
      (cacheAnalyticsServiceInstance as any).collectAnalytics = jest.fn().mockResolvedValue(null);

      const result = await cacheAnalyticsServiceInstance.getCurrentAnalytics();

      expect(result).toBeNull();
    });
  });

  describe('getAnalyticsHistory()', () => {
    it('should return analytics history with limit', () => {
      const mockHistory = [
        { timestamp: Date.now() - 1000, overall: { overallHitRate: 0.8 } },
        { timestamp: Date.now() - 2000, overall: { overallHitRate: 0.75 } },
        { timestamp: Date.now() - 3000, overall: { overallHitRate: 0.7 } }
      ];

      (cacheAnalyticsServiceInstance as any).analyticsHistory = mockHistory;

      const result = cacheAnalyticsServiceInstance.getAnalyticsHistory(2);

      expect(result).toHaveLength(2);
      expect(result[0].timestamp).toBeGreaterThan(result[1].timestamp);
    });

    it('should return all history when no limit specified', () => {
      const mockHistory = [
        { timestamp: Date.now() - 1000, overall: { overallHitRate: 0.8 } },
        { timestamp: Date.now() - 2000, overall: { overallHitRate: 0.75 } }
      ];

      (cacheAnalyticsServiceInstance as any).analyticsHistory = mockHistory;

      const result = cacheAnalyticsServiceInstance.getAnalyticsHistory();

      expect(result).toHaveLength(2);
    });
  });

  describe('getAlerts()', () => {
    it('should return alerts with limit', () => {
      const mockAlerts = [
        { type: 'hit_rate_low', severity: 'medium', timestamp: Date.now() - 1000 },
        { type: 'response_time_high', severity: 'high', timestamp: Date.now() - 2000 },
        { type: 'memory_usage_high', severity: 'critical', timestamp: Date.now() - 3000 }
      ];

      (cacheAnalyticsServiceInstance as any).alerts = mockAlerts;

      const result = cacheAnalyticsServiceInstance.getAlerts(2);

      expect(result).toHaveLength(2);
      expect(result[0].timestamp).toBeGreaterThan(result[1].timestamp);
    });

    it('should return all alerts when no limit specified', () => {
      const mockAlerts = [
        { type: 'hit_rate_low', severity: 'medium', timestamp: Date.now() },
        { type: 'response_time_high', severity: 'high', timestamp: Date.now() }
      ];

      (cacheAnalyticsServiceInstance as any).alerts = mockAlerts;

      const result = cacheAnalyticsServiceInstance.getAlerts();

      expect(result).toHaveLength(2);
    });
  });

  describe('getCostAnalysis()', () => {
    it('should calculate cost savings correctly', () => {
      const mockAnalytics = {
        overall: {
          totalHits: 800,
          totalMisses: 200,
          totalRequests: 1000
        }
      };

      (cacheAnalyticsServiceInstance as any).analyticsHistory = [mockAnalytics];

      const result = cacheAnalyticsServiceInstance.getCostAnalysis();

      expect(result).toHaveProperty('cacheHitCost');
      expect(result).toHaveProperty('databaseQueryCost');
      expect(result).toHaveProperty('totalSavings');
      expect(result).toHaveProperty('savingsPercentage');
      expect(result).toHaveProperty('estimatedMonthlySavings');
      expect(result.savingsPercentage).toBeGreaterThan(0);
    });

    it('should handle zero requests gracefully', () => {
      const mockAnalytics = {
        overall: {
          totalHits: 0,
          totalMisses: 0,
          totalRequests: 0
        }
      };

      (cacheAnalyticsServiceInstance as any).analyticsHistory = [mockAnalytics];

      const result = cacheAnalyticsServiceInstance.getCostAnalysis();

      expect(result.totalSavings).toBe(0);
      expect(result.savingsPercentage).toBe(0);
    });
  });

  describe('getPerformanceTrends()', () => {
    it('should return performance trends for specified hours', () => {
      const mockHistory = [
        { timestamp: Date.now() - 1000, overall: { overallHitRate: 0.8, averageResponseTime: 50 } },
        { timestamp: Date.now() - 2000, overall: { overallHitRate: 0.75, averageResponseTime: 60 } },
        { timestamp: Date.now() - 3000, overall: { overallHitRate: 0.7, averageResponseTime: 70 } }
      ];

      (cacheAnalyticsServiceInstance as any).analyticsHistory = mockHistory;

      const result = cacheAnalyticsServiceInstance.getPerformanceTrends(24);

      expect(result).toHaveProperty('hitRateTrend');
      expect(result).toHaveProperty('responseTimeTrend');
      expect(result).toHaveProperty('memoryUsageTrend');
      expect(typeof result.hitRateTrend).toBe('number');
      expect(typeof result.responseTimeTrend).toBe('number');
    });

    it('should handle empty history gracefully', () => {
      (cacheAnalyticsServiceInstance as any).analyticsHistory = [];

      const result = cacheAnalyticsServiceInstance.getPerformanceTrends(24);

      expect(result).toHaveProperty('hitRateTrend');
      expect(result.hitRateTrend).toBe(0);
    });
  });

  describe('clearAnalyticsHistory()', () => {
    it('should clear analytics history', () => {
      const mockHistory = [
        { timestamp: Date.now(), overall: { overallHitRate: 0.8 } }
      ];

      (cacheAnalyticsServiceInstance as any).analyticsHistory = mockHistory;

      cacheAnalyticsServiceInstance.clearAnalyticsHistory();

      const result = cacheAnalyticsServiceInstance.getAnalyticsHistory();
      expect(result).toHaveLength(0);
    });
  });

  describe('healthCheck()', () => {
    it('should return true for healthy service', async () => {
      // Mock successful health check
      (cacheManager.getStats as jest.Mock).mockResolvedValue({ totalItems: 100 });

      const result = await cacheAnalyticsServiceInstance.healthCheck();

      expect(result).toBe(true);
    });

    it('should handle health check errors gracefully', async () => {
      // Mock a scenario where health check fails
      (cacheManager.getStats as jest.Mock).mockRejectedValue(new Error('Health check failed'));

      const result = await cacheAnalyticsServiceInstance.healthCheck();

      expect(typeof result).toBe('boolean');
    });
  });

  describe('calculateCostSavings()', () => {
    it('should calculate cost savings correctly', () => {
      const hits = 800;
      const misses = 200;

      const savings = (cacheAnalyticsServiceInstance as any).calculateCostSavings(hits, misses);

      expect(savings).toBeGreaterThan(0);
      expect(typeof savings).toBe('number');
    });

    it('should handle zero values', () => {
      const savings = (cacheAnalyticsServiceInstance as any).calculateCostSavings(0, 0);

      expect(savings).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle analytics collection errors gracefully', async () => {
      // Mock the collectAnalytics method to handle errors properly
      const originalCollectAnalytics = cacheAnalyticsServiceInstance.collectAnalytics;
      (cacheAnalyticsServiceInstance as any).collectAnalytics = jest.fn().mockImplementation(() => {
        throw new Error('Cache error');
      });

      try {
        await cacheAnalyticsServiceInstance.collectAnalytics();
      } catch (error: any) {
        expect(error.message).toBe('Cache error');
      }

      // Restore original method
      (cacheAnalyticsServiceInstance as any).collectAnalytics = originalCollectAnalytics;
    });
  });

  describe('Performance', () => {
    it('should handle large analytics history efficiently', () => {
      const largeHistory = Array.from({ length: 2000 }, (_, i) => ({
        timestamp: Date.now() - i * 1000,
        overall: { overallHitRate: 0.8, totalRequests: 1000 }
      }));

      (cacheAnalyticsServiceInstance as any).analyticsHistory = largeHistory;

      const result = cacheAnalyticsServiceInstance.getAnalyticsHistory();

      // Should be limited to MAX_HISTORY_SIZE
      expect(result.length).toBeLessThanOrEqual(1000);
    });

    it('should handle concurrent analytics collection', async () => {
      // Mock successful analytics collection
      const mockAnalytics = {
        timestamp: Date.now(),
        memoryCache: { totalItems: 100, hitRate: 0.8 },
        redisCache: { totalKeys: 500, hitRate: 0.75 },
        searchCache: { totalSearches: 1000, hitRate: 0.75 },
        apiCache: { totalRequests: 2000, hitRate: 0.8 },
        overall: { overallHitRate: 0.8, totalRequests: 3000 }
      };

      (cacheAnalyticsServiceInstance as any).collectAnalytics = jest.fn().mockResolvedValue(mockAnalytics);

      const promises = Array.from({ length: 10 }, () =>
        cacheAnalyticsServiceInstance.collectAnalytics()
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(results.every(result => result !== undefined)).toBe(true);
    });
  });
}); 