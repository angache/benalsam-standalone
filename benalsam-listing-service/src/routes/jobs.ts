/**
 * Job Routes
 * 
 * @fileoverview Job management endpoints for Listing Service
 * @author Benalsam Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { jobProcessorService } from '../services/jobProcessor';
import { logger } from '../config/logger';
import { validateUserAuthentication } from '../utils/validation';
import { AuthenticatedRequest } from '../types/listing';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * Get job metrics
 * GET /api/v1/jobs/metrics
 */
router.get('/metrics', asyncHandler(async (_req: Request, res: Response) => {
  logger.info('📊 Getting job metrics');

  const metrics = jobProcessorService.getMetrics();
  
  res.json({
    success: true,
    data: {
      metrics,
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * Get job by ID
 * GET /api/v1/jobs/:id
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Job ID is required'
    });
    return;
  }

  logger.info('🔍 Getting job', { jobId: id, userId });

  const job = await jobProcessorService.getJob(id);
  
  if (!job) {
    res.status(404).json({
      success: false,
      message: 'Job not found'
    });
    return;
  }

  // Check if user has access to this job
  if (job.userId !== userId) {
    res.status(403).json({
      success: false,
      message: 'Access denied'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      jobId: job.id,
      type: job.type,
      status: job.status,
      priority: job.priority,
      userId: job.userId,
      payload: job.payload,
      result: job.result,
      error: job.error,
      retryCount: job.retryCount,
      maxRetries: job.maxRetries,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt,
      traceId: job.traceId
    }
  });
}));

/**
 * Cancel job
 * DELETE /api/v1/jobs/:id
 */
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Job ID is required'
    });
    return;
  }

  logger.info('❌ Cancelling job', { jobId: id, userId });

  const job = await jobProcessorService.getJob(id);
  
  if (!job) {
    res.status(404).json({
      success: false,
      message: 'Job not found'
    });
    return;
  }

  // Check if user has access to this job
  if (job.userId !== userId) {
    res.status(403).json({
      success: false,
      message: 'Access denied'
    });
    return;
  }

  const cancelled = await jobProcessorService.cancelJob(id);
  
  if (!cancelled) {
    res.status(400).json({
      success: false,
      message: 'Job cannot be cancelled'
    });
    return;
  }

  logger.info('✅ Job cancelled', { jobId: id, userId });

  res.json({
    success: true,
    data: {
      jobId: id,
      message: 'Job cancelled successfully'
    }
  });
}));

/**
 * Get job status
 * GET /api/v1/jobs/:id/status
 */
router.get('/:id/status', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Job ID is required'
    });
    return;
  }

  logger.info('📊 Getting job status', { jobId: id, userId });

  const job = await jobProcessorService.getJob(id);
  
  if (!job) {
    res.status(404).json({
      success: false,
      message: 'Job not found'
    });
    return;
  }

  // Check if user has access to this job
  if (job.userId !== userId) {
    res.status(403).json({
      success: false,
      message: 'Access denied'
    });
    return;
  }

  const progress = job.status === 'completed' ? 100 : 
                   job.status === 'failed' ? 0 : 
                   job.status === 'processing' ? 50 : 
                   job.status === 'cancelled' ? 0 : 0;

  res.json({
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      progress,
      result: job.status === 'completed' ? job.result : null,
      error: job.error || null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt
    }
  });
}));

export default router;
