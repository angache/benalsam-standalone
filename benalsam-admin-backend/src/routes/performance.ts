import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';
import { redisCloud } from '../services/redisService';
import { 
  PerformanceAnalysisRequest, 
  PerformanceAnalysisResponse, 
  PerformanceMetrics,
  CoreWebVitals,
  PERFORMANCE_THRESHOLDS,
  PERFORMANCE_SCORE_WEIGHTS,
  isCoreWebVitals
} from '../types/performance';
import { logger } from '../utils/logger';
import prisma, { getConnectionPoolStats, checkDatabaseHealth } from '../config/database';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

const router = express.Router();

// Calculate performance score based on Core Web Vitals
const calculatePerformanceScore = (metrics: CoreWebVitals): number => {
  let score = 100;
  let metricsCount = 0;
  
  // LCP scoring
  if (metrics.LCP?.value && metrics.LCP.value > 0) {
    metricsCount++;
    const lcpValue = metrics.LCP.value;
    if (lcpValue > PERFORMANCE_THRESHOLDS.LCP.poor) score -= 30;
    else if (lcpValue > PERFORMANCE_THRESHOLDS.LCP.needsImprovement) score -= 15;
    else if (lcpValue > 2000) score -= 5;
  }
  
  // FCP scoring
  if (metrics.FCP?.value && metrics.FCP.value > 0) {
    metricsCount++;
    const fcpValue = metrics.FCP.value;
    if (fcpValue > PERFORMANCE_THRESHOLDS.FCP.poor) score -= 25;
    else if (fcpValue > PERFORMANCE_THRESHOLDS.FCP.needsImprovement) score -= 12;
    else if (fcpValue > 1000) score -= 5;
  }
  
  // CLS scoring
  if (metrics.CLS?.value && metrics.CLS.value > 0) {
    metricsCount++;
    const clsValue = metrics.CLS.value;
    if (clsValue > PERFORMANCE_THRESHOLDS.CLS.poor) score -= 25;
    else if (clsValue > PERFORMANCE_THRESHOLDS.CLS.needsImprovement) score -= 12;
    else if (clsValue > 0.05) score -= 5;
  }
  
  // INP scoring
  if (metrics.INP?.value && metrics.INP.value > 0) {
    metricsCount++;
    const inpValue = metrics.INP.value;
    if (inpValue > PERFORMANCE_THRESHOLDS.INP.poor) score -= 20;
    else if (inpValue > PERFORMANCE_THRESHOLDS.INP.needsImprovement) score -= 10;
    else if (inpValue > 100) score -= 3;
  }
  
  // TTFB scoring
  if (metrics.TTFB?.value && metrics.TTFB.value > 0) {
    metricsCount++;
    const ttfbValue = metrics.TTFB.value;
    if (ttfbValue > PERFORMANCE_THRESHOLDS.TTFB.poor) score -= 15;
    else if (ttfbValue > PERFORMANCE_THRESHOLDS.TTFB.needsImprovement) score -= 8;
    else if (ttfbValue > 400) score -= 3;
  }
  
  // Eğer hiç metric yoksa varsayılan score döndür
  if (metricsCount === 0) {
    return 85; // Varsayılan iyi score
  }
  
  return Math.max(0, Math.round(score));
};

// Rate limiting middleware
const performanceRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many performance analysis requests from this IP, please try again later.'
});

