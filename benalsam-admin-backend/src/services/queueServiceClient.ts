import axios, { AxiosInstance, AxiosResponse } from 'axios';
import logger from '../config/logger';

export interface QueueJobData {
  type: 'ELASTICSEARCH_SYNC';
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  recordId: number;
  changeData?: any;
  priority?: number;
  delay?: number;
  attempts?: number;
}

export interface QueueJobResponse {
  id: string;
  type: string;
  operation: string;
  table: string;
  recordId: number;
  changeData?: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export class QueueServiceClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.QUEUE_SERVICE_URL || 'http://localhost:3004';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info('🚀 Queue Service Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        });
        return config;
      },
      (error) => {
        logger.error('❌ Queue Service Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.info('✅ Queue Service Response', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      (error) => {
        logger.error('❌ Queue Service Response Error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Add a new job to the queue
   */
  async addJob(jobData: QueueJobData): Promise<QueueJobResponse> {
    try {
      // Transform jobData to match queue service format
      const queueJobData = {
        type: 'elasticsearch-sync',
        data: {
          operation: jobData.operation,
          table: jobData.table,
          recordId: jobData.recordId,
          changeData: jobData.changeData,
        },
        priority: jobData.priority || 0,
        delay: jobData.delay || 0,
        attempts: jobData.attempts || 3,
      };

      const response = await this.client.post<QueueServiceResponse<QueueJobResponse>>(
        '/api/v1/queue/jobs',
        queueJobData
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to add job to queue');
      }

      return response.data.data;
    } catch (error) {
      logger.error('❌ Failed to add job to queue:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        jobData,
      });
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<QueueJobResponse> {
    try {
      const response = await this.client.get<QueueServiceResponse<QueueJobResponse>>(
        `/api/v1/queue/jobs/${jobId}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Job not found');
      }

      return response.data.data;
    } catch (error) {
      logger.error('❌ Failed to get job:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        jobId,
      });
      throw error;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<void> {
    try {
      const response = await this.client.put<QueueServiceResponse>(
        `/api/v1/queue/jobs/${jobId}/retry`
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to retry job');
      }

      logger.info('✅ Job retried successfully', { jobId });
    } catch (error) {
      logger.error('❌ Failed to retry job:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        jobId,
      });
      throw error;
    }
  }

  /**
   * Remove a job from the queue
   */
  async removeJob(jobId: string): Promise<void> {
    try {
      const response = await this.client.delete<QueueServiceResponse>(
        `/api/v1/queue/jobs/${jobId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to remove job');
      }

      logger.info('✅ Job removed successfully', { jobId });
    } catch (error) {
      logger.error('❌ Failed to remove job:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        jobId,
      });
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    try {
      const response = await this.client.get<QueueServiceResponse>(
        '/api/v1/queue/queues/stats'
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to get queue stats');
      }

      return response.data.data;
    } catch (error) {
      logger.error('❌ Failed to get queue stats:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check queue service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get<QueueServiceResponse>(
        '/api/v1/queue/health'
      );

      return response.data.success && response.data.data?.status === 'healthy';
    } catch (error) {
      logger.error('❌ Queue service health check failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Pause all queues
   */
  async pauseQueues(): Promise<void> {
    try {
      const response = await this.client.post<QueueServiceResponse>(
        '/api/v1/queue/queues/pause'
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to pause queues');
      }

      logger.info('✅ All queues paused successfully');
    } catch (error) {
      logger.error('❌ Failed to pause queues:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Resume all queues
   */
  async resumeQueues(): Promise<void> {
    try {
      const response = await this.client.post<QueueServiceResponse>(
        '/api/v1/queue/queues/resume'
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to resume queues');
      }

      logger.info('✅ All queues resumed successfully');
    } catch (error) {
      logger.error('❌ Failed to resume queues:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Clean completed jobs
   */
  async cleanCompletedJobs(olderThan?: number): Promise<void> {
    try {
      const response = await this.client.post<QueueServiceResponse>(
        '/api/v1/queue/queues/clean',
        {
          queueName: 'elasticsearchSync',
          clean: 'completed',
          olderThan: olderThan || 24 * 60 * 60 * 1000, // Default: 24 hours
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to clean completed jobs');
      }

      logger.info('✅ Completed jobs cleaned successfully');
    } catch (error) {
      logger.error('❌ Failed to clean completed jobs:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Export singleton instance
export const queueServiceClient = new QueueServiceClient();
