import { AdminElasticsearchService } from './elasticsearchService';
import { MessageQueueService, QueueJob } from './messageQueueService';
import logger from '../config/logger';

export interface IndexerConfig {
  batchSize: number;
  batchTimeout: number;
  maxRetries: number;
  retryDelay: number;
}

export interface IndexerStats {
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
  avgProcessingTime: number;
  lastProcessedAt: string | null;
  isRunning: boolean;
}

export class IndexerService {
  private elasticsearchService: AdminElasticsearchService;
  private messageQueue: MessageQueueService;
  private config: IndexerConfig;
  private stats: IndexerStats;
  private isRunning: boolean = false;
  private processingBatch: QueueJob[] = [];
  private batchTimer: any = null;

  constructor(
    elasticsearchService: AdminElasticsearchService,
    messageQueue: MessageQueueService,
    config: Partial<IndexerConfig> = {}
  ) {
    this.elasticsearchService = elasticsearchService;
    this.messageQueue = messageQueue;
    
    this.config = {
      batchSize: config.batchSize || 10,
      batchTimeout: config.batchTimeout || 5000, // 5 saniye
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000, // 1 saniye
    };

    this.stats = {
      totalProcessed: 0,
      totalSuccess: 0,
      totalFailed: 0,
      avgProcessingTime: 0,
      lastProcessedAt: null,
      isRunning: false,
    };
  }

  /**
   * Indexer'ı başlat
   */
  async start(): Promise<void> {
    try {
      if (this.isRunning) {
        logger.warn('⚠️ Indexer already running');
        return;
      }

      this.isRunning = true;
      this.stats.isRunning = true;
      
      logger.info('🚀 Starting Elasticsearch indexer...');
      
      // Queue'yu dinlemeye başla
      await this.messageQueue.listenForJobs(async (job) => {
        await this.processJob(job);
      });

    } catch (error) {
      this.isRunning = false;
      this.stats.isRunning = false;
      logger.error('❌ Error starting indexer:', error);
      throw error;
    }
  }

