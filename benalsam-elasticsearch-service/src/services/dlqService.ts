import { Channel } from 'amqplib';
import { rabbitmqConfig } from '../config/rabbitmq';
import { supabaseConfig } from '../config/supabase';
import logger from '../config/logger';

export interface DLQMessage {
  originalMessage: any;
  originalQueue: string;
  error: string;
  retryCount: number;
  failedAt: string;
  traceId?: string;
  jobId?: number;
}

export interface DLQStats {
  totalMessages: number;
  messagesByError: Record<string, number>;
  messagesByQueue: Record<string, number>;
  oldestMessage?: string;
  newestMessage?: string;
}

class DLQService {
  private static instance: DLQService;
  private channel: Channel | null = null;
  private readonly dlqExchange = 'benalsam.dlq';
  private readonly dlqQueue = 'benalsam.dlq.messages';

  private constructor() {}

  public static getInstance(): DLQService {
    if (!DLQService.instance) {
      DLQService.instance = new DLQService();
    }
    return DLQService.instance;
  }

  /**
   * Initialize DLQ service
   */
  public async initialize(): Promise<void> {
    try {
      this.channel = await rabbitmqConfig.getChannel();
      
      if (!this.channel) {
        throw new Error('Failed to get RabbitMQ channel');
      }
      
      // Create DLQ exchange
      await this.channel.assertExchange(this.dlqExchange, 'direct', {
        durable: true,
        autoDelete: false
      });

      // Create DLQ queue
      await this.channel.assertQueue(this.dlqQueue, {
        durable: true,
        autoDelete: false,
        arguments: {
          'x-message-ttl': 7 * 24 * 60 * 60 * 1000, // 7 days TTL
          'x-max-length': 10000 // Max 10k messages
        }
      });

      // Bind DLQ queue to exchange
      await this.channel.bindQueue(this.dlqQueue, this.dlqExchange, 'failed');

      logger.info('✅ DLQ Service initialized', {
        exchange: this.dlqExchange,
        queue: this.dlqQueue
      });

    } catch (error) {
      logger.error('❌ Failed to initialize DLQ service:', error);
      throw error;
    }
  }

  /**
   * Send message to DLQ
   */
  public async sendToDLQ(
    originalMessage: any,
    originalQueue: string,
    error: Error,
    retryCount: number,
    traceId?: string,
    jobId?: number
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('DLQ service not initialized');
    }

    try {
      const dlqMessage: DLQMessage = {
        originalMessage,
        originalQueue,
        error: error.message,
        retryCount,
        failedAt: new Date().toISOString(),
        traceId,
        jobId
      };

      // Publish to DLQ
      await this.channel.publish(
        this.dlqExchange,
        'failed',
        Buffer.from(JSON.stringify(dlqMessage)),
        {
          persistent: true,
          messageId: `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          headers: {
            'x-original-queue': originalQueue,
            'x-retry-count': retryCount,
            'x-failed-at': dlqMessage.failedAt,
            'x-trace-id': traceId,
            'x-job-id': jobId
          }
        }
      );

      // Update job status in database
      if (jobId) {
        await this.updateJobStatus(jobId, 'failed', error.message, traceId);
      }

      logger.error('💀 Message sent to DLQ', {
        traceId,
        jobId,
        originalQueue,
        retryCount,
        error: error.message
      });

    } catch (dlqError) {
      logger.error('❌ Failed to send message to DLQ:', dlqError);
      throw dlqError;
    }
  }

  /**
   * Get DLQ statistics
   */
  public async getDLQStats(): Promise<DLQStats> {
    if (!this.channel) {
      throw new Error('DLQ service not initialized');
    }

    try {
      const queueInfo = await this.channel.checkQueue(this.dlqQueue);
      
      // Get messages from database for detailed stats
      const supabase = supabaseConfig.getClient();
      const { data: failedJobs } = await supabase
        .from('elasticsearch_sync_queue')
        .select('error_message, created_at')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(1000);

      const messagesByError: Record<string, number> = {};
      const messagesByQueue: Record<string, number> = {};
      let oldestMessage: string | undefined;
      let newestMessage: string | undefined;

      if (failedJobs) {
        failedJobs.forEach(job => {
          const error = job.error_message || 'Unknown error';
          messagesByError[error] = (messagesByError[error] || 0) + 1;
          
          if (!oldestMessage || job.created_at < oldestMessage) {
            oldestMessage = job.created_at;
          }
          if (!newestMessage || job.created_at > newestMessage) {
            newestMessage = job.created_at;
          }
        });
      }

      return {
        totalMessages: queueInfo.messageCount,
        messagesByError,
        messagesByQueue: { [this.dlqQueue]: queueInfo.messageCount },
        oldestMessage,
        newestMessage
      };

    } catch (error) {
      logger.error('❌ Failed to get DLQ stats:', error);
      throw error;
    }
  }

  /**
   * Replay message from DLQ
   */
  public async replayMessage(messageId: string): Promise<void> {
    if (!this.channel) {
      throw new Error('DLQ service not initialized');
    }

    try {
      // This would require implementing message retrieval from DLQ
      // For now, just log the action
      logger.info('🔄 Replaying message from DLQ', { messageId });
      
      // TODO: Implement message replay logic
      // 1. Get message from DLQ
      // 2. Send back to original queue
      // 3. Update job status to pending
      
    } catch (error) {
      logger.error('❌ Failed to replay message from DLQ:', error);
      throw error;
    }
  }

  /**
   * Clear DLQ
   */
  public async clearDLQ(): Promise<number> {
    if (!this.channel) {
      throw new Error('DLQ service not initialized');
    }

    try {
      const queueInfo = await this.channel.checkQueue(this.dlqQueue);
      const messageCount = queueInfo.messageCount;
      
      // Purge queue
      await this.channel.purgeQueue(this.dlqQueue);
      
      logger.info('🗑️ DLQ cleared', { messageCount });
      return messageCount;

    } catch (error) {
      logger.error('❌ Failed to clear DLQ:', error);
      throw error;
    }
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(
    jobId: number,
    status: string,
    errorMessage: string,
    traceId?: string
  ): Promise<void> {
    try {
      const supabase = supabaseConfig.getClient();
      const { error } = await supabase
        .from('elasticsearch_sync_queue')
        .update({
          status,
          error_message: errorMessage,
          processed_at: new Date().toISOString(),
          trace_id: traceId
        })
        .eq('id', jobId);

      if (error) {
        logger.error('❌ Failed to update job status:', error);
        throw error;
      }

      logger.info('✅ Job status updated to DLQ', {
        jobId,
        status,
        traceId
      });

    } catch (error) {
      logger.error('❌ Failed to update job status:', error);
      throw error;
    }
  }

  /**
   * Get DLQ health status
   */
  public async getHealthStatus(): Promise<{
    healthy: boolean;
    messageCount: number;
    queueExists: boolean;
  }> {
    try {
      if (!this.channel) {
        return {
          healthy: false,
          messageCount: 0,
          queueExists: false
        };
      }

      const queueInfo = await this.channel.checkQueue(this.dlqQueue);
      
      return {
        healthy: true,
        messageCount: queueInfo.messageCount,
        queueExists: true
      };

    } catch (error) {
      logger.error('❌ DLQ health check failed:', error);
      return {
        healthy: false,
        messageCount: 0,
        queueExists: false
      };
    }
  }
}

export const dlqService = DLQService.getInstance();
export default dlqService;
