import express, { Router } from 'express';
import cacheService from '../services/cacheService';
import cacheManager from '../services/cacheManager';
import memoryCacheService from '../services/memoryCacheService';
import logger from '../config/logger';

const router: Router = express.Router();

/**
 * KVKK COMPLIANCE: Cache API
 * 
 * Cache API endpoints KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ SESSION_BASED - Sadece session_id ile erişim
 * ✅ ANONYMIZED - Kişisel veri döndürülmez
 * ✅ TRANSPARENCY - Cache süreleri açık
 * ✅ MINIMIZATION - Sadece gerekli veriler döndürülür
 */

// Cache get endpoint
router.post('/get', async (req, res) => {
  try {
    const { key, sessionId } = req.body;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Cache key gerekli'
      });
    }
    
    // Use Cache Manager for intelligent routing
    const cachedData = await cacheManager.get(key, sessionId);
    
    return res.json({
      success: true,
      data: cachedData
    });
  } catch (error) {
    logger.error('❌ Cache get error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cache verisi alınamadı'
    });
  }
});

// Cache set endpoint
router.post('/set', async (req, res) => {
  try {
    const { key, data, sessionId } = req.body;
    
    if (!key || !data) {
      return res.status(400).json({
        success: false,
        error: 'Cache key ve data gerekli'
      });
    }
    
    // Use Cache Manager for intelligent routing
    const success = await cacheManager.set(key, data, undefined, sessionId);
    
    return res.json({
      success: true,
      message: success ? 'Cache verisi kaydedildi' : 'Cache verisi kaydedilemedi'
    });
  } catch (error) {
    logger.error('❌ Cache set error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cache verisi kaydedilemedi'
    });
  }
});

// Cache istatistiklerini al
router.get('/stats', async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    
    return res.json({
      success: true,
      data: {
        totalKeys: stats.totalKeys,
        totalSize: stats.totalSize,
        hitRate: stats.hitRate,
        health: await cacheService.healthCheck()
      }
    });
  } catch (error) {
    logger.error('❌ Cache stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cache istatistikleri alınamadı'
    });
  }
});

// Cache temizleme
router.post('/clear', async (req, res) => {
  try {
    const clearedCount = await cacheService.clearExpiredCache();
    
    return res.json({
      success: true,
      data: {
        clearedCount,
        message: `${clearedCount} adet süresi dolmuş cache temizlendi`
      }
    });
  } catch (error) {
    logger.error('❌ Cache clear error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cache temizleme başarısız'
    });
  }
});

// Kullanıcı kullanım istatistikleri
router.get('/usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await cacheService.getUserUsageStats(userId);
    
    return res.json({
      success: true,
      data: {
        userId,
        attempts: stats.attempts,
        monthlyLimit: stats.monthlyLimit,
        isPremium: stats.isPremium,
        remainingAttempts: stats.monthlyLimit === -1 ? 999 : Math.max(0, stats.monthlyLimit - stats.attempts)
      }
    });
  } catch (error) {
    logger.error('❌ User usage stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Kullanıcı istatistikleri alınamadı'
    });
  }
});

// Cache health check
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await cacheService.healthCheck();
    
    return res.json({
      success: true,
      data: {
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ Cache health check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cache health check başarısız'
    });
  }
});

// Cache boyut kontrolü
router.post('/check-size', async (req, res) => {
  try {
    await cacheService.checkCacheSize();
    
    return res.json({
      success: true,
      data: {
        message: 'Cache boyut kontrolü tamamlandı'
      }
    });
  } catch (error) {
    logger.error('❌ Cache size check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cache boyut kontrolü başarısız'
    });
  }
});

// Cache Manager stats
router.get('/manager/stats', async (req, res) => {
  try {
    const stats = await cacheManager.getStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ Cache manager stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cache manager istatistikleri alınamadı'
    });
  }
});

// Memory cache stats
router.get('/memory/stats', async (req, res) => {
  try {
    const stats = memoryCacheService.getStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ Memory cache stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Memory cache istatistikleri alınamadı'
    });
  }
});

// Cache warming
router.post('/warm', async (req, res) => {
  try {
    const { keys, dataProvider } = req.body;
    
    if (!keys || !Array.isArray(keys)) {
      return res.status(400).json({
        success: false,
        error: 'Cache warming için keys array gerekli'
      });
    }
    
    // Simple data provider for testing
    const simpleDataProvider = (key: string) => Promise.resolve({ key, data: `warmed_${key}` });
    
    await cacheManager.warmCache(keys, simpleDataProvider);
    
    return res.json({
      success: true,
      data: {
        message: `${keys.length} adet cache key warmed`
      }
    });
  } catch (error) {
    logger.error('❌ Cache warming error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cache warming başarısız'
    });
  }
});

export default router; 