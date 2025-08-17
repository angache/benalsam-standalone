import { redis } from './redisService';
import performanceMonitoringService from './performanceMonitoringService';

interface PerformanceTrend {
  route: string;
  score: number;
  trend: 'improving' | 'degrading' | 'stable';
  change: number;
  period: '1h' | '24h' | '7d' | '30d';
  timestamp: Date;
  metrics: {
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
  };
}

interface TrendAlert {
  id: string;
  type: 'performance_degradation' | 'performance_improvement' | 'critical_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  route: string;
  message: string;
  score: number;
  previousScore: number;
  change: number;
  timestamp: Date;
  resolved: boolean;
}

class PerformanceTrendService {
  private readonly TREND_CACHE_PREFIX = 'performance:trend:';
  private readonly ALERT_CACHE_PREFIX = 'performance:alert:';
  private readonly TREND_THRESHOLDS = {
    degradation: -5, // 5 puan düşüş
    improvement: 5,  // 5 puan artış
    critical: -10    // 10 puan düşüş
  };

  /**
   * Performance trendlerini analiz et
   */
  async analyzeTrends(route?: string, period: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<PerformanceTrend[]> {
    try {
      const routes = route ? [route] : await this.getActiveRoutes();
      console.log('Active routes found:', routes);
      
      if (routes.length === 0) {
        return [];
      }

      // Batch Redis operations for better performance
      const [currentDataBatch, historicalDataBatch] = await Promise.all([
        this.getCurrentPerformanceDataBatch(routes),
        this.getHistoricalPerformanceDataBatch(routes, period)
      ]);

      const trends: PerformanceTrend[] = [];

      for (const currentRoute of routes) {
        console.log('Calculating trend for route:', currentRoute);
        const currentData = currentDataBatch[currentRoute];
        const historicalData = historicalDataBatch[currentRoute] || [];
        
        const trend = this.calculateTrendFromData(currentRoute, currentData, historicalData, period);
        if (trend) {
          trends.push(trend);
          console.log('Trend calculated:', trend);
        } else {
          console.log('No trend calculated for route:', currentRoute);
        }
      }

      // Trendleri cache'le (batch)
      await this.cacheTrendsBatch(trends, period);
      
      return trends;
    } catch (error) {
      console.error('Trend analizi hatası:', error);
      throw new Error('Trend analizi başarısız');
    }
  }

  /**
   * Belirli bir route için trend hesapla
   */
  private async calculateTrend(route: string, period: '1h' | '24h' | '7d' | '30d'): Promise<PerformanceTrend | null> {
    try {
      const currentData = await this.getCurrentPerformanceData(route);
      const historicalData = await this.getHistoricalPerformanceData(route, period);

      return this.calculateTrendFromData(route, currentData, historicalData, period);
    } catch (error) {
      console.error(`${route} trend hesaplama hatası:`, error);
      return null;
    }
  }

  /**
   * Verilerden trend hesapla (sync version for batch processing)
   */
  private calculateTrendFromData(route: string, currentData: any, historicalData: any[], period: '1h' | '24h' | '7d' | '30d'): PerformanceTrend | null {
    try {
      // Eğer güncel data yoksa, geçmiş verilerden en son veriyi kullan
      if (!currentData && historicalData.length === 0) {
        return null;
      }

      let currentScore: number;
      let currentMetrics: any;

      if (currentData) {
        currentScore = currentData.score;
        currentMetrics = currentData.metrics;
      } else {
        // En son historical data'yı kullan
        const latestData = historicalData[historicalData.length - 1];
        currentScore = latestData.score;
        currentMetrics = {
          lcp: latestData.lcp || 0,
          fid: 0, // FID historical data'da yok
          cls: latestData.cls || 0,
          ttfb: latestData.ttfb || 0
        };
      }

      // Geçmiş verilerden trend hesapla
      let trend: 'improving' | 'degrading' | 'stable' = 'stable';
      let change = 0;

      if (historicalData.length >= 2) {
        const previousData = historicalData[historicalData.length - 2];
        const previousScore = previousData.score;
        change = currentScore - previousScore;

        if (change > this.TREND_THRESHOLDS.improvement) {
          trend = 'improving';
        } else if (change < this.TREND_THRESHOLDS.degradation) {
          trend = 'degrading';
        }
      } else if (historicalData.length === 1) {
        // Sadece 1 veri varsa stable
        trend = 'stable';
        change = 0;
      }

      return {
        route,
        score: currentScore,
        trend,
        change,
        period,
        timestamp: new Date(),
        metrics: currentMetrics
      };
    } catch (error) {
      console.error(`${route} trend hesaplama hatası:`, error);
      return null;
    }
  }

  /**
   * Performance alertleri oluştur
   */
  async generateAlerts(): Promise<TrendAlert[]> {
    try {
      const trends = await this.analyzeTrends();
      const alerts: TrendAlert[] = [];

      for (const trend of trends) {
        const alert = this.createAlertFromTrend(trend);
        if (alert) {
          alerts.push(alert);
          await this.saveAlert(alert);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Alert oluşturma hatası:', error);
      throw new Error('Alert oluşturulamadı');
    }
  }

  /**
   * Trend'den alert oluştur
   */
  private createAlertFromTrend(trend: PerformanceTrend): TrendAlert | null {
    const change = Math.abs(trend.change);
    
    if (change < 5) return null; // Küçük değişimler için alert yok

    let type: 'performance_degradation' | 'performance_improvement' | 'critical_issue';
    let severity: 'low' | 'medium' | 'high' | 'critical';
    let message: string;

    if (trend.change <= this.TREND_THRESHOLDS.critical) {
      type = 'critical_issue';
      severity = 'critical';
      message = `🚨 Kritik performans düşüşü: ${trend.route} sayfasında ${change} puan düşüş!`;
    } else if (trend.change <= this.TREND_THRESHOLDS.degradation) {
      type = 'performance_degradation';
      severity = 'high';
      message = `⚠️ Performans düşüşü: ${trend.route} sayfasında ${change} puan düşüş`;
    } else if (trend.change >= this.TREND_THRESHOLDS.improvement) {
      type = 'performance_improvement';
      severity = 'low';
      message = `✅ Performans iyileşmesi: ${trend.route} sayfasında ${change} puan artış`;
    } else {
      return null;
    }

    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      route: trend.route,
      message,
      score: trend.score,
      previousScore: trend.score - trend.change,
      change: trend.change,
      timestamp: new Date(),
      resolved: false
    };
  }

  /**
   * Aktif route'ları al
   */
  private async getActiveRoutes(): Promise<string[]> {
    try {
      console.log('🔍 [TrendService] Getting active routes...');
      
      // Önce güncel data key'lerini dene
      let keys = await redis.keys('perf:data:*');
      console.log('🔍 [TrendService] Current data keys:', keys);
      
      // Eğer güncel data yoksa, history key'lerinden route'ları çıkar
      if (keys.length === 0) {
        console.log('🔍 [TrendService] No current data, checking history keys...');
        const historyKeys = await redis.keys('perf:history:*');
        console.log('🔍 [TrendService] History keys found:', historyKeys.length);
        
        const routeSet = new Set<string>();
        
        for (const key of historyKeys) {
          const parts = key.split(':');
          if (parts.length >= 3) {
            const route = parts[2]; // perf:history:route:timestamp -> parts[2] = route
            if (route && route !== 'history') {
              routeSet.add(route);
            }
          }
        }
        
        const routes = Array.from(routeSet);
        console.log('🔍 [TrendService] Routes extracted from history:', routes);
        return routes;
      }
      
      const routes = keys.map((key: string) => key.replace('perf:data:', ''));
      console.log('🔍 [TrendService] Routes from current data:', routes);
      return routes;
    } catch (error) {
      console.error('❌ [TrendService] Aktif route\'lar alınamadı:', error);
      return [];
    }
  }

  /**
   * Güncel performance data'sını al
   */
  private async getCurrentPerformanceData(route: string): Promise<any> {
    try {
      const data = await redis.get(`perf:data:${route}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`${route} güncel data alınamadı:`, error);
      return null;
    }
  }

  /**
   * Geçmiş performance data'sını al
   */
  private async getHistoricalPerformanceData(route: string, period: '1h' | '24h' | '7d' | '30d'): Promise<any[]> {
    try {
      const keys = await redis.keys(`perf:history:${route}:*`);
      const data: any[] = [];

      for (const key of keys) {
        const item = await redis.get(key);
        if (item) {
          data.push(JSON.parse(item));
        }
      }

      return data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error(`${route} geçmiş data alınamadı:`, error);
      return [];
    }
  }

  /**
   * Batch olarak güncel performance data'sını al
   */
  private async getCurrentPerformanceDataBatch(routes: string[]): Promise<Record<string, any>> {
    try {
      const pipeline = redis.pipeline();
      const keys = routes.map(route => `perf:data:${route}`);
      
      keys.forEach(key => pipeline.get(key as string));
      
      const results = await pipeline.exec();
      const data: Record<string, any> = {};
      
      if (results) {
        results.forEach((result, index) => {
          const [error, value] = result;
          if (!error && value) {
            try {
              data[routes[index]] = JSON.parse(value as string);
            } catch (parseError) {
              console.error(`JSON parse error for route ${routes[index]}:`, parseError);
            }
          }
        });
      }
      
      return data;
    } catch (error) {
      console.error('Batch current data alınamadı:', error);
      return {};
    }
  }

  /**
   * Batch olarak geçmiş performance data'sını al
   */
  private async getHistoricalPerformanceDataBatch(routes: string[], period: '1h' | '24h' | '7d' | '30d'): Promise<Record<string, any[]>> {
    try {
      const pipeline = redis.pipeline();
      const routeKeys: { route: string; keys: string[] }[] = [];
      
      // Her route için history key'lerini al
      for (const route of routes) {
        const keys = await redis.keys(`perf:history:${route}:*`);
        routeKeys.push({ route, keys });
        
        // Her key için get komutu ekle
        keys.forEach(key => pipeline.get(key as string));
      }
      
      const results = await pipeline.exec();
      const data: Record<string, any[]> = {};
      
      if (results) {
        let resultIndex = 0;
        
        for (const { route, keys } of routeKeys) {
          const routeData: any[] = [];
          
          for (const key of keys) {
            const [error, value] = results[resultIndex++];
            if (!error && value) {
              try {
                routeData.push(JSON.parse(value as string));
              } catch (parseError) {
                console.error(`JSON parse error for key ${key}:`, parseError);
              }
            }
          }
          
          // Tarihe göre sırala
          data[route] = routeData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
      }
      
      return data;
    } catch (error) {
      console.error('Batch historical data alınamadı:', error);
      return {};
    }
  }

  /**
   * Trendleri cache'le
   */
  private async cacheTrends(trends: PerformanceTrend[], period: string): Promise<void> {
    try {
      for (const trend of trends) {
        const key = `${this.TREND_CACHE_PREFIX}${trend.route}:${period}`;
        await redis.setex(key, 3600, JSON.stringify(trend)); // 1 saat cache
      }
    } catch (error) {
      console.error('Trend cache hatası:', error);
    }
  }

  /**
   * Batch olarak trendleri cache'le
   */
  private async cacheTrendsBatch(trends: PerformanceTrend[], period: string): Promise<void> {
    try {
      const pipeline = redis.pipeline();
      
      for (const trend of trends) {
        const key = `${this.TREND_CACHE_PREFIX}${trend.route}:${period}`;
        pipeline.setex(key as string, 3600, JSON.stringify(trend)); // 1 saat cache
      }
      
      await pipeline.exec();
    } catch (error) {
      console.error('Batch trend cache hatası:', error);
    }
  }

  /**
   * Alert'i kaydet
   */
  private async saveAlert(alert: TrendAlert): Promise<void> {
    try {
      const key = `${this.ALERT_CACHE_PREFIX}${alert.id}`;
      await redis.setex(key, 86400, JSON.stringify(alert)); // 24 saat cache
    } catch (error) {
      console.error('Alert kaydetme hatası:', error);
    }
  }

  /**
   * Aktif alertleri al
   */
  async getActiveAlerts(): Promise<TrendAlert[]> {
    try {
      const keys = await redis.keys(`${this.ALERT_CACHE_PREFIX}*`);
      const alerts: TrendAlert[] = [];

      for (const key of keys) {
        const alert = await redis.get(key);
        if (alert) {
          const parsedAlert = JSON.parse(alert);
          if (!parsedAlert.resolved) {
            alerts.push(parsedAlert);
          }
        }
      }

      return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Aktif alertler alınamadı:', error);
      return [];
    }
  }

  /**
   * Alert'i çözüldü olarak işaretle
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      const key = `${this.ALERT_CACHE_PREFIX}${alertId}`;
      const alert = await redis.get(key);
      
      if (alert) {
        const parsedAlert = JSON.parse(alert);
        parsedAlert.resolved = true;
        await redis.setex(key, 86400, JSON.stringify(parsedAlert));
      }
    } catch (error) {
      console.error('Alert çözme hatası:', error);
    }
  }

  /**
   * Performance özeti al
   */
  async getPerformanceSummary(): Promise<{
    totalRoutes: number;
    averageScore: number;
    improvingTrends: number;
    degradingTrends: number;
    criticalIssues: number;
    activeAlerts: number;
  }> {
    try {
      const trends = await this.analyzeTrends();
      const alerts = await this.getActiveAlerts();

      const totalRoutes = trends.length;
      const averageScore = trends.length > 0 
        ? trends.reduce((sum, t) => sum + t.score, 0) / trends.length 
        : 0;
      
      const improvingTrends = trends.filter(t => t.trend === 'improving').length;
      const degradingTrends = trends.filter(t => t.trend === 'degrading').length;
      const criticalIssues = alerts.filter(a => a.severity === 'critical').length;

      return {
        totalRoutes,
        averageScore: Math.round(averageScore),
        improvingTrends,
        degradingTrends,
        criticalIssues,
        activeAlerts: alerts.length
      };
    } catch (error) {
      console.error('Performance özeti alınamadı:', error);
      return {
        totalRoutes: 0,
        averageScore: 0,
        improvingTrends: 0,
        degradingTrends: 0,
        criticalIssues: 0,
        activeAlerts: 0
      };
    }
  }
}

export const performanceTrendService = new PerformanceTrendService();
