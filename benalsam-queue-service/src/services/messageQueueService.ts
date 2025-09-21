import Redis from 'ioredis';
import logger from '../config/logger';

export interface QueueJob {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: string;
  retryCount?: number;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export class MessageQueueService {
  private redis: Redis;
  private queueName: string;
  private processingQueueName: string;
  private completedQueueName: string;
  private failedQueueName: string;
  private isConnected: boolean = false;

  constructor(
    redisUrl: string = process.env['REDIS_URL'] || 'redis://localhost:6379',
    queueName: string = 'elasticsearch_sync'
  ) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.queueName = queueName;
    this.processingQueueName = `${queueName}:processing`;
    this.completedQueueName = `${queueName}:completed`;
    this.failedQueueName = `${queueName}:failed`;

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.redis.on('connect', () => {
      this.isConnected = true;
      logger.info('✅ Redis connected for message queue');
    });

    this.redis.on('error', (error: Error) => {
      this.isConnected = false;
      logger.error('❌ Redis connection error:', error);
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      logger.warn('⚠️ Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      logger.info('🔄 Redis reconnecting...');
    });
  }

  /**
   * Queue'ya job ekle
   */
  async addJob(job: Omit<QueueJob, 'id' | 'timestamp'>): Promise<string> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const jobId = this.generateJobId();
      const fullJob: QueueJob = {
        ...job,
        id: jobId,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      await this.redis.lpush(this.queueName, JSON.stringify(fullJob));
      
      logger.info(`✅ Job added to queue: ${jobId} (${job.operation} on ${job.table})`);
      return jobId;
    } catch (error) {
      logger.error('❌ Error adding job to queue:', error);
      throw error;
    }
  }

  /**
   * Queue'dan job al
   */
  async getNextJob(): Promise<QueueJob | null> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const jobData = await this.redis.brpop(this.queueName, 5); // 5 saniye bekle
      
      if (!jobData || !jobData[1]) {
        return null;
      }

      const job: QueueJob = JSON.parse(jobData[1]);
      
      // Processing queue'ya taşı
      await this.redis.lpush(this.processingQueueName, JSON.stringify(job));
      
