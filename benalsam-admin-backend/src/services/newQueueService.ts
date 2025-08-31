import { queueServiceClient, QueueJobData, QueueJobResponse } from './queueServiceClient';
import logger from '../config/logger';

export class NewQueueService {
  /**
   * Job'ı yeni queue service'e gönder
   */
  async addJob(jobData: QueueJobData): Promise<QueueJobResponse> {
    try {
      logger.info('🚀 Sending job to new Bull Queue service', {
        type: jobData.type,
        operation: jobData.operation,
        table: jobData.table,
        recordId: jobData.recordId,
      });

      const result = await queueServiceClient.addJob(jobData);
      
      logger.info('✅ Job successfully sent to new queue service', {
        jobId: result.id,
        status: result.status,
      });

      return result;
    } catch (error) {
      logger.error('❌ Failed to send job to new queue service:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        jobData,
      });
      throw error;
    }
  }

  /**
   * Queue service health check
   */
  async checkHealth(): Promise<boolean> {
    try {
      const health = await queueServiceClient.checkHealth();
      return health;
    } catch (error) {
      logger.error('❌ Queue service health check failed:', error);
      return false;
    }
  }

  /**
   * Queue stats
   */
  async getQueueStats() {
    try {
      return await queueServiceClient.getQueueStats();
    } catch (error) {
      logger.error('❌ Failed to get queue stats:', error);
      throw error;
    }
  }

  /**
   * Test job gönder
   */
  async sendTestJob(): Promise<QueueJobResponse> {
    const testJob: QueueJobData = {
      type: 'ELASTICSEARCH_SYNC',
      operation: 'INSERT',
      table: 'test_table',
      recordId: Date.now(),
      changeData: { test: 'data', timestamp: new Date().toISOString() },
    };

    return this.addJob(testJob);
  }
}

// Export singleton instance
export const newQueueService = new NewQueueService();
