import { supabase } from '../config/supabase';
import logger from '../config/logger';
import { rabbitmqService } from './rabbitmqService';

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
  private interval: number = 5000; // Default 5 saniye

  /**
   * Database trigger bridge'i başlat
   */
  async startProcessing(intervalMs: number = 5000): Promise<void> {
    if (this.isProcessing) {
      logger.warn('⚠️ Database trigger bridge already running');
      return;
    }

    this.isProcessing = true;
    this.interval = intervalMs;
    logger.info('🚀 Starting database trigger bridge...');

    // RabbitMQ bağlantısını kontrol et
    try {
      await rabbitmqService.connect();
      logger.info('✅ RabbitMQ connection established');
    } catch (error) {
      logger.error('❌ Failed to connect to RabbitMQ:', error);
    }

    this.processingInterval = setInterval(async () => {
      await this.processPendingJobs();
    }, this.interval);

    logger.info('✅ Database trigger bridge started');
  }

  /**
   * Bridge'i durdur
   */
  async stopProcessing(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    logger.info('🛑 Stopping database trigger bridge...');
    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    logger.info('✅ Database trigger bridge stopped');
  }

  /**
   * Pending job'ları işle
   */
  private async processPendingJobs(): Promise<void> {
    try {
      // Timeout ile database sorgusu
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 10000); // 10 saniye timeout
      });

      const queryPromise = supabase
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      const { data: pendingJobs, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

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

    } catch (error) {
      if (error instanceof Error && error.message === 'Database query timeout') {
        logger.warn('⏰ Database query timeout - will retry on next cycle');
      } else {
        logger.error('❌ Error in processPendingJobs:', error);
      }
      this.errorCount++;
      
      // Eğer çok fazla hata varsa, interval'ı artır
      if (this.errorCount > 5) {
        logger.warn(`⚠️ Too many errors (${this.errorCount}), increasing interval to 60s`);
        this.interval = 60000; // 60 saniye
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
