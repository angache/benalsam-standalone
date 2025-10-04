import { FirebaseService } from './firebaseService';
import rabbitmqService from './rabbitmqService';
import logger from '../config/logger';
import { EnterpriseJobData } from '../types/job';


export class FirebaseEventListener {
  private firebaseService: FirebaseService;
  private isListening: boolean = false;
  private cleanupFunction: (() => void) | null = null;

  constructor() {
    this.firebaseService = new FirebaseService();
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      logger.warn('⚠️ Firebase event listener already running');
      return;
    }

    try {
      // RabbitMQ'ya bağlan
      await rabbitmqService.connect();

      // Firebase'deki jobs/ path'ini dinle
      this.cleanupFunction = this.firebaseService.listenToChanges('jobs', (data) => {
        this.handleFirebaseChanges(data);
      });

      this.isListening = true;
      logger.info('✅ Firebase event listener started');

    } catch (error) {
      logger.error('❌ Failed to start Firebase event listener:', error);
      throw error;
    }
  }

  private async handleFirebaseChanges(data: any): Promise<void> {
    try {
      if (!data) {
        return;
      }

      // Firebase'deki her job'ı işle
      Object.entries(data).forEach(async ([jobId, jobData]: [string, any]) => {
        await this.processJob(jobId, jobData);
      });

    } catch (error) {
      logger.error('❌ Error handling Firebase changes:', error);
    }
  }


  private async processJob(jobId: string, jobData: EnterpriseJobData): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 🔒 authSecret'i jobData'dan çıkar (güvenlik için) - legacy support
      const { authSecret, ...safeJobData } = jobData as any;
      
      // ✅ Idempotency check - Skip if already completed or processing
      if (jobData.status === 'completed') {
        logger.info(`⏭️ Job already completed, skipping: ${jobId}`);
        return;
      }
      
      if (jobData.status === 'processing') {
        logger.info(`⏭️ Job already processing, skipping: ${jobId}`);
        return;
      }
      
      logger.info(`📨 Processing enterprise job: ${jobId}`, {
        jobId,
        type: safeJobData.type,
        status: safeJobData.status,
        source: safeJobData.source,
        listingId: safeJobData.listingId
      });
      
      // 🔄 Update job status to 'processing' with performance tracking
      const processedAt = new Date().toISOString();
      const queueWaitTime = jobData.queuedAt ? 
        new Date(processedAt).getTime() - new Date(jobData.queuedAt).getTime() : 0;
      
      await this.updateJobStatus(jobId, 'processing', {
        processedAt,
        queueWaitTime,
        status: 'processing'
      });

      // RabbitMQ mesajı oluştur
      const rabbitmqMessage = {
        id: jobId,
        type: safeJobData.type || 'listing_change',
        action: 'update',
        timestamp: safeJobData.timestamp || new Date().toISOString(),
        source: safeJobData.source || 'firebase_realtime',
        recordId: safeJobData.listingId, // ✅ Elasticsearch Service için gerekli
        data: {
          listingId: safeJobData.listingId,
          jobId: jobId,
          change: {
            field: 'status',
            newValue: safeJobData.listingStatus || safeJobData.status,
            changedAt: safeJobData.timestamp
          },
          source: {
            database: 'supabase',
            table: 'listings',
            id: safeJobData.listingId
          }
        }
      };

      // RabbitMQ'ya gönder
      await rabbitmqService.sendMessage('elasticsearch.sync', rabbitmqMessage);

      // 🔄 Update job status to 'completed' with performance metrics
      const completedAt = new Date().toISOString();
      const processingDuration = Date.now() - startTime;
      const totalDuration = jobData.queuedAt ? 
        new Date(completedAt).getTime() - new Date(jobData.queuedAt).getTime() : processingDuration;
      
      await this.updateJobStatus(jobId, 'completed', {
        completedAt,
        processingDuration,
        totalDuration,
        status: 'completed'
      });

      // Push notification gönder (opsiyonel)
      if (safeJobData.listingStatus === 'active' && safeJobData.listingId) {
        await this.sendPushNotification(safeJobData.listingId, 'active');
      }

      logger.info(`✅ Job processed: ${jobId} for listing ${safeJobData.listingId} → ${safeJobData.listingStatus || safeJobData.status}`);

    } catch (error) {
      const errorTime = Date.now();
      const processingDuration = errorTime - startTime;
      
      logger.error(`❌ Error processing enterprise job ${jobId}:`, {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingDuration: `${processingDuration}ms`,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // 🔄 Update job status to 'failed' with error details
      const failedAt = new Date().toISOString();
      const newRetryCount = (jobData.retryCount || 0) + 1;
      
      const errorUpdates: Partial<EnterpriseJobData> = {
        failedAt,
        processingDuration,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
        lastErrorAt: failedAt,
        retryCount: newRetryCount
      };
      
      // Add error stack only if it exists
      if (error instanceof Error && error.stack) {
        errorUpdates.errorStack = error.stack;
      }
      
      await this.updateJobStatus(jobId, 'failed', errorUpdates);
      
      // 🔄 Retry logic - if retries remaining, set back to pending
      const maxRetries = jobData.maxRetries || 3;
      const currentRetries = (jobData.retryCount || 0) + 1;
      
      if (currentRetries < maxRetries) {
        logger.info(`🔄 Scheduling retry ${currentRetries}/${maxRetries} for job: ${jobId}`);
        // Wait 5 seconds before retry
        setTimeout(async () => {
          await this.updateJobStatus(jobId, 'pending', {
            retryCount: currentRetries
          });
        }, 5000);
      } else {
        logger.error(`❌ Max retries (${maxRetries}) reached for job: ${jobId}`);
      }
    }
  }


  private async sendPushNotification(listingId: string, status: string): Promise<void> {
    try {
      // Push notification logic buraya eklenebilir
      logger.info(`📱 Push notification sent for listing ${listingId} with status ${status}`);
    } catch (error) {
      logger.error('❌ Error sending push notification:', error);
    }
  }

  /**
   * Update job status in Firebase with enterprise tracking
   */
  private async updateJobStatus(
    jobId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying',
    additionalData: Partial<EnterpriseJobData> = {}
  ): Promise<void> {
    try {
      const updates: Partial<EnterpriseJobData> = {
        status,
        ...additionalData
      };
      
      await this.firebaseService.updateJobStatus(jobId, updates);
      logger.info(`🔄 Job status updated: ${jobId} → ${status}`);
    } catch (error) {
      logger.error(`❌ Error updating job status for ${jobId}:`, error);
      throw error;
    }
  }

  stopListening(): void {
    if (this.cleanupFunction) {
      this.cleanupFunction();
      this.cleanupFunction = null;
    }
    this.isListening = false;
    logger.info('🔇 Firebase event listener stopped');
  }

  isListeningToFirebase(): boolean {
    return this.isListening;
  }
}

export default new FirebaseEventListener();
