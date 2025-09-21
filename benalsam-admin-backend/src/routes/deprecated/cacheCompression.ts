import express, { Router } from 'express';
import cacheCompressionService from '../services/cacheCompressionService';
import logger from '../config/logger';

const router: Router = express.Router();

/**
 * KVKK COMPLIANCE: Cache Compression Routes
 * 
 * Cache compression routes KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ EFFICIENT_STORAGE - Verimli depolama
 * ✅ PERFORMANCE_OPTIMIZATION - Performans optimizasyonu
 * ✅ MEMORY_MANAGEMENT - Bellek yönetimi
 * ✅ TRANSPARENCY - Compression süreleri açık
 */

// Get compression statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = cacheCompressionService.getStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ Compression stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Compression stats alınamadı'
    });
  }
});

// Get compression configuration
router.get('/config', async (req, res) => {
  try {
    const config = cacheCompressionService.getConfig();
    
    return res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('❌ Compression config error:', error);
    return res.status(500).json({
      success: false,
      error: 'Compression config alınamadı'
    });
  }
});

// Update compression configuration
router.put('/config', async (req, res) => {
  try {
    const { algorithm, level, threshold, maxSize, enableCompression } = req.body;
    
    cacheCompressionService.updateConfig({
      algorithm,
      level,
      threshold,
      maxSize,
      enableCompression
    });
    
    return res.json({
      success: true,
      message: 'Compression config güncellendi'
    });
  } catch (error) {
    logger.error('❌ Update compression config error:', error);
    return res.status(500).json({
      success: false,
      error: 'Compression config güncellenemedi'
    });
  }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const metrics = cacheCompressionService.getPerformanceMetrics();
    
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('❌ Performance metrics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Performance metrics alınamadı'
    });
  }
});

// Get algorithm performance
router.get('/algorithms', async (req, res) => {
  try {
    const performance = cacheCompressionService.getAlgorithmPerformance();
    
    return res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('❌ Algorithm performance error:', error);
    return res.status(500).json({
      success: false,
      error: 'Algorithm performance alınamadı'
    });
  }
});

// Test compression
router.post('/test', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Test data gerekli'
      });
    }
    
    const result = await cacheCompressionService.testCompression(data);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('❌ Compression test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Compression test başarısız'
    });
  }
});

// Compress and cache data
router.post('/compress-cache', async (req, res) => {
  try {
    const { key, data, ttl } = req.body;
    
    if (!key || !data) {
      return res.status(400).json({
        success: false,
        error: 'Key ve data gerekli'
      });
    }
    
    const success = await cacheCompressionService.compressAndCache(key, data, ttl);
    
    return res.json({
      success: true,
      message: success ? 'Data compressed ve cached' : 'Compression başarısız'
    });
  } catch (error) {
    logger.error('❌ Compress cache error:', error);
    return res.status(500).json({
      success: false,
      error: 'Compress cache başarısız'
    });
  }
});

// Get and decompress cached data
router.get('/decompress-cache', async (req, res) => {
  try {
    const { key } = req.query;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Key gerekli'
      });
    }
    
    const data = await cacheCompressionService.getAndDecompress(key as string);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Cached data bulunamadı'
      });
    }
    
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('❌ Decompress cache error:', error);
    return res.status(500).json({
      success: false,
      error: 'Decompress cache başarısız'
    });
  }
});

// Get memory analysis
router.get('/memory-analysis', async (req, res) => {
  try {
    const analysis = cacheCompressionService.getMemoryAnalysis();
    
    return res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('❌ Memory analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Memory analysis alınamadı'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await cacheCompressionService.healthCheck();
    
    return res.json({
      success: true,
      data: {
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ Compression health check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Health check başarısız'
    });
  }
});

// Get compression summary
router.get('/summary', async (req, res) => {
  try {
    const stats = cacheCompressionService.getStats();
    const config = cacheCompressionService.getConfig();
    const performance = cacheCompressionService.getPerformanceMetrics();
    const analysis = cacheCompressionService.getMemoryAnalysis();
    
    const summary = {
      stats,
      config,
      performance,
      analysis,
      summary: {
        totalCompressed: stats.totalCompressed,
        totalBytesSaved: stats.totalBytesSaved,
        averageCompressionRatio: stats.averageCompressionRatio,
        compressionEnabled: config.enableCompression,
        algorithm: config.algorithm,
        level: config.level
      }
    };
    
    return res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('❌ Compression summary error:', error);
    return res.status(500).json({
      success: false,
      error: 'Compression summary alınamadı'
    });
  }
});

// Get compression recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const performance = cacheCompressionService.getAlgorithmPerformance();
    const analysis = cacheCompressionService.getMemoryAnalysis();
    
    const recommendations = {
      algorithm: performance.recommendations,
      memory: analysis.recommendations,
      overall: {
        enableCompression: performance.recommendations.enableCompression,
        adjustThreshold: performance.recommendations.adjustThreshold,
        optimizeLevel: performance.recommendations.level
      }
    };
    
    return res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('❌ Compression recommendations error:', error);
    return res.status(500).json({
      success: false,
      error: 'Compression recommendations alınamadı'
    });
  }
});

export default router; 