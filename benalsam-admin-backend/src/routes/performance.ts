import { Router } from 'express';
import { getPerformanceStats, getEndpointStats, clearPerformanceMetrics, getAllPerformanceMetrics } from '../middleware/performanceMonitor';
import { authenticateToken } from '../middleware/auth';
import logger from '../config/logger';

const router = Router();

// Get overall performance statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const stats = getPerformanceStats();
    
    logger.info('📊 Performance stats requested', {
      totalRequests: stats.totalRequests,
      averageResponseTime: stats.averageResponseTime,
      errorRate: stats.errorRate
    });

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error getting performance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get endpoint-specific statistics
router.get('/endpoint/:endpoint', authenticateToken, (req, res) => {
  try {
    const { endpoint } = req.params;
    const stats = getEndpointStats(endpoint);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'No metrics found for this endpoint'
      });
    }

    logger.info('📊 Endpoint performance stats requested', {
      endpoint,
      totalRequests: stats.totalRequests,
      averageResponseTime: stats.averageResponseTime
    });

    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error getting endpoint stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get endpoint statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all performance metrics (for detailed analysis)
router.get('/metrics', authenticateToken, (req, res) => {
  try {
    const metrics = getAllPerformanceMetrics();
    
    logger.info('📊 All performance metrics requested', {
      totalMetrics: metrics.length
    });

    res.json({
      success: true,
      data: {
        totalMetrics: metrics.length,
        metrics: metrics.slice(-100) // Son 100 metrik
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error getting all metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear performance metrics
router.delete('/clear', authenticateToken, (req, res) => {
  try {
    clearPerformanceMetrics();
    
    logger.info('🧹 Performance metrics cleared by user', {
      userId: (req as any).user?.id
    });

    res.json({
      success: true,
      message: 'Performance metrics cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error clearing metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear performance metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Performance health check
router.get('/health', (req, res) => {
  try {
    const stats = getPerformanceStats();
    
    // Performance health indicators
    const isHealthy = {
      averageResponseTime: stats.averageResponseTime < 1000, // < 1s
      errorRate: stats.errorRate < 5, // < 5%
      totalRequests: stats.totalRequests > 0 // At least some requests
    };

    const overallHealth = Object.values(isHealthy).every(Boolean);

    res.json({
      success: true,
      data: {
        healthy: overallHealth,
        indicators: isHealthy,
        stats: {
          averageResponseTime: stats.averageResponseTime,
          errorRate: stats.errorRate,
          totalRequests: stats.totalRequests
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error checking performance health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check performance health',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Performance alerts
router.get('/alerts', authenticateToken, (req, res) => {
  try {
    const stats = getPerformanceStats();
    const alerts = [];

    // Check for performance issues
    if (stats.averageResponseTime > 1000) {
      alerts.push({
        type: 'SLOW_RESPONSE',
        severity: 'WARNING',
        message: `Average response time is ${stats.averageResponseTime}ms (should be < 1000ms)`,
        value: stats.averageResponseTime,
        threshold: 1000
      });
    }

    if (stats.errorRate > 5) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        severity: 'CRITICAL',
        message: `Error rate is ${stats.errorRate}% (should be < 5%)`,
        value: stats.errorRate,
        threshold: 5
      });
    }

    if (stats.slowestEndpoint && stats.slowestEndpoint.responseTime > 2000) {
      alerts.push({
        type: 'SLOW_ENDPOINT',
        severity: 'WARNING',
        message: `Slowest endpoint: ${stats.slowestEndpoint.endpoint} (${stats.slowestEndpoint.responseTime}ms)`,
        endpoint: stats.slowestEndpoint.endpoint,
        responseTime: stats.slowestEndpoint.responseTime,
        threshold: 2000
      });
    }

    res.json({
      success: true,
      data: {
        alerts,
        totalAlerts: alerts.length,
        hasCriticalAlerts: alerts.some(a => a.severity === 'CRITICAL')
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error getting performance alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance alerts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 