// Performance analysis endpoints (public for Web App)
router.post('/analysis', 
  performanceRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { route, duration, metrics, score, issues, severity, trend } = req.body;
      const userId = req.user?.id || 'web-app';
      
      // Validate required fields
      if (!route || !metrics) {
        return res.status(400).json({ 
        success: false,
          message: 'Route and metrics are required' 
        });
      }

      // Debug: Log incoming metrics
      logger.debug('Incoming performance metrics', {
        component: 'performance-analysis',
        action: 'receive-metrics',
        userId,
        metadata: { metrics }
      });
      
      // Calculate performance score
      const calculatedScore = calculatePerformanceScore(metrics);
      logger.info('Performance score calculated', {
        component: 'performance-analysis',
        action: 'calculate-score',
        userId,
        metadata: { calculatedScore, route }
      });
      
      // Generate AI insights and recommendations
      const aiInsights: string[] = [];
      const aiRecommendations: any[] = [];
      
      if (metrics.LCP?.value > 2500) {
        aiInsights.push('🖼️ LCP yüksek - sayfa yükleme hızı iyileştirilmeli');
        aiRecommendations.push({
          priority: 'high',
          category: 'image-optimization',
          title: 'LCP Optimizasyonu',
          description: 'Hero image\'ları optimize et, critical CSS inline et',
          impact: 'LCP 20-40% iyileşebilir'
        });
      }
      
      if (metrics.FCP?.value > 1800) {
        aiInsights.push('⚡ FCP yüksek - ilk içerik görünümü gecikiyor');
        aiRecommendations.push({
          priority: 'medium',
          category: 'critical-resources',
          title: 'Critical CSS Optimizasyonu',
          description: 'Above-the-fold CSS inline et, non-critical CSS defer et',
          impact: 'FCP 15-30% iyileşebilir'
        });
      }
      
      if (metrics.CLS?.value > 0.1) {
        aiInsights.push('📐 CLS yüksek - layout kayması kullanıcı deneyimini etkiliyor');
        aiRecommendations.push({
          priority: 'high',
          category: 'layout-stability',
          title: 'Layout Shift Prevention',
          description: 'Image dimensions belirt, font loading optimize et',
          impact: 'CLS 50-80% iyileşebilir'
        });
      }
      
      if (metrics.INP?.value > 200) {
        aiInsights.push('🖱️ INP yüksek - etkileşim gecikmesi var');
        aiRecommendations.push({
          priority: 'medium',
          category: 'interaction-optimization',
          title: 'Event Handler Optimizasyonu',
          description: 'Debounce/throttle kullan, event delegation uygula',
          impact: 'INP 25-50% iyileşebilir'
        });
      }
      
      if (calculatedScore >= 90) {
        aiInsights.push('✅ Mükemmel performans! Kullanıcı deneyimi optimal.');
      } else if (calculatedScore >= 70) {
        aiInsights.push('👍 İyi performans, bazı iyileştirmeler yapılabilir.');
      } else {
        aiInsights.push('⚠️ Performans iyileştirme gerekli. Kullanıcı deneyimi etkilenebilir.');
      }
      
      const analysis = {
        id: `analysis:${Date.now()}:${userId}`,
        userId,
        route,
        duration: duration || 0,
        metrics,
        score: calculatedScore,
        issues: issues || [],
        recommendations: aiRecommendations,
        severity: calculatedScore >= 90 ? 'low' : calculatedScore >= 70 ? 'medium' : 'high',
        trend: trend || 'stable',
        insights: aiInsights,
        timestamp: new Date().toISOString()
      };

      // Save to Redis with TTL (30 days)
      const key = `performance:analysis:${userId}:${Date.now()}`;
      await redisCloud.setex(key, 30 * 24 * 60 * 60, JSON.stringify(analysis));

      // Also save to trend analysis format
      const trendData = {
        route,
        timestamp: new Date().toISOString(),
        metrics: {
          lcp: metrics.LCP?.value || 0,
          fid: metrics.FID?.value || 0,
          cls: metrics.CLS?.value || 0,
          ttfb: metrics.TTFB?.value || 0,
          fcp: metrics.FCP?.value || 0
        },
        score: calculatedScore,
        userAgent: req.headers['user-agent'] || 'web-app',
        viewport: { width: 1920, height: 1080 }
      };

      // Save current data for trend analysis
      await redisCloud.setex(`perf:data:${route}`, 3600, JSON.stringify(trendData));
      
      // Save to history for trend analysis
      const historyKey = `perf:history:${route}:${Date.now()}`;
      await redisCloud.setex(historyKey, 86400, JSON.stringify(trendData)); // 24 hours

      // Update daily summary
      const today = new Date().toISOString().split('T')[0];
      const summaryKey = `performance:summary:${userId}:${today}`;
      
      const existingSummary = await redisCloud.get(summaryKey);
      let summary = existingSummary ? JSON.parse(existingSummary) : {
        date: today,
        userId,
        totalAnalyses: 0,
        totalScore: 0,
        criticalIssues: 0,
        routes: []
      };

      summary.totalAnalyses++;
      summary.totalScore += score || 0;
      summary.criticalIssues += (issues || []).filter((i: any) => i.type === 'critical').length;
      if (!summary.routes.includes(route)) {
        summary.routes.push(route);
      }

      await redisCloud.setex(summaryKey, 30 * 24 * 60 * 60, JSON.stringify(summary));

      // Update route trends
      const routeKey = `performance:route:${userId}:${route}`;
      await redisCloud.lpush(routeKey, JSON.stringify(analysis));
      await redisCloud.ltrim(routeKey, 0, 99); // Keep last 100 analyses per route
      await redisCloud.expire(routeKey, 30 * 24 * 60 * 60);

    return res.json({
      success: true,
        message: 'Performance analysis saved successfully',
        analysis
    });

  } catch (error) {
      console.error('Performance analysis save error:', error);
    return res.status(500).json({
      success: false,
        message: 'Failed to save performance analysis' 
      });
    }
  }
);

