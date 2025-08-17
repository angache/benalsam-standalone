import express from 'express';
import { performanceTrendService } from '../services/performanceTrendService';
import { authenticateToken } from '../middleware/auth';
import { rateLimit } from 'express-rate-limit';
import { redis } from '../services/redisService';

const router = express.Router();

// Rate limiting
const trendAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // 100 istek
  message: 'Trend analizi istekleri çok fazla. Lütfen 15 dakika bekleyin.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route GET /api/trends/analysis
 * @desc Performance trendlerini analiz et
 * @access Private
 */
router.get('/analysis', authenticateToken, trendAnalysisLimiter, async (req, res) => {
  try {
    const { route, period = '24h' } = req.query as { route?: string; period?: '1h' | '24h' | '7d' | '30d' };
    
    const trends = await performanceTrendService.analyzeTrends(route, period);
    
    res.json({
      success: true,
      data: {
        trends,
        totalTrends: trends.length,
        period,
        analyzedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Trend analizi hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Trend analizi başarısız',
      details: error.message
    });
  }
});

/**
 * @route GET /api/trends/alerts
 * @desc Aktif performance alertlerini al
 * @access Private
 */
router.get('/alerts', authenticateToken, trendAnalysisLimiter, async (req, res) => {
  try {
    const alerts = await performanceTrendService.getActiveAlerts();
    
    res.json({
      success: true,
      data: {
        alerts,
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        highAlerts: alerts.filter(a => a.severity === 'high').length,
        mediumAlerts: alerts.filter(a => a.severity === 'medium').length,
        lowAlerts: alerts.filter(a => a.severity === 'low').length
      }
    });
  } catch (error: any) {
    console.error('Alert alma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Alertler alınamadı',
      details: error.message
    });
  }
});

/**
 * @route POST /api/trends/alerts/generate
 * @desc Yeni performance alertleri oluştur
 * @access Private
 */
