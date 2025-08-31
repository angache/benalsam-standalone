import { createQueue } from '../config/bull';
import { JobType, ElasticsearchSyncJobData } from '../types/queue';
import logger from '../utils/logger';

// Create Elasticsearch sync queue
export const elasticsearchSyncQueue = createQueue(JobType.ELASTICSEARCH_SYNC, {
  concurrency: 3, // 3 concurrent jobs
  retryAttempts: 3,
  retryDelay: 5000,
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50, // Keep last 50 failed jobs
});

// Add job to queue
export const addElasticsearchSyncJob = async (
  data: ElasticsearchSyncJobData,
  options?: {
    priority?: number;
    delay?: number;
    attempts?: number;
  }
) => {
  try {
    const job = await elasticsearchSyncQueue.add(
      JobType.ELASTICSEARCH_SYNC,
      data,
      {
        priority: options?.priority || 0,
        delay: options?.delay || 0,
        attempts: options?.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    logger.info(`✅ Elasticsearch sync job added to queue`, {
      jobId: job.id,
      tableName: data.tableName,
      operation: data.operation,
      recordId: data.recordId,
      userId: data.userId,
    });

    return job;
  } catch (error) {
    logger.error('❌ Failed to add Elasticsearch sync job to queue:', error);
    throw error;
  }
};

// Get queue stats
export const getElasticsearchSyncQueueStats = async () => {
  try {
    const stats = await elasticsearchSyncQueue.getJobCounts();
    
    logger.info('📊 Elasticsearch sync queue stats:', stats);
    
    return {
      waiting: stats.waiting,
      active: stats.active,
      completed: stats.completed,
      failed: stats.failed,
      delayed: stats.delayed,
      // paused: stats.paused, // Bull doesn't have paused in JobCounts
    };
  } catch (error) {
    logger.error('❌ Failed to get Elasticsearch sync queue stats:', error);
    throw error;
  }
};

// Clean queue
export const cleanElasticsearchSyncQueue = async (
  type: 'completed' | 'failed' | 'wait' | 'active' | 'delayed' | 'paused',
  grace: number = 1000 * 60 * 60 * 24 // 24 hours
) => {
  try {
    const cleaned = await elasticsearchSyncQueue.clean(grace, type);
    
    logger.info(`🧹 Cleaned ${cleaned.length} ${type} jobs from Elasticsearch sync queue`);
    
    return cleaned;
  } catch (error) {
    logger.error('❌ Failed to clean Elasticsearch sync queue:', error);
    throw error;
  }
};

// Pause queue
export const pauseElasticsearchSyncQueue = async () => {
  try {
    await elasticsearchSyncQueue.pause();
    logger.info('⏸️ Elasticsearch sync queue paused');
  } catch (error) {
    logger.error('❌ Failed to pause Elasticsearch sync queue:', error);
    throw error;
  }
};

// Resume queue
export const resumeElasticsearchSyncQueue = async () => {
  try {
    await elasticsearchSyncQueue.resume();
    logger.info('▶️ Elasticsearch sync queue resumed');
  } catch (error) {
    logger.error('❌ Failed to resume Elasticsearch sync queue:', error);
    throw error;
  }
};

// Get job by ID
export const getElasticsearchSyncJob = async (jobId: string | number) => {
  try {
    const job = await elasticsearchSyncQueue.getJob(jobId);
    
    if (!job) {
      logger.warn(`⚠️ Elasticsearch sync job not found: ${jobId}`);
      return null;
    }

    return job;
  } catch (error) {
    logger.error(`❌ Failed to get Elasticsearch sync job ${jobId}:`, error);
    throw error;
  }
};

// Retry failed job
export const retryElasticsearchSyncJob = async (jobId: string | number) => {
  try {
    const job = await elasticsearchSyncQueue.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.retry();
    
    logger.info(`🔄 Elasticsearch sync job ${jobId} retried`);
    
    return job;
  } catch (error) {
    logger.error(`❌ Failed to retry Elasticsearch sync job ${jobId}:`, error);
    throw error;
  }
};

// Remove job
export const removeElasticsearchSyncJob = async (jobId: string | number) => {
  try {
    const job = await elasticsearchSyncQueue.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.remove();
    
    logger.info(`🗑️ Elasticsearch sync job ${jobId} removed`);
    
    return true;
  } catch (error) {
    logger.error(`❌ Failed to remove Elasticsearch sync job ${jobId}:`, error);
    throw error;
  }
};

export default elasticsearchSyncQueue;
