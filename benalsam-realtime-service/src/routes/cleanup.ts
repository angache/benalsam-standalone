import { Router, Request, Response } from 'express';
import jobCleanupService from '../services/jobCleanupService';
import logger from '../config/logger';

const router = Router();

/**
 * Manual cleanup endpoint
 * DELETE /api/v1/cleanup?days=7
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query['days'] as string) || 7;
    
    logger.info(`🧹 Manual cleanup triggered (older than ${days} days)`);
    
    const deletedCount = await jobCleanupService.runCleanup(days);
    
    res.json({
      success: true,
      deletedCount,
      olderThanDays: days,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Manual cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get cleanup status
 * GET /api/v1/cleanup/status
 */
router.get('/status', (_req: Request, res: Response) => {
  try {
    const isRunning = jobCleanupService.isRunning();
    
    res.json({
      success: true,
      cleanupScheduler: {
        isRunning,
        schedule: '0 2 * * *',  // Daily at 2 AM
        olderThanDays: 7,
        nextRun: isRunning ? 'Tonight at 02:00 AM' : 'Not scheduled'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Get cleanup status failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as cleanupRoutes };

