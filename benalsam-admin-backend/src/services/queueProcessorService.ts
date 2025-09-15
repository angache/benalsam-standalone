import { createClient } from '@supabase/supabase-js';
import { AdminElasticsearchService } from './elasticsearchService';
import cloudinaryService from './cloudinaryService';
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
   * Health check - stuck job'ları tespit et ve düzelt (Enhanced with detailed analysis)
   */
  private async healthCheck(): Promise<void> {
    try {
      const stuckJobs = await this.detectStuckJobs();
      
      if (stuckJobs.length > 0) {
        logger.warn(`⚠️ Found ${stuckJobs.length} stuck jobs, auto-fixing...`);
        
        // Stuck job'ları analiz et
        const stuckJobAnalysis = stuckJobs.map(job => {
          const stuckDuration = Math.round((Date.now() - new Date(job.created_at).getTime()) / 1000 / 60);
          const dataSize = JSON.stringify(job.change_data).length;
          return {
            id: job.id,
            table: job.table_name,
            operation: job.operation,
            record_id: job.record_id,
            stuckDuration,
            retryCount: job.retry_count,
            dataSize,
            hasLargeData: dataSize > 1000000,
            hasBase64Data: JSON.stringify(job.change_data).includes('base64')
          };
        });
        
        logger.warn(`🔍 Stuck jobs analysis:`, stuckJobAnalysis);
        
        let fixedCount = 0;
        let failedCount = 0;
        
        for (const job of stuckJobs) {
          try {
            // Base64 data içeren job'ları direkt failed yap
            const changeDataStr = JSON.stringify(job.change_data);
            if (changeDataStr.includes('base64') && changeDataStr.length > 100000) {
              logger.warn(`🚫 Base64 job detected - marking as permanently failed: ${job.id}`);
              await this.updateJobStatus(
                job.id, 
                'failed', 
                'Job contains large base64 data - permanently failed to prevent infinite loops'
              );
              failedCount++;
            } else {
              await this.resetStuckJob(job);
              fixedCount++;
            }
          } catch (error) {
            logger.error(`❌ Failed to reset stuck job ${job.id}:`, error);
            failedCount++;
          }
        }
        
        logger.info(`✅ Health check completed: ${fixedCount} jobs fixed, ${failedCount} failed`, {
          totalStuckJobs: stuckJobs.length,
          fixedCount,
          failedCount,
          stuckJobAnalysis
        });
        
        // Eğer çok fazla stuck job varsa uyarı ver
        if (stuckJobs.length > 5) {
          logger.error(`🚨 CRITICAL: ${stuckJobs.length} stuck jobs detected! Queue processor may have issues.`, {
            stuckJobCount: stuckJobs.length,
            stuckJobAnalysis
          });
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
   * Stuck job'ı reset et (Enhanced with detailed analysis)
   */
  private async resetStuckJob(job: any): Promise<void> {
    try {
      const stuckDuration = Math.round((Date.now() - new Date(job.created_at).getTime()) / 1000 / 60);
      const retryCount = job.retry_count || 0;
      const dataSize = JSON.stringify(job.change_data).length;
      
      // Job analizi
      const jobAnalysis = {
        id: job.id,
        operation: job.operation,
        table: job.table_name,
        record_id: job.record_id,
        stuckDuration,
        retryCount,
        dataSize,
        hasLargeData: dataSize > 1000000, // 1MB
        hasBase64Data: JSON.stringify(job.change_data).includes('base64'),
        created_at: job.created_at
      };
      
      logger.warn(`🔍 Stuck job analysis for job ${job.id}:`, jobAnalysis);
      
      // Eğer çok fazla retry yapmışsa failed olarak işaretle
      if (retryCount >= this.maxRetries) {
        const failureReason = jobAnalysis.hasLargeData 
          ? `Job stuck for ${stuckDuration} minutes with large data (${dataSize} bytes) and exceeded max retries (${this.maxRetries})`
          : `Job stuck for ${stuckDuration} minutes and exceeded max retries (${this.maxRetries})`;
          
        await this.updateJobStatus(job.id, 'failed', failureReason);
        logger.warn(`❌ Marked stuck job ${job.id} as failed (max retries exceeded)`, jobAnalysis);
      } else {
        // Normal reset
        let resetReason = `Reset from stuck state (stuck for ${stuckDuration} minutes, retry ${retryCount + 1}/${this.maxRetries})`;
        if (jobAnalysis.hasLargeData) {
          resetReason += `. Large data detected: ${dataSize} bytes`;
        }
        
        await this.updateJobStatus(job.id, 'pending', resetReason);
        logger.info(`🔄 Reset stuck job ${job.id} to pending (stuck for ${stuckDuration} minutes)`, jobAnalysis);
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
      logger.info(`📋 Jobs to process:`, jobs.map(job => ({ id: job.id, operation: job.operation, table: job.table_name, record_id: job.record_id })));

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
   * Job'ı timeout ile işle (Enhanced with detailed logging)
   */
  private async processJobWithTimeout(job: QueueJob): Promise<void> {
    const startTime = Date.now();
    const jobDetails = {
      id: job.id,
      operation: job.operation,
      table: job.table_name,
      record_id: job.record_id,
      retry_count: job.retry_count,
      data_size: JSON.stringify(job.change_data).length
    };

    try {
      logger.info(`🔄 Starting job ${job.id}: ${job.operation} on ${job.table_name}:${job.record_id}`, {
        jobDetails,
        timeout: this.processingTimeout,
        maxRetries: this.maxRetries
      });
      
      // Data size kontrolü
      if (jobDetails.data_size > 1000000) { // 1MB
        logger.warn(`⚠️ Large job data detected: ${jobDetails.data_size} bytes for job ${job.id}`);
      }
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Job processing timeout after ${this.processingTimeout}ms`)), this.processingTimeout);
      });

      const jobPromise = this.processJob(job);

      await Promise.race([jobPromise, timeoutPromise]);
      
      const processingTime = Date.now() - startTime;
      logger.info(`✅ Job ${job.id} completed successfully in ${processingTime}ms`, {
        jobDetails,
        processingTime,
        dataSize: jobDetails.data_size
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error(`❌ Job ${job.id} failed or timed out after ${processingTime}ms:`, {
        jobDetails,
        error: errorMessage,
        processingTime,
        dataSize: jobDetails.data_size,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Detaylı error message oluştur
      const detailedErrorMessage = `Job failed after ${processingTime}ms: ${errorMessage}. Data size: ${jobDetails.data_size} bytes. Retry: ${job.retry_count}/${this.maxRetries}`;
      
      // Job'ı failed olarak işaretle
      await this.updateJobStatus(job.id, 'failed', detailedErrorMessage);
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
          logger.info(`📝 Processing listing job: ${operation} on ${record_id}`);
          await this.processListingJob(operation, record_id, change_data);
          break;
        case 'profiles':
          logger.info(`📝 Processing profile job: ${operation} on ${record_id}`);
          await this.processProfileJob(operation, record_id, change_data);
          break;
        case 'categories':
          logger.info(`📝 Processing category job: ${operation} on ${record_id}`);
          await this.processCategoryJob(operation, record_id, change_data);
          break;
        case 'category_ai_suggestions':
          logger.info(`📝 Processing AI suggestion job: ${operation} on ${record_id}`);
          await this.processAiSuggestionJob(operation, record_id, change_data);
          break;
        case 'inventory_items':
          logger.info(`📝 Processing inventory job: ${operation} on ${record_id}`);
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
            // İlan deaktif edildi (inactive, rejected, deleted, pending_approval) - Elasticsearch'ten sil
            await this.elasticsearchService.deleteDocument(recordId);
            
            // Kategori sayıları cache'ini temizle
            await this.elasticsearchService.invalidateCategoryCountsCache();
            logger.info(`✅ Category counts cache invalidated after listing deactivation: ${recordId}`);
          }
          break;

        case 'DELETE':
          // Listing silindi
          logger.info(`🗑️ Processing listing DELETE job: ${recordId}`);
          
          // Akıllı kontrol: Record'ın gerçekten var olup olmadığını kontrol et
          const recordExists = await this.checkRecordExists('listings', recordId);
          
          if (!recordExists) {
            logger.warn(`⚠️ Record ${recordId} already deleted or doesn't exist - skipping DELETE job`, {
              recordId,
              operation: 'DELETE',
              table: 'listings'
            });
            // Job'ı completed olarak işaretle çünkü zaten silinmiş
            return;
          }
          
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
   * Inventory job'ını işle (Enhanced with detailed logging)
   */
  private async processInventoryJob(operation: string, recordId: string, changeData: any): Promise<void> {
    const startTime = Date.now();
    const dataSize = JSON.stringify(changeData).length;
    
    try {
      logger.info(`📦 Processing inventory job: ${operation} on ${recordId}`, {
        operation,
        recordId,
        dataSize,
        hasBase64Data: JSON.stringify(changeData).includes('base64'),
        hasImages: changeData?.main_image_url || changeData?.additional_image_urls?.length > 0
      });

      switch (operation) {
        case 'INSERT':
          // Yeni inventory item eklendi
          logger.info(`📦 New inventory item added: ${recordId}`, {
            recordId,
            dataSize,
            hasImages: changeData?.main_image_url || changeData?.additional_image_urls?.length > 0
          });
          
          // Base64 data kontrolü
          if (JSON.stringify(changeData).includes('base64')) {
            logger.warn(`⚠️ Base64 image data detected in inventory INSERT job ${recordId}`, {
              recordId,
              dataSize,
              imageCount: changeData?.additional_image_urls?.length || 0
            });
          }
          
          // TODO: Inventory-specific processing (e.g., recommendation updates, analytics)
          break;

        case 'UPDATE':
          // Inventory item güncellendi
          const newData = changeData.new;
          const oldData = changeData.old;
          
          logger.info(`📦 Inventory item updated: ${recordId}`, {
            recordId,
            dataSize,
            hasImageChanges: newData.main_image_url !== oldData.main_image_url || 
                            JSON.stringify(newData.additional_image_urls) !== JSON.stringify(oldData.additional_image_urls)
          });
          
          // Eğer imaj değişikliği varsa Cloudinary işlemleri
          if (newData.main_image_url !== oldData.main_image_url || 
              JSON.stringify(newData.additional_image_urls) !== JSON.stringify(oldData.additional_image_urls)) {
            logger.info(`🖼️ Image change detected for inventory item: ${recordId}`, {
              recordId,
              oldImageCount: oldData.additional_image_urls?.length || 0,
              newImageCount: newData.additional_image_urls?.length || 0
            });
            // TODO: Cloudinary cleanup for old images
          }
          break;

        case 'DELETE':
          // Inventory item silindi
          logger.info(`🗑️ Processing inventory DELETE job: ${recordId}`, {
            recordId,
            dataSize,
            hasImages: changeData?.main_image_url || changeData?.additional_image_urls?.length > 0,
            userId: changeData?.user_id
          });
          
          // Akıllı kontrol: Record'ın gerçekten var olup olmadığını kontrol et
          const recordExists = await this.checkRecordExists('inventory_items', recordId);
          
          if (!recordExists) {
            logger.warn(`⚠️ Record ${recordId} already deleted or doesn't exist - skipping DELETE job`, {
              recordId,
              operation: 'DELETE',
              table: 'inventory_items'
            });
            // Job'ı completed olarak işaretle çünkü zaten silinmiş
            return;
          }
          
          logger.info(`🗑️ Inventory item deleted: ${recordId}`, {
            recordId,
            dataSize,
            hasImages: changeData?.main_image_url || changeData?.additional_image_urls?.length > 0,
            userId: changeData?.user_id
          });
          
          // Cloudinary'den imajları sil
          if (changeData && changeData.main_image_url || changeData?.additional_image_urls) {
            await this.cleanupInventoryImages(changeData);
          }
          
          // Cloudinary'den klasörü sil
          if (changeData && changeData.user_id) {
            logger.info(`🗑️ Attempting to delete folder for user: ${changeData.user_id}, item: ${recordId}`);
            await this.cleanupInventoryFolder(changeData.user_id, recordId);
          } else {
            logger.warn(`⚠️ Cannot delete folder - missing user_id in changeData for job ${recordId}`);
          }
          break;

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      const processingTime = Date.now() - startTime;
      logger.info(`✅ Inventory job completed: ${operation} on ${recordId} in ${processingTime}ms`, {
        operation,
        recordId,
        processingTime,
        dataSize
      });
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error(`❌ Error processing inventory job: ${operation} on ${recordId} after ${processingTime}ms`, {
        operation,
        recordId,
        error: error instanceof Error ? error.message : String(error),
        processingTime,
        dataSize,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Record'ın veritabanında var olup olmadığını kontrol et
   */
  private async checkRecordExists(tableName: string, recordId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('id')
        .eq('id', recordId)
        .limit(1);

      if (error) {
        logger.error(`❌ Error checking record existence: ${tableName}:${recordId}`, error);
        return false;
      }

      const exists = data && data.length > 0;
      logger.debug(`🔍 Record existence check: ${tableName}:${recordId} = ${exists}`);
      
      return exists;
    } catch (error) {
      logger.error(`❌ Error checking record existence: ${tableName}:${recordId}`, error);
      return false;
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
        
        // URL'lerden public ID'leri çıkar
        const publicIds = cloudinaryUrls
          .map(url => cloudinaryService.extractPublicId(url))
          .filter(Boolean);

        if (publicIds.length > 0) {
          // Cloudinary'den imajları sil
          await cloudinaryService.deleteMultipleImages(publicIds);
          logger.info(`✅ Successfully deleted ${publicIds.length} images from Cloudinary`);
        }
      }
    } catch (error) {
      logger.error('❌ Error cleaning up inventory images:', error);
      // Don't throw - image cleanup failure shouldn't fail the job
    }
  }

  /**
   * Inventory klasörünü Cloudinary'den temizle
   */
  private async cleanupInventoryFolder(userId: string, itemId: string): Promise<void> {
    try {
      const folderPath = `benalsam/inventory/${userId}/${itemId}`;
      logger.info(`🗑️ Cleaning up inventory folder: ${folderPath}`);
      
      const result = await cloudinaryService.deleteInventoryItemFolder(userId, itemId);
      
      if (result) {
        logger.info(`✅ Successfully deleted inventory folder from Cloudinary: ${folderPath}`);
      } else {
        logger.warn(`⚠️ Failed to delete inventory folder from Cloudinary: ${folderPath}`);
        
        // Alternatif yöntem: Manuel olarak klasörü silmeyi dene
        logger.info(`🔄 Trying alternative deletion method for: ${folderPath}`);
        const alternativeResult = await cloudinaryService.deleteFolder(folderPath);
        
        if (alternativeResult) {
          logger.info(`✅ Alternative deletion successful for: ${folderPath}`);
        } else {
          logger.error(`❌ Alternative deletion also failed for: ${folderPath}`);
        }
      }
    } catch (error) {
      logger.error('❌ Error cleaning up inventory folder:', error);
      logger.error('❌ Error details:', {
        userId,
        itemId,
        folderPath: `benalsam/inventory/${userId}/${itemId}`,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // Don't throw - folder cleanup failure shouldn't fail the job
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
          logger.info(`🗑️ Processing AI suggestion DELETE job: ${recordId}`);
          
          // Akıllı kontrol: Record'ın gerçekten var olup olmadığını kontrol et
          const recordExists = await this.checkRecordExists('category_ai_suggestions', recordId);
          
          if (!recordExists) {
            logger.warn(`⚠️ Record ${recordId} already deleted or doesn't exist - skipping DELETE job`, {
              recordId,
              operation: 'DELETE',
              table: 'category_ai_suggestions'
            });
            // Job'ı completed olarak işaretle çünkü zaten silinmiş
            return;
          }
          
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
""        // Önce mevcut retry count'u al
        const { data: currentJob } = await this.supabase
          .from('elasticsearch_sync_queue')
          .select('retry_count')
          .eq('id', jobId)
          .single();
        
        if (currentJob) {
          updateData.retry_count = (currentJob.retry_count || 0) + 1;
        }
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