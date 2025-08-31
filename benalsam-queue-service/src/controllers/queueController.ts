import { Request, Response } from 'express';
import { getAllQueueStats, cleanAllQueues, pauseAllQueues, resumeAllQueues } from '../queues/index';
import { ApiResponse } from '../types/queue';
import logger from '../utils/logger';

// Get all queue statistics
export const getQueueStats = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('📊 Getting queue statistics', {
      userId: req.ip,
    });

    const stats = await getAllQueueStats();

    logger.info('✅ Queue statistics retrieved successfully', {
      elasticsearchSync: stats.elasticsearchSync,
    });

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Queue statistics retrieved successfully',
      timestamp: new Date().toISOString(),
    } as ApiResponse);

  } catch (error) {
    logger.error('❌ Failed to get queue statistics:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to get queue statistics',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

// Clean all queues
export const cleanQueues = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, grace } = req.body;

    logger.info('🧹 Cleaning queues', {
      type,
      grace,
      userId: req.ip,
    });

    // Validate type
    const validTypes = ['completed', 'failed', 'wait', 'active', 'delayed', 'paused'];
    if (!type || !validTypes.includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Invalid clean type',
        message: `Valid types: ${validTypes.join(', ')}`,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    const result = await cleanAllQueues(type, grace || 1000 * 60 * 60 * 24); // Default 24 hours

    logger.info('✅ Queues cleaned successfully', {
      type,
      totalCleaned: result.total,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: `Cleaned ${result.total} jobs from all queues`,
      timestamp: new Date().toISOString(),
    } as ApiResponse);

  } catch (error) {
    logger.error('❌ Failed to clean queues:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to clean queues',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

// Pause all queues
export const pauseQueues = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('⏸️ Pausing all queues', {
      userId: req.ip,
    });

    await pauseAllQueues();

    logger.info('✅ All queues paused successfully');

    res.status(200).json({
      success: true,
      data: { status: 'paused' },
      message: 'All queues paused successfully',
      timestamp: new Date().toISOString(),
    } as ApiResponse);

  } catch (error) {
    logger.error('❌ Failed to pause queues:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to pause queues',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

// Resume all queues
export const resumeQueues = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('▶️ Resuming all queues', {
      userId: req.ip,
    });

    await resumeAllQueues();

    logger.info('✅ All queues resumed successfully');

    res.status(200).json({
      success: true,
      data: { status: 'resumed' },
      message: 'All queues resumed successfully',
      timestamp: new Date().toISOString(),
    } as ApiResponse);

  } catch (error) {
    logger.error('❌ Failed to resume queues:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to resume queues',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};