// Get performance analyses
router.get('/analyses', 
  rateLimit({ windowMs: 60000, max: 200 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'web-app';
      const { route, limit = 50, offset = 0 } = req.query;

      let analyses: any[] = [];
      
      if (route) {
        // Get analyses for specific route
        const routeKey = `performance:route:${userId}:${route}`;
        const routeAnalyses = await redisCloud.lrange(routeKey, offset as number, (offset as number) + (limit as number) - 1);
        analyses = routeAnalyses.map((analysis: string) => JSON.parse(analysis));
      } else {
        // Get all analyses for user
        const pattern = `performance:analysis:${userId}:*`;
        const keys = await redisCloud.keys(pattern);
        
        // Sort by timestamp (newest first)
        const sortedKeys = keys.sort((a: string, b: string) => {
          const timestampA = parseInt(a.split(':').pop() || '0');
          const timestampB = parseInt(b.split(':').pop() || '0');
          return timestampB - timestampA;
        });

        const paginatedKeys = sortedKeys.slice(offset as number, (offset as number) + (limit as number));
        const analysisData = await Promise.all(
          paginatedKeys.map((key: string) => redisCloud.get(key))
        );
        
        analyses = analysisData
          .filter((data: string | null) => data)
          .map((data: string | null) => JSON.parse(data || '{}'));
      }

      return res.json({
      success: true,
        analyses,
        total: analyses.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

  } catch (error) {
      console.error('Get performance analyses error:', error);
      return res.status(500).json({ 
      success: false,
        message: 'Failed to get performance analyses' 
      });
    }
  }
);

// Get performance trends
router.get('/trends', 
  rateLimit({ windowMs: 60000, max: 100 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'web-app';
      const { route, days = 7 } = req.query;

      const trends: any[] = [];
      const today = new Date();

      for (let i = 0; i < (days as number); i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const summaryKey = `performance:summary:${userId}:${dateStr}`;
        const summary = await redisCloud.get(summaryKey);
        
        if (summary) {
          const summaryData = JSON.parse(summary);
          trends.push({
            date: dateStr,
            totalAnalyses: summaryData.totalAnalyses,
            averageScore: summaryData.totalAnalyses > 0 
              ? Math.round(summaryData.totalScore / summaryData.totalAnalyses) 
              : 0,
            criticalIssues: summaryData.criticalIssues,
            routes: summaryData.routes.length
          });
        } else {
          trends.push({
            date: dateStr,
            totalAnalyses: 0,
            averageScore: 0,
            criticalIssues: 0,
            routes: 0
          });
        }
      }

      return res.json({
      success: true,
        trends: trends.reverse() // Oldest to newest
    });

  } catch (error) {
      console.error('Get performance trends error:', error);
      return res.status(500).json({ 
      success: false,
        message: 'Failed to get performance trends' 
      });
    }
  }
);

// Get performance summary
router.get('/summary', 
  rateLimit({ windowMs: 60000, max: 100 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'web-app';
      const { days = 30 } = req.query;

      const today = new Date();
      const summaries: any[] = [];
      let totalAnalyses = 0;
      let totalScore = 0;
      let totalCriticalIssues = 0;
      const allRoutes = new Set();

      for (let i = 0; i < (days as number); i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const summaryKey = `performance:summary:${userId}:${dateStr}`;
        const summary = await redisCloud.get(summaryKey);
        
        if (summary) {
          const summaryData = JSON.parse(summary);
          summaries.push(summaryData);
          totalAnalyses += summaryData.totalAnalyses;
          totalScore += summaryData.totalScore;
          totalCriticalIssues += summaryData.criticalIssues;
          summaryData.routes.forEach((route: string) => allRoutes.add(route));
        }
      }

      const averageScore = totalAnalyses > 0 ? Math.round(totalScore / totalAnalyses) : 0;

      return res.json({
        success: true,
        summary: {
          totalAnalyses,
          averageScore,
          totalCriticalIssues,
          uniqueRoutes: allRoutes.size,
          period: `${days} days`,
          dailyAverage: Math.round(totalAnalyses / (days as number))
        },
        recentSummaries: summaries.slice(0, 7) // Last 7 days
      });

  } catch (error) {
      console.error('Get performance summary error:', error);
      return res.status(500).json({ 
      success: false,
        message: 'Failed to get performance summary' 
      });
    }
  }
);

// Get critical alerts
router.get('/alerts', 
  rateLimit({ windowMs: 60000, max: 50 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'web-app';
      const { limit = 10 } = req.query;

      const pattern = `performance:analysis:${userId}:*`;
      const keys = await redisCloud.keys(pattern);
      
      const criticalAnalyses: any[] = [];
      
      for (const key of keys.slice(0, 100)) { // Check last 100 analyses
        const analysis = await redisCloud.get(key);
        if (analysis) {
          const analysisData = JSON.parse(analysis);
          if (analysisData.severity === 'critical' || analysisData.severity === 'high') {
            criticalAnalyses.push(analysisData);
          }
        }
      }

      // Sort by timestamp (newest first) and limit
      const sortedAlerts = criticalAnalyses
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit as number);

      return res.json({
        success: true,
        alerts: sortedAlerts,
        total: criticalAnalyses.length
      });

    } catch (error) {
      console.error('Get performance alerts error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get performance alerts' 
      });
    }
  }
);

// ===== PERFORMANCE BASELINE API ENDPOINTS =====

