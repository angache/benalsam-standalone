import { elasticsearchSyncQueue } from './elasticsearchSyncQueue';
import { processElasticsearchSyncJob } from '../processors/elasticsearchSyncProcessor';
import logger from '../utils/logger';

// Initialize all queues and processors
export const initializeQueues = () => {
  logger.info('🚀 Initializing queue processors...');

  // Elasticsearch sync queue processor
  elasticsearchSyncQueue.process(
    'elasticsearch-sync',
    3, // concurrency
    async (job) => {
      return await processElasticsearchSyncJob(job);
    }
  );

  logger.info('✅ All queue processors initialized successfully');
};

// Get all queue instances
export const getAllQueues = () => {
  return {
    elasticsearchSync: elasticsearchSyncQueue,
  };
};

// Close all queues
export const closeAllQueues = async () => {
  logger.info('🛑 Closing all queues...');

  try {
    await elasticsearchSyncQueue.close();
    logger.info('✅ All queues closed successfully');
  } catch (error) {
    logger.error('❌ Error closing queues:', error);
    throw error;
  }
};

// Get stats for all queues
export const getAllQueueStats = async () => {
  try {
    const [elasticsearchStats] = await Promise.all([
      elasticsearchSyncQueue.getJobCounts(),
    ]);

    return {
      elasticsearchSync: {
        waiting: elasticsearchStats.waiting,
        active: elasticsearchStats.active,
        completed: elasticsearchStats.completed,
        failed: elasticsearchStats.failed,
        delayed: elasticsearchStats.delayed,
        // paused: elasticsearchStats.paused, // Bull doesn't have paused in JobCounts
      },
    };
  } catch (error) {
    logger.error('❌ Error getting queue stats:', error);
    throw error;
  }
};

// Clean all queues
export const cleanAllQueues = async (
  type: 'completed' | 'failed' | 'wait' | 'active' | 'delayed' | 'paused',
  grace: number = 1000 * 60 * 60 * 24 // 24 hours
) => {
  logger.info(`🧹 Cleaning all queues (${type})...`);

  try {
    const [elasticsearchCleaned] = await Promise.all([
      elasticsearchSyncQueue.clean(grace, type),
    ]);

    const totalCleaned = elasticsearchCleaned.length;

    logger.info(`✅ Cleaned ${totalCleaned} jobs from all queues`);

    return {
      elasticsearchSync: elasticsearchCleaned.length,
      total: totalCleaned,
    };
  } catch (error) {
    logger.error('❌ Error cleaning queues:', error);
    throw error;
  }
};

// Pause all queues
export const pauseAllQueues = async () => {
  logger.info('⏸️ Pausing all queues...');

  try {
    await Promise.all([
      elasticsearchSyncQueue.pause(),
    ]);

    logger.info('✅ All queues paused successfully');
  } catch (error) {
    logger.error('❌ Error pausing queues:', error);
    throw error;
  }
};

// Resume all queues
export const resumeAllQueues = async () => {
  logger.info('▶️ Resuming all queues...');

  try {
    await Promise.all([
      elasticsearchSyncQueue.resume(),
    ]);

    logger.info('✅ All queues resumed successfully');
  } catch (error) {
    logger.error('❌ Error resuming queues:', error);
    throw error;
  }
};

export {
  elasticsearchSyncQueue,
};
