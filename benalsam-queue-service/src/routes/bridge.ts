import { Router, Request, Response } from 'express';
import logger from '../config/logger';
import { databaseTriggerBridge } from '../services/databaseTriggerBridge';

const router = Router();

// Bridge status endpoint
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = await databaseTriggerBridge.getStatus();
    
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        service: 'database-trigger-bridge',
        ...status
      }
    });
  } catch (error) {
    logger.error('Bridge status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Bridge status check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bridge health check endpoint
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await databaseTriggerBridge.healthCheck();
    const status = health.healthy ? 200 : 503;
    
    res.status(status).json({
      success: health.healthy,
      data: {
        timestamp: new Date().toISOString(),
        service: 'database-trigger-bridge',
        ...health
      }
    });
  } catch (error) {
    logger.error('Bridge health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Bridge health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint - manually trigger bridge processing
router.post('/test', async (_req: Request, res: Response) => {
  try {
    logger.info('🧪 Manual bridge test triggered');
    
    // Get current status before test
    const statusBefore = await databaseTriggerBridge.getStatus();
    
    res.json({
      success: true,
      message: 'Bridge test completed',
      data: {
        timestamp: new Date().toISOString(),
        statusBefore,
        note: 'Check logs for processing details'
      }
    });
  } catch (error) {
    logger.error('Bridge test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Bridge test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as bridgeRoutes };