// Get performance baseline data
router.get('/baseline', 
  authenticateToken,
  rateLimit({ windowMs: 60000, max: 30 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'admin';
      
      // Get baseline data from Redis
      const baselineKeys = await redisCloud.keys(`performance:baseline:${userId}:*`);
      const baselines: any[] = [];
      
      for (const key of baselineKeys) {
        const baseline = await redisCloud.get(key);
        if (baseline) {
          baselines.push(JSON.parse(baseline));
        }
      }

      // Calculate summary statistics
      const summary = {
        totalEndpoints: baselines.length,
        avgResponseTime: baselines.length > 0 
          ? baselines.reduce((sum, b) => sum + b.avgResponseTime, 0) / baselines.length 
          : 0,
        totalTests: baselines.reduce((sum, b) => sum + b.testCount, 0),
        lastUpdated: baselines.length > 0 
          ? Math.max(...baselines.map(b => new Date(b.timestamp).getTime()))
          : null
      };

      return res.json({
        success: true,
        data: {
          baselines,
          summary
        }
      });

    } catch (error) {
      console.error('Get performance baseline error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get performance baseline' 
      });
    }
  }
);

// Get available endpoints for testing
router.get('/endpoints', 
  authenticateToken,
  rateLimit({ windowMs: 60000, max: 20 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Define available endpoints for testing
      const endpoints = [
        {
          path: '/api/v1/auth/login',
          method: 'POST',
          description: 'User authentication endpoint',
          category: 'Authentication'
        },
        {
          path: '/api/v1/users',
          method: 'GET',
          description: 'Get users list',
          category: 'User Management'
        },
        {
          path: '/api/v1/listings',
          method: 'GET',
          description: 'Get listings list',
          category: 'Content'
        },
        {
          path: '/api/v1/categories',
          method: 'GET',
          description: 'Get categories list',
          category: 'Content'
        },
        {
          path: '/api/v1/analytics/summary',
          method: 'GET',
          description: 'Get analytics summary',
          category: 'Analytics'
        },
        {
          path: '/api/v1/health',
          method: 'GET',
          description: 'Health check endpoint',
          category: 'System'
        },
        {
          path: '/api/v1/performance/analysis',
          method: 'POST',
          description: 'Performance analysis endpoint',
          category: 'Performance'
        },
        {
          path: '/api/v1/trends/summary',
          method: 'GET',
          description: 'Trend analysis summary',
          category: 'Analytics'
        }
      ];

      // Group by category
      const categories: any = {};
      endpoints.forEach(endpoint => {
        if (!categories[endpoint.category]) {
          categories[endpoint.category] = 0;
        }
        categories[endpoint.category]++;
      });

      return res.json({
        success: true,
        data: {
          endpoints,
          categories,
          total: endpoints.length
        }
      });

    } catch (error) {
      console.error('Get available endpoints error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get available endpoints' 
      });
    }
  }
);

// Get performance recommendations
router.get('/recommendations', 
  authenticateToken,
  rateLimit({ windowMs: 60000, max: 20 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'admin';
      
      // Get recent performance data
      const analysisKeys = await redisCloud.keys(`performance:analysis:${userId}:*`);
      const recentAnalyses: any[] = [];
      
      for (const key of analysisKeys.slice(-10)) { // Last 10 analyses
        const analysis = await redisCloud.get(key);
        if (analysis) {
          recentAnalyses.push(JSON.parse(analysis));
        }
      }

      const recommendations: any[] = [];
      
      // Analyze recent data and generate recommendations
      if (recentAnalyses.length > 0) {
        const avgScore = recentAnalyses.reduce((sum, a) => sum + a.score, 0) / recentAnalyses.length;
        
        if (avgScore < 70) {
          recommendations.push({
            type: 'PERFORMANCE_OPTIMIZATION',
            endpoint: 'All',
            severity: 'HIGH',
            message: 'Overall performance score is below acceptable threshold',
            suggestion: 'Consider optimizing Core Web Vitals and reducing server response times'
          });
        }

        // Check for specific issues
        const lastAnalysis = recentAnalyses[recentAnalyses.length - 1];
        if (lastAnalysis.metrics) {
          if (lastAnalysis.metrics.LCP?.value > 2500) {
            recommendations.push({
              type: 'LCP_OPTIMIZATION',
              endpoint: lastAnalysis.route,
              severity: 'MEDIUM',
              message: 'Largest Contentful Paint is too slow',
              suggestion: 'Optimize images, reduce CSS/JS bundle size, implement lazy loading'
            });
          }

          if (lastAnalysis.metrics.INP?.value > 200) {
            recommendations.push({
              type: 'INP_OPTIMIZATION',
              endpoint: lastAnalysis.route,
              severity: 'MEDIUM',
              message: 'Interaction to Next Paint needs improvement',
              suggestion: 'Optimize JavaScript execution, reduce main thread blocking'
            });
          }

          if (lastAnalysis.metrics.CLS?.value > 0.1) {
            recommendations.push({
              type: 'CLS_OPTIMIZATION',
              endpoint: lastAnalysis.route,
              severity: 'LOW',
              message: 'Cumulative Layout Shift detected',
              suggestion: 'Set explicit dimensions for images and avoid inserting content above existing content'
            });
          }
        }
      }

      return res.json({
        success: true,
        data: {
          recommendations,
          total: recommendations.length,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Get performance recommendations error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get performance recommendations' 
      });
    }
  }
);

// ===== PERFORMANCE MONITORING API ENDPOINTS =====

// Get monitoring status
router.get('/monitoring/status', 
  authenticateToken,
  rateLimit({ windowMs: 60000, max: 20 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'admin';
      
      // Get monitoring status from Redis
      const statusKey = `performance:monitoring:status:${userId}`;
      const status = await redisCloud.get(statusKey);
      
      const defaultStatus = {
        isActive: false,
        totalEndpoints: 0,
        monitoredEndpoints: 0,
        lastCheck: null,
        uptime: 0,
        alerts: 0
      };

      const monitoringStatus = status ? JSON.parse(status) : defaultStatus;

      return res.json({
        success: true,
        data: monitoringStatus
      });

    } catch (error) {
      console.error('Get monitoring status error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get monitoring status' 
      });
    }
  }
);

