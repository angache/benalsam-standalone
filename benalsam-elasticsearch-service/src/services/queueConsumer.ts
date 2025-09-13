import { Channel, ConsumeMessage } from 'amqplib';
import { rabbitmqConfig } from '../config/rabbitmq';
import { supabaseConfig } from '../config/supabase';
import { elasticsearchConfig } from '../config/elasticsearch';
import logger from '../config/logger';
import { QueueMessage, Operation } from '../types/queue';
import { Job, JobStatus } from '../types/job';
import type { TableUpdate } from '../config/supabase';
import { 
  messageProcessingDuration, 
  messagesProcessedTotal, 
  messagesFailedTotal,
  updateErrorRate 
} from '../config/metrics';
import { 
  elasticsearchCircuitBreaker, 
  rabbitmqCircuitBreaker,
  getCircuitBreakerStatus 
} from '../config/circuitBreaker';
import { retryService } from './retryService';
import { dlqService } from './dlqService';
import { errorService } from './errorService';
import { ErrorType } from '../types/errors';

interface TraceContext {
  traceId: string;
  jobId: number;
  recordId: string;
  operation: string;
  messageId?: string;
}

class QueueConsumer {
  private static instance: QueueConsumer;
  private channel: Channel | null = null;
  private isProcessing: boolean = false;
  private readonly maxRetries: number = 3;

  private constructor() {}

  public static getInstance(): QueueConsumer {
    if (!QueueConsumer.instance) {
      QueueConsumer.instance = new QueueConsumer();
    }
    return QueueConsumer.instance;
  }

  /**
   * Consumer'ı başlat
   */
  public async start(): Promise<void> {
    try {
      logger.info('🚀 Starting queue consumer...');

      // RabbitMQ bağlantısını kur
      const channel = await rabbitmqConfig.getChannel();
      this.channel = channel;

      // Queue'yu kur
      await rabbitmqConfig.setupQueue();

      // Consumer'ı başlat
      const queueName = process.env.RABBITMQ_QUEUE || 'elasticsearch.sync';
      await channel.prefetch(1); // Her seferinde bir mesaj işle

      await channel.consume(queueName, this.handleMessage.bind(this), {
        noAck: false // Manual acknowledgment
      });

      this.isProcessing = true;
      logger.info('✅ Queue consumer started');

    } catch (error) {
      logger.error('❌ Failed to start queue consumer:', error);
      throw error;
    }
  }

