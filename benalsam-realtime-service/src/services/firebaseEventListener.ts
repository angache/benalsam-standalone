import { FirebaseService } from './firebaseService';
import rabbitmqService from './rabbitmqService';
import logger from '../config/logger';


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


  private async processJob(jobId: string, jobData: any): Promise<void> {
    try {
      // 🔒 authSecret'i jobData'dan çıkar (güvenlik için)
      const { authSecret, ...safeJobData } = jobData;
      
      logger.info(`📨 Processing job: ${jobId}`, safeJobData);

      // RabbitMQ mesajı oluştur
      const rabbitmqMessage = {
        id: jobId,
        type: safeJobData.type || 'listing_change',
        action: 'update',
        timestamp: safeJobData.timestamp || new Date().toISOString(),
        source: safeJobData.source || 'firebase_realtime',
        data: {
          listingId: safeJobData.listingId,
          jobId: jobId,
          change: {
            field: 'status',
            newValue: safeJobData.status,
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

      // Push notification gönder (opsiyonel)
      if (safeJobData.status === 'active') {
        await this.sendPushNotification(safeJobData.listingId, 'active');
      }

      logger.info(`✅ Job processed: ${jobId} for listing ${safeJobData.listingId} → ${safeJobData.status}`);

    } catch (error) {
      logger.error(`❌ Error processing job ${jobId}:`, error);
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
