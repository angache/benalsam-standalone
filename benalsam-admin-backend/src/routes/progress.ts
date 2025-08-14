import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { progressService } from '../services/progressService';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all progress
router.get('/', async (req, res) => {
  try {
    const operationType = req.query.operationType as string;
    const progress = await progressService.getAllProgress(operationType as any);
    
    return res.json({
      success: true,
      data: progress,
      message: 'Progress retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get progress', { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific progress
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const progress = await progressService.getProgress(id);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    return res.json({
      success: true,
      data: progress,
      message: 'Progress retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get progress', { progressId: req.params.id, error });
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cancel operation
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const cancelledProgress = await progressService.cancelProgress(id);
    
    if (!cancelledProgress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    return res.json({
      success: true,
      data: cancelledProgress,
      message: 'Operation cancelled successfully'
    });
  } catch (error) {
    logger.error('Failed to cancel progress', { progressId: req.params.id, error });
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel operation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get progress health
router.get('/health/status', async (req, res) => {
  try {
    const isHealthy = await progressService.isHealthy();
    
    return res.json({
      success: true,
      data: {
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      },
      message: isHealthy ? 'Progress service is healthy' : 'Progress service is unhealthy'
    });
  } catch (error) {
    logger.error('Failed to check progress service health', { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to check progress service health',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cleanup old progress (admin only)
router.post('/cleanup', async (req, res) => {
  try {
    const daysToKeep = parseInt(req.body.daysToKeep) || 7;
    const deletedCount = await progressService.cleanupOldProgress(daysToKeep);
    
    return res.json({
      success: true,
      data: {
        deletedCount,
        daysToKeep
      },
      message: `Cleaned up ${deletedCount} old progress records`
    });
  } catch (error) {
    logger.error('Failed to cleanup old progress', { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to cleanup old progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
