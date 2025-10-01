import amqp from 'amqplib';
import { elasticsearchConfig } from '../config/elasticsearch';
import logger from '../config/logger';

/**
 * Firebase Event Consumer - Firebase Realtime Service'ten gelen event'leri işler
 * Supabase job tablosuna bağımlı değil, direkt mesajdan job ID alır
 */
export class FirebaseEventConsumer {
  private connection: any = null;
  private channel: any = null;
  private isConnected: boolean = false;
  private isRunning: boolean = false;

  async connect(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;

      logger.info('✅ Firebase Event Consumer connected to RabbitMQ');

      // Connection error handling
      this.connection.on('error', (error: any) => {
        logger.error('❌ Firebase Event Consumer connection error:', error);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        logger.warn('⚠️ Firebase Event Consumer connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      logger.error('❌ Failed to connect Firebase Event Consumer to RabbitMQ:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const queueName = 'elasticsearch.sync';
      
      // Queue'yu declare et (mevcut parametrelerle uyumlu)
      await this.channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'benalsam.listings.dlx',
          'x-dead-letter-routing-key': 'dead.letter',
          'x-message-ttl': 1000 * 60 * 60 * 24, // 24 hours (86400000)
          'x-max-retries': 3,
          'x-queue-type': 'classic'
        }
      });
      
      // Consumer'ı başlat
      await this.channel.consume(queueName, this.handleMessage.bind(this), {
        noAck: false
      });

      this.isRunning = true;
      logger.info('✅ Firebase Event Consumer started');

    } catch (error) {
      logger.error('❌ Failed to start Firebase Event Consumer:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      this.isRunning = false;
      logger.info('✅ Firebase Event Consumer stopped');
    } catch (error) {
      logger.error('❌ Error stopping Firebase Event Consumer:', error);
    }
  }

  isConsumerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Firebase event mesajını işle
   */
  private async handleMessage(msg: any): Promise<void> {
    if (!msg) return;

    const startTime = Date.now();
    let message: any = null;

    try {
      // Mesajı parse et
      message = JSON.parse(msg.content.toString());
      
      logger.info('📥 Firebase event received:', {
        messageId: message.id,
        type: message.type,
        recordId: message.recordId,
        action: message.action
      });

      // Mesajı validate et
      this.validateFirebaseMessage(message);

      // Elasticsearch işlemini yap
      await this.processFirebaseEvent(message);

      // Başarılı - acknowledge
      this.channel.ack(msg);

      const duration = Date.now() - startTime;
      logger.info('✅ Firebase event processed successfully', {
        messageId: message.id,
        duration: `${duration}ms`
      });

    } catch (error) {
      logger.error('❌ Firebase event processing failed:', {
        messageId: message?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Hata durumunda mesajı reject et (DLQ'ya gönder)
      this.channel.nack(msg, false, false);
    }
  }

  /**
   * Firebase mesajını validate et
   */
  private validateFirebaseMessage(message: any): void {
    if (!message.id) {
      throw new Error('Message ID is required');
    }
    if (!message.recordId) {
      throw new Error('Record ID is required');
    }
    if (!message.type) {
      throw new Error('Message type is required');
    }
  }

  /**
   * Firebase event'ini Elasticsearch'e işle
   */
  private async processFirebaseEvent(message: any): Promise<void> {
    const client = await elasticsearchConfig.getClient();
    const index = 'benalsam_listings';
    const recordId = message.recordId;

    try {
      logger.info('🔄 Processing Firebase event for Elasticsearch', {
        messageId: message.id,
        type: message.type,
        recordId,
        action: message.action
      });

      // Firebase event tipine göre işlem yap
      switch (message.type) {
        case 'status_change':
          await this.handleStatusChange(client, index, recordId, message);
          break;
        
        case 'listing_change':
          await this.handleListingChange(client, index, recordId, message);
          break;
        
        default:
          logger.warn('⚠️ Unknown Firebase event type, skipping:', {
            messageId: message.id,
            type: message.type
          });
      }

    } catch (error) {
      logger.error('❌ Elasticsearch operation failed for Firebase event:', {
        messageId: message.id,
        recordId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Status değişikliği işle
   */
  private async handleStatusChange(client: any, index: string, recordId: string, message: any): Promise<void> {
    const newStatus = message.data?.change?.newValue;
    const oldStatus = message.data?.change?.oldValue;

    logger.info('📝 Processing status change', {
      messageId: message.id,
      recordId,
      oldStatus,
      newStatus
    });

    // Reddedilen veya silinen ilanları ES'den sil
    if (newStatus === 'rejected' || newStatus === 'deleted') {
      try {
        await client.delete({
          index,
          id: recordId,
          refresh: true
        });
        
        logger.info('🗑️ Document deleted from ES (rejected/deleted status)', {
          messageId: message.id,
          recordId,
          oldStatus,
          newStatus
        });
      } catch (deleteError: any) {
        // Document zaten yoksa hata verme
        if (deleteError.meta?.statusCode === 404) {
          logger.info('ℹ️ Document already deleted from ES', {
            messageId: message.id,
            recordId,
            oldStatus,
            newStatus
          });
        } else {
          throw deleteError;
        }
      }
    } else {
      // Normal status güncelleme - sadece status alanını güncelle
      try {
        await client.update({
          index,
          id: recordId,
          body: {
            doc: {
              status: newStatus,
              updated_at: new Date().toISOString()
            },
            doc_as_upsert: true
          },
          refresh: true
        });

        logger.info('✅ Document status updated in ES', {
          messageId: message.id,
          recordId,
          oldStatus,
          newStatus
        });
      } catch (updateError: any) {
        // Document yoksa oluştur
        if (updateError.meta?.statusCode === 404) {
          logger.info('📄 Document not found, creating new one', {
            messageId: message.id,
            recordId,
            newStatus
          });

          await client.index({
            index,
            id: recordId,
            body: {
              id: recordId,
              status: newStatus,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            refresh: true
          });

          logger.info('✅ New document created in ES', {
            messageId: message.id,
            recordId,
            newStatus
          });
        } else {
          throw updateError;
        }
      }
    }
  }

  /**
   * Listing değişikliği işle
   */
  private async handleListingChange(client: any, index: string, recordId: string, message: any): Promise<void> {
    const changeData = message.data?.change;

    logger.info('📝 Processing listing change', {
      messageId: message.id,
      recordId,
      field: changeData?.field
    });

    // Listing verilerini güncelle
    await client.update({
      index,
      id: recordId,
      body: {
        doc: {
          ...changeData?.newValue,
          updated_at: new Date().toISOString()
        },
        doc_as_upsert: true
      },
      refresh: true
    });

    logger.info('✅ Document updated in ES', {
      messageId: message.id,
      recordId,
      field: changeData?.field
    });
  }
}

// Singleton instance
export const firebaseEventConsumer = new FirebaseEventConsumer();
export default firebaseEventConsumer;
