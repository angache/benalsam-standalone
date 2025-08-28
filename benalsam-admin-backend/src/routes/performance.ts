import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';
import { redis } from '../config/redis'; // Local Redis kullanıyoruz, Redis Cloud değil

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

const router = express.Router();

// Calculate performance score based on Core Web Vitals
const calculatePerformanceScore = (metrics: any): number => {
  let score = 100;
  let metricsCount = 0;
  
  // LCP scoring (0-2500ms = good, 2500-4000ms = needs-improvement, >4000ms = poor)
  if (metrics.LCP?.value && metrics.LCP.value > 0) {
    metricsCount++;
    if (metrics.LCP.value > 4000) score -= 30;
    else if (metrics.LCP.value > 2500) score -= 15;
    else if (metrics.LCP.value > 2000) score -= 5;
  }
  
  // FCP scoring (0-1800ms = good, 1800-3000ms = needs-improvement, >3000ms = poor)
  if (metrics.FCP?.value && metrics.FCP.value > 0) {
    metricsCount++;
    if (metrics.FCP.value > 3000) score -= 25;
    else if (metrics.FCP.value > 1800) score -= 12;
    else if (metrics.FCP.value > 1000) score -= 5;
  }
  
  // CLS scoring (0-0.1 = good, 0.1-0.25 = needs-improvement, >0.25 = poor)
  if (metrics.CLS?.value && metrics.CLS.value > 0) {
    metricsCount++;
    if (metrics.CLS.value > 0.25) score -= 25;
    else if (metrics.CLS.value > 0.1) score -= 12;
    else if (metrics.CLS.value > 0.05) score -= 5;
  }
  
  // INP scoring (0-200ms = good, 200-500ms = needs-improvement, >500ms = poor)
  if (metrics.INP?.value && metrics.INP.value > 0) {
    metricsCount++;
    if (metrics.INP.value > 500) score -= 20;
    else if (metrics.INP.value > 200) score -= 10;
    else if (metrics.INP.value > 100) score -= 3;
  }
  
  // TTFB scoring (0-800ms = good, 800-1800ms = needs-improvement, >1800ms = poor)
  if (metrics.TTFB?.value && metrics.TTFB.value > 0) {
    metricsCount++;
    if (metrics.TTFB.value > 1800) score -= 15;
    else if (metrics.TTFB.value > 800) score -= 8;
    else if (metrics.TTFB.value > 400) score -= 3;
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
      console.log('🔍 Incoming metrics:', JSON.stringify(metrics, null, 2));
      
      // Calculate performance score
      const calculatedScore = calculatePerformanceScore(metrics);
      console.log('🔍 Calculated score:', calculatedScore);
      
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
      await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(analysis));

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
      await redis.setex(`perf:data:${route}`, 3600, JSON.stringify(trendData));
      
      // Save to history for trend analysis
      const historyKey = `perf:history:${route}:${Date.now()}`;
      await redis.setex(historyKey, 86400, JSON.stringify(trendData)); // 24 hours

      // Update daily summary
      const today = new Date().toISOString().split('T')[0];
      const summaryKey = `performance:summary:${userId}:${today}`;
      
      const existingSummary = await redis.get(summaryKey);
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

      await redis.setex(summaryKey, 30 * 24 * 60 * 60, JSON.stringify(summary));

      // Update route trends
      const routeKey = `performance:route:${userId}:${route}`;
      await redis.lpush(routeKey, JSON.stringify(analysis));
      await redis.ltrim(routeKey, 0, 99); // Keep last 100 analyses per route
      await redis.expire(routeKey, 30 * 24 * 60 * 60);

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
        const routeAnalyses = await redis.lrange(routeKey, offset as number, (offset as number) + (limit as number) - 1);
        analyses = routeAnalyses.map((analysis: string) => JSON.parse(analysis));
      } else {
        // Get all analyses for user
        const pattern = `performance:analysis:${userId}:*`;
        const keys = await redis.keys(pattern);
        
        // Sort by timestamp (newest first)
        const sortedKeys = keys.sort((a: string, b: string) => {
          const timestampA = parseInt(a.split(':').pop() || '0');
          const timestampB = parseInt(b.split(':').pop() || '0');
          return timestampB - timestampA;
        });

        const paginatedKeys = sortedKeys.slice(offset as number, (offset as number) + (limit as number));
        const analysisData = await Promise.all(
          paginatedKeys.map((key: string) => redis.get(key))
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
        const summary = await redis.get(summaryKey);
        
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
        const summary = await redis.get(summaryKey);
        
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
      const keys = await redis.keys(pattern);
      
      const criticalAnalyses: any[] = [];
      
      for (const key of keys.slice(0, 100)) { // Check last 100 analyses
        const analysis = await redis.get(key);
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
      const baselineKeys = await redis.keys(`performance:baseline:${userId}:*`);
      const baselines: any[] = [];
      
      for (const key of baselineKeys) {
        const baseline = await redis.get(key);
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
      const analysisKeys = await redis.keys(`performance:analysis:${userId}:*`);
      const recentAnalyses: any[] = [];
      
      for (const key of analysisKeys.slice(-10)) { // Last 10 analyses
        const analysis = await redis.get(key);
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
      const status = await redis.get(statusKey);
      
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
      const alertKeys = await redis.keys(`performance:alert:${userId}:*`);
      const alerts: any[] = [];
      
      for (const key of alertKeys) {
        const alert = await redis.get(key);
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
        await redis.set(statusKey, JSON.stringify(status));
      } else if (action === 'stop') {
        const status = {
          isActive: false,
          totalEndpoints: 8,
          monitoredEndpoints: 0,
          lastCheck: new Date().toISOString(),
          uptime: 0,
          alerts: 0
        };
        await redis.set(statusKey, JSON.stringify(status));
      } else if (action === 'clear-alerts') {
        const alertKeys = await redis.keys(`performance:alert:${userId}:*`);
        for (const key of alertKeys) {
          await redis.del(key);
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
      await redis.set(baselineKey, JSON.stringify(baseline));

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
      const baselineKeys = await redis.keys(`performance:baseline:${userId}:*`);
      for (const key of baselineKeys) {
        await redis.del(key);
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

export default router; 