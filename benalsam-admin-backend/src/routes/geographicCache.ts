import express, { Router } from 'express';
import geographicCacheService from '../services/geographicCacheService';
import logger from '../config/logger';

const router: Router = express.Router();

/**
 * KVKK COMPLIANCE: Geographic Cache Routes
 * 
 * Geographic cache routes KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ REGIONAL_COMPLIANCE - Bölgesel veri koruma
 * ✅ EDGE_SECURITY - Edge node güvenliği
 * ✅ TRANSPARENCY - Geographic routing açık
 * ✅ MINIMIZATION - Sadece gerekli veriler edge'de
 */

// Cache with geographic distribution
router.post('/cache', async (req, res) => {
  try {
    const { key, data, userLat, userLng, ttl } = req.body;
    
    if (!key || !data) {
      return res.status(400).json({
        success: false,
        error: 'Cache key ve data gerekli'
      });
    }
    
    const success = await geographicCacheService.cacheWithGeographicDistribution(
      key, data, userLat, userLng, ttl
    );
    
    return res.json({
      success: true,
      message: success ? 'Geographic cache kaydedildi' : 'Geographic cache kaydedilemedi'
    });
  } catch (error) {
    logger.error('❌ Geographic cache error:', error);
    return res.status(500).json({
      success: false,
      error: 'Geographic cache kaydedilemedi'
    });
  }
});

// Get with geographic routing
router.get('/get', async (req, res) => {
  try {
    const { key, userLat, userLng } = req.query;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Cache key gerekli'
      });
    }
    
    const data = await geographicCacheService.getWithGeographicRouting(
      key as string,
      userLat ? parseFloat(userLat as string) : undefined,
      userLng ? parseFloat(userLng as string) : undefined
    );
    
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('❌ Geographic get error:', error);
    return res.status(500).json({
      success: false,
      error: 'Geographic cache verisi alınamadı'
    });
  }
});

// Get geographic statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = geographicCacheService.getGeographicStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ Geographic stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Geographic stats alınamadı'
    });
  }
});

// Get all regions
router.get('/regions', async (req, res) => {
  try {
    const regions = geographicCacheService.getRegions();
    
    return res.json({
      success: true,
      data: {
        regions,
        count: regions.length
      }
    });
  } catch (error) {
    logger.error('❌ Get regions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Regions alınamadı'
    });
  }
});

// Get all edge nodes
router.get('/edge-nodes', async (req, res) => {
  try {
    const edgeNodes = geographicCacheService.getEdgeNodes();
    
    return res.json({
      success: true,
      data: {
        edgeNodes,
        count: edgeNodes.length
      }
    });
  } catch (error) {
    logger.error('❌ Get edge nodes error:', error);
    return res.status(500).json({
      success: false,
      error: 'Edge nodes alınamadı'
    });
  }
});

// Get optimal region for coordinates
router.get('/optimal-region', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude ve longitude gerekli'
      });
    }
    
    const regionId = geographicCacheService.getOptimalRegion(
      parseFloat(lat as string),
      parseFloat(lng as string)
    );
    
    const regions = geographicCacheService.getRegions();
    const region = regions.find(r => r.id === regionId);
    
    return res.json({
      success: true,
      data: {
        regionId,
        region,
        coordinates: { lat: parseFloat(lat as string), lng: parseFloat(lng as string) }
      }
    });
  } catch (error) {
    logger.error('❌ Get optimal region error:', error);
    return res.status(500).json({
      success: false,
      error: 'Optimal region alınamadı'
    });
  }
});

// Get regional performance
router.get('/regional-performance', async (req, res) => {
  try {
    const stats = geographicCacheService.getGeographicStats();
    const regions = geographicCacheService.getRegions();
    
    const performance = regions.map(region => ({
      id: region.id,
      name: region.name,
      country: region.country,
      usage: region.currentUsage,
      capacity: region.cacheCapacity,
      usagePercentage: (region.currentUsage / region.cacheCapacity) * 100,
      edgeNodes: region.edgeNodes.length,
      activeEdgeNodes: region.edgeNodes.filter(n => n.status === 'active').length,
      averageLatency: region.edgeNodes.reduce((sum, n) => sum + n.latency, 0) / region.edgeNodes.length || 0
    }));
    
    return res.json({
      success: true,
      data: {
        performance,
        overallStats: stats
      }
    });
  } catch (error) {
    logger.error('❌ Regional performance error:', error);
    return res.status(500).json({
      success: false,
      error: 'Regional performance alınamadı'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await geographicCacheService.healthCheck();
    
    return res.json({
      success: true,
      data: {
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ Geographic cache health check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Health check başarısız'
    });
  }
});

// Get edge node status
router.get('/edge-nodes/status', async (req, res) => {
  try {
    const edgeNodes = geographicCacheService.getEdgeNodes();
    
    const status = edgeNodes.map(node => ({
      id: node.id,
      regionId: node.regionId,
      hostname: node.hostname,
      status: node.status,
      latency: node.latency,
      currentLoad: node.currentLoad,
      capacity: node.capacity,
      loadPercentage: (node.currentLoad / node.capacity) * 100,
      lastHealthCheck: node.lastHealthCheck
    }));
    
    return res.json({
      success: true,
      data: {
        status,
        totalNodes: status.length,
        activeNodes: status.filter(s => s.status === 'active').length,
        inactiveNodes: status.filter(s => s.status === 'inactive').length
      }
    });
  } catch (error) {
    logger.error('❌ Edge node status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Edge node status alınamadı'
    });
  }
});

// Get regional distribution
router.get('/regional-distribution', async (req, res) => {
  try {
    const stats = geographicCacheService.getGeographicStats();
    
    return res.json({
      success: true,
      data: {
        distribution: stats.regionalDistribution,
        totalRegions: stats.totalRegions,
        activeRegions: stats.activeRegions,
        averageLatency: stats.averageLatency,
        cacheHitRate: stats.cacheHitRate
      }
    });
  } catch (error) {
    logger.error('❌ Regional distribution error:', error);
    return res.status(500).json({
      success: false,
      error: 'Regional distribution alınamadı'
    });
  }
});

export default router; 