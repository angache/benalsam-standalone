/**
 * Job Management Routes
 * 
 * @fileoverview Routes for job management, monitoring, and control
 * @author Benalsam Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { jobProcessorService } from '../services/jobProcessor';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../config/logger';

const router = Router();

/**
 * @route   GET /api/v1/jobs/metrics
 * @desc    Get job processing metrics
 * @access  Private
 */
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  try {
    const metrics = jobProcessorService.getMetrics();
    const queueMetrics = await jobProcessorService.getQueueMetrics();
    
    res.json({
      success: true,
      data: {
        jobMetrics: metrics,
        queueMetrics: queueMetrics
      }
    });
  } catch (error) {
    logger.error('❌ Failed to get job metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route   GET /api/v1/jobs/:id
 * @desc    Get job by ID
 * @access  Private
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
      return;
    }
    const job = jobProcessorService.getJob(id);
    
    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.error('❌ Failed to get job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route   POST /api/v1/jobs/create
 * @desc    Create a new job
 * @access  Private
 */
router.post('/create', asyncHandler(async (req: Request, res: Response) => {
  try {
    const jobData = req.body;
    const jobId = await jobProcessorService.createJob(jobData);
    
    res.json({
      success: true,
      message: 'Job created successfully',
      data: {
        jobId
      }
    });
  } catch (error) {
    logger.error('❌ Failed to create job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * @route   GET /api/v1/jobs/status/health
 * @desc    Get job processor health status
 * @access  Private
 */
router.get('/status/health', asyncHandler(async (req: Request, res: Response) => {
  try {
    const metrics = jobProcessorService.getMetrics();
    
    const health = {
      status: 'healthy',
      isProcessing: true,
      activeJobs: metrics.processingJobs,
      totalJobs: metrics.totalJobs,
      successRate: metrics.successRate,
      errorRate: metrics.errorRate,
      averageProcessingTime: metrics.averageProcessingTime
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('❌ Failed to get job processor health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job processor health',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;
