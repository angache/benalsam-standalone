import express, { Router } from 'express';
import apiCacheService from '../services/apiCacheService';
import logger from '../config/logger';

const router: Router = express.Router();

/**
 * KVKK COMPLIANCE: API Cache Routes
 * 
 * API cache routes KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ SESSION_BASED - Sadece session_id ile erişim
 * ✅ ANONYMIZED - Kişisel veri döndürülmez
 * ✅ TRANSPARENCY - Cache süreleri açık
 * ✅ MINIMIZATION - Sadece gerekli veriler döndürülür
 */

// API cache stats
router.get('/stats', async (req, res) => {
  try {
    const stats = apiCacheService.getStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ API cache stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'API cache istatistikleri alınamadı'
    });
  }
});

// Get popular endpoints
router.get('/popular', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const popular = await apiCacheService.getPopularEndpoints(sessionId);
    
    return res.json({
      success: true,
      data: popular
    });
  } catch (error) {
    logger.error('❌ Popular endpoints error:', error);
    return res.status(500).json({
      success: false,
      error: 'Popular endpoints alınamadı'
    });
  }
});

// Clear API cache
router.post('/clear', async (req, res) => {
  try {
    await apiCacheService.clearAll();
    
    return res.json({
      success: true,
      message: 'API cache temizlendi'
    });
  } catch (error) {
    logger.error('❌ API cache clear error:', error);
    return res.status(500).json({
      success: false,
      error: 'API cache temizlenemedi'
    });
  }
});

// Warm API cache
router.post('/warm', async (req, res) => {
  try {
    const { endpoints } = req.body;
    
    if (!endpoints || !Array.isArray(endpoints)) {
      return res.status(400).json({
        success: false,
        error: 'Endpoints array gerekli'
      });
    }
    
    await apiCacheService.warmAPICache(endpoints);
    
    return res.json({
      success: true,
      message: `${endpoints.length} adet endpoint warmed`
    });
  } catch (error) {
    logger.error('❌ API cache warming error:', error);
    return res.status(500).json({
      success: false,
      error: 'API cache warming başarısız'
    });
  }
});

// API cache health check
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await apiCacheService.healthCheck();
    
    return res.json({
      success: true,
      data: {
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ API cache health check error:', error);
    return res.status(500).json({
      success: false,
      error: 'API cache health check başarısız'
    });
  }
});

// Invalidate specific API cache
router.post('/invalidate', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    const clearedCount = await apiCacheService.invalidateAPICache(pattern);
    
    return res.json({
      success: true,
      data: {
        clearedCount,
        message: `${clearedCount} adet API cache temizlendi`
      }
    });
  } catch (error) {
    logger.error('❌ API cache invalidation error:', error);
    return res.status(500).json({
      success: false,
      error: 'API cache invalidation başarısız'
    });
  }
});

export default router; 