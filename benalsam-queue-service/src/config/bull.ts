import Queue from 'bull';
import config from './index';
import logger from '../utils/logger';
import { QueueConfig } from '../types/queue';

// Default queue configuration
export const defaultQueueConfig: QueueConfig = {
  name: 'default',
  concurrency: config.bull.concurrency,
  retryAttempts: config.bull.retryAttempts,
  retryDelay: config.bull.retryDelay,
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50, // Keep last 50 failed jobs
  backoff: {
    type: 'exponential',
    delay: config.bull.retryDelay,
  },
};

// Create queue with configuration
export const createQueue = (
  name: string,
  customConfig?: Partial<QueueConfig>
): Queue.Queue => {
  const queueConfig = {
    ...defaultQueueConfig,
    ...customConfig,
    name,
  };

  const queue = new Queue(name, {
    redis: {
      host: config.redis.host,
      port: config.redis.port,
      ...(config.redis.password && { password: config.redis.password }),
      db: config.redis.db,
    },
    prefix: config.bull.prefix,
    defaultJobOptions: {
      removeOnComplete: queueConfig.removeOnComplete,
      removeOnFail: queueConfig.removeOnFail,
      attempts: queueConfig.retryAttempts,
      backoff: queueConfig.backoff,
      delay: queueConfig.retryDelay,
    },
  });

  // Queue event handlers
  queue.on('error', (error) => {
    logger.error(`❌ Queue ${name} error:`, error);
  });

  queue.on('waiting', (jobId) => {
    logger.debug(`⏳ Job ${jobId} waiting in queue ${name}`);
  });

  queue.on('active', (job) => {
    logger.debug(`🔄 Job ${job.id} started processing in queue ${name}`, {
      jobId: job.id,
      queueName: name,
      data: job.data,
    });
  });

  queue.on('completed', (job, result) => {
    logger.info(`✅ Job ${job.id} completed in queue ${name}`, {
      jobId: job.id,
      queueName: name,
      processingTime: Date.now() - job.timestamp,
      result,
    });
  });

  queue.on('failed', (job, error) => {
    logger.error(`❌ Job ${job.id} failed in queue ${name}:`, {
      jobId: job.id,
      queueName: name,
      error: error.message,
      stack: error.stack,
      attempts: job.attemptsMade,
      data: job.data,
    });
  });

  queue.on('stalled', (jobId) => {
    logger.warn(`⚠️ Job ${jobId} stalled in queue ${name}`);
  });

  queue.on('paused', () => {
    logger.info(`⏸️ Queue ${name} paused`);
  });

  queue.on('resumed', () => {
    logger.info(`▶️ Queue ${name} resumed`);
  });

  queue.on('cleaned', (jobs, type) => {
    logger.info(`🧹 Cleaned ${jobs.length} ${type} jobs from queue ${name}`);
  });

  return queue;
};

// Get queue statistics
export const getQueueStats = async (queue: Queue.Queue) => {
  try {
    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
    ] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    const total = waiting.length + active.length + completed.length + failed.length + delayed.length;

    // Calculate average processing time for completed jobs
    let avgProcessingTime = 0;
    if (completed.length > 0) {
      const processingTimes = completed.map((job: any) => {
        return job.processedOn ? job.processedOn - job.timestamp : 0;
      }).filter((time: any) => time > 0);
      
      if (processingTimes.length > 0) {
        avgProcessingTime = processingTimes.reduce((sum: any, time: any) => sum + time, 0) / processingTimes.length;
      }
    }

    return {
      total,
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      // paused: paused.length, // Bull doesn't have getPaused method
      avgProcessingTime,
      lastProcessedAt: completed.length > 0 ? new Date(completed[0]?.processedOn || 0).toISOString() : undefined,
    };
  } catch (error) {
    logger.error('❌ Error getting queue stats:', error);
    throw error;
  }
};

// Clean queue
export const cleanQueue = async (
  queue: Queue.Queue,
  type: 'completed' | 'failed' | 'wait' | 'active' | 'delayed' | 'paused',
  grace: number = 1000 * 60 * 60 * 24 // 24 hours
) => {
  try {
    const cleaned = await queue.clean(grace, type);
    logger.info(`🧹 Cleaned ${cleaned.length} ${type} jobs from queue ${queue.name}`);
    return cleaned;
  } catch (error) {
    logger.error(`❌ Error cleaning queue ${queue.name}:`, error);
    throw error;
  }
};

// Pause queue
export const pauseQueue = async (queue: Queue.Queue) => {
  try {
    await queue.pause();
    logger.info(`⏸️ Queue ${queue.name} paused`);
  } catch (error) {
    logger.error(`❌ Error pausing queue ${queue.name}:`, error);
    throw error;
  }
};

// Resume queue
export const resumeQueue = async (queue: Queue.Queue) => {
  try {
    await queue.resume();
    logger.info(`▶️ Queue ${queue.name} resumed`);
  } catch (error) {
    logger.error(`❌ Error resuming queue ${queue.name}:`, error);
    throw error;
  }
};

// Close queue
export const closeQueue = async (queue: Queue.Queue) => {
  try {
    await queue.close();
    logger.info(`🔒 Queue ${queue.name} closed`);
  } catch (error) {
    logger.error(`❌ Error closing queue ${queue.name}:`, error);
    throw error;
  }
};