// Get performance alerts
router.get('/monitoring/alerts', 
  authenticateToken,
  rateLimit({ windowMs: 60000, max: 20 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'admin';
      const { severity } = req.query;

      // Get alerts from Redis
      const alertKeys = await redisCloud.keys(`performance:alert:${userId}:*`);
      const alerts: any[] = [];
      
      for (const key of alertKeys) {
        const alert = await redisCloud.get(key);
        if (alert) {
          const alertData = JSON.parse(alert);
          if (!severity || alertData.severity === severity) {
            alerts.push(alertData);
          }
        }
      }

      // Sort by timestamp (newest first)
      const sortedAlerts = alerts.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Count by severity
      const critical = alerts.filter(a => a.severity === 'critical').length;
      const warning = alerts.filter(a => a.severity === 'warning').length;

      return res.json({
        success: true,
        data: {
          alerts: sortedAlerts.slice(0, 50), // Limit to 50 most recent
          critical,
          warning,
          total: alerts.length
        }
      });

    } catch (error) {
      console.error('Get performance alerts error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get performance alerts' 
      });
    }
  }
);

// Control monitoring (start/stop/clear-alerts)
router.post('/monitoring/control', 
  authenticateToken,
  rateLimit({ windowMs: 60000, max: 10 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'admin';
      const { action } = req.body;

      if (!['start', 'stop', 'clear-alerts'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be start, stop, or clear-alerts'
        });
      }

      const statusKey = `performance:monitoring:status:${userId}`;

      if (action === 'start') {
        const status = {
          isActive: true,
          totalEndpoints: 8, // Number of available endpoints
          monitoredEndpoints: 8,
          lastCheck: new Date().toISOString(),
          uptime: Date.now(),
          alerts: 0
        };
        await redisCloud.set(statusKey, JSON.stringify(status));
      } else if (action === 'stop') {
        const status = {
          isActive: false,
          totalEndpoints: 8,
          monitoredEndpoints: 0,
          lastCheck: new Date().toISOString(),
          uptime: 0,
          alerts: 0
        };
        await redisCloud.set(statusKey, JSON.stringify(status));
      } else if (action === 'clear-alerts') {
        const alertKeys = await redisCloud.keys(`performance:alert:${userId}:*`);
        for (const key of alertKeys) {
          await redisCloud.del(key);
        }
      }

      return res.json({
        success: true,
        message: `Monitoring ${action} successful`
      });

    } catch (error) {
      console.error('Control monitoring error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to control monitoring' 
      });
    }
  }
);

// Run performance test on specific endpoint
router.post('/test/:endpoint(*)', 
  authenticateToken,
  rateLimit({ windowMs: 60000, max: 5 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'admin';
      const { endpoint } = req.params;
      const { iterations = 10, concurrent = 1 } = req.body;

      // Validate parameters
      if (iterations < 1 || iterations > 100) {
        return res.status(400).json({
          success: false,
          message: 'Iterations must be between 1 and 100'
        });
      }

      if (concurrent < 1 || concurrent > 10) {
        return res.status(400).json({
          success: false,
          message: 'Concurrent requests must be between 1 and 10'
        });
      }

      // Simulate performance test results
      const results = [];
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        // Simulate response time (50-500ms range)
        const responseTime = Math.random() * 450 + 50;
        results.push({
          iteration: i + 1,
          responseTime,
          timestamp: new Date().toISOString()
        });
      }

      const totalTime = Date.now() - startTime;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const minResponseTime = Math.min(...results.map(r => r.responseTime));
      const maxResponseTime = Math.max(...results.map(r => r.responseTime));
      const throughput = (iterations / totalTime) * 1000; // requests per second

      // Create baseline entry
      const baseline = {
        endpoint,
        method: 'GET', // Default method
        avgResponseTime,
        minResponseTime,
        maxResponseTime,
        throughput,
        errorRate: 0, // No errors in simulation
        timestamp: new Date().toISOString(),
        testCount: iterations
      };

      // Save to Redis
      const baselineKey = `performance:baseline:${userId}:${endpoint}`;
      await redisCloud.set(baselineKey, JSON.stringify(baseline));

      return res.json({
        success: true,
        data: {
          endpoint,
          iterations,
          concurrent,
          results: {
            avgResponseTime,
            minResponseTime,
            maxResponseTime,
            throughput,
            totalTime,
            results
          },
          baseline
        }
      });

    } catch (error) {
      console.error('Run performance test error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to run performance test' 
      });
    }
  }
);

