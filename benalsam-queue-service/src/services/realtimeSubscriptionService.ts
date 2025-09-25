/**
 * Enterprise Event-Driven Architecture
 * 
 * @fileoverview Real-time subscription service for elasticsearch_sync_queue
 * @author Benalsam Team
 * @version 1.0.0
 */

import { supabase } from '../config/supabase';
import logger from '../config/logger';
import { rabbitmqService } from './rabbitmqService';
import { databaseCircuitBreaker } from '../utils/circuitBreaker';

interface QueueJob {
  id: number;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  change_data: any;
  status: string;
  retry_count: number;
  created_at: string;
  trace_id?: string;
}

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: QueueJob;
  old: QueueJob;
}

export class RealtimeSubscriptionService {
  private static instance: RealtimeSubscriptionService;
  private subscription: any = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds

  private constructor() {}

  public static getInstance(): RealtimeSubscriptionService {
    if (!RealtimeSubscriptionService.instance) {
      RealtimeSubscriptionService.instance = new RealtimeSubscriptionService();
    }
    return RealtimeSubscriptionService.instance;
  }

  /**
   * Start realtime subscription
   */
  async start(): Promise<void> {
    try {
      logger.info('🔄 Starting realtime subscription service...');

      // Subscribe to elasticsearch_sync_queue changes
      this.subscription = supabase
        .channel('elasticsearch_sync_queue_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT', // Only listen to INSERT events for new pending jobs
            schema: 'public',
            table: 'elasticsearch_sync_queue',
            filter: 'status=eq.pending' // Only listen to pending jobs
          },
          async (payload: any) => {
            await this.handleRealtimeEvent(payload);
          }
        )
        .subscribe((status: string) => {
          this.handleSubscriptionStatus(status);
        });

      logger.info('✅ Realtime subscription service started');
    } catch (error) {
      logger.error('❌ Failed to start realtime subscription:', error);
      throw error;
    }
  }

  /**
   * Handle realtime subscription status changes
   */
  private handleSubscriptionStatus(status: string): void {
    logger.info(`📡 Realtime subscription status: ${status}`);
    
    switch (status) {
      case 'SUBSCRIBED':
        this.isConnected = true;
        this.reconnectAttempts = 0;
        logger.info('✅ Realtime subscription connected');
        break;
      case 'CHANNEL_ERROR':
        this.isConnected = false;
        logger.error('❌ Realtime subscription channel error');
        this.handleReconnection();
        break;
      case 'TIMED_OUT':
        this.isConnected = false;
        logger.warn('⏰ Realtime subscription timed out');
        this.handleReconnection();
        break;
      case 'CLOSED':
        this.isConnected = false;
        logger.warn('🔒 Realtime subscription closed');
        this.handleReconnection();
        break;
    }
  }

  /**
   * Handle reconnection logic
   */
  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('❌ Max reconnection attempts reached, giving up');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    logger.info(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.start();
      } catch (error) {
        logger.error('❌ Reconnection failed:', error);
      }
    }, delay);
  }

  /**
   * Handle realtime events
   */
  private async handleRealtimeEvent(payload: RealtimePayload): Promise<void> {
    try {
      logger.info('📨 Received realtime event', {
        eventType: payload.eventType,
        jobId: payload.new?.id || payload.old?.id,
        status: payload.new?.status || payload.old?.status
      });

      // Only process INSERT events for new pending jobs
      if (payload.eventType === 'INSERT' && payload.new?.status === 'pending') {
        await this.processJob(payload.new);
      }
    } catch (error) {
      logger.error('❌ Error handling realtime event:', error);
    }
  }

  /**
   * Process individual job
   */
  private async processJob(job: QueueJob): Promise<void> {
    try {
      // Use circuit breaker for job processing
      await databaseCircuitBreaker.execute(
        async () => {
          // Update job status to processing
          await this.updateJobStatus(job.id, 'processing');

          // Publish to RabbitMQ
          await this.publishToRabbitMQ(job);

          // Update job status to sent
          await this.updateJobStatus(job.id, 'sent');

          logger.info('✅ Job processed successfully', {
            jobId: job.id,
            operation: job.operation,
            recordId: job.record_id
          });
        },
        'process-job'
      );
    } catch (error) {
      logger.error('❌ Error processing job:', error);
      
      // Update job status to failed
      await this.updateJobStatus(job.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(jobId: number, status: string, errorMessage?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        processed_at: new Date().toISOString()
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
        updateData.retry_count = supabase.rpc('increment_retry_count', { job_id: jobId });
      }

      const { error } = await supabase
        .from('elasticsearch_sync_queue')
        .update(updateData)
        .eq('id', jobId);

      if (error) {
        logger.error('❌ Error updating job status:', error);
      }
    } catch (error) {
      logger.error('❌ Error updating job status:', error);
    }
  }

  /**
   * Publish job to RabbitMQ
   */
  private async publishToRabbitMQ(job: QueueJob): Promise<void> {
    try {
      const message = {
        operation: job.operation,
        recordId: job.record_id,
        changeData: job.change_data,
        listingId: job.record_id,
        traceId: job.trace_id || `trace-${Date.now()}-${job.id}`
      };

      await rabbitmqService.publishMessage('elasticsearch.sync', message);
      
      logger.info('📤 Job published to RabbitMQ', {
        jobId: job.id,
        operation: job.operation,
        recordId: job.record_id
      });
    } catch (error) {
      logger.error('❌ Error publishing to RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Stop realtime subscription
   */
  async stop(): Promise<void> {
    try {
      if (this.subscription) {
        await supabase.removeChannel(this.subscription);
        this.subscription = null;
        this.isConnected = false;
        logger.info('🛑 Realtime subscription stopped');
      }
    } catch (error) {
      logger.error('❌ Error stopping realtime subscription:', error);
    }
  }

  /**
   * Get subscription status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Singleton instance
export const realtimeSubscriptionService = RealtimeSubscriptionService.getInstance();
