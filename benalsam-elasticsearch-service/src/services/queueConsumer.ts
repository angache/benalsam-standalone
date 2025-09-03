import { Channel, ConsumeMessage } from 'amqplib';
import { rabbitmqConfig } from '../config/rabbitmq';
import { supabaseConfig } from '../config/supabase';
import { elasticsearchConfig } from '../config/elasticsearch';
import logger from '../config/logger';
import { QueueMessage, Operation } from '../types/queue';
import { Job, JobStatus } from '../types/job';

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

    try {
      // Mesajı parse et
      const message = this.parseMessage(msg);
      
      // Job ID'yi mesaj içeriğinden al
      const jobId = this.extractJobId(message);
      
      // Job'ı getir
      job = await this.getJob(jobId);
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      // Job durumunu güncelle
      await this.updateJobStatus(job.id, 'processing');

      // Mesajı validate et
      this.validateMessage(message);

      // Mesajı işle
      await this.processMessage(message, job);

      // Başarılı - acknowledge
      this.channel.ack(msg);

      // Job durumunu güncelle
      await this.updateJobStatus(job.id, 'completed');

      logger.info('✅ Message processed successfully', {
        jobId: job.id,
        operation: message.operation,
        recordId: message.recordId
      });

    } catch (error) {
      logger.error('❌ Error processing message:', error);

      if (job) {
        const retryCount = (job.retry_count || 0) + 1;
        
        if (retryCount <= this.maxRetries) {
          // Retry
          logger.info(`🔄 Retrying job ${job.id} (attempt ${retryCount}/${this.maxRetries})`);
          await this.updateJobStatus(job.id, 'pending', {
            retry_count: retryCount,
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
          this.channel.nack(msg, false, true); // Requeue message
        } else {
          // Max retries exceeded
          logger.error(`❌ Max retries exceeded for job ${job.id}`);
          await this.updateJobStatus(job.id, 'failed', {
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
          this.channel.nack(msg, false, false); // Don't requeue
        }
      } else {
        // Job not found - reject message
        this.channel.reject(msg, false);
      }
    }
  }

  /**
   * Mesajı parse et
   */
  private parseMessage(msg: ConsumeMessage): QueueMessage {
    try {
      const content = msg.content.toString();
      return JSON.parse(content);
    } catch (error) {
      throw new Error('Invalid message format');
    }
  }

  /**
   * Job ID'yi mesajdan çıkar
   */
  private extractJobId(message: QueueMessage): number {
    const jobId = message.messageId.split('_')[1];
    if (!jobId) {
      throw new Error('Invalid message ID format');
    }
    return parseInt(jobId, 10);
  }

  /**
   * Job'ı getir
   */
  private async getJob(jobId: number): Promise<Job | null> {
    const supabase = supabaseConfig.getClient();
    const { data, error } = await supabase
      .from('elasticsearch_sync_queue')
      .select('*')
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
    additional: Partial<Job> = {}
  ): Promise<void> {
    const supabase = supabaseConfig.getClient();
    const { error } = await supabase
      .from('elasticsearch_sync_queue')
      .update({
        status,
        processed_at: new Date().toISOString(),
        ...additional
      })
      .eq('id', jobId);

    if (error) {
      logger.error('❌ Error updating job status:', error);
      throw error;
    }
  }

  /**
   * Mesajı validate et
   */
  private validateMessage(message: QueueMessage): void {
    if (!message.type || message.type !== 'ELASTICSEARCH_SYNC') {
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
   * Mesajı işle
   */
  private async processMessage(message: QueueMessage, job: Job): Promise<void> {
    const client = await elasticsearchConfig.getClient();
    const index = 'benalsam_listings';

    switch (message.operation) {
      case 'INSERT':
        await client.index({
          index,
          id: message.recordId,
          body: message.changeData,
          refresh: true
        });
        break;

      case 'UPDATE':
        await client.update({
          index,
          id: message.recordId,
          body: {
            doc: message.changeData.new,
            doc_as_upsert: true
          },
          refresh: true
        });
        break;

      case 'DELETE':
        await client.delete({
          index,
          id: message.recordId,
          refresh: true
        });
        break;

      default:
        throw new Error(`Unsupported operation: ${message.operation}`);
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