      logger.info(`🔄 Job moved to processing: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('❌ Error getting next job:', error);
      throw error;
    }
  }

  /**
   * Job'ı tamamla
   */
  async completeJob(jobId: string): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      // Processing queue'dan job'ı bul ve kaldır
      const processingJobs = await this.redis.lrange(this.processingQueueName, 0, -1);
      const jobIndex = processingJobs.findIndex((job: string) => {
        const parsedJob = JSON.parse(job);
        return parsedJob.id === jobId;
      });

      if (jobIndex !== -1) {
        const jobData = processingJobs[jobIndex];
        if (jobData) {
          await this.redis.lrem(this.processingQueueName, 1, jobData);
          
          // Completed queue'ya taşı
          await this.redis.lpush(this.completedQueueName, jobData);
        }
        
        logger.info(`✅ Job completed: ${jobId}`);
      } else {
        logger.warn(`⚠️ Job not found in processing queue: ${jobId}`);
      }
    } catch (error) {
      logger.error('❌ Error completing job:', error);
      throw error;
    }
  }

  /**
   * Job'ı başarısız olarak işaretle
   */
  async failJob(jobId: string, error: string, maxRetries: number = 3): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      // Processing queue'dan job'ı bul
      const processingJobs = await this.redis.lrange(this.processingQueueName, 0, -1);
      const jobIndex = processingJobs.findIndex((job: string) => {
        const parsedJob = JSON.parse(job);
        return parsedJob.id === jobId;
      });

      if (jobIndex !== -1) {
        const jobData = processingJobs[jobIndex];
        if (jobData) {
          const job: QueueJob = JSON.parse(jobData);
          
          await this.redis.lrem(this.processingQueueName, 1, jobData);

          // Retry count kontrol et
          if (job.retryCount && job.retryCount < maxRetries) {
            // Retry için ana queue'ya geri ekle
            job.retryCount++;
            await this.redis.lpush(this.queueName, JSON.stringify(job));
            logger.warn(`🔄 Job retry ${job.retryCount}/${maxRetries}: ${jobId}`);
          } else {
            // Failed queue'ya taşı
            job.retryCount = job.retryCount || 0;
            const failedJob = { ...job, error };
            await this.redis.lpush(this.failedQueueName, JSON.stringify(failedJob));
            logger.error(`❌ Job failed permanently: ${jobId} (${error})`);
          }
        }
      } else {
        logger.warn(`⚠️ Job not found in processing queue: ${jobId}`);
      }
    } catch (error) {
      logger.error('❌ Error failing job:', error);
      throw error;
    }
  }

  /**
   * Queue istatistiklerini al
   */
  async getStats(): Promise<QueueStats> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const [pending, processing, completed, failed] = await Promise.all([
        this.redis.llen(this.queueName),
        this.redis.llen(this.processingQueueName),
        this.redis.llen(this.completedQueueName),
        this.redis.llen(this.failedQueueName),
      ]);

      return {
        pending,
        processing,
        completed,
        failed,
        total: pending + processing + completed + failed,
      };
    } catch (error) {
      logger.error('❌ Error getting queue stats:', error);
      throw error;
    }
  }

  /**
   * Queue'yu temizle
   */
  async clearQueue(queueType: 'pending' | 'processing' | 'completed' | 'failed' = 'completed'): Promise<number> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      let queueToClear: string;
      switch (queueType) {
        case 'pending':
          queueToClear = this.queueName;
          break;
        case 'processing':
          queueToClear = this.processingQueueName;
          break;
        case 'completed':
          queueToClear = this.completedQueueName;
          break;
        case 'failed':
          queueToClear = this.failedQueueName;
          break;
        default:
          throw new Error('Invalid queue type');
      }

      const count = await this.redis.llen(queueToClear);
      await this.redis.del(queueToClear);
      
      logger.info(`🧹 Cleared ${queueType} queue: ${count} jobs`);
      return count;
    } catch (error) {
      logger.error('❌ Error clearing queue:', error);
      throw error;
    }
  }

  /**
   * Failed job'ları retry et
   */
  async retryFailedJobs(): Promise<number> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const failedJobs = await this.redis.lrange(this.failedQueueName, 0, -1);
      let retryCount = 0;

      for (const jobData of failedJobs) {
        const job: QueueJob = JSON.parse(jobData);
        
        // Retry count'u sıfırla ve ana queue'ya ekle
        job.retryCount = 0;
        await this.redis.lpush(this.queueName, JSON.stringify(job));
        retryCount++;
      }

      // Failed queue'yu temizle
      if (retryCount > 0) {
        await this.redis.del(this.failedQueueName);
      }

      logger.info(`🔄 Retried ${retryCount} failed jobs`);
      return retryCount;
    } catch (error) {
      logger.error('❌ Error retrying failed jobs:', error);
      throw error;
    }
  }

  /**
   * Queue'yu dinle (real-time)
   */
  async listenForJobs(callback: (job: QueueJob) => Promise<void>): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      logger.info('👂 Listening for jobs...');

      while (this.isConnected) {
        try {
          const job = await this.getNextJob();
          
          if (job) {
            logger.info(`📥 Processing job: ${job.id}`);
            
            try {
              await callback(job);
              await this.completeJob(job.id);
              logger.info(`✅ Job processed successfully: ${job.id}`);
            } catch (error) {
              await this.failJob(job.id, error instanceof Error ? error.message : 'Unknown error');
              logger.error(`❌ Job processing failed: ${job.id}`, error);
            }
          }
        } catch (error) {
          logger.error('❌ Error in job listener:', error);
          // Kısa bir bekleme süresi
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      logger.error('❌ Error starting job listener:', error);
      throw error;
    }
  }

  /**
   * Connection'ı kapat
   */
  async disconnect(): Promise<void> {
    try {
      this.isConnected = false;
      await this.redis.quit();
      logger.info('🔌 Redis connection closed');
    } catch (error) {
      logger.error('❌ Error disconnecting Redis:', error);
      throw error;
    }
  }

  /**
   * Connection durumunu kontrol et
   */
  isQueueConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Redis connection test
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.redis.ping();
      logger.info('✅ Redis connection test successful');
      return true;
    } catch (error) {
      logger.error('❌ Redis connection test failed:', error);
      throw error;
    }
  }

  /**
   * Job ID oluştur
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
