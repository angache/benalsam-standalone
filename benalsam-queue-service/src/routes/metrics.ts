import { Router } from 'express';
import { metricsService } from '../services/MetricsService';
import logger from '../config/logger';

const router = Router();

/**
 * Prometheus Metrics Endpoint
 * GET /api/v1/metrics
 */
router.get('/', async (req, res) => {
  try {
    const metrics = await metricsService.getMetrics();
    
    res.set('Content-Type', metricsService.getMetricsContentType());
    res.send(metrics);
    
    logger.debug('📊 Metrics endpoint accessed', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
  } catch (error) {
    logger.error('❌ Error serving metrics:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Health Metrics Endpoint
 * GET /api/v1/metrics/health
 */
router.get('/health', async (_req, res) => {
  try {
    const healthMetrics = await metricsService.getHealthMetrics();
    
    res.json({
      success: true,
      data: {
        ...healthMetrics,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
    
  } catch (error) {
    logger.error('❌ Error retrieving health metrics:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve health metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Reset Metrics Endpoint (Development only)
 * POST /api/v1/metrics/reset
 */
router.post('/reset', async (req, res) => {
  try {
    // Only allow in development
    if (process.env['NODE_ENV'] === 'production') {
      res.status(403).json({
        success: false,
        error: 'Metrics reset not allowed in production'
      });
      return;
    }
    
    metricsService.resetMetrics();
    
    res.json({
      success: true,
      message: 'Metrics reset successfully'
    });
    
    logger.info('🔄 Metrics reset requested', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
  } catch (error) {
    logger.error('❌ Error resetting metrics:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as metricsRoutes };
