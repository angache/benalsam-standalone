import { supabase } from '../config/supabase';
import { newQueueService } from './newQueueService';
import logger from '../config/logger';

export class DatabaseTriggerBridge {
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Database trigger bridge'i başlat
   */
  async startProcessing(intervalMs: number = 5000): Promise<void> {
    if (this.isProcessing) {
      logger.warn('⚠️ Database trigger bridge already running');
      return;
    }

    this.isProcessing = true;
    logger.info('🚀 Starting database trigger bridge...');

    this.processingInterval = setInterval(async () => {
      await this.processPendingJobs();
    }, intervalMs);

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
      // Database'den pending job'ları al
      const { data: pendingJobs, error } = await supabase
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        logger.error('❌ Error fetching pending jobs:', error);
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
      logger.error('❌ Error in processPendingJobs:', error);
    }
  }

  /**
   * Tek job'ı işle
   */
  private async processJob(job: any): Promise<void> {
    try {
      // Job status'unu processing'e güncelle
      await this.updateJobStatus(job.id, 'processing');

      // Job data'sını yeni queue service formatına dönüştür
      const queueJobData = this.transformJobData(job);

      // Yeni queue service'e gönder
      const result = await newQueueService.addJob(queueJobData);

      // Job status'unu completed'e güncelle
      await this.updateJobStatus(job.id, 'completed');

      logger.info('✅ Job processed successfully', {
        jobId: job.id,
        queueJobId: result.id,
        table: job.table_name,
        operation: job.operation
      });

    } catch (error) {
      logger.error('❌ Error processing job:', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Job status'unu failed'e güncelle
      await this.updateJobStatus(job.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
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
  private async updateJobStatus(jobId: number, status: string, errorMessage?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        processed_at: new Date().toISOString()
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
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
   * Bridge durumunu kontrol et
   */
  async getStatus(): Promise<{ isRunning: boolean; lastProcessed: Date | null }> {
    return {
      isRunning: this.isProcessing,
      lastProcessed: null // TODO: Add last processed tracking
    };
  }
}

// Export singleton instance
export const databaseTriggerBridge = new DatabaseTriggerBridge();
