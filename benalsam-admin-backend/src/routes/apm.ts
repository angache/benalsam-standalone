import express, { IRouter, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import apmMiddleware from '../middleware/apmMiddleware';
import enhancedErrorTrackingService from '../services/enhancedErrorTrackingService';
import logger from '../config/logger';

const router: IRouter = express.Router();

// APM Metrics Summary
router.get('/metrics/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const summary = await apmMiddleware.getMetricsSummary();
    
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get APM metrics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve APM metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Recent APM Metrics
router.get('/metrics/recent', authenticateToken, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const recentMetrics = apmMiddleware.getRecentMetrics(limit);
    
    res.json({
      success: true,
      data: {
        metrics: recentMetrics,
        count: recentMetrics.length,
        limit
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get recent APM metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent APM metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// APM Configuration
router.get('/config', authenticateToken, async (req: Request, res: Response) => {
  try {
    const config = apmMiddleware.getConfig();
    
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get APM configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve APM configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update APM Configuration
router.put('/config', authenticateToken, async (req: Request, res: Response) => {
  try {
    const newConfig = req.body;
    
    // Validate configuration
    const validConfigKeys = [
      'enableDetailedMetrics',
      'enableMemoryTracking',
      'enableCpuTracking',
      'enableQueryTracking',
      'enableCacheTracking',
      'slowRequestThreshold',
      'errorThreshold',
      'maxMetricsHistory'
    ];
    
    const filteredConfig = Object.keys(newConfig)
      .filter(key => validConfigKeys.includes(key))
      .reduce((obj, key) => {
        obj[key] = newConfig[key];
        return obj;
      }, {} as any);
    
    apmMiddleware.updateConfig(filteredConfig);
    
    logger.info('APM configuration updated', {
      updatedBy: (req as any).user?.id,
      config: filteredConfig,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'APM configuration updated successfully',
      data: apmMiddleware.getConfig(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to update APM configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update APM configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error Metrics
router.get('/errors/metrics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const errorMetrics = await enhancedErrorTrackingService.getErrorMetrics();
    
    res.json({
      success: true,
      data: {
        metrics: errorMetrics,
        count: errorMetrics.length,
        summary: {
          totalErrors: errorMetrics.reduce((sum, metric) => sum + metric.frequency, 0),
          criticalErrors: errorMetrics.filter(m => m.severity === 'critical').length,
          highErrors: errorMetrics.filter(m => m.severity === 'high').length,
          mediumErrors: errorMetrics.filter(m => m.severity === 'medium').length,
          lowErrors: errorMetrics.filter(m => m.severity === 'low').length,
          unresolvedErrors: errorMetrics.filter(m => m.resolutionStatus === 'unresolved').length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get error metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve error metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Recent Errors
router.get('/errors/recent', authenticateToken, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const recentErrors = await enhancedErrorTrackingService.getRecentErrors(limit);
    
    res.json({
      success: true,
      data: {
        errors: recentErrors,
        count: recentErrors.length,
        limit
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get recent errors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent errors',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Error by ID
router.get('/errors/:errorId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { errorId } = req.params;
    const error = await enhancedErrorTrackingService.getErrorById(errorId);
    
    if (!error) {
      return res.status(404).json({
        success: false,
        message: 'Error not found',
        errorId
      });
    }
    
    res.json({
      success: true,
      data: error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get error by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error Notifications
router.get('/errors/notifications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await enhancedErrorTrackingService.getErrorNotifications(limit);
    
    res.json({
      success: true,
      data: {
        notifications,
        count: notifications.length,
        limit
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get error notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve error notifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update Error Resolution Status
router.put('/errors/:pattern/resolution', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { pattern } = req.params;
    const { status, assignedTo, notes } = req.body;
    
    if (!status || !['unresolved', 'investigating', 'resolved', 'ignored'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resolution status',
        validStatuses: ['unresolved', 'investigating', 'resolved', 'ignored']
      });
    }
    
    await enhancedErrorTrackingService.updateErrorResolutionStatus(pattern, status, assignedTo, notes);
    
    logger.info('Error resolution status updated', {
      pattern,
      status,
      assignedTo,
      notes,
      updatedBy: (req as any).user?.id,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Error resolution status updated successfully',
      data: {
        pattern,
        status,
        assignedTo,
        notes
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to update error resolution status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update error resolution status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error Patterns
router.get('/errors/patterns', authenticateToken, async (req: Request, res: Response) => {
  try {
    const patterns = enhancedErrorTrackingService.getErrorPatterns();
    
    res.json({
      success: true,
      data: {
        patterns,
        count: patterns.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get error patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve error patterns',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add Error Pattern
router.post('/errors/patterns', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { pattern, description, severity, autoResolve, notificationChannels } = req.body;
    
    if (!pattern || !description || !severity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: pattern, description, severity'
      });
    }
    
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid severity level',
        validSeverities: ['low', 'medium', 'high', 'critical']
      });
    }
    
    const newPattern = {
      pattern,
      description,
      severity,
      autoResolve: autoResolve || false,
      notificationChannels: notificationChannels || ['log']
    };
    
    enhancedErrorTrackingService.addErrorPattern(newPattern);
    
    logger.info('New error pattern added', {
      pattern: newPattern,
      addedBy: (req as any).user?.id,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Error pattern added successfully',
      data: newPattern,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to add error pattern:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add error pattern',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Remove Error Pattern
router.delete('/errors/patterns/:pattern', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { pattern } = req.params;
    
    enhancedErrorTrackingService.removeErrorPattern(pattern);
    
    logger.info('Error pattern removed', {
      pattern,
      removedBy: (req as any).user?.id,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Error pattern removed successfully',
      data: { pattern },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to remove error pattern:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove error pattern',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// APM Health Check
router.get('/health', authenticateToken, async (req: Request, res: Response) => {
  try {
    const config = apmMiddleware.getConfig();
    const recentMetrics = apmMiddleware.getRecentMetrics(10);
    const errorMetrics = await enhancedErrorTrackingService.getErrorMetrics();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      apm: {
        enabled: config.enableDetailedMetrics,
        recentMetricsCount: recentMetrics.length,
        config: {
          slowRequestThreshold: config.slowRequestThreshold,
          errorThreshold: config.errorThreshold,
          maxMetricsHistory: config.maxMetricsHistory
        }
      },
      errorTracking: {
        enabled: true,
        totalErrorTypes: errorMetrics.length,
        criticalErrors: errorMetrics.filter(m => m.severity === 'critical').length,
        unresolvedErrors: errorMetrics.filter(m => m.resolutionStatus === 'unresolved').length
      }
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('APM health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'APM health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
