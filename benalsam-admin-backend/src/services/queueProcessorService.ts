import { createClient } from '@supabase/supabase-js';
import { AdminElasticsearchService } from './elasticsearchService';
import logger from '../config/logger';

interface QueueJob {
  id: number;
  table_name: string;
  operation: string;
  record_id: string;
  change_data: any;
  status: string;
  created_at: string;
  processed_at?: string;
  error_message?: string;
  retry_count: number;
}

interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  stuck: number;
  avgProcessingTime: number;
  lastProcessedAt?: string;
}

export class QueueProcessorService {
  private supabase: any;
  private elasticsearchService: AdminElasticsearchService;
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private stuckJobTimeout: number = 30 * 1000; // 30 saniye (çok agresif)
  private maxRetries: number = 3;
  private batchSize: number = 5;
  private processingTimeout: number = 30 * 1000; // 30 saniye
  private stats: QueueStats = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    stuck: 0,
    avgProcessingTime: 0
  };

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

    logger.info('🚀 Starting enhanced Elasticsearch queue processor...');
    this.isProcessing = true;

    // İlk işlemi hemen yap
    await this.processQueue();

    // Periyodik işlem
    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, intervalMs);

    // Health check interval
    this.healthCheckInterval = setInterval(async () => {
      await this.healthCheck();
    }, 15000); // 15 saniye (daha sık kontrol)

    logger.info('✅ Enhanced queue processor started successfully');
  }

  /**
   * Queue processing'i durdur
   */
  async stopProcessing(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    logger.info('🛑 Stopping enhanced Elasticsearch queue processor...');
    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    logger.info('✅ Enhanced queue processor stopped');
  }

  /**
   * Health check - stuck job'ları tespit et ve düzelt (Enhanced)
   */
  private async healthCheck(): Promise<void> {
    try {
      const stuckJobs = await this.detectStuckJobs();
      
      if (stuckJobs.length > 0) {
        logger.warn(`⚠️ Found ${stuckJobs.length} stuck jobs, auto-fixing...`);
        
        let fixedCount = 0;
        let failedCount = 0;
        
        for (const job of stuckJobs) {
          try {
            await this.resetStuckJob(job);
            fixedCount++;
          } catch (error) {
            logger.error(`❌ Failed to reset stuck job ${job.id}:`, error);
            failedCount++;
          }
        }
        
        logger.info(`✅ Health check completed: ${fixedCount} jobs fixed, ${failedCount} failed`);
        
        // Eğer çok fazla stuck job varsa uyarı ver
        if (stuckJobs.length > 5) {
          logger.error(`🚨 CRITICAL: ${stuckJobs.length} stuck jobs detected! Queue processor may have issues.`);
        }
      } else {
        logger.debug('✅ Health check: No stuck jobs found');
      }

      // Stats güncelle
      await this.updateStats();
      
    } catch (error) {
      logger.error('❌ Error in health check:', error);
    }
  }

  /**
   * Stuck job'ları tespit et (Enhanced)
   */
  private async detectStuckJobs(): Promise<any[]> {
    try {
      const cutoffTime = new Date(Date.now() - this.stuckJobTimeout);
      
      // 1. Zaman bazlı stuck job'lar
      const { data: timeBasedStuckJobs, error: timeError } = await this.supabase
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('status', 'processing')
        .lt('created_at', cutoffTime.toISOString());

      if (timeError) {
        logger.error('❌ Error detecting time-based stuck jobs:', timeError);
      }

      // 2. Çok uzun süredir processing'de olan job'lar (10 dakika)
      const longStuckCutoff = new Date(Date.now() - 10 * 60 * 1000);
      const { data: longStuckJobs, error: longError } = await this.supabase
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('status', 'processing')
        .lt('created_at', longStuckCutoff.toISOString());

      if (longError) {
        logger.error('❌ Error detecting long stuck jobs:', longError);
      }

      // 3. Çok fazla retry yapmış ama hala processing'de olan job'lar
      const { data: highRetryJobs, error: retryError } = await this.supabase
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('status', 'processing')
        .gte('retry_count', 2);

      if (retryError) {
        logger.error('❌ Error detecting high retry jobs:', retryError);
      }

      // Tüm stuck job'ları birleştir ve unique yap
      const allStuckJobs = [
        ...(timeBasedStuckJobs || []),
        ...(longStuckJobs || []),
        ...(highRetryJobs || [])
      ];

      const uniqueStuckJobs = allStuckJobs.filter((job, index, self) => 
        index === self.findIndex(j => j.id === job.id)
      );

      if (uniqueStuckJobs.length > 0) {
        logger.warn(`⚠️ Detected ${uniqueStuckJobs.length} stuck jobs:`, 
          uniqueStuckJobs.map(job => ({
            id: job.id,
            table: job.table_name,
            operation: job.operation,
            retryCount: job.retry_count,
            stuckFor: Math.round((Date.now() - new Date(job.created_at).getTime()) / 1000 / 60) + ' minutes'
          }))
        );
      }

      return uniqueStuckJobs;
    } catch (error) {
      logger.error('❌ Error detecting stuck jobs:', error);
      return [];
    }
  }

  /**
   * Stuck job'ı reset et (Enhanced)
   */
  private async resetStuckJob(job: any): Promise<void> {
    try {
      const stuckDuration = Math.round((Date.now() - new Date(job.created_at).getTime()) / 1000 / 60);
      const retryCount = job.retry_count || 0;
      
      // Eğer çok fazla retry yapmışsa failed olarak işaretle
      if (retryCount >= this.maxRetries) {
        await this.updateJobStatus(
          job.id, 
          'failed', 
          `Job stuck for ${stuckDuration} minutes and exceeded max retries (${this.maxRetries})`
        );
        logger.warn(`❌ Marked stuck job ${job.id} as failed (max retries exceeded)`);
      } else {
        // Normal reset
        await this.updateJobStatus(
          job.id, 
          'pending', 
          `Reset from stuck state (stuck for ${stuckDuration} minutes, retry ${retryCount + 1}/${this.maxRetries})`
        );
        logger.info(`🔄 Reset stuck job ${job.id} to pending (stuck for ${stuckDuration} minutes)`);
      }
    } catch (error) {
      logger.error(`❌ Error resetting stuck job ${job.id}:`, error);
    }
  }

  /**
   * Queue'daki işleri işle (Enhanced)
   */
  private async processQueue(): Promise<void> {
    try {
      // Pending job'ları al (batch size kadar)
      const { data: jobs, error } = await this.supabase
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(this.batchSize);

      if (error) {
        logger.error('❌ Error fetching queue jobs:', error);
        return;
      }

      if (!jobs || jobs.length === 0) {
        return; // İş yok
      }

      logger.info(`🔄 Processing ${jobs.length} queue jobs (batch ${this.batchSize})...`);

      // Batch processing
      const promises = jobs.map((job: any) => this.processJobWithTimeout(job));
      const results = await Promise.allSettled(promises);

      // Sonuçları analiz et
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(`✅ Batch completed: ${successful} successful, ${failed} failed`);

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
   * Job'ı timeout ile işle
   */
  private async processJobWithTimeout(job: QueueJob): Promise<void> {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job processing timeout')), this.processingTimeout);
      });

      const jobPromise = this.processJob(job);

      await Promise.race([jobPromise, timeoutPromise]);
    } catch (error) {
      logger.error(`❌ Job ${job.id} failed or timed out:`, error);
      
      // Job'ı failed olarak işaretle
      await this.updateJobStatus(job.id, 'failed', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Tek bir job'ı işle (Enhanced)
   */
  private async processJob(job: QueueJob): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Job'ı processing olarak işaretle
      await this.updateJobStatus(job.id, 'processing');

      const { table_name, operation, record_id, change_data } = job;

      logger.info(`🔄 Processing job ${job.id}: ${operation} on ${table_name}:${record_id}`);

      // Retry count kontrolü
      if (job.retry_count >= this.maxRetries) {
        throw new Error(`Max retries (${this.maxRetries}) exceeded`);
      }

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
        case 'category_ai_suggestions':
          await this.processAiSuggestionJob(operation, record_id, change_data);
          break;
        case 'inventory_items':
          await this.processInventoryJob(operation, record_id, change_data);
          break;
        default:
          logger.warn(`⚠️ Unknown table: ${table_name}`);
          await this.updateJobStatus(job.id, 'failed', `Unknown table: ${table_name}`);
          return;
      }

      // Job'ı completed olarak işaretle
      await this.updateJobStatus(job.id, 'completed');
      
      const processingTime = Date.now() - startTime;
      logger.info(`✅ Job ${job.id} completed successfully in ${processingTime}ms`);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error(`❌ Error processing job ${job.id} (${processingTime}ms):`, error);
      
      // Retry logic
      if (job.retry_count < this.maxRetries) {
        await this.updateJobStatus(job.id, 'pending', `Retry ${job.retry_count + 1}/${this.maxRetries}: ${error instanceof Error ? error.message : String(error)}`);
        logger.info(`🔄 Job ${job.id} queued for retry (${job.retry_count + 1}/${this.maxRetries})`);
      } else {
        await this.updateJobStatus(job.id, 'failed', `Max retries exceeded: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Listing job'ını işle (Enhanced)
   */
  private async processListingJob(operation: string, recordId: string, changeData: any): Promise<void> {
    try {
      switch (operation) {
        case 'INSERT':
          // Yeni listing eklendi
          if (changeData.status === 'active') {
            await this.elasticsearchService.indexDocument(recordId, this.transformListingForElasticsearch(changeData));
            
            // Kategori sayıları cache'ini temizle
            await this.elasticsearchService.invalidateCategoryCountsCache();
            logger.info(`✅ Category counts cache invalidated after new listing: ${recordId}`);
          }
          break;

        case 'UPDATE':
          // Listing güncellendi
          const newData = changeData.new;
          const oldData = changeData.old;

          if (newData.status === 'active' && oldData.status !== 'active') {
            // İlan onaylandı - Elasticsearch'e ekle
            await this.elasticsearchService.indexDocument(recordId, this.transformListingForElasticsearch(newData));
            
            // Kategori sayıları cache'ini temizle
            await this.elasticsearchService.invalidateCategoryCountsCache();
            logger.info(`✅ Category counts cache invalidated after listing approval: ${recordId}`);
          } else if (newData.status === 'active' && oldData.status === 'active') {
            // Aktif ilan güncellendi - Elasticsearch'i güncelle
            await this.elasticsearchService.updateDocument(recordId, this.transformListingForElasticsearch(newData));
            
            // Kategori değişmişse cache'i temizle (category_id veya category name)
            if (newData.category_id !== oldData.category_id || newData.category !== oldData.category) {
              await this.elasticsearchService.invalidateCategoryCountsCache();
              logger.info(`✅ Category counts cache invalidated after category change: ${recordId} (${oldData.category} → ${newData.category})`);
            }
          } else if (newData.status !== 'active' && oldData.status === 'active') {
            // İlan deaktif edildi - Elasticsearch'ten sil
            await this.elasticsearchService.deleteDocument(recordId);
            
            // Kategori sayıları cache'ini temizle
            await this.elasticsearchService.invalidateCategoryCountsCache();
            logger.info(`✅ Category counts cache invalidated after listing deactivation: ${recordId}`);
          }
          break;

        case 'DELETE':
          // Listing silindi
          await this.elasticsearchService.deleteDocument(recordId);
          
          // Kategori sayıları cache'ini temizle
          await this.elasticsearchService.invalidateCategoryCountsCache();
          logger.info(`✅ Category counts cache invalidated after listing deletion: ${recordId}`);
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
   * Profile job'ını işle (Enhanced)
   */
  private async processProfileJob(operation: string, recordId: string, changeData: any): Promise<void> {
    try {
      // Profile değişiklikleri için şimdilik sadece log
      logger.info(`📝 Profile ${operation}: ${recordId}`);
      // TODO: Profile değişikliklerini ilgili listing'lere yansıt
    } catch (error) {
      logger.error(`❌ Error processing profile job:`, error);
      throw error;
    }
  }

  /**
   * Category job'ını işle (Enhanced)
   */
  private async processCategoryJob(operation: string, recordId: string, changeData: any): Promise<void> {
    try {
      // Category değişiklikleri için şimdilik sadece log
      logger.info(`📝 Category ${operation}: ${recordId}`);
      // TODO: Category değişikliklerini ilgili listing'lere yansıt
    } catch (error) {
      logger.error(`❌ Error processing category job:`, error);
      throw error;
    }
  }

  /**
   * Inventory job'ını işle (Enhanced)
   */
  private async processInventoryJob(operation: string, recordId: string, changeData: any): Promise<void> {
    try {
      switch (operation) {
        case 'INSERT':
          // Yeni inventory item eklendi
          logger.info(`📦 New inventory item added: ${recordId}`);
          // TODO: Inventory-specific processing (e.g., recommendation updates, analytics)
          break;

        case 'UPDATE':
          // Inventory item güncellendi
          const newData = changeData.new;
          const oldData = changeData.old;
          
          logger.info(`📦 Inventory item updated: ${recordId}`);
          
          // Eğer imaj değişikliği varsa Cloudinary işlemleri
          if (newData.main_image_url !== oldData.main_image_url || 
              JSON.stringify(newData.additional_image_urls) !== JSON.stringify(oldData.additional_image_urls)) {
            logger.info(`🖼️ Image change detected for inventory item: ${recordId}`);
            // TODO: Cloudinary cleanup for old images
          }
          break;

        case 'DELETE':
          // Inventory item silindi
          logger.info(`🗑️ Inventory item deleted: ${recordId}`);
          
          // Cloudinary'den imajları sil
          if (changeData && changeData.main_image_url || changeData?.additional_image_urls) {
            await this.cleanupInventoryImages(changeData);
          }
          break;

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      logger.error(`❌ Error processing inventory job:`, error);
      throw error;
    }
  }

  /**
   * Inventory imajlarını Cloudinary'den temizle
   */
  private async cleanupInventoryImages(inventoryData: any): Promise<void> {
    try {
      const imageUrls = [
        inventoryData.main_image_url,
        ...(inventoryData.additional_image_urls || [])
      ].filter(Boolean);

      // Cloudinary URL'lerini filtrele
      const cloudinaryUrls = imageUrls.filter(url => url.includes('cloudinary.com'));
      
      if (cloudinaryUrls.length > 0) {
        logger.info(`🗑️ Cleaning up ${cloudinaryUrls.length} Cloudinary images for deleted inventory item`);
        
        // TODO: Cloudinary service ile imajları sil
        // await cloudinaryService.deleteMultipleImages(publicIds);
      }
    } catch (error) {
      logger.error('❌ Error cleaning up inventory images:', error);
      // Don't throw - image cleanup failure shouldn't fail the job
    }
  }

  /**
   * AI Suggestion job'ını işle (Enhanced)
   */
  private async processAiSuggestionJob(operation: string, recordId: string, changeData: any): Promise<void> {
    try {
      switch (operation) {
        case 'INSERT':
          // Yeni AI suggestion eklendi
          if (changeData.is_approved) {
            await this.elasticsearchService.indexDocument(
              `ai_suggestions_${recordId}`, 
              this.transformAiSuggestionForElasticsearch(changeData),
              'ai_suggestions'
            );
          }
          break;

        case 'UPDATE':
          // AI suggestion güncellendi
          const newData = changeData.new;
          const oldData = changeData.old;

          if (newData.is_approved && oldData.is_approved) {
            // Onaylı suggestion güncellendi - Elasticsearch'i güncelle
            await this.elasticsearchService.updateDocument(
              `ai_suggestions_${recordId}`,
              this.transformAiSuggestionForElasticsearch(newData),
              'ai_suggestions'
            );
          } else if (newData.is_approved && !oldData.is_approved) {
            // Suggestion onaylandı - Elasticsearch'e ekle
            await this.elasticsearchService.indexDocument(
              `ai_suggestions_${recordId}`,
              this.transformAiSuggestionForElasticsearch(newData),
              'ai_suggestions'
            );
          } else if (!newData.is_approved && oldData.is_approved) {
            // Suggestion onayı kaldırıldı - Elasticsearch'ten sil
            await this.elasticsearchService.deleteDocument(`ai_suggestions_${recordId}`, 'ai_suggestions');
          }
          break;

        case 'DELETE':
          // AI suggestion silindi
          await this.elasticsearchService.deleteDocument(`ai_suggestions_${recordId}`, 'ai_suggestions');
          break;

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      logger.error(`❌ Error processing AI suggestion job:`, error);
      throw error;
    }
  }

  /**
   * AI Suggestion'ı Elasticsearch formatına çevir
   */
  private transformAiSuggestionForElasticsearch(suggestion: any): any {
    // Supabase'den gelen suggestion_data'yı ES formatına çevir
    let transformedSuggestionData = { ...suggestion.suggestion_data };
    
    // Eğer 'suggestions' varsa 'keywords' olarak kopyala
    if (suggestion.suggestion_data.suggestions) {
      transformedSuggestionData.keywords = suggestion.suggestion_data.suggestions;
      // suggestions'ı kaldır (ES mapping'de yok)
      delete transformedSuggestionData.suggestions;
    }

    return {
      id: suggestion.id,
      category_id: suggestion.category_id,
      category_name: suggestion.category_name,
      category_path: suggestion.category_path,
      suggestion_type: suggestion.suggestion_type,
      suggestion_data: transformedSuggestionData,
      confidence_score: suggestion.confidence_score,
      is_approved: suggestion.is_approved,
      created_at: suggestion.created_at,
      updated_at: suggestion.updated_at,
      search_boost: suggestion.search_boost || 1.0,
      usage_count: suggestion.usage_count || 0,
      last_used_at: suggestion.last_used_at
    };
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
      category_id: listing.category_id,
      category_path: listing.category_path,
      budget: listing.budget,
      location: listing.location || null,
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
   * Job status'unu güncelle (Enhanced)
   */
  private async updateJobStatus(jobId: number, status: string, errorMessage?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        processed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
        error_message: errorMessage
      };

      // Retry count'u sadece failed durumunda artır
      if (status === 'failed') {
        updateData.retry_count = this.supabase.sql`retry_count + 1`;
      }

      const { error } = await this.supabase
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
   * Queue istatistiklerini al (Enhanced)
   */
  async getQueueStats(): Promise<QueueStats> {
    try {
      // Direct SQL query instead of RPC
      const { data, error } = await this.supabase
        .from('elasticsearch_sync_queue')
        .select('status, created_at, processed_at');

      if (error) {
        logger.error('❌ Error getting queue stats:', error);
        return this.stats;
      }

      // Calculate stats manually
      const total = data.length;
      const pending = data.filter((job: any) => job.status === 'pending').length;
      const processing = data.filter((job: any) => job.status === 'processing').length;
      const completed = data.filter((job: any) => job.status === 'completed').length;
      const failed = data.filter((job: any) => job.status === 'failed').length;

      // Calculate average processing time
      const completedJobs = data.filter((job: any) => 
        job.status === 'completed' && job.processed_at && job.created_at
      );
      
      let avgProcessingTime = 0;
      if (completedJobs.length > 0) {
        const totalTime = completedJobs.reduce((sum: number, job: any) => {
          const created = new Date(job.created_at).getTime();
          const processed = new Date(job.processed_at!).getTime();
          return sum + (processed - created);
        }, 0);
        avgProcessingTime = totalTime / completedJobs.length;
      }

      // Get last processed time
      const lastProcessedJob = data
        .filter((job: any) => job.processed_at)
        .sort((a: any, b: any) => new Date(b.processed_at!).getTime() - new Date(a.processed_at!).getTime())[0];

      // Stuck job'ları da say
      const stuckJobs = await this.detectStuckJobs();
      
      this.stats = {
        total,
        pending,
        processing,
        completed,
        failed,
        stuck: stuckJobs.length,
        avgProcessingTime,
        lastProcessedAt: lastProcessedJob?.processed_at
      };

      return this.stats;
    } catch (error) {
      logger.error('❌ Error getting queue stats:', error);
      return this.stats;
    }
  }

  /**
   * Stats'ı güncelle
   */
  private async updateStats(): Promise<void> {
    await this.getQueueStats();
  }

  /**
   * Failed job'ları retry et (Enhanced)
   */
  async retryFailedJobs(): Promise<number> {
    try {
      const { data: failedJobs, error } = await this.supabase
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('status', 'failed')
        .lt('retry_count', this.maxRetries);

      if (error) {
        logger.error('❌ Error fetching failed jobs:', error);
        return 0;
      }

      let retryCount = 0;
      for (const job of failedJobs) {
        await this.updateJobStatus(job.id, 'pending', 'Manual retry');
        retryCount++;
      }

      logger.info(`🔄 Retried ${retryCount} failed jobs`);
      return retryCount;
    } catch (error) {
      logger.error('❌ Error retrying failed jobs:', error);
      return 0;
    }
  }

  /**
   * Queue'yu temizle (Enhanced)
   */
  async clearQueue(status?: string): Promise<number> {
    try {
      let query = this.supabase
        .from('elasticsearch_sync_queue')
        .delete();

      if (status) {
        query = query.eq('status', status);
      }

      const { count, error } = await query;

      if (error) {
        logger.error('❌ Error clearing queue:', error);
        return 0;
      }

      logger.info(`🗑️ Cleared ${count} jobs from queue`);
      return count;
    } catch (error) {
      logger.error('❌ Error clearing queue:', error);
      return 0;
    }
  }

  /**
   * Queue job'larını getir (filtreli)
   */
  async getQueueJobs(status?: string, operation?: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      let query = this.supabase
        .from('elasticsearch_sync_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (operation) {
        query = query.eq('operation', operation);
      }

      const { data: jobs, error } = await query;

      if (error) {
        logger.error('❌ Error getting queue jobs:', error);
        return [];
      }

      return jobs || [];
    } catch (error) {
      logger.error('❌ Error getting queue jobs:', error);
      return [];
    }
  }

  /**
   * Queue health durumunu kontrol et
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const stats = await this.getQueueStats();
      
      // Stuck job kontrolü
      if (stats.stuck > 0) {
        issues.push(`${stats.stuck} stuck jobs detected`);
        recommendations.push('Run health check to reset stuck jobs');
      }

      // Failed job kontrolü
      if (stats.failed > 10) {
        issues.push(`${stats.failed} failed jobs (high failure rate)`);
        recommendations.push('Review failed jobs and fix underlying issues');
      }

      // Processing job kontrolü
      if (stats.processing > 20) {
        issues.push(`${stats.processing} jobs stuck in processing`);
        recommendations.push('Check if queue processor is running properly');
      }

      // Pending job kontrolü
      if (stats.pending > 100) {
        issues.push(`${stats.pending} pending jobs (queue backlog)`);
        recommendations.push('Increase processing frequency or batch size');
      }

      const isHealthy = issues.length === 0;

      return {
        isHealthy,
        issues,
        recommendations
      };

    } catch (error) {
      logger.error('❌ Error getting health status:', error);
      return {
        isHealthy: false,
        issues: ['Unable to check queue health'],
        recommendations: ['Check database connection and queue processor']
      };
    }
  }
}

export default QueueProcessorService; 