  /**
   * Indexer'ı durdur
   */
  async stop(): Promise<void> {
    try {
      this.isRunning = false;
      this.stats.isRunning = false;
      
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }

      // Mevcut batch'i işle
      if (this.processingBatch.length > 0) {
        await this.processBatch();
      }

      logger.info('🛑 Elasticsearch indexer stopped');
    } catch (error) {
      logger.error('❌ Error stopping indexer:', error);
      throw error;
    }
  }

  /**
   * Tek job işle
   */
  private async processJob(job: QueueJob): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info(`📥 Processing job: ${job.id} (${job.operation} on ${job.table})`);

      // Batch'e ekle
      this.processingBatch.push(job);

      // Batch timer'ı sıfırla
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }

      // Batch size'a ulaştıysa veya timer ile işle
      if (this.processingBatch.length >= this.config.batchSize) {
        await this.processBatch();
      } else {
        // Timer başlat
        this.batchTimer = setTimeout(async () => {
          if (this.processingBatch.length > 0) {
            await this.processBatch();
          }
        }, this.config.batchTimeout);
      }

      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, true);
      
      logger.info(`✅ Job processed successfully: ${job.id} (${processingTime}ms)`);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, false);
      
      logger.error(`❌ Job processing failed: ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Batch işle
   */
  private async processBatch(): Promise<void> {
    if (this.processingBatch.length === 0) {
      return;
    }

    const batch = [...this.processingBatch];
    this.processingBatch = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    logger.info(`🔄 Processing batch of ${batch.length} jobs`);

    try {
      // Elasticsearch'e bulk index
      const documents = batch.map(job => this.transformJobToDocument(job));
      const success = await this.elasticsearchService.bulkIndex(documents as any);

      if (success) {
        logger.info(`✅ Batch processed successfully: ${batch.length} jobs`);
      } else {
        throw new Error('Bulk indexing failed');
      }

    } catch (error) {
      logger.error(`❌ Batch processing failed: ${batch.length} jobs`, error);
      
      // Failed job'ları queue'ya geri ekle
      for (const job of batch) {
        await this.messageQueue.failJob(job.id, error instanceof Error ? error.message : 'Unknown error');
      }
      
      throw error;
    }
  }

  /**
   * Job'ı Elasticsearch document'ına çevir
   */
  private transformJobToDocument(job: QueueJob): { id: string; document: any } {
    const { table, operation, data } = job;

    switch (table) {
      case 'listings':
        return this.transformListingJob(job);
      case 'profiles':
        return this.transformProfileJob(job);
      case 'categories':
        return this.transformCategoryJob(job);
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  /**
   * Listing job'ını transform et
   */
  private transformListingJob(job: QueueJob): { id: string; document: any } {
    const { operation, data } = job;

    if (operation === 'DELETE') {
      return {
        id: data.id,
        document: null // Silme işlemi için null
      };
    }

    const listing = operation === 'UPDATE' ? data.new : data;
    
    return {
      id: listing.id,
      document: {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        budget: listing.budget,
        location: listing.location ? {
          lat: listing.location.lat,
          lon: listing.location.lon,
          text: listing.location.text
        } : null,
        urgency: listing.urgency,
        attributes: listing.attributes,
        user_id: listing.user_id,
        status: listing.status,
        created_at: listing.created_at,
        updated_at: listing.updated_at,
        popularity_score: listing.popularity_score || 0,
        is_premium: listing.is_premium || false,
        tags: listing.tags || []
      }
    };
  }

  /**
   * Profile job'ını transform et
   */
  private transformProfileJob(job: QueueJob): { id: string; document: any } {
    const { operation, data } = job;

    if (operation === 'DELETE') {
      return {
        id: data.id,
        document: null
      };
    }

    const profile = operation === 'UPDATE' ? data.new : data;
    
    return {
      id: profile.id,
      document: {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        trust_score: profile.trust_score || 0,
        is_premium: profile.is_premium || false,
        premium_expires_at: profile.premium_expires_at,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    };
  }

  /**
   * Category job'ını transform et
   */
  private transformCategoryJob(job: QueueJob): { id: string; document: any } {
    const { operation, data } = job;

    if (operation === 'DELETE') {
      return {
        id: data.id,
        document: null
      };
    }

    const category = operation === 'UPDATE' ? data.new : data;
    
    return {
      id: category.id,
      document: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parent_id: category.parent_id,
        level: category.level,
        path: category.path,
        attributes: category.attributes,
        created_at: category.created_at,
        updated_at: category.updated_at
      }
    };
  }

  /**
   * Stats güncelle
   */
  private updateStats(processingTime: number, success: boolean): void {
    this.stats.totalProcessed++;
    
    if (success) {
      this.stats.totalSuccess++;
    } else {
      this.stats.totalFailed++;
    }

    // Average processing time hesapla
    const totalTime = this.stats.avgProcessingTime * (this.stats.totalProcessed - 1) + processingTime;
    this.stats.avgProcessingTime = totalTime / this.stats.totalProcessed;

    this.stats.lastProcessedAt = new Date().toISOString();
  }

  /**
   * Indexer stats'ını al
   */
  getStats(): IndexerStats {
    return { ...this.stats };
  }

  /**
   * Indexer durumunu kontrol et
   */
  isIndexerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Queue stats'ını al
   */
  async getQueueStats() {
    return await this.messageQueue.getStats();
  }

  /**
   * Failed job'ları retry et
   */
  async retryFailedJobs(): Promise<number> {
    return await this.messageQueue.retryFailedJobs();
  }

  /**
   * Queue'yu temizle
   */
  async clearQueue(queueType: 'pending' | 'processing' | 'completed' | 'failed' = 'completed'): Promise<number> {
    return await this.messageQueue.clearQueue(queueType);
  }

  /**
   * Manual sync - tüm data'yı yeniden index'le
   */
  async manualSync(): Promise<{ success: boolean; count: number; errors: string[] }> {
    try {
      logger.info('🔄 Starting manual sync...');
      
      // Indexer'ı durdur
      await this.stop();
      
      // Elasticsearch'te reindex yap
      const result = await this.elasticsearchService.reindexAllListings();
      
      // Indexer'ı tekrar başlat
      await this.start();
      
      logger.info(`✅ Manual sync completed: ${result.count} documents indexed`);
      return result;
    } catch (error) {
      logger.error('❌ Manual sync failed:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    indexer: boolean;
    elasticsearch: boolean;
    redis: boolean;
    stats: IndexerStats;
  }> {
    try {
      const elasticsearchHealth = await this.elasticsearchService.getHealth();
      const redisConnected = this.messageQueue.isQueueConnected();
      
      return {
        indexer: this.isRunning,
        elasticsearch: elasticsearchHealth.status === 'green' || elasticsearchHealth.status === 'yellow',
        redis: redisConnected,
        stats: this.getStats()
      };
    } catch (error) {
      logger.error('❌ Health check failed:', error);
      throw error;
    }
  }
} 