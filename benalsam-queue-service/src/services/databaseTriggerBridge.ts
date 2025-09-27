import { supabase } from '../config/supabase';
import logger from '../config/logger';
import { rabbitmqService } from './rabbitmqService';
import { databaseCircuitBreaker } from '../utils/circuitBreaker';
import { realtimeSubscriptionService } from './realtimeSubscriptionService';

interface TraceContext {
  traceId: string;
  jobId: number;
  recordId: string;
  operation: string;
}

interface JobStatus {
  status: string;
  processed_at?: string;
  trace_id?: string;
  error_message?: string;
}

export class DatabaseTriggerBridge {
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private lastProcessedAt: Date | null = null;
  private processedJobsCount: number = 0;
  private errorCount: number = 0;
  private interval: number = 5000; // Default 5 saniye for faster processing
  private useRealtime: boolean = false; // Disable realtime temporarily due to timeout issues

  /**
   * Database trigger bridge'i başlat (Event-Driven Architecture)
   */
  async startProcessing(intervalMs: number = 5000): Promise<void> {
    if (this.isProcessing) {
      logger.warn('⚠️ Database trigger bridge already running');
      return;
    }

    this.isProcessing = true;
    this.interval = intervalMs;
    logger.info('🚀 Starting database trigger bridge (Event-Driven Architecture)...');

    // RabbitMQ bağlantısını kontrol et
    try {
      await rabbitmqService.connect();
      logger.info('✅ RabbitMQ connection established');
    } catch (error) {
      logger.error('❌ Failed to connect to RabbitMQ:', error);
    }

    // Try realtime subscription first
    if (this.useRealtime) {
      try {
        await realtimeSubscriptionService.start();
        logger.info('✅ Realtime subscription started - Zero polling mode active');
        
        // Start fallback polling as backup
        this.startFallbackPolling();
      } catch (error) {
        logger.error('❌ Failed to start realtime subscription, falling back to polling:', error);
        this.startPolling();
      }
    } else {
      this.startPolling();
    }

    logger.info('✅ Database trigger bridge started');
  }

  /**
   * Start traditional polling
   */
  private startPolling(): void {
    this.processingInterval = setInterval(async () => {
      // Önce stuck job'ları temizle (her 5 döngüde bir)
      if (this.processedJobsCount % 5 === 0) {
        await this.cleanupStuckJobs();
      }
      
      // Sonra pending job'ları işle
      await this.processPendingJobs();
      
      // Counter'ı artır
      this.processedJobsCount++;
    }, this.interval);
    logger.info('📊 Polling mode started with stuck job cleanup');
  }

  /**
   * Start fallback polling (backup for realtime)
   */
  private startFallbackPolling(): void {
    // Fallback polling with longer interval (60 seconds)
    setTimeout(() => {
      this.processingInterval = setInterval(async () => {
        const realtimeStatus = realtimeSubscriptionService.getStatus();
        if (!realtimeStatus.isConnected) {
          logger.warn('⚠️ Realtime disconnected, processing pending jobs via fallback polling');
          await this.processPendingJobs();
        }
      }, 60000); // 60 seconds fallback
    }, 30000); // Start fallback after 30 seconds
  }

  /**
   * Bridge'i durdur (Graceful Shutdown)
   */
  async stopProcessing(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    logger.info('🛑 Starting graceful shutdown of database trigger bridge...');
    this.isProcessing = false;

    // Stop realtime subscription gracefully
    try {
      await realtimeSubscriptionService.stop();
      logger.info('✅ Realtime subscription stopped gracefully');
    } catch (error) {
      logger.error('❌ Error stopping realtime subscription:', error);
    }

    // Stop polling interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info('✅ Polling interval stopped');
    }

    // Wait for any ongoing operations to complete (increased from 1 to 5 seconds)
    await new Promise(resolve => setTimeout(resolve, 5000));