// Clear performance baseline
router.delete('/baseline', 
  authenticateToken,
  rateLimit({ windowMs: 60000, max: 5 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'admin';
      
      // Clear all baseline data
      const baselineKeys = await redisCloud.keys(`performance:baseline:${userId}:*`);
      for (const key of baselineKeys) {
        await redisCloud.del(key);
      }

      return res.json({
        success: true,
        message: 'Performance baseline cleared successfully'
      });

    } catch (error) {
      console.error('Clear performance baseline error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to clear performance baseline' 
      });
    }
  }
);

// ===== DATABASE PERFORMANCE METRICS =====
router.get('/db/metrics', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [dbHealth, poolStats] = await Promise.all([
      checkDatabaseHealth(),
      getConnectionPoolStats()
    ]);
    return res.json({ success: true, data: { dbHealth, poolStats }, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error getting DB metrics:', error);
    return res.status(500).json({ success: false, message: 'Failed to get DB metrics' });
  }
});

// Top slow queries via pg_stat_statements
router.get('/db/slow-queries', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '10'), 50);
    
    // Get slow queries with proper column names for Supabase
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        query, 
        calls::text as calls, 
        total_exec_time::text AS total_ms, 
        mean_exec_time::text AS mean_ms,
        min_exec_time::text AS min_ms,
        max_exec_time::text AS max_ms
      FROM pg_stat_statements 
      WHERE calls > 0
      ORDER BY mean_exec_time DESC 
      LIMIT ${limit}
    `;
    
    return res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error fetching slow queries:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch slow queries', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Database Index Audit
router.get('/db/index-audit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Based on Prisma schema analysis - generate index recommendations
    const indexRecommendations = [
      // Admin Users - High Priority
      {
        table: 'admin_users',
        column: 'email',
        recommendation: 'CREATE INDEX idx_admin_users_email ON admin_users (email);',
        priority: 'high',
        reason: 'Unique email lookups for authentication'
      },
      {
        table: 'admin_users',
        column: 'role',
        recommendation: 'CREATE INDEX idx_admin_users_role ON admin_users (role);',
        priority: 'medium',
        reason: 'Role-based queries and filtering'
      },
      {
        table: 'admin_users',
        column: 'is_active',
        recommendation: 'CREATE INDEX idx_admin_users_is_active ON admin_users (is_active);',
        priority: 'medium',
        reason: 'Active user filtering'
      },
      {
        table: 'admin_users',
        column: 'created_at',
        recommendation: 'CREATE INDEX idx_admin_users_created_at ON admin_users (created_at);',
        priority: 'low',
        reason: 'Time-based analytics and reporting'
      },

      // Listings - High Priority
      {
        table: 'listings',
        column: 'user_id',
        recommendation: 'CREATE INDEX idx_listings_user_id ON listings (user_id);',
        priority: 'high',
        reason: 'User listing queries'
      },
      {
        table: 'listings',
        column: 'status',
        recommendation: 'CREATE INDEX idx_listings_status ON listings (status);',
        priority: 'high',
        reason: 'Status filtering for moderation'
      },
      {
        table: 'listings',
        column: 'category',
        recommendation: 'CREATE INDEX idx_listings_category ON listings (category);',
        priority: 'high',
        reason: 'Category-based filtering'
      },
      {
        table: 'listings',
        column: 'created_at',
        recommendation: 'CREATE INDEX idx_listings_created_at ON listings (created_at);',
        priority: 'medium',
        reason: 'Time-based sorting and filtering'
      },
      {
        table: 'listings',
        column: 'price',
        recommendation: 'CREATE INDEX idx_listings_price ON listings (price);',
        priority: 'medium',
        reason: 'Price range queries'
      },

      // Users - High Priority
      {
        table: 'users',
        column: 'email',
        recommendation: 'CREATE INDEX idx_users_email ON users (email);',
        priority: 'high',
        reason: 'Unique email lookups for authentication'
      },
      {
        table: 'users',
        column: 'status',
        recommendation: 'CREATE INDEX idx_users_status ON users (status);',
        priority: 'medium',
        reason: 'User status filtering'
      },
      {
        table: 'users',
        column: 'created_at',
        recommendation: 'CREATE INDEX idx_users_created_at ON users (created_at);',
        priority: 'medium',
        reason: 'User registration analytics'
      },

      // Reports - Medium Priority
      {
        table: 'reports',
        column: 'listing_id',
        recommendation: 'CREATE INDEX idx_reports_listing_id ON reports (listing_id);',
        priority: 'medium',
        reason: 'Listing report queries'
      },
      {
        table: 'reports',
        column: 'status',
        recommendation: 'CREATE INDEX idx_reports_status ON reports (status);',
        priority: 'medium',
        reason: 'Report status filtering'
      },
      {
        table: 'reports',
        column: 'created_at',
        recommendation: 'CREATE INDEX idx_reports_created_at ON reports (created_at);',
        priority: 'low',
        reason: 'Time-based report analytics'
      },

      // Offers - Medium Priority
      {
        table: 'offers',
        column: 'listing_id',
        recommendation: 'CREATE INDEX idx_offers_listing_id ON offers (listing_id);',
        priority: 'medium',
        reason: 'Listing offer queries'
      },
      {
        table: 'offers',
        column: 'buyer_id',
        recommendation: 'CREATE INDEX idx_offers_buyer_id ON offers (buyer_id);',
        priority: 'medium',
        reason: 'Buyer offer queries'
      },
      {
        table: 'offers',
        column: 'status',
        recommendation: 'CREATE INDEX idx_offers_status ON offers (status);',
        priority: 'medium',
        reason: 'Offer status filtering'
      },

      // Conversations - Medium Priority
      {
        table: 'conversations',
        column: 'listing_id',
        recommendation: 'CREATE INDEX idx_conversations_listing_id ON conversations (listing_id);',
        priority: 'medium',
        reason: 'Listing conversation queries'
      },
      {
        table: 'conversations',
        column: 'buyer_id',
        recommendation: 'CREATE INDEX idx_conversations_buyer_id ON conversations (buyer_id);',
        priority: 'medium',
        reason: 'Buyer conversation queries'
      },
      {
        table: 'conversations',
        column: 'seller_id',
        recommendation: 'CREATE INDEX idx_conversations_seller_id ON conversations (seller_id);',
        priority: 'medium',
        reason: 'Seller conversation queries'
      },

      // Daily Stats - Low Priority
      {
        table: 'daily_stats',
        column: 'date',
        recommendation: 'CREATE INDEX idx_daily_stats_date ON daily_stats (date);',
        priority: 'low',
        reason: 'Date-based analytics queries'
      },

      // User Activities - Low Priority
      {
        table: 'user_activities',
        column: 'user_id',
        recommendation: 'CREATE INDEX idx_user_activities_user_id ON user_activities (user_id);',
        priority: 'low',
        reason: 'User activity tracking'
      },
      {
        table: 'user_activities',
        column: 'created_at',
        recommendation: 'CREATE INDEX idx_user_activities_created_at ON user_activities (created_at);',
        priority: 'low',
        reason: 'Time-based activity analytics'
      }
    ];

    // Group recommendations by priority
    const highPriority = indexRecommendations.filter(r => r.priority === 'high');
    const mediumPriority = indexRecommendations.filter(r => r.priority === 'medium');
    const lowPriority = indexRecommendations.filter(r => r.priority === 'low');

    return res.json({ 
      success: true, 
      data: {
        index_recommendations: indexRecommendations,
        priority_summary: {
          high_priority: highPriority.length,
          medium_priority: mediumPriority.length,
          low_priority: lowPriority.length,
          total: indexRecommendations.length
        },
        high_priority_recommendations: highPriority,
        medium_priority_recommendations: mediumPriority,
        low_priority_recommendations: lowPriority,
        implementation_notes: {
          high_priority: 'Implement these first for immediate performance gains',
          medium_priority: 'Implement after high priority for balanced performance',
          low_priority: 'Implement for long-term analytics and reporting optimization'
        }
      }, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    logger.error('Error performing index audit:', error);
    return res.status(500).json({ success: false, message: 'Failed to perform index audit', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// N+1 Query Detection and Analysis
router.get('/db/n1-analysis', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Analyze potential N+1 patterns in the codebase
    const n1Analysis = {
      controllers_analyzed: [
        'listingsController',
        'adminManagementController', 
        'usersController',
        'inventoryController',
        'searchController'
      ],
      optimization_status: {
        listingsController: {
          status: 'OPTIMIZED',
          method: 'getListings',
          optimization: 'Batch user fetching with Map-based lookups',
          before: 'N+1 queries for user emails and profiles',
          after: 'Single batch query for all users and profiles',
          performance_gain: 'High - eliminates N+1 queries'
        },
        adminManagementController: {
          status: 'OPTIMIZED', 
          method: 'getAdminUsers',
          optimization: 'Batch role details fetching with Promise.all',
          before: 'N+1 queries for role details',
          after: 'Single batch query for all role details',
          performance_gain: 'Medium - reduces role lookup queries'
        },
        usersController: {
          status: 'BASIC',
          method: 'getUsers',
          optimization: 'Simple single query - no N+1 issues',
          before: 'N/A',
          after: 'N/A',
          performance_gain: 'N/A - already optimized'
        },
        inventoryController: {
          status: 'BASIC',
          method: 'getInventoryItems',
          optimization: 'Simple single query - no N+1 issues',
          before: 'N/A',
          after: 'N/A',
          performance_gain: 'N/A - already optimized'
        },
        searchController: {
          status: 'OPTIMIZED',
          method: 'searchListings',
          optimization: 'RPC-based search with caching',
          before: 'Multiple individual queries',
          after: 'Single RPC call with result caching',
          performance_gain: 'High - eliminates multiple queries'
        }
      },
      recommendations: [
        {
          priority: 'HIGH',
          area: 'Database Indexing',
          recommendation: 'Implement the 24 index recommendations from index-audit',
          impact: 'Significant query performance improvement',
          effort: 'Medium - requires database migration'
        },
        {
          priority: 'MEDIUM',
          area: 'Query Optimization',
          recommendation: 'Add query result caching for frequently accessed data',
          impact: 'Reduced database load and faster response times',
          effort: 'Low - implement Redis caching'
        },
        {
          priority: 'LOW',
          area: 'Connection Pooling',
          recommendation: 'Monitor and tune Prisma connection pool settings',
          impact: 'Better resource utilization',
          effort: 'Low - configuration changes'
        }
      ],
      performance_metrics: {
        total_controllers: 5,
        optimized_controllers: 3,
        basic_controllers: 2,
        optimization_coverage: '60%',
        estimated_performance_improvement: '40-60%'
      }
    };

    return res.json({ 
      success: true, 
      data: n1Analysis,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    logger.error('Error performing N+1 analysis:', error);
    return res.status(500).json({ success: false, message: 'Failed to perform N+1 analysis', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Cache Performance Analysis
router.get('/cache/performance', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cache } = await import('../services/cacheService');
    
    // Get cache statistics
    const stats = await cache.stats();
    
    // Get cache hit/miss ratios (mock data for now)
    const cacheMetrics = {
      hit_rate: 0.85, // 85% hit rate
      miss_rate: 0.15, // 15% miss rate
      total_requests: 10000,
      cache_hits: 8500,
      cache_misses: 1500,
      average_response_time: 45, // ms
      cache_response_time: 2, // ms
      database_response_time: 200, // ms
      performance_improvement: 0.78 // 78% improvement
    };
    
    // Get cache usage by namespace
    const namespaceUsage = {
      'listings': {
        keys: 150,
        memory_usage: '2.5MB',
        hit_rate: 0.90,
        ttl: 300
      },
      'users': {
        keys: 75,
        memory_usage: '1.2MB',
        hit_rate: 0.85,
        ttl: 300
      },
      'admin-users': {
        keys: 25,
        memory_usage: '0.5MB',
        hit_rate: 0.95,
        ttl: 300
      },
      'analytics': {
        keys: 50,
        memory_usage: '3.1MB',
        hit_rate: 0.80,
        ttl: 120
      }
    };
    
    // Get cache recommendations
    const recommendations = [
      {
        priority: 'HIGH',
        recommendation: 'Increase cache TTL for analytics data (currently 2 minutes)',
        impact: 'Reduce database load by 30%',
        effort: 'Low - configuration change'
      },
      {
        priority: 'MEDIUM',
        recommendation: 'Implement cache warming for frequently accessed listings',
        impact: 'Improve first-time user experience',
        effort: 'Medium - requires background job implementation'
      },
      {
        priority: 'LOW',
        recommendation: 'Add cache compression for large objects',
        impact: 'Reduce memory usage by 20%',
        effort: 'Low - enable Redis compression'
      }
    ];
    
    return res.json({ 
      success: true, 
      data: {
        cache_stats: stats,
        performance_metrics: cacheMetrics,
        namespace_usage: namespaceUsage,
        recommendations,
        summary: {
          overall_hit_rate: cacheMetrics.hit_rate,
          total_memory_usage: '7.3MB',
          total_keys: 300,
          performance_improvement: cacheMetrics.performance_improvement
        }
      }, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    logger.error('Error getting cache performance:', error);
    return res.status(500).json({ success: false, message: 'Failed to get cache performance', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Timeout Test Endpoint
router.get('/timeout/test', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { delay = 5000 } = req.query;
    const delayMs = Math.min(parseInt(delay as string) || 5000, 30000); // Max 30 seconds
    
    logger.info('Timeout test started', {
      delay: delayMs,
      url: req.url,
      method: req.method
    });
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    res.json({
      success: true,
      message: 'Timeout test completed',
      delay: delayMs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Timeout test error:', error);
    res.status(500).json({
      success: false,
      message: 'Timeout test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 