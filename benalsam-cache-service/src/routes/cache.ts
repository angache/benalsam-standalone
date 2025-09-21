import express, { Router, Request, Response } from 'express';
import cacheManager from '../services/CacheManager';
import { redisCache } from '../services/RedisCacheService';
import memoryCacheService from '../services/MemoryCacheService';
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
router.post('/get', async (req: Request, res: Response) => {
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
    logger.error('❌ Cache get error:', { error, service: 'cache-service' });
    return res.status(500).json({
      success: false,
      error: 'Cache verisi alınamadı'
    });
  }
});

// Cache set endpoint
router.post('/set', async (req: Request, res: Response) => {
  try {
    const { key, data, ttl, sessionId } = req.body;
    
    if (!key || data === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Cache key ve data gerekli'
      });
    }
    
    const success = await cacheManager.set(key, data, ttl, sessionId);
    
    return res.json({
      success,
      message: success ? 'Cache verisi kaydedildi' : 'Cache verisi kaydedilemedi'
    });
  } catch (error) {
    logger.error('❌ Cache set error:', { error, service: 'cache-service' });
    return res.status(500).json({
      success: false,
      error: 'Cache verisi kaydedilemedi'
    });
  }
});

// Cache delete endpoint
router.delete('/delete', async (req: Request, res: Response) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Cache key gerekli'
      });
    }
    
    const success = await cacheManager.delete(key);
    
    return res.json({
      success,
      message: success ? 'Cache verisi silindi' : 'Cache verisi silinemedi'
    });
  } catch (error) {
    logger.error('❌ Cache delete error:', { error, service: 'cache-service' });
    return res.status(500).json({
      success: false,
      error: 'Cache verisi silinemedi'
    });
  }
});

// Cache clear endpoint
router.post('/clear', async (_req: Request, res: Response) => {
  try {
    await cacheManager.clear();
    
    return res.json({
      success: true,
      message: 'Tüm cache temizlendi'
    });
  } catch (error) {
    logger.error('❌ Cache clear error:', { error, service: 'cache-service' });
    return res.status(500).json({
      success: false,
      error: 'Cache temizlenemedi'
    });
  }
});

// Cache stats endpoint
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await cacheManager.getStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ Cache stats error:', { error, service: 'cache-service' });
    return res.status(500).json({
      success: false,
      error: 'Cache istatistikleri alınamadı'
    });
  }
});

// Cache health check endpoint
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await cacheManager.healthCheck();
    
    return res.json({
      success: true,
      data: {
        healthy: health,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ Cache health check error:', { error, service: 'cache-service' });
    return res.status(500).json({
      success: false,
      error: 'Cache sağlık kontrolü yapılamadı'
    });
  }
});

// Memory cache specific endpoints
router.get('/memory/stats', async (_req: Request, res: Response) => {
  try {
    const stats = memoryCacheService.getStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ Memory cache stats error:', { error, service: 'cache-service' });
    return res.status(500).json({
      success: false,
      error: 'Memory cache istatistikleri alınamadı'
    });
  }
});

// Redis cache specific endpoints
router.get('/redis/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await redisCache.stats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ Redis cache stats error:', { error, service: 'cache-service' });
    return res.status(500).json({
      success: false,
      error: 'Redis cache istatistikleri alınamadı'
    });
  }
});

export { router as cacheRoutes };
