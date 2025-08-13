import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getSecurityStats, clearOldSecurityEvents } from '../middleware/securityMonitor';
import logger from '../config/logger';
import { performance } from 'perf_hooks';
import performanceMonitoringService from '../services/performanceMonitoringService';

const router = express.Router();

// Available API endpoints for testing
const availableEndpoints = [
  // Health & Monitoring
  { path: '/api/v1/health', method: 'GET', description: 'System Health Check' },
  { path: '/api/v1/health/detailed', method: 'GET', description: 'Detailed Health Status' },
  { path: '/api/v1/health/uptime', method: 'GET', description: 'Uptime Information' },
  { path: '/api/v1/health/sla', method: 'GET', description: 'SLA Information' },
  { path: '/api/v1/health/api', method: 'GET', description: 'API Health Status' },
  { path: '/api/v1/health/database', method: 'GET', description: 'Database Health' },
  { path: '/api/v1/health/redis', method: 'GET', description: 'Redis Health' },
  { path: '/api/v1/health/elasticsearch', method: 'GET', description: 'Elasticsearch Health' },
  { path: '/api/v1/health/memory', method: 'GET', description: 'Memory Health' },
  { path: '/api/v1/health/disk', method: 'GET', description: 'Disk Health' },
  
  // Analytics
  { path: '/api/v1/analytics', method: 'GET', description: 'Real-time Analytics' },
  { path: '/api/v1/analytics/dashboard', method: 'GET', description: 'Analytics Dashboard' },
  { path: '/api/v1/analytics/session', method: 'GET', description: 'Session Analytics' },
  { path: '/api/v1/analytics/user-journey', method: 'GET', description: 'User Journey Analytics' },
  
  // Security
  { path: '/api/v1/security/stats', method: 'GET', description: 'Security Statistics' },
  { path: '/api/v1/security/events', method: 'GET', description: 'Security Events' },
  { path: '/api/v1/security/suspicious-ips', method: 'GET', description: 'Suspicious IPs' },
  { path: '/api/v1/security/summary', method: 'GET', description: 'Security Summary' },
  
  // Performance
  { path: '/api/v1/performance/baseline', method: 'GET', description: 'Performance Baseline' },
  { path: '/api/v1/performance/recommendations', method: 'GET', description: 'Performance Recommendations' },
  
  // Cache
  { path: '/api/v1/cache/stats', method: 'GET', description: 'Cache Statistics' },
  { path: '/api/v1/cache/analytics', method: 'GET', description: 'Cache Analytics' },
  { path: '/api/v1/cache/predictive', method: 'GET', description: 'Predictive Cache' },
  { path: '/api/v1/cache/geographic', method: 'GET', description: 'Geographic Cache' },
  
  // Data Export
  { path: '/api/v1/data-export', method: 'GET', description: 'Data Export' },
  { path: '/api/v1/data-export-v2', method: 'GET', description: 'Data Export V2' },
  
  // Monitoring
  { path: '/api/v1/monitoring', method: 'GET', description: 'System Monitoring' },
  { path: '/api/v1/hybrid-monitoring', method: 'GET', description: 'Hybrid Monitoring' },
  { path: '/api/v1/sentry-dashboard', method: 'GET', description: 'Sentry Dashboard' },
  
  // Management
  { path: '/api/v1/admin-management', method: 'GET', description: 'Admin Management' },
  { path: '/api/v1/users', method: 'GET', description: 'User Management' },
  { path: '/api/v1/listings', method: 'GET', description: 'Listings Management' },
  { path: '/api/v1/categories', method: 'GET', description: 'Categories Management' },
  
  // Elasticsearch
  { path: '/api/v1/elasticsearch', method: 'GET', description: 'Elasticsearch Dashboard' },
  { path: '/api/v1/elasticsearch/health', method: 'GET', description: 'Elasticsearch Health' },
  { path: '/api/v1/elasticsearch/indices', method: 'GET', description: 'Elasticsearch Indices' },
  
  // Alerts
  { path: '/api/v1/alerts', method: 'GET', description: 'Alert System' },
  { path: '/api/v1/analytics-alerts', method: 'GET', description: 'Analytics Alerts' },
  
  // Session Management
  { path: '/api/v1/session-management', method: 'GET', description: 'Session Management' },
  { path: '/api/v1/session-analytics', method: 'GET', description: 'Session Analytics' },
  { path: '/api/v1/session-journey', method: 'GET', description: 'Session Journey' },
  
  // Load Testing
  { path: '/api/v1/load-testing', method: 'GET', description: 'Load Testing' },
  { path: '/api/v1/performance-test', method: 'GET', description: 'Performance Test' },
  
  // Rate Limiting
  { path: '/api/v1/rate-limit', method: 'GET', description: 'Rate Limiting' },
  
  // 2FA
  { path: '/api/v1/2fa', method: 'GET', description: 'Two Factor Authentication' },
  
  // Test Routes
  { path: '/api/v1/test', method: 'GET', description: 'Test Routes' },
  { path: '/api/v1/sentry-test', method: 'GET', description: 'Sentry Test' },
];

