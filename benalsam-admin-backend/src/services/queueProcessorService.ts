import { createClient } from '@supabase/supabase-js';
import { AdminElasticsearchService } from './elasticsearchService';
import logger from '../config/logger';

export class QueueProcessorService {
  private supabase: any;
  private elasticsearchService: AdminElasticsearchService;
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.elasticsearchService = new AdminElasticsearchService();
  }

  /**
   * Queue processing'i başlat
   */
  async startProcessing(intervalMs: number = 5000): Promise<void> {
    if (this.isProcessing) {
      logger.warn('⚠️ Queue processing already running');
      return;
    }

    logger.info('🚀 Starting Elasticsearch queue processor...');
    this.isProcessing = true;

    // İlk işlemi hemen yap
    await this.processQueue();

    // Periyodik işlem
    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, intervalMs);
  }

  /**
   * Queue processing'i durdur
   */
  async stopProcessing(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    logger.info('🛑 Stopping Elasticsearch queue processor...');
    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Queue'daki işleri işle
   */
  private async processQueue(): Promise<void> {
    try {
      // Pending job'ları al
      const { data: jobs, error } = await this.supabase
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        logger.error('❌ Error fetching queue jobs:', error);
        return;
      }

      if (!jobs || jobs.length === 0) {
        return; // İş yok
      }

      logger.info(`🔄 Processing ${jobs.length} queue jobs...`);

      for (const job of jobs) {
        await this.processJob(job);
      }
    } catch (error) {
      // Supabase bağlantı hatası durumunda sessizce devam et
      if (error instanceof Error && error.message.includes('fetch failed')) {
        logger.debug('🔇 Queue processing skipped due to connection issue');
        return;
      }
      logger.error('❌ Error in processQueue:', error);
    }
  }

  /**
   * Tek bir job'ı işle
   */
  private async processJob(job: any): Promise<void> {
    try {
      // Job'ı processing olarak işaretle
      await this.updateJobStatus(job.id, 'processing');

      const { table_name, operation, record_id, change_data } = job;

      logger.info(`🔄 Processing job ${job.id}: ${operation} on ${table_name}:${record_id}`);

      switch (table_name) {
        case 'listings':
          await this.processListingJob(operation, record_id, change_data);
          break;
        case 'profiles':
          await this.processProfileJob(operation, record_id, change_data);
          break;
        case 'categories':
          await this.processCategoryJob(operation, record_id, change_data);
          break;
        default:
          logger.warn(`⚠️ Unknown table: ${table_name}`);
          await this.updateJobStatus(job.id, 'failed', `Unknown table: ${table_name}`);
          return;
      }

      // Job'ı completed olarak işaretle
      await this.updateJobStatus(job.id, 'completed');
      logger.info(`✅ Job ${job.id} completed successfully`);

    } catch (error) {
      logger.error(`❌ Error processing job ${job.id}:`, error);
      await this.updateJobStatus(job.id, 'failed', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Listing job'ını işle
   */
  private async processListingJob(operation: string, recordId: string, changeData: any): Promise<void> {
    try {
      switch (operation) {
        case 'INSERT':
          // Yeni listing eklendi
          if (changeData.status === 'active') {
            await this.elasticsearchService.indexDocument(recordId, this.transformListingForElasticsearch(changeData));
          }
          break;

        case 'UPDATE':
          // Listing güncellendi
          const newData = changeData.new;
          const oldData = changeData.old;

          if (newData.status === 'active' && oldData.status !== 'active') {
            // İlan onaylandı - Elasticsearch'e ekle
            await this.elasticsearchService.indexDocument(recordId, this.transformListingForElasticsearch(newData));
          } else if (newData.status === 'active' && oldData.status === 'active') {
            // Aktif ilan güncellendi - Elasticsearch'i güncelle
            await this.elasticsearchService.updateDocument(recordId, this.transformListingForElasticsearch(newData));
          } else if (newData.status !== 'active' && oldData.status === 'active') {
            // İlan deaktif edildi - Elasticsearch'ten sil
            await this.elasticsearchService.deleteDocument(recordId);
          }
          break;

        case 'DELETE':
          // Listing silindi
          await this.elasticsearchService.deleteDocument(recordId);
          break;

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      logger.error(`❌ Error processing listing job:`, error);
      throw error;
    }
  }

  /**
   * Profile job'ını işle
   */
  private async processProfileJob(operation: string, recordId: string, changeData: any): Promise<void> {
    // Profile değişiklikleri için şimdilik sadece log
    logger.info(`📝 Profile ${operation}: ${recordId}`);
    // TODO: Profile değişikliklerini ilgili listing'lere yansıt
  }

  /**
   * Category job'ını işle
   */
  private async processCategoryJob(operation: string, recordId: string, changeData: any): Promise<void> {
    // Category değişiklikleri için şimdilik sadece log
    logger.info(`📝 Category ${operation}: ${recordId}`);
    // TODO: Category değişikliklerini ilgili listing'lere yansıt
  }

  /**
   * Listing'i Elasticsearch formatına çevir
   */
  private transformListingForElasticsearch(listing: any): any {
    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      budget: listing.budget,
      location: listing.location ? {
        lat: listing.latitude,
        lon: listing.longitude,
        text: listing.location
      } : null,
      urgency: listing.urgency,
      attributes: listing.attributes || {},
      user_id: listing.user_id,
      status: listing.status,
      created_at: listing.created_at,
      updated_at: listing.updated_at,
      popularity_score: listing.popularity_score || 0,
      is_premium: listing.is_premium || false,
      tags: listing.tags || []
    };
  }

  /**
   * Job status'unu güncelle
   */
  private async updateJobStatus(jobId: number, status: string, errorMessage?: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('elasticsearch_sync_queue')
        .update({
          status,
          processed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
          error_message: errorMessage,
          retry_count: status === 'failed' ? this.supabase.sql`retry_count + 1` : undefined
        })
        .eq('id', jobId);

      if (error) {
        logger.error('❌ Error updating job status:', error);
      }
    } catch (error) {
      logger.error('❌ Error updating job status:', error);
    }
  }

  /**
   * Queue istatistiklerini al
   */
  async getQueueStats(): Promise<any> {
    try {
      const { data, error } = await this.supabase.rpc('get_elasticsearch_queue_stats');
      
      if (error) {
        logger.error('❌ Error getting queue stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('❌ Error getting queue stats:', error);
      return null;
    }
  }

  /**
   * Failed job'ları retry et
   */
  async retryFailedJobs(): Promise<number> {
    try {
      const { data: failedJobs, error } = await this.supabase
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('status', 'failed')
        .lt('retry_count', 3);

      if (error) {
        logger.error('❌ Error fetching failed jobs:', error);
        return 0;
      }

      let retryCount = 0;
      for (const job of failedJobs) {
        await this.updateJobStatus(job.id, 'pending');
        retryCount++;
      }

      logger.info(`🔄 Retried ${retryCount} failed jobs`);
      return retryCount;
    } catch (error) {
      logger.error('❌ Error retrying failed jobs:', error);
      return 0;
    }
  }
}

export default QueueProcessorService; 