import cacheManager from './cacheManager';
import searchCacheService from './searchCacheService';
import apiCacheService from './apiCacheService';
import logger from '../config/logger';

/**
 * KVKK COMPLIANCE: Cache Analytics Service
 * 
 * Cache analytics sistemi KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ SESSION_BASED - Sadece session_id ile analytics
 * ✅ ANONYMIZED - Kişisel veri analytics'te kullanılmaz
 * ✅ TRANSPARENCY - Analytics süreleri açık
 * ✅ MINIMIZATION - Sadece gerekli veriler analytics'te
 * ✅ PERFORMANCE_MONITORING - Performans izleme
 */

interface CacheAnalytics {
  timestamp: number;
  memoryCache: {
    totalItems: number;
    totalSize: number;
    hitRate: number;
    averageResponseTime: number;
    evictionCount: number;
  };
  redisCache: {
    totalKeys: number;
    totalSize: number;
    hitRate: number;
    connected: boolean;
  };
  searchCache: {
    totalSearches: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    averageResponseTime: number;
    popularQueries: string[];
  };
  apiCache: {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    averageResponseTime: number;
    popularEndpoints: string[];
  };
  overall: {
    totalRequests: number;
    totalHits: number;
    totalMisses: number;
    overallHitRate: number;
    averageResponseTime: number;
    memoryUsage: number;
    costSavings: number;
  };
}

interface PerformanceAlert {
  type: 'hit_rate_low' | 'response_time_high' | 'memory_usage_high' | 'cache_down';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  data: any;
}

interface CostAnalysis {
  cacheHitCost: number;
  databaseQueryCost: number;
  totalSavings: number;
  savingsPercentage: number;
  estimatedMonthlySavings: number;
}

