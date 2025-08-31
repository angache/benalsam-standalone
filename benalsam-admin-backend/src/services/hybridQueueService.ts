import { queueServiceClient, QueueJobData } from './queueServiceClient';
import logger from '../config/logger';

export interface HybridQueueConfig {
  useNewQueue: boolean;
  fallbackToOldQueue: boolean;
  transitionPercentage: number; // 0-100, yeni queue'ya gönderilecek job yüzdesi
}

export class HybridQueueService {
  private config: HybridQueueConfig;
  private transitionStartTime: number;
  private totalJobsProcessed: number = 0;
  private newQueueJobsProcessed: number = 0;

  constructor(config: HybridQueueConfig) {
    this.config = config;
    this.transitionStartTime = Date.now();
    
    logger.info('🚀 Hybrid Queue Service initialized', {
      useNewQueue: config.useNewQueue,
      fallbackToOldQueue: config.fallbackToOldQueue,
      transitionPercentage: config.transitionPercentage,
    });
  }

  /**
   * Job'ı hybrid olarak işle - yeni queue'ya gönder veya eski sisteme yönlendir
   */
  async processJob(jobData: QueueJobData): Promise<{ success: boolean; queue: 'new' | 'old' | 'both'; message: string }> {
    try {
      this.totalJobsProcessed++;

      // Transition logic: Yeni queue'ya gönderilecek job yüzdesi
      const shouldUseNewQueue = this.shouldUseNewQueue();
      
      if (shouldUseNewQueue) {
        // Yeni queue service'e gönder
        const result = await this.sendToNewQueue(jobData);
        if (result.success) {
          this.newQueueJobsProcessed++;
          logger.info('✅ Job sent to new queue service', {
            jobId: result.jobId,
            type: jobData.type,
            operation: jobData.operation,
            table: jobData.table,
          });
          
          return {
            success: true,
            queue: 'new',
            message: `Job sent to new queue service: ${result.jobId}`,
          };
        } else {
          // Yeni queue başarısız, eski sisteme fallback
          if (this.config.fallbackToOldQueue) {
            logger.warn('⚠️ New queue failed, falling back to old system', {
              error: result.error,
              jobData,
            });
            
            return {
              success: true,
              queue: 'old',
              message: 'Job sent to old queue system (fallback)',
            };
          } else {
            throw new Error(`New queue failed and fallback disabled: ${result.error}`);
          }
        }
      } else {
        // Eski sisteme gönder
        logger.info('📤 Job sent to old queue system', {
          type: jobData.type,
          operation: jobData.operation,
          table: jobData.table,
        });
        
        return {
          success: true,
          queue: 'old',
          message: 'Job sent to old queue system',
        };
      }
    } catch (error) {
      logger.error('❌ Hybrid queue processing failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        jobData,
      });
      
      return {
        success: false,
        queue: 'both',
        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Yeni queue service'e job gönder
   */
  private async sendToNewQueue(jobData: QueueJobData): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      // Queue service health check
      const isHealthy = await queueServiceClient.checkHealth();
      if (!isHealthy) {
        return {
          success: false,
          error: 'Queue service is not healthy',
        };
      }

      // Job'ı yeni queue'ya ekle
      const job = await queueServiceClient.addJob(jobData);
      
      return {
        success: true,
        jobId: job.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Transition logic: Yeni queue'ya gönderilecek job yüzdesi
   */
  private shouldUseNewQueue(): boolean {
    if (!this.config.useNewQueue) {
      return false;
    }

    // Transition percentage'e göre karar ver
    if (this.totalJobsProcessed === 0) {
      return Math.random() * 100 < this.config.transitionPercentage;
    }

    const currentPercentage = (this.newQueueJobsProcessed / this.totalJobsProcessed) * 100;
    const targetPercentage = this.config.transitionPercentage;
    
    // Eğer hedef yüzdeye ulaşıldıysa, yeni queue'yu daha fazla kullan
    if (currentPercentage < targetPercentage) {
      return Math.random() * 100 < (targetPercentage - currentPercentage + 10); // +10 buffer
    } else {
      return Math.random() * 100 < targetPercentage;
    }
  }

  /**
   * Transition durumunu getir
   */
  getTransitionStatus() {
    const currentPercentage = this.totalJobsProcessed > 0 
      ? (this.newQueueJobsProcessed / this.totalJobsProcessed) * 100 
      : 0;
    
    const targetPercentage = this.config.transitionPercentage;
    const isOnTrack = Math.abs(currentPercentage - targetPercentage) < 5; // 5% tolerance
    
    return {
      totalJobsProcessed: this.totalJobsProcessed,
      newQueueJobsProcessed: this.newQueueJobsProcessed,
      currentPercentage: Math.round(currentPercentage * 100) / 100,
      targetPercentage,
      isOnTrack,
      transitionStartTime: this.transitionStartTime,
      uptime: Date.now() - this.transitionStartTime,
    };
  }

  /**
   * Transition percentage'ini güncelle
   */
  updateTransitionPercentage(newPercentage: number) {
    if (newPercentage < 0 || newPercentage > 100) {
      throw new Error('Transition percentage must be between 0 and 100');
    }
    
    this.config.transitionPercentage = newPercentage;
    logger.info('🔄 Transition percentage updated', {
      newPercentage,
      currentStatus: this.getTransitionStatus(),
    });
  }

  /**
   * Yeni queue'yu tamamen aktif et
   */
  enableNewQueue() {
    this.config.transitionPercentage = 100;
    this.config.useNewQueue = true;
    logger.info('🚀 New queue service fully enabled');
  }

  /**
   * Eski queue'ya geri dön
   */
  fallbackToOldQueue() {
    this.config.transitionPercentage = 0;
    this.config.useNewQueue = false;
    logger.info('🔄 Fallback to old queue system');
  }

  /**
   * Queue service health check
   */
  async checkNewQueueHealth(): Promise<boolean> {
    try {
      return await queueServiceClient.checkHealth();
    } catch (error) {
      logger.error('❌ New queue health check failed:', error);
      return false;
    }
  }

  /**
   * Queue service stats
   */
  async getNewQueueStats() {
    try {
      return await queueServiceClient.getQueueStats();
    } catch (error) {
      logger.error('❌ Failed to get new queue stats:', error);
      return null;
    }
  }
}

// Default configuration
export const defaultHybridConfig: HybridQueueConfig = {
  useNewQueue: true,
  fallbackToOldQueue: true,
  transitionPercentage: 20, // Başlangıçta %20 yeni queue
};

// Export singleton instance
export const hybridQueueService = new HybridQueueService(defaultHybridConfig);