    logger.info('✅ Database trigger bridge stopped gracefully');
  }

  /**
   * Stuck processing job'ları temizle (Enterprise Safety)
   */
  private async cleanupStuckJobs(): Promise<void> {
    try {
      // 5 dakikadan eski processing job'ları bul
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: stuckJobs, error } = await supabase
        .from('elasticsearch_sync_queue')
        .select('id, retry_count, created_at, processed_at')
        .eq('status', 'processing')
        .lt('processed_at', fiveMinutesAgo);

      if (error) {
        logger.error('❌ Error fetching stuck jobs:', error);
        return;
      }

      if (stuckJobs && stuckJobs.length > 0) {
        logger.warn(`🧹 Found ${stuckJobs.length} stuck processing jobs, cleaning up...`);
        
        for (const job of stuckJobs) {
          // Retry count'u artır ve pending'e çevir
          const newRetryCount = (job.retry_count || 0) + 1;
          
          if (newRetryCount >= 3) {
            // Max retry'e ulaştı, failed yap
            await this.updateJobStatus(
              job.id, 
              'failed', 
              'Job stuck in processing state for too long',
              { traceId: `cleanup_${job.id}_${Date.now()}`, jobId: job.id, recordId: '', operation: 'cleanup' }
            );
            logger.warn(`❌ Job ${job.id} marked as failed (max retries reached)`);
          } else {
            // Pending'e çevir ve retry count artır
            const { error: updateError } = await supabase
              .from('elasticsearch_sync_queue')
              .update({ 
                status: 'pending', 
                retry_count: newRetryCount,
                processed_at: null,
                error_message: null
              })
              .eq('id', job.id);

            if (updateError) {
              logger.error(`❌ Error cleaning up stuck job ${job.id}:`, updateError);
            } else {
              logger.info(`✅ Stuck job ${job.id} reset to pending (retry ${newRetryCount}/3)`);
            }
          }
        }
      }
    } catch (error) {
      logger.error('❌ Error in cleanupStuckJobs:', error);
    }
  }

  /**
   * Pending job'ları işle
   */
  private async processPendingJobs(): Promise<void> {
    try {
      // Circuit breaker ile database sorgusu
      const { data: pendingJobs, error } = await databaseCircuitBreaker.execute(
        async () => {
          // Timeout ile database sorgusu
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database query timeout')), 30000); // 30 saniye timeout
          });

          const queryPromise = supabase
            .from('elasticsearch_sync_queue')
            .select('id, table_name, operation, record_id, change_data, status, retry_count, created_at, trace_id')
            .eq('status', 'pending')
            .lt('retry_count', 3) // Max 3 retry
            .order('created_at', { ascending: true })
            .limit(20); // Increased batch size for better throughput

          return await Promise.race([queryPromise, timeoutPromise]) as any;
        },
        'fetch-pending-jobs'
      );

      if (error) {
        logger.error('❌ Error fetching pending jobs:', error);
        this.errorCount++;
        return;
      }

      if (!pendingJobs || pendingJobs.length === 0) {
        return; // No pending jobs
      }

      logger.info(`📥 Processing ${pendingJobs.length} pending jobs`);

      for (const job of pendingJobs) {
        await this.processJob(job);
      }

      // Reset error count on successful processing
      if (this.errorCount > 0) {
        logger.info(`✅ Processing successful, resetting error count from ${this.errorCount} to 0`);
        this.errorCount = 0;
      }

    } catch (error) {
      if (error instanceof Error && error.message === 'Database query timeout') {
        logger.warn('⏰ Database query timeout - will retry on next cycle');
      } else {
        logger.error('❌ Error in processPendingJobs:', error);
      }
      this.errorCount++;
      
      // Log error count but don't change interval (fixed interval approach)
      if (this.errorCount > 3) {
        logger.warn(`⚠️ Error count: ${this.errorCount}, but keeping fixed interval for consistency`);
      }
    }
  }

  /**
   * Tek job'ı işle
   */
  private async processJob(job: any): Promise<void> {
    const traceId = `job_${job.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const traceContext: TraceContext = {
      traceId,
      jobId: job.id,
      recordId: job.record_id,
      operation: job.operation
    };

    try {
      logger.info('🔄 Processing job', { ...traceContext, status: 'started' });
      
      await this.updateJobStatus(job.id, 'processing', undefined, traceContext);
      const queueJobData = this.transformJobData(job);

      const messageId = traceId;
      const syncRoutingKey = `listing.${job.operation.toLowerCase()}`;
      
      logger.info('📤 Publishing sync message', { 
        ...traceContext, 
        routingKey: syncRoutingKey 
      });

      const syncPublished = await rabbitmqService.publishToExchange(
        'benalsam.listings',
        syncRoutingKey,
        { ...queueJobData, traceId },
        { messageId: `${messageId}_sync` }
      );

      // Status change mesajı için doğru status'u al
      logger.info('🔍 Job change_data debug', { 
        ...traceContext, 
        changeData: JSON.stringify(job.change_data, null, 2)
      });
      
      let listingStatus = 'active'; // Default status
      if (job.change_data && job.change_data.new && job.change_data.new.status) {
        listingStatus = job.change_data.new.status.toLowerCase();
      } else if (job.change_data && job.change_data.status) {
        listingStatus = job.change_data.status.toLowerCase();
      }
      
      const statusRoutingKey = `listing.status.${listingStatus}`;
      
      logger.info('📤 Publishing status message', { 
        ...traceContext, 
        routingKey: statusRoutingKey,
        listingStatus
      });

      const statusPublished = await rabbitmqService.publishToExchange(
        'benalsam.listings',
        statusRoutingKey,
        {
          listingId: job.record_id,
          status: listingStatus,
          timestamp: new Date().toISOString(),
          traceId
        },
        { messageId: `${messageId}_status` }
      );

      const published = syncPublished && statusPublished;

      if (!published) {
        throw new Error('Failed to publish message to RabbitMQ');
      }

      await this.updateJobStatus(job.id, 'sent', undefined, traceContext);
      
      this.processedJobsCount++;
      this.lastProcessedAt = new Date();

      logger.info('✅ Job processed successfully', {
        ...traceContext,
        status: 'sent'
      });

    } catch (error) {
      logger.error('❌ Error processing job', {
        ...traceContext,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      await this.updateJobStatus(
        job.id, 
        'failed',
        error instanceof Error ? error.message : 'Unknown error',
        traceContext
      );
      
      this.errorCount++;
    }
  }

  /**
   * Job data'sını yeni queue service formatına dönüştür
   */
  private transformJobData(job: any) {
    const changeData = job.change_data;
    let operation: 'INSERT' | 'UPDATE' | 'DELETE';
    let data: any;

    if (job.operation === 'INSERT') {
      operation = 'INSERT';
      data = changeData;
    } else if (job.operation === 'UPDATE') {
      operation = 'UPDATE';
      // UPDATE için hem old hem new data'yı gönder
      data = {
        old: changeData.old,
        new: changeData.new
      };
    } else if (job.operation === 'DELETE') {
      operation = 'DELETE';
      data = changeData;
    } else {
      throw new Error(`Unknown operation: ${job.operation}`);
    }

    return {
      type: 'ELASTICSEARCH_SYNC' as const,
      operation,
      table: job.table_name,
      recordId: job.record_id,
      changeData: data
    };
  }

  /**
   * Job status'unu güncelle
   */
  private async updateJobStatus(
    jobId: number, 
    status: string, 
    errorMessage?: string,
    traceContext?: TraceContext
  ): Promise<void> {
    try {
      const updateData: JobStatus = {
        status,
        processed_at: new Date().toISOString(),
        ...(traceContext?.traceId && { trace_id: traceContext.traceId })
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

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
      } else {
        logger.info('✅ Job status updated', {
          ...traceContext,
          jobId,
          status
        });
      }

    } catch (error) {
      logger.error('❌ Error updating job status', {
        ...traceContext,
        error: error instanceof Error ? error.message : 'Unknown error',
        jobId,
        status
      });
    }
  }

  /**
   * Bridge durumunu kontrol et
   */
  async getStatus(): Promise<{ 
    isRunning: boolean; 
    lastProcessed: Date | null;
    processedJobsCount: number;
    errorCount: number;
    uptime: number;
  }> {
    return {
      isRunning: this.isProcessing,
      lastProcessed: this.lastProcessedAt,
      processedJobsCount: this.processedJobsCount,
      errorCount: this.errorCount,
      uptime: this.isProcessing ? Date.now() - (this.lastProcessedAt?.getTime() || Date.now()) : 0
    };
  }

  /**
   * Health check - bridge'in gerçekten çalışıp çalışmadığını test et
   */
  async healthCheck(): Promise<{ 
    healthy: boolean; 
    message: string; 
    details: any;
  }> {
    try {
      // 1. Bridge çalışıyor mu?
      if (!this.isProcessing) {
        return {
          healthy: false,
          message: 'Database trigger bridge is not running',
          details: { isProcessing: false }
        };
      }

      // 2. Database bağlantısı çalışıyor mu?
      const { error: dbError } = await supabase
        .from('elasticsearch_sync_queue')
        .select('count')
        .limit(1);

      if (dbError) {
        return {
          healthy: false,
          message: 'Database connection failed',
          details: { dbError: dbError.message }
        };
      }

      // 3. RabbitMQ bağlantısı çalışıyor mu?
      try {
        await rabbitmqService.connect();
      } catch (error) {
        return {
          healthy: false,
          message: 'RabbitMQ connection failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        };
      }

      // 4. Pending job'lar var mı kontrol et
      const { data: pendingJobs, error: pendingError } = await supabase
        .from('elasticsearch_sync_queue')
        .select('id, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(5);

      if (pendingError) {
        return {
          healthy: false,
          message: 'Failed to check pending jobs',
          details: { pendingError: pendingError.message }
        };
      }

      return {
        healthy: true,
        message: 'Database trigger bridge is healthy',
        details: {
          isProcessing: this.isProcessing,
          lastProcessed: this.lastProcessedAt,
          processedJobsCount: this.processedJobsCount,
          errorCount: this.errorCount,
          pendingJobsCount: pendingJobs?.length || 0,
          pendingJobs: pendingJobs?.map(j => ({ id: j.id, created_at: j.created_at })) || []
        }
      };

    } catch (error) {
      return {
        healthy: false,
        message: 'Health check failed with error',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }
}

// Export singleton instance
export const databaseTriggerBridge = new DatabaseTriggerBridge();
