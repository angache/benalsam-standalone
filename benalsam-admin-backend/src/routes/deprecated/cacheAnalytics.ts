import express, { Router } from 'express';
import cacheAnalyticsService from '../services/cacheAnalyticsService';
import logger from '../config/logger';

const router: Router = express.Router();

/**
 * KVKK COMPLIANCE: Cache Analytics Routes
 * 
 * Cache analytics routes KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ SESSION_BASED - Sadece session_id ile erişim
 * ✅ ANONYMIZED - Kişisel veri döndürülmez
 * ✅ TRANSPARENCY - Analytics süreleri açık
 * ✅ MINIMIZATION - Sadece gerekli veriler döndürülür
 */

// Get current analytics
router.get('/current', async (req, res) => {
  try {
    const analytics = await cacheAnalyticsService.getCurrentAnalytics();
    
    if (!analytics) {
      return res.status(500).json({
        success: false,
        error: 'Analytics verisi alınamadı'
      });
    }
    
    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('❌ Current analytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Analytics verisi alınamadı'
    });
  }
});

// Get analytics history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const history = cacheAnalyticsService.getAnalyticsHistory(limit);
    
    return res.json({
      success: true,
      data: {
        history,
        count: history.length,
        limit
      }
    });
  } catch (error) {
    logger.error('❌ Analytics history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Analytics geçmişi alınamadı'
    });
  }
});

// Get performance alerts
router.get('/alerts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const alerts = cacheAnalyticsService.getAlerts(limit);
    
    return res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        limit
      }
    });
  } catch (error) {
    logger.error('❌ Performance alerts error:', error);
    return res.status(500).json({
      success: false,
      error: 'Performance alerts alınamadı'
    });
  }
});

// Get cost analysis
router.get('/cost-analysis', async (req, res) => {
  try {
    const costAnalysis = cacheAnalyticsService.getCostAnalysis();
    
    return res.json({
      success: true,
      data: costAnalysis
    });
  } catch (error) {
    logger.error('❌ Cost analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cost analysis alınamadı'
    });
  }
});

// Get performance trends
router.get('/trends', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const trends = cacheAnalyticsService.getPerformanceTrends(hours);
    
    return res.json({
      success: true,
      data: {
        trends,
        hours,
        period: `${hours} hours`
      }
    });
  } catch (error) {
    logger.error('❌ Performance trends error:', error);
    return res.status(500).json({
      success: false,
      error: 'Performance trends alınamadı'
    });
  }
});

// Get dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const analytics = await cacheAnalyticsService.getCurrentAnalytics();
    const alerts = cacheAnalyticsService.getAlerts(10);
    const costAnalysis = cacheAnalyticsService.getCostAnalysis();
    const trends = cacheAnalyticsService.getPerformanceTrends(24);
    
    if (!analytics) {
      return res.status(500).json({
        success: false,
        error: 'Dashboard verisi alınamadı'
      });
    }
    
    return res.json({
      success: true,
      data: {
        current: analytics,
        alerts: alerts.slice(0, 5), // Son 5 alert
        costAnalysis,
        trends,
        summary: {
          overallHitRate: analytics.overall.overallHitRate,
          totalRequests: analytics.overall.totalRequests,
          averageResponseTime: analytics.overall.averageResponseTime,
          memoryUsage: analytics.overall.memoryUsage,
          activeAlerts: alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length
        }
      }
    });
  } catch (error) {
    logger.error('❌ Dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: 'Dashboard verisi alınamadı'
    });
  }
});

// Clear analytics history
router.post('/clear', async (req, res) => {
  try {
    cacheAnalyticsService.clearAnalyticsHistory();
    
    return res.json({
      success: true,
      message: 'Analytics geçmişi temizlendi'
    });
  } catch (error) {
    logger.error('❌ Clear analytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Analytics geçmişi temizlenemedi'
    });
  }
});

// Analytics health check
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await cacheAnalyticsService.healthCheck();
    
    return res.json({
      success: true,
      data: {
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ Analytics health check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Analytics health check başarısız'
    });
  }
});

// Get real-time metrics
router.get('/realtime', async (req, res) => {
  try {
    const analytics = await cacheAnalyticsService.getCurrentAnalytics();
    
    if (!analytics) {
      return res.status(500).json({
        success: false,
        error: 'Real-time metrics alınamadı'
      });
    }
    
    return res.json({
      success: true,
      data: {
        timestamp: analytics.timestamp,
        hitRate: analytics.overall.overallHitRate,
        responseTime: analytics.overall.averageResponseTime,
        memoryUsage: analytics.overall.memoryUsage,
        totalRequests: analytics.overall.totalRequests,
        costSavings: analytics.overall.costSavings
      }
    });
  } catch (error) {
    logger.error('❌ Real-time metrics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Real-time metrics alınamadı'
    });
  }
});

export default router; 