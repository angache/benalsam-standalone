import { Request, Response } from 'express';
import { JobType, CreateJobRequest, JobResponse, ApiResponse, JobStatus } from '../types/queue';
import { addElasticsearchSyncJob, getElasticsearchSyncJob, retryElasticsearchSyncJob, removeElasticsearchSyncJob } from '../queues/elasticsearchSyncQueue';
import logger from '../utils/logger';

// Create a new job
export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, data, priority, delay, attempts }: CreateJobRequest = req.body;

    logger.info('📝 Creating new job', {
      type,
      priority,
      delay,
      attempts,
      userId: req.ip,
    });

    // Validate job type
    if (!Object.values(JobType).includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Invalid job type',
        message: `Supported job types: ${Object.values(JobType).join(', ')}`,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    // Validate required data
    if (!data) {
      res.status(400).json({
        success: false,
        error: 'Missing job data',
        message: 'Job data is required',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    let job;

    // Create job based on type
    switch (type) {
      case JobType.ELASTICSEARCH_SYNC:
        // Transform data to match ElasticsearchSyncJobData interface
        const elasticsearchData = {
          tableName: data.table || data.tableName,
          operation: data.operation,
          recordId: data.recordId,
          changeData: data.changeData,
          userId: data.userId,
          timestamp: new Date().toISOString(),
        };
        
        job = await addElasticsearchSyncJob(elasticsearchData, {
          ...(priority !== undefined && { priority }),
          ...(delay !== undefined && { delay }),
          ...(attempts !== undefined && { attempts }),
        });
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Unsupported job type',
          message: `Job type ${type} is not yet implemented`,
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
    }

    const jobResponse: JobResponse = {
      id: job.id?.toString() || '',
      type,
      status: JobStatus.PENDING,
      data,
      createdAt: new Date(job.timestamp).toISOString(),
      attempts: attempts || 3,
      delay: delay || 0,
      priority: priority || 0,
    };

    logger.info('✅ Job created successfully', {
      jobId: job.id,
      type,
      status: JobStatus.PENDING,
    });

    res.status(201).json({
      success: true,
      data: jobResponse,
      message: 'Job created successfully',
      timestamp: new Date().toISOString(),
    } as ApiResponse<JobResponse>);

  } catch (error) {
    logger.error('❌ Failed to create job:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to create job',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

// Get job by ID
export const getJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    logger.info('🔍 Getting job details', {
      jobId: id,
      type,
      userId: req.ip,
    });

    let job;

    // Get job based on type
    switch (type) {
      case JobType.ELASTICSEARCH_SYNC:
        job = await getElasticsearchSyncJob(id!);
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid job type',
          message: 'Job type is required',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
    }

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job not found',
        message: `Job ${id} not found`,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    const jobState = await job.getState();
    const jobResponse: JobResponse = {
      id: job.id?.toString() || '',
      type: type as JobType,
      status: jobState as JobStatus,
      data: job.data,
      progress: job.progress(),
      createdAt: new Date(job.timestamp).toISOString(),
      processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
      error: job.failedReason || undefined,
      attempts: job.attemptsMade,
      priority: job.opts.priority || undefined,
    };

    logger.info('✅ Job details retrieved successfully', {
      jobId: id,
      status: jobResponse.status,
    });

    res.status(200).json({
      success: true,
      data: jobResponse,
      timestamp: new Date().toISOString(),
    } as ApiResponse<JobResponse>);

  } catch (error) {
    logger.error('❌ Failed to get job:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to get job',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

// Get all jobs
export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, limit = '10', offset = '0' } = req.query;

    logger.info('📋 Getting jobs list', {
      type,
      status,
      limit,
      offset,
      userId: req.ip,
    });

    // Validate job type
    if (!type || !Object.values(JobType).includes(type as JobType)) {
      res.status(400).json({
        success: false,
        error: 'Invalid job type',
        message: `Supported job types: ${Object.values(JobType).join(', ')}`,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    let jobs: any[] = [];

    // Get jobs based on type
    switch (type) {
      case JobType.ELASTICSEARCH_SYNC:
        // TODO: Implement pagination and filtering
        // For now, return empty array
        jobs = [];
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Unsupported job type',
          message: `Job type ${type} is not yet implemented`,
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
    }

    const jobResponses: JobResponse[] = jobs.map(job => ({
      id: job.id?.toString() || '',
      type: type as JobType,
      status: JobStatus.PENDING, // TODO: Get actual status
      data: job.data,
      createdAt: new Date().toISOString(),
    }));

    logger.info('✅ Jobs list retrieved successfully', {
      count: jobResponses.length,
      type,
    });

    res.status(200).json({
      success: true,
      data: jobResponses,
      message: `Retrieved ${jobResponses.length} jobs`,
      timestamp: new Date().toISOString(),
    } as ApiResponse<JobResponse[]>);

  } catch (error) {
    logger.error('❌ Failed to get jobs:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to get jobs',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

// Retry failed job
export const retryJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    logger.info('🔄 Retrying job', {
      jobId: id,
      type,
      userId: req.ip,
    });

    // Retry job based on type
    switch (type) {
      case JobType.ELASTICSEARCH_SYNC:
        await retryElasticsearchSyncJob(id!);
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid job type',
          message: 'Job type is required',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
    }

    logger.info('✅ Job retried successfully', {
      jobId: id,
      type,
    });

    res.status(200).json({
      success: true,
      data: { jobId: id, status: 'retried' },
      message: 'Job retried successfully',
      timestamp: new Date().toISOString(),
    } as ApiResponse);

  } catch (error) {
    logger.error('❌ Failed to retry job:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to retry job',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

// Remove job
export const removeJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    logger.info('🗑️ Removing job', {
      jobId: id,
      type,
      userId: req.ip,
    });

    let result;

    // Remove job based on type
    switch (type) {
      case JobType.ELASTICSEARCH_SYNC:
        result = await removeElasticsearchSyncJob(id!);
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid job type',
          message: 'Job type is required',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
    }

    logger.info('✅ Job removed successfully', {
      jobId: id,
      type,
    });

    res.status(200).json({
      success: true,
      data: { jobId: id, removed: result },
      message: 'Job removed successfully',
      timestamp: new Date().toISOString(),
    } as ApiResponse);

  } catch (error) {
    logger.error('❌ Failed to remove job:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to remove job',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};
