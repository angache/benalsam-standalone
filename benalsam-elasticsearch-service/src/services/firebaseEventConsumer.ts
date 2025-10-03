import amqp from 'amqplib';
import { elasticsearchConfig } from '../config/elasticsearch';
import logger from '../config/logger';
import { createClient } from '@supabase/supabase-js';

/**
 * Firebase Event Consumer - Firebase Realtime Service'ten gelen event'leri işler
 * Supabase job tablosuna bağımlı değil, direkt mesajdan job ID alır
 */
export class FirebaseEventConsumer {
  private connection: any = null;
  private channel: any = null;
  private isConnected: boolean = false;
  private isRunning: boolean = false;
  private supabase: any = null;

  async connect(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;

      // Supabase client'ı initialize et
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        logger.info('✅ Supabase client initialized for Firebase Event Consumer');
      } else {
        logger.warn('⚠️ Supabase credentials not found, will use minimal data');
      }

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
   * Status değişikliği işle - Sadece active ilanlar ES'de kalır
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

    // Sadece active ilanlar ES'de kalır, diğerleri silinir
    if (newStatus === 'active') {
      // Active ilan - Supabase'den tam veriyi çek ve ES'de tut/oluştur
      try {
        const listingData = await this.fetchListingFromSupabase(recordId);
        
        if (listingData) {
          await client.index({
            index,
            id: recordId,
            body: {
              ...listingData,
              status: newStatus,
              updated_at: new Date().toISOString()
            },
            refresh: true
          });

          logger.info('✅ Active document with full data indexed in ES', {
            messageId: message.id,
            recordId,
            oldStatus,
            newStatus,
            action: 'INDEX_WITH_FULL_DATA',
            index: 'benalsam_listings',
            fieldsCount: Object.keys(listingData).length
          });
        } else {
          // Supabase'de veri yoksa sadece status ile oluştur
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

          logger.info('✅ Active document created with minimal data in ES', {
            messageId: message.id,
            recordId,
            newStatus,
            action: 'CREATE_MINIMAL',
            index: 'benalsam_listings'
          });
        }
      } catch (error: any) {
        logger.error('❌ Failed to index active document:', {
          messageId: message.id,
          recordId,
          error: error.message
        });
        throw error;
      }
    } else {
      // Active olmayan ilan - ES'den sil
      try {
        await client.delete({
          index,
          id: recordId,
          refresh: true
        });
        
        logger.info('🗑️ Non-active document deleted from ES', {
          messageId: message.id,
          recordId,
          oldStatus,
          newStatus,
          action: 'DELETE',
          index: 'benalsam_listings'
        });
      } catch (deleteError: any) {
        // Document zaten yoksa hata verme
        if (deleteError.meta?.statusCode === 404) {
          logger.info('ℹ️ Document already deleted from ES', {
            messageId: message.id,
            recordId,
            oldStatus,
            newStatus,
            action: 'ALREADY_DELETED',
            index: 'benalsam_listings'
          });
        } else {
          throw deleteError;
        }
      }
    }
  }

  /**
   * Supabase'den ilan verisini çek
   */
  private async fetchListingFromSupabase(listingId: string): Promise<any | null> {
    if (!this.supabase) {
      logger.warn('⚠️ Supabase client not initialized, cannot fetch listing data');
      return null;
    }

    try {
      // Önce basit query ile test edelim
      const { data, error } = await this.supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error) {
        logger.error('❌ Failed to fetch listing from Supabase:', {
          listingId,
          error: error.message
        });
        return null;
      }

      if (!data) {
        logger.warn('⚠️ Listing not found in Supabase:', { listingId });
        return null;
      }

      logger.info('✅ Listing data fetched from Supabase', {
        listingId,
        fieldsCount: Object.keys(data).length,
        fields: Object.keys(data),
        data: data
      });

      return data;

    } catch (error) {
      logger.error('❌ Error fetching listing from Supabase:', {
        listingId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
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