router.post('/alerts/generate', authenticateToken, trendAnalysisLimiter, async (req, res) => {
  try {
    const alerts = await performanceTrendService.generateAlerts();
    
    res.json({
      success: true,
      data: {
        alerts,
        generatedAlerts: alerts.length,
        message: `${alerts.length} yeni alert oluşturuldu`
      }
    });
  } catch (error: any) {
    console.error('Alert oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Alertler oluşturulamadı',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/trends/alerts/:alertId/resolve
 * @desc Alert'i çözüldü olarak işaretle
 * @access Private
 */
router.put('/alerts/:alertId/resolve', authenticateToken, trendAnalysisLimiter, async (req, res) => {
  try {
    const { alertId } = req.params;
    
    await performanceTrendService.resolveAlert(alertId);
    
    res.json({
      success: true,
      data: {
        message: 'Alert başarıyla çözüldü',
        alertId
      }
    });
  } catch (error: any) {
    console.error('Alert çözme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Alert çözülemedi',
      details: error.message
    });
  }
});

/**
 * @route GET /api/trends/summary
 * @desc Performance özeti al
 * @access Private
 */
router.get('/summary', trendAnalysisLimiter, async (req, res) => {
  try {
    const summary = await performanceTrendService.getPerformanceSummary();
    
    res.json({
      success: true,
      data: {
        summary,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Performance özeti hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Performance özeti alınamadı',
      details: error.message
    });
  }
});

/**
 * @route GET /api/trends/route/:route
 * @desc Belirli bir route için detaylı trend analizi
 * @access Private
 */
router.get('/route/:route', authenticateToken, trendAnalysisLimiter, async (req, res) => {
  try {
    const { route } = req.params;
    const { period = '24h' } = req.query as { period?: '1h' | '24h' | '7d' | '30d' };
    
    const trends = await performanceTrendService.analyzeTrends(route, period);
    const routeTrend = trends.find(t => t.route === route);
    
    if (!routeTrend) {
      return res.status(404).json({
        success: false,
        error: 'Route trend verisi bulunamadı'
      });
    }
    
    return res.json({
      success: true,
      data: {
        route,
        trend: routeTrend,
        period,
        analyzedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Route trend analizi hatası:', error);
    return res.status(500).json({
      success: false,
      error: 'Route trend analizi başarısız',
      details: error.message
    });
  }
});

/**
 * @route GET /api/trends/health
 * @desc Trend analizi servisinin sağlık durumu
 * @access Private
 */
router.get('/health', async (req, res) => {
  try {
    const summary = await performanceTrendService.getPerformanceSummary();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        summary,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  } catch (error: any) {
    console.error('Trend servis sağlık kontrolü hatası:', error);
    res.status(503).json({
      success: false,
      error: 'Trend servis sağlıksız',
      details: error.message
    });
  }
});

/**
 * @route GET /api/v1/trends/debug/keys
 * @desc Redis key'lerini listele (debug için)
 * @access Private
 */
router.get('/debug/keys', authenticateToken, async (req, res) => {
  try {
    const dataKeys = await redis.keys('perf:data:*');
    const historyKeys = await redis.keys('perf:history:*');
    const trendKeys = await redis.keys('perf:trend:*');
    const alertKeys = await redis.keys('perf:alert:*');
    
    return res.json({
      success: true,
      data: {
        dataKeys,
        historyKeys,
        trendKeys,
        alertKeys,
        totalKeys: dataKeys.length + historyKeys.length + trendKeys.length + alertKeys.length
      }
    });
  } catch (error: any) {
    console.error('Debug keys error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get debug keys',
      details: error.message
    });
  }
});

/**
 * @route GET /api/v1/trends/debug/data/:route
 * @desc Belirli bir route'un data'sını kontrol et (debug için)
 * @access Private
 */
router.get('/debug/data/:route', authenticateToken, async (req, res) => {
  try {
    const { route } = req.params;
    const data = await redis.get(`perf:data:${route}`);
    
    return res.json({
      success: true,
      data: {
        route,
        data: data ? JSON.parse(data) : null
      }
    });
  } catch (error: any) {
    console.error('Debug data error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get debug data',
      details: error.message
    });
  }
});

/**
 * @route DELETE /api/v1/trends/performance-data
 * @desc Tüm performance data'ları temizle (test için)
 * @access Private
 */
router.delete('/performance-data', authenticateToken, async (req, res) => {
  try {
    // Tüm performance data key'lerini bul
    const dataKeys = await redis.keys('perf:data:*');
    const historyKeys = await redis.keys('perf:history:*');
    const trendKeys = await redis.keys('perf:trend:*');
    const alertKeys = await redis.keys('perf:alert:*');
    
    // Tüm key'leri sil
    const allKeys = [...dataKeys, ...historyKeys, ...trendKeys, ...alertKeys];
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
    }
    
    console.log(`🧹 Cleared ${allKeys.length} performance data keys`);
    
    return res.json({
      success: true,
      data: {
        message: 'All performance data cleared successfully',
        clearedKeys: allKeys.length
      }
    });
  } catch (error: any) {
    console.error('Performance data clear error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear performance data',
      details: error.message
    });
  }
});

/**
 * @route POST /api/v1/trends/performance-data
 * @desc Web app'ten performance data al
 * @access Public (for Web App)
 */
router.post('/performance-data', async (req, res) => {
  try {
    const { route, timestamp, metrics, score, userAgent, viewport } = req.body;
    
    // Validate required fields
    if (!route || !metrics || !score) {
      return res.status(400).json({
        success: false,
        error: 'Route, metrics, and score are required'
      });
    }

    // Save to Redis for trend analysis
    const performanceData = {
      route,
      timestamp: timestamp || new Date().toISOString(),
      metrics,
      score,
      userAgent,
      viewport
    };

    // Save current data
    await redis.setex(`perf:data:${route}`, 3600, JSON.stringify(performanceData));
    
    // Save to history for trend analysis
    const historyKey = `perf:history:${route}:${Date.now()}`;
    await redis.setex(historyKey, 86400, JSON.stringify(performanceData)); // 24 hours

    console.log(`📊 Performance data saved for route: ${route}, score: ${score}`);

    return res.json({
      success: true,
      data: {
        message: 'Performance data saved successfully',
        route,
        score,
        timestamp: performanceData.timestamp
      }
    });
  } catch (error: any) {
    console.error('Performance data save error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save performance data',
      details: error.message
    });
  }
});

export default router;