  /**
   * Mesajı işle
   */
  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) {
      return;
    }

    let job: Job | null = null;
    let traceContext: TraceContext | undefined;
    let message: any = null; // Move message declaration outside try block
    const startTime = Date.now();

    try {
      // Mesajı parse et
      message = this.parseMessage(msg);
      
      // Status change mesajlarını yoksay
      if ('status' in message) {
        const traceId = message.traceId || `status_${message.listingId}_${Date.now()}`;
        logger.info('📝 Skipping status change message', {
          traceId,
          listingId: message.listingId,
          status: message.status,
          messageId: msg.properties.messageId
        });
        this.channel.ack(msg);
        return;
      }

      // Trace context'i oluştur
      const traceId = message.traceId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      traceContext = {
        traceId,
        jobId: 0, // Job ID'yi sonra güncelleyeceğiz
        recordId: message.recordId,
        operation: message.operation,
        messageId: msg.properties.messageId
      };

      logger.info('📥 Processing message', { ...traceContext });

      // Job ID'yi mesaj içeriğinden al
      const jobId = await this.extractJobId(message);
      traceContext.jobId = jobId;
      
      // Job'ı getir
      job = await this.getJob(jobId);
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      // Job durumunu güncelle
      await this.updateJobStatus(job.id, 'processing', undefined, traceContext);

      // Mesajı validate et
      this.validateMessage(message);

      // Mesajı işle (Circuit Breaker ile)
      await this.processMessageWithCircuitBreaker(message, job, traceContext);

      // Başarılı - acknowledge
      this.channel.ack(msg);

      // Job durumunu güncelle
      await this.updateJobStatus(job.id, 'completed', undefined, traceContext);

      // Metrics güncelle
      const duration = (Date.now() - startTime) / 1000;
      messageProcessingDuration.observe({ operation: message.operation, status: 'completed' }, duration);
      messagesProcessedTotal.inc({ operation: message.operation, status: 'completed' });
      updateErrorRate();

      logger.info('✅ Message processed successfully', {
        ...traceContext,
        status: 'completed',
        duration: `${duration}s`
      });

    } catch (error) {
      // Error Service ile hata yönetimi
      const errorType = errorService.classifyError(error instanceof Error ? error : new Error('Unknown error'));
      const customError = errorService.createError(
        errorType,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error : undefined,
        { jobId: job?.id, messageId: traceContext?.messageId, operation: traceContext?.operation },
        traceContext?.traceId
      );

      // Error Service ile hata işle
      const recoveryResult = await errorService.handleError(customError, message, job?.retry_count || 0);

      // Metrics güncelle
      const duration = (Date.now() - startTime) / 1000;
      const operation = traceContext?.operation || 'unknown';
      messageProcessingDuration.observe({ operation, status: 'failed' }, duration);
      messagesFailedTotal.inc({ operation, error_type: errorType });
      updateErrorRate();

      if (job) {
        if (recoveryResult.success) {
          // Error handled successfully
          logger.info('✅ Error handled successfully', {
            errorType,
            action: recoveryResult.action,
            jobId: job.id,
            traceId: traceContext?.traceId
          });

          // Job status'u güncelle
          const jobStatus = recoveryResult.action === 'SKIP' ? 'skipped' : 'completed';
          await this.updateJobStatus(job.id, jobStatus, undefined, traceContext);
          
          // Message'ı acknowledge et
          this.channel?.ack(msg);
        } else if (recoveryResult.action === 'RETRY') {
          // Retry scheduled
          logger.info('🔄 Retry scheduled', {
            errorType,
            retryCount: recoveryResult.retryCount,
            nextRetryAt: recoveryResult.nextRetryAt,
            jobId: job.id,
            traceId: traceContext?.traceId
          });

          // Job status'u retry olarak güncelle
          await this.updateJobStatus(job.id, 'retry', {
            retry_count: recoveryResult.retryCount,
            error_message: customError.message
          }, traceContext);
          
          // Message'ı reject et (retry için)
          this.channel?.nack(msg, false, true);
        } else {
          // Error handling failed
          logger.error('❌ Error handling failed', {
            errorType,
            action: recoveryResult.action,
            jobId: job.id,
            traceId: traceContext?.traceId
          });

          // Job status'u failed olarak güncelle
          await this.updateJobStatus(job.id, 'failed', {
            error_message: customError.message,
            error_type: errorType
          }, traceContext);
          
          // Message'ı acknowledge et
          this.channel?.ack(msg);
        }
      } else {
        // Job not found - reject message
        logger.error('❌ Job not found', {
          errorType,
          traceId: traceContext?.traceId
        });
        this.channel?.reject(msg, false);
      }
    }
  }

  /**
   * Mesajı parse et
   */
  private parseMessage(msg: ConsumeMessage): QueueMessage {
    try {
      const content = msg.content.toString();
      logger.info('📥 Received message:', { content });
      
      const message = JSON.parse(content);

      // Status change mesajı kontrolü
      if ('status' in message && 'listingId' in message) {
        logger.info('📝 Status change message received:', {
          listingId: message.listingId,
          status: message.status
        });
        return message;
      }
      
      // Elasticsearch sync mesajı validasyonu
      if (!message.recordId) {
        logger.error('❌ Invalid sync message format - missing recordId:', message);
        throw new Error('Record ID is required in sync message');
      }

      return message;
    } catch (error) {
      logger.error('❌ Failed to parse message:', error);
      throw new Error('Invalid message format');
    }
  }

  /**
   * Job ID'yi mesajdan çıkar
   */
  private async extractJobId(message: QueueMessage): Promise<number> {
    try {
      // Record ID'yi mesaj tipine göre al
      const recordId = 'recordId' in message ? message.recordId : 
                      'listingId' in message ? message.listingId : undefined;

      if (!recordId) {
        logger.error('❌ Record/Listing ID is missing from message:', message);
        throw new Error('Record/Listing ID is required');
      }

      // Supabase'den job'ı bul
      const supabase = supabaseConfig.getClient();
      const { data, error } = await supabase
        .from('elasticsearch_sync_queue')
        .select('id, created_at')
        .eq('record_id', recordId)
        .in('status', ['pending', 'processing', 'sent'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(`No job found for record ID: ${recordId}`);
      }

      // En son oluşturulan job'ı al
      return data[0].id;
    } catch (error) {
      logger.error('❌ Error extracting job ID:', error);
      throw error;
    }
  }

  /**
   * Job'ı getir
   */
  private async getJob(jobId: number): Promise<Job | null> {
    const supabase = supabaseConfig.getClient();
    const { data, error } = await supabase
      .from('elasticsearch_sync_queue')
      .select()
      .eq('id', jobId)
      .single();

    if (error) {
      logger.error('❌ Error fetching job:', error);
      throw error;
    }

    return data;
  }

  /**
   * Job durumunu güncelle
   */
  private async updateJobStatus(
    jobId: number, 
    status: JobStatus, 
    errorData?: { error_message: string; error_type?: string; retry_count?: number },
    traceContext?: TraceContext
  ): Promise<void> {
    try {
      const supabase = supabaseConfig.getClient();
      const updateData = {
        status,
        processed_at: new Date().toISOString(),
        trace_id: traceContext?.traceId,
        ...(errorData?.error_message && { error_message: errorData.error_message }),
        ...(errorData?.error_type && { error_type: errorData.error_type }),
        ...(errorData?.retry_count && { retry_count: errorData.retry_count })
      } satisfies TableUpdate<'elasticsearch_sync_queue'>;

      const { error } = await supabase
        .from('elasticsearch_sync_queue')
        .update(updateData)
        .eq('id', jobId);

      if (error) {
        logger.error('❌ Error updating job status', {
          ...traceContext,
          error,
          jobId,
          status
        });
        throw error;
      }

      logger.info('✅ Job status updated', {
        ...traceContext,
        jobId,
        status,
        ...(errorData && { errorData })
      });

    } catch (error) {
      logger.error('❌ Error updating job status', {
        ...traceContext,
        error: error instanceof Error ? error.message : 'Unknown error',
        jobId,
        status
      });
      throw error;
    }
  }

  /**
   * Mesajı validate et
   */
  private validateMessage(message: QueueMessage): void {
    // Status change mesajlarını yoksay
    if ('status' in message) {
      return;
    }

    // Elasticsearch sync mesajlarını validate et
    if (!('type' in message) || message.type !== 'ELASTICSEARCH_SYNC') {
      throw new Error('Invalid message type');
    }

    if (!message.operation || !['INSERT', 'UPDATE', 'DELETE'].includes(message.operation)) {
      throw new Error('Invalid operation type');
    }

    if (!message.table || message.table !== 'listings') {
      throw new Error('Invalid table name');
    }

    if (!message.recordId) {
      throw new Error('Record ID is required');
    }

    if (!message.changeData) {
      throw new Error('Change data is required');
    }
  }

  /**
   * Mesajı Circuit Breaker ile işle
   */
  private async processMessageWithCircuitBreaker(
    message: QueueMessage, 
    job: Job,
    traceContext?: TraceContext
  ): Promise<void> {
    // Status change mesajlarını yoksay
    if ('status' in message) {
      logger.info('📝 Skipping status change message', {
        ...traceContext,
        listingId: message.listingId,
        status: message.status
      });
      return;
    }

    // Circuit Breaker ile Elasticsearch işlemini sarmalayalım
    try {
      await elasticsearchCircuitBreaker.fire(
        message.operation,
        message,
        traceContext
      );
    } catch (error) {
      logger.error('❌ Circuit Breaker blocked Elasticsearch operation', {
        ...traceContext,
        error: error instanceof Error ? error.message : 'Unknown error',
        circuitBreakerState: elasticsearchCircuitBreaker.stats
      });
      throw error;
    }
  }

  /**
   * Mesajı işle
   */
  private async processMessage(
    message: QueueMessage, 
    job: Job,
    traceContext?: TraceContext
  ): Promise<void> {
    // Status change mesajlarını yoksay
    if ('status' in message) {
      logger.info('📝 Skipping status change message', {
        ...traceContext,
        listingId: message.listingId,
        status: message.status
      });
      return;
    }

    // Elasticsearch sync mesajlarını işle
    const client = await elasticsearchConfig.getClient();
    const index = 'benalsam_listings';

    try {
      logger.info('🔄 Processing Elasticsearch operation', {
        ...traceContext,
        operation: message.operation,
        index
      });

      switch (message.operation) {
        case 'INSERT':
          await client.index({
            index,
            id: message.recordId,
            body: message.changeData,
            refresh: true
          });

          logger.info('✅ Document indexed', {
            ...traceContext,
            operation: 'INSERT'
          });
          break;

        case 'UPDATE':
          // Status değişikliğini kontrol et
          const oldStatus = message.changeData.old?.status;
          const newStatus = message.changeData.new?.status;
          
          // Reddedilen ilanları ES'den sil
          if (newStatus === 'rejected' || newStatus === 'deleted') {
            try {
              await client.delete({
                index,
                id: message.recordId,
                refresh: true
              });
              
              logger.info('🗑️ Document deleted from ES (rejected/deleted status)', {
                ...traceContext,
                operation: 'DELETE',
                oldStatus,
                newStatus
              });
            } catch (deleteError: any) {
              // Document zaten yoksa hata verme
              if (deleteError.meta?.statusCode === 404) {
                logger.info('ℹ️ Document already deleted from ES', {
                  ...traceContext,
                  operation: 'DELETE',
                  oldStatus,
                  newStatus
                });
              } else {
                throw deleteError;
              }
            }
          } else {
            // Normal update işlemi
            await client.update({
              index,
              id: message.recordId,
              body: {
                doc: message.changeData.new,
                doc_as_upsert: true
              },
              refresh: true
            });

            logger.info('✅ Document updated', {
              ...traceContext,
              operation: 'UPDATE',
              oldStatus,
              newStatus
            });
          }
          break;

        case 'DELETE':
          await client.delete({
            index,
            id: message.recordId,
            refresh: true
          });

          logger.info('✅ Document deleted', {
            ...traceContext,
            operation: 'DELETE'
          });
          break;

        default:
          throw new Error(`Unsupported operation: ${message.operation}`);
      }

    } catch (error) {
      logger.error('❌ Elasticsearch operation failed', {
        ...traceContext,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operation: message.operation
      });
      throw error;
    }
  }


  /**
   * Consumer'ı durdur
   */
  public async stop(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      this.isProcessing = false;
      logger.info('✅ Queue consumer stopped');
    } catch (error) {
      logger.error('❌ Error stopping queue consumer:', error);
      throw error;
    }
  }

  /**
   * Consumer durumunu kontrol et
   */
  public isRunning(): boolean {
    return this.isProcessing && this.channel !== null;
  }
}

export const queueConsumer = QueueConsumer.getInstance();
export default queueConsumer;