class CacheAnalyticsService {
  private analyticsHistory: CacheAnalytics[] = [];
  private alerts: PerformanceAlert[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;
  private readonly ALERT_THRESHOLDS = {
    hitRateLow: 0.7, // %70 altında
    responseTimeHigh: 100, // 100ms üstünde
    memoryUsageHigh: 0.8, // %80 üstünde
  };

  constructor() {
    logger.info('✅ Cache Analytics Service initialized');
    this.startPeriodicAnalytics();
  }

  /**
   * Start periodic analytics collection
   */
  private startPeriodicAnalytics(): void {
    setInterval(async () => {
      try {
        await this.collectAnalytics();
        await this.checkPerformanceAlerts();
      } catch (error) {
        logger.error('❌ Periodic analytics error:', error);
      }
    }, 60000); // Her dakika
  }

  /**
   * Collect comprehensive analytics
   */
  async collectAnalytics(): Promise<CacheAnalytics> {
    try {
      const timestamp = Date.now();

      // Get cache manager stats
      const cacheManagerStats = await cacheManager.getStats();
      
      // Get search cache stats
      const searchCacheStats = searchCacheService.getStats();
      
      // Get API cache stats
      const apiCacheStats = apiCacheService.getStats();

      // Calculate overall metrics
      const totalRequests = (searchCacheStats.totalSearches || 0) + (apiCacheStats.totalRequests || 0);
      const totalHits = (searchCacheStats.cacheHits || 0) + (apiCacheStats.cacheHits || 0);
      const totalMisses = (searchCacheStats.cacheMisses || 0) + (apiCacheStats.cacheMisses || 0);
      const overallHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
      
      const averageResponseTime = (
        (searchCacheStats.averageResponseTime || 0) + 
        (apiCacheStats.averageResponseTime || 0)
      ) / 2;

      const memoryUsage = cacheManagerStats?.overall?.totalSize || 0;
      const costSavings = this.calculateCostSavings(totalHits, totalMisses);

      const analytics: CacheAnalytics = {
        timestamp,
        memoryCache: {
          totalItems: cacheManagerStats?.layers?.[0]?.stats?.totalItems || 0,
          totalSize: cacheManagerStats?.layers?.[0]?.stats?.totalSize || 0,
          hitRate: cacheManagerStats?.layers?.[0]?.stats?.hitRate || 0,
          averageResponseTime: cacheManagerStats?.layers?.[0]?.stats?.averageResponseTime || 0,
          evictionCount: cacheManagerStats?.layers?.[0]?.stats?.evictionCount || 0,
        },
        redisCache: {
          totalKeys: cacheManagerStats?.layers?.[1]?.stats?.totalKeys || 0,
          totalSize: cacheManagerStats?.layers?.[1]?.stats?.totalSize || 0,
          hitRate: cacheManagerStats?.layers?.[1]?.stats?.hitRate || 0,
          connected: cacheManagerStats?.layers?.[1]?.healthy || false,
        },
        searchCache: {
          totalSearches: searchCacheStats.totalSearches,
          cacheHits: searchCacheStats.cacheHits,
          cacheMisses: searchCacheStats.cacheMisses,
          hitRate: searchCacheStats.hitRate,
          averageResponseTime: searchCacheStats.averageResponseTime,
          popularQueries: searchCacheStats.popularQueries,
        },
        apiCache: {
          totalRequests: apiCacheStats.totalRequests,
          cacheHits: apiCacheStats.cacheHits,
          cacheMisses: apiCacheStats.cacheMisses,
          hitRate: apiCacheStats.hitRate,
          averageResponseTime: apiCacheStats.averageResponseTime,
          popularEndpoints: apiCacheStats.popularEndpoints,
        },
        overall: {
          totalRequests,
          totalHits,
          totalMisses,
          overallHitRate,
          averageResponseTime,
          memoryUsage,
          costSavings,
        }
      };

      // Store analytics
      this.analyticsHistory.push(analytics);
      
      // Keep only recent history
      if (this.analyticsHistory.length > this.MAX_HISTORY_SIZE) {
        this.analyticsHistory = this.analyticsHistory.slice(-this.MAX_HISTORY_SIZE);
      }

      logger.debug('📊 Cache analytics collected');
      return analytics;
    } catch (error) {
      logger.error('❌ Cache analytics collection error:', error);
      throw error;
    }
  }

  /**
   * Check performance alerts
   */
  private async checkPerformanceAlerts(): Promise<void> {
    try {
      const latestAnalytics = this.analyticsHistory[this.analyticsHistory.length - 1];
      if (!latestAnalytics) return;

      const { overall, memoryCache, redisCache } = latestAnalytics;

      // Check hit rate
      if (overall.overallHitRate < this.ALERT_THRESHOLDS.hitRateLow) {
        this.createAlert('hit_rate_low', 'Cache hit rate is below threshold', 'medium', {
          currentHitRate: overall.overallHitRate,
          threshold: this.ALERT_THRESHOLDS.hitRateLow
        });
      }

      // Check response time
      if (overall.averageResponseTime > this.ALERT_THRESHOLDS.responseTimeHigh) {
        this.createAlert('response_time_high', 'Cache response time is above threshold', 'high', {
          currentResponseTime: overall.averageResponseTime,
          threshold: this.ALERT_THRESHOLDS.responseTimeHigh
        });
      }

      // Check memory usage
      const memoryUsagePercentage = memoryCache.totalSize / (1024 * 1024 * 100); // 100MB limit
      if (memoryUsagePercentage > this.ALERT_THRESHOLDS.memoryUsageHigh) {
        this.createAlert('memory_usage_high', 'Cache memory usage is above threshold', 'high', {
          currentUsage: memoryUsagePercentage,
          threshold: this.ALERT_THRESHOLDS.memoryUsageHigh
        });
      }

      // Check cache health
      if (!redisCache.connected) {
        this.createAlert('cache_down', 'Redis cache is not connected', 'critical', {
          redisConnected: redisCache.connected
        });
      }
    } catch (error) {
      logger.error('❌ Performance alerts check error:', error);
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(type: string, message: string, severity: string, data: any): void {
    const alert: PerformanceAlert = {
      type: type as any,
      message,
      severity: severity as any,
      timestamp: Date.now(),
      data
    };

    this.alerts.push(alert);
    logger.warn(`⚠️ Cache Alert [${severity.toUpperCase()}]: ${message}`, data);
  }

  /**
   * Calculate cost savings
   */
  private calculateCostSavings(hits: number, misses: number): number {
    // Estimated costs (in milliseconds)
    const cacheHitCost = 1; // 1ms
    const databaseQueryCost = 50; // 50ms
    
    const totalSavings = (databaseQueryCost - cacheHitCost) * hits;
    return totalSavings;
  }

  /**
   * Get current analytics
   */
  async getCurrentAnalytics(): Promise<CacheAnalytics | null> {
    try {
      return await this.collectAnalytics();
    } catch (error) {
      logger.error('❌ Get current analytics error:', error);
      return null;
    }
  }

  /**
   * Get analytics history
   */
  getAnalyticsHistory(limit: number = 100): CacheAnalytics[] {
    return this.analyticsHistory.slice(-limit);
  }

  /**
   * Get performance alerts
   */
  getAlerts(limit: number = 50): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Get cost analysis
   */
  getCostAnalysis(): CostAnalysis {
    const latestAnalytics = this.analyticsHistory[this.analyticsHistory.length - 1];
    if (!latestAnalytics) {
      return {
        cacheHitCost: 0,
        databaseQueryCost: 0,
        totalSavings: 0,
        savingsPercentage: 0,
        estimatedMonthlySavings: 0
      };
    }

    const { totalHits, totalMisses } = latestAnalytics.overall;
    const cacheHitCost = 1; // 1ms
    const databaseQueryCost = 50; // 50ms
    
    const totalSavings = (databaseQueryCost - cacheHitCost) * totalHits;
    const totalCost = (cacheHitCost * totalHits) + (databaseQueryCost * totalMisses);
    const savingsPercentage = totalCost > 0 ? (totalSavings / totalCost) * 100 : 0;
    
    // Estimate monthly savings (assuming 30 days)
    const estimatedMonthlySavings = totalSavings * 30;

    return {
      cacheHitCost,
      databaseQueryCost,
      totalSavings,
      savingsPercentage,
      estimatedMonthlySavings
    };
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(hours: number = 24): any {
    const now = Date.now();
    const cutoff = now - (hours * 60 * 60 * 1000);
    
    const recentAnalytics = this.analyticsHistory.filter(
      analytics => analytics.timestamp >= cutoff
    );

    if (recentAnalytics.length === 0) {
      return {
        hitRateTrend: 0,
        responseTimeTrend: 0,
        memoryUsageTrend: 0
      };
    }

    const first = recentAnalytics[0];
    const last = recentAnalytics[recentAnalytics.length - 1];

    return {
      hitRateTrend: last.overall.overallHitRate - first.overall.overallHitRate,
      responseTimeTrend: last.overall.averageResponseTime - first.overall.averageResponseTime,
      memoryUsageTrend: last.overall.memoryUsage - first.overall.memoryUsage
    };
  }

  /**
   * Clear analytics history
   */
  clearAnalyticsHistory(): void {
    this.analyticsHistory = [];
    this.alerts = [];
    logger.info('🧹 Cache analytics history cleared');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const analytics = await this.collectAnalytics();
      return analytics !== null;
    } catch (error) {
      logger.error('❌ Cache analytics health check failed:', error);
      return false;
    }
  }
}

export default new CacheAnalyticsService(); 