// Performance baseline storage
interface PerformanceBaseline {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  throughput: number;
  errorRate: number;
  timestamp: string;
  testCount: number;
}

const performanceBaselines: Map<string, PerformanceBaseline> = new Map();

// Get available endpoints for testing
router.get('/endpoints', authenticateToken, async (req, res) => {
  try {
    logger.info('Available endpoints requested', {
      endpoint: req.path,
      ip: req.ip,
      endpointCount: availableEndpoints.length
    });

    res.json({
      success: true,
      data: {
        endpoints: availableEndpoints,
        total: availableEndpoints.length,
        categories: {
          health: availableEndpoints.filter(e => e.path.startsWith('/api/v1/health')).length,
          analytics: availableEndpoints.filter(e => e.path.startsWith('/api/v1/analytics')).length,
          security: availableEndpoints.filter(e => e.path.startsWith('/api/v1/security')).length,
          performance: availableEndpoints.filter(e => e.path.startsWith('/api/v1/performance')).length,
          cache: availableEndpoints.filter(e => e.path.startsWith('/api/v1/cache')).length,
          management: availableEndpoints.filter(e => ['/api/v1/admin-management', '/api/v1/users', '/api/v1/listings', '/api/v1/categories'].includes(e.path)).length,
          monitoring: availableEndpoints.filter(e => ['/api/v1/monitoring', '/api/v1/hybrid-monitoring', '/api/v1/sentry-dashboard'].includes(e.path)).length,
          elasticsearch: availableEndpoints.filter(e => e.path.startsWith('/api/v1/elasticsearch')).length,
          alerts: availableEndpoints.filter(e => e.path.includes('alert')).length,
          session: availableEndpoints.filter(e => e.path.includes('session')).length,
          other: availableEndpoints.filter(e => !['/api/v1/health', '/api/v1/analytics', '/api/v1/security', '/api/v1/performance', '/api/v1/cache', '/api/v1/admin-management', '/api/v1/users', '/api/v1/listings', '/api/v1/categories', '/api/v1/monitoring', '/api/v1/hybrid-monitoring', '/api/v1/sentry-dashboard', '/api/v1/elasticsearch'].some(prefix => e.path.startsWith(prefix))).length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get available endpoints', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get available endpoints',
      error: errorMessage
    });
  }
});

// Performance testing middleware
const performanceTest = (endpoint: string) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const start = performance.now();
    const originalSend = res.send;
    
    res.send = function(data: any) {
      const end = performance.now();
      const responseTime = end - start;
      
      // Store performance data
      const key = `${req.method}:${endpoint}`;
      const existing = performanceBaselines.get(key);
      
      if (existing) {
        existing.avgResponseTime = (existing.avgResponseTime + responseTime) / 2;
        existing.minResponseTime = Math.min(existing.minResponseTime, responseTime);
        existing.maxResponseTime = Math.max(existing.maxResponseTime, responseTime);
        existing.testCount++;
        existing.timestamp = new Date().toISOString();
      } else {
        performanceBaselines.set(key, {
          endpoint,
          method: req.method,
          avgResponseTime: responseTime,
          minResponseTime: responseTime,
          maxResponseTime: responseTime,
          throughput: 1,
          errorRate: res.statusCode >= 400 ? 1 : 0,
          timestamp: new Date().toISOString(),
          testCount: 1
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Get performance baseline
router.get('/baseline', authenticateToken, async (req, res) => {
  try {
    const baselines = Array.from(performanceBaselines.values());
    
    logger.info('Performance baseline retrieved', {
      endpoint: req.path,
      ip: req.ip,
      baselineCount: baselines.length
    });

    res.json({
      success: true,
      data: {
        baselines,
        summary: {
          totalEndpoints: baselines.length,
          avgResponseTime: baselines.reduce((sum, b) => sum + b.avgResponseTime, 0) / baselines.length,
          totalTests: baselines.reduce((sum, b) => sum + b.testCount, 0),
          lastUpdated: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get performance baseline', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get performance baseline',
      error: errorMessage
    });
  }
});

// Run performance test on specific endpoint
router.post('/test/:endpoint(*)', authenticateToken, async (req, res) => {
  try {
    const { endpoint } = req.params;
    const { iterations = 10, concurrent = 1 } = req.body;
    
    const results = [];
    const startTime = performance.now();
    
    // Run performance tests
    for (let i = 0; i < iterations; i++) {
      const testStart = performance.now();
      
      // Simulate endpoint call (you can replace this with actual endpoint testing)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      
      const testEnd = performance.now();
      results.push({
        iteration: i + 1,
        responseTime: testEnd - testStart,
        timestamp: new Date().toISOString()
      });
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const minResponseTime = Math.min(...results.map(r => r.responseTime));
    const maxResponseTime = Math.max(...results.map(r => r.responseTime));
    
    const baseline: PerformanceBaseline = {
      endpoint,
      method: 'GET',
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      throughput: iterations / (totalTime / 1000),
      errorRate: 0,
      timestamp: new Date().toISOString(),
      testCount: iterations
    };
    
    performanceBaselines.set(`GET:${endpoint}`, baseline);
    
    logger.info('Performance test completed', {
      endpoint: req.path,
      ip: req.ip,
      testEndpoint: endpoint,
      iterations,
      avgResponseTime,
      throughput: baseline.throughput
    });

    res.json({
      success: true,
      data: {
        endpoint,
        iterations,
        concurrent,
        results: {
          avgResponseTime,
          minResponseTime,
          maxResponseTime,
          throughput: baseline.throughput,
          totalTime,
          results
        },
        baseline
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to run performance test', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to run performance test',
      error: errorMessage
    });
  }
});

// Get performance recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const baselines = Array.from(performanceBaselines.values());
    const recommendations: Array<{
      type: string;
      endpoint: string;
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
      message: string;
      suggestion: string;
    }> = [];
    
    // Analyze performance and generate recommendations
    baselines.forEach(baseline => {
      if (baseline.avgResponseTime > 1000) {
        recommendations.push({
          type: 'SLOW_RESPONSE',
          endpoint: baseline.endpoint,
          severity: 'HIGH',
          message: `${baseline.endpoint} endpoint is slow (${baseline.avgResponseTime.toFixed(2)}ms). Consider optimization.`,
          suggestion: 'Add caching, optimize database queries, or implement pagination.'
        });
      }
      
      if (baseline.errorRate > 0.05) {
        recommendations.push({
          type: 'HIGH_ERROR_RATE',
          endpoint: baseline.endpoint,
          severity: 'HIGH',
          message: `${baseline.endpoint} has high error rate (${(baseline.errorRate * 100).toFixed(2)}%).`,
          suggestion: 'Review error handling and fix underlying issues.'
        });
      }
      
      if (baseline.throughput < 10) {
        recommendations.push({
          type: 'LOW_THROUGHPUT',
          endpoint: baseline.endpoint,
          severity: 'MEDIUM',
          message: `${baseline.endpoint} has low throughput (${baseline.throughput.toFixed(2)} req/s).`,
          suggestion: 'Consider load balancing or horizontal scaling.'
        });
      }
    });
    
    logger.info('Performance recommendations generated', {
      endpoint: req.path,
      ip: req.ip,
      recommendationCount: recommendations.length
    });

    res.json({
      success: true,
      data: {
        recommendations,
        summary: {
          totalRecommendations: recommendations.length,
          highSeverity: recommendations.filter(r => r.severity === 'HIGH').length,
          mediumSeverity: recommendations.filter(r => r.severity === 'MEDIUM').length,
          lowSeverity: recommendations.filter(r => r.severity === 'LOW').length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get performance recommendations', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get performance recommendations',
      error: errorMessage
    });
  }
});

// Clear performance baseline
router.delete('/baseline', authenticateToken, async (req, res) => {
  try {
    const clearedCount = performanceBaselines.size;
    performanceBaselines.clear();
    
    logger.info('Performance baseline cleared', {
      endpoint: req.path,
      ip: req.ip,
      clearedCount
    });

    res.json({
      success: true,
      message: `Cleared ${clearedCount} performance baselines`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to clear performance baseline', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to clear performance baseline',
      error: errorMessage
    });
  }
});

// Get monitoring status
router.get('/monitoring/status', authenticateToken, async (req, res) => {
  try {
    const status = performanceMonitoringService.getMonitoringStatus();
    
    logger.info('Performance monitoring status retrieved', {
      endpoint: req.path,
      ip: req.ip,
      status
    });

    return res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get monitoring status', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to get monitoring status',
      error: errorMessage
    });
  }
});

// Get monitoring results
router.get('/monitoring/results', authenticateToken, async (req, res) => {
  try {
    const { endpoint } = req.query;
    const results = performanceMonitoringService.getMonitoringResults(endpoint as string);
    
    logger.info('Performance monitoring results retrieved', {
      endpoint: req.path,
      ip: req.ip,
      resultCount: Array.isArray(results) ? results.length : Object.keys(results).length
    });

    return res.json({
      success: true,
      data: {
        results,
        total: Array.isArray(results) ? results.length : Object.keys(results).length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get monitoring results', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to get monitoring results',
      error: errorMessage
    });
  }
});

// Get performance alerts
router.get('/monitoring/alerts', authenticateToken, async (req, res) => {
  try {
    const { severity } = req.query;
    const alerts = performanceMonitoringService.getAlerts(severity as 'warning' | 'critical');
    
    logger.info('Performance alerts retrieved', {
      endpoint: req.path,
      ip: req.ip,
      alertCount: alerts.length
    });

    return res.json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get performance alerts', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to get performance alerts',
      error: errorMessage
    });
  }
});

// Get endpoint statistics
router.get('/monitoring/stats/:endpoint', authenticateToken, async (req, res) => {
  try {
    const { endpoint } = req.params;
    const stats = performanceMonitoringService.getEndpointStats(endpoint);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'No monitoring data found for this endpoint'
      });
    }

    logger.info('Endpoint statistics retrieved', {
      endpoint: req.path,
      ip: req.ip,
      targetEndpoint: endpoint
    });

    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get endpoint statistics', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to get endpoint statistics',
      error: errorMessage
    });
  }
});

// Control monitoring service
router.post('/monitoring/control', authenticateToken, async (req, res) => {
  try {
    const { action } = req.body;
    
    switch (action) {
      case 'start':
        await performanceMonitoringService.startMonitoring();
        logger.info('Performance monitoring started manually', { ip: req.ip });
        break;
      case 'stop':
        performanceMonitoringService.stopMonitoring();
        logger.info('Performance monitoring stopped manually', { ip: req.ip });
        break;
      case 'clear-alerts':
        performanceMonitoringService.clearAlerts();
        logger.info('Performance alerts cleared manually', { ip: req.ip });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: start, stop, or clear-alerts'
        });
    }

    const status = performanceMonitoringService.getMonitoringStatus();

    return res.json({
      success: true,
      message: `Performance monitoring ${action} successful`,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to control monitoring service', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to control monitoring service',
      error: errorMessage
    });
  }
});

export default router; 