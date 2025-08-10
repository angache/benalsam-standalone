import { AdminElasticsearchService } from './elasticsearchService';
import { MessageQueueService } from './messageQueueService';
import { IndexerService } from './indexerService';
import logger from '../config/logger';

export interface SyncConfig {
  enabled: boolean;
  batchSize: number;
  syncInterval: number;
  maxRetries: number;
  retryDelay: number;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  totalSynced: number;
  errors: string[];
  progress: number; // 0-100
}

export interface SyncStats {
  totalDocuments: number;
  syncedDocuments: number;
  failedDocuments: number;
  syncDuration: number;
  avgSyncTime: number;
}

export class SyncService {
  private elasticsearchService: AdminElasticsearchService;
  private messageQueue: MessageQueueService;
  private indexer: IndexerService;
  private config: SyncConfig;
  private syncStatus: SyncStatus;
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor(
    elasticsearchService: AdminElasticsearchService,
    messageQueue: MessageQueueService,
    indexer: IndexerService,
    config: Partial<SyncConfig> = {}
  ) {
    this.elasticsearchService = elasticsearchService;
    this.messageQueue = messageQueue;
    this.indexer = indexer;
    
    this.config = {
      enabled: config.enabled ?? true,
      batchSize: config.batchSize || 100,
      syncInterval: config.syncInterval || 300000, // 5 dakika
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
    };

    this.syncStatus = {
      isRunning: false,
      lastSyncAt: null,
      nextSyncAt: null,
      totalSynced: 0,
      errors: [],
      progress: 0,
    };
  }

  /**
   * Sync service'i başlat
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        logger.warn('⚠️ Sync service already initialized');
        return;
      }

      logger.info('🚀 Initializing sync service...');

      // Elasticsearch connection test
      await this.elasticsearchService.testConnection();
      logger.info('✅ Elasticsearch connection verified');

      // Redis connection test
      if (!this.messageQueue.isQueueConnected()) {
        throw new Error('Redis not connected');
      }
      logger.info('✅ Redis connection verified');

      // Indexer'ı başlat
      await this.indexer.start();
      logger.info('✅ Indexer started');

      // Sync interval'ı başlat
      if (this.config.enabled) {
        this.startSyncInterval();
      }

      this.isInitialized = true;
      logger.info('✅ Sync service initialized successfully');

    } catch (error) {
      logger.error('❌ Error initializing sync service:', error);
      throw error;
    }
  }

  /**
   * Sync service'i durdur
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('🛑 Shutting down sync service...');

      // Sync interval'ı durdur
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      // Indexer'ı durdur
      await this.indexer.stop();

      this.isInitialized = false;
      this.syncStatus.isRunning = false;
      
      logger.info('✅ Sync service shut down successfully');

    } catch (error) {
      logger.error('❌ Error shutting down sync service:', error);
      throw error;
    }
  }

  /**
   * Initial data migration
   */
  async initialDataMigration(): Promise<{ success: boolean; count: number; errors: string[] }> {
    try {
      if (this.syncStatus.isRunning) {
        throw new Error('Sync already running');
      }

      this.syncStatus.isRunning = true;
      this.syncStatus.progress = 0;
      this.syncStatus.errors = [];

      logger.info('🔄 Starting initial data migration...');

      // Elasticsearch index'i oluştur
      await this.elasticsearchService.createIndex();
      this.syncStatus.progress = 10;

      // Tüm listings'i reindex et
      const result = await this.elasticsearchService.reindexAllListings();
      this.syncStatus.progress = 90;

      if (result.success) {
        this.syncStatus.totalSynced = result.count;
        this.syncStatus.lastSyncAt = new Date().toISOString();
        this.syncStatus.progress = 100;
        
        logger.info(`✅ Initial migration completed: ${result.count} documents`);
      } else {
        this.syncStatus.errors = result.errors;
        logger.error(`❌ Initial migration failed: ${result.errors.length} errors`);
      }

      this.syncStatus.isRunning = false;
      return result;

    } catch (error) {
      this.syncStatus.isRunning = false;
      this.syncStatus.errors.push(error instanceof Error ? error.message : 'Unknown error');
      logger.error('❌ Initial migration failed:', error);
      throw error;
    }
  }

  /**
   * Incremental sync
   */
  async incrementalSync(): Promise<{ success: boolean; count: number; errors: string[] }> {
    try {
      if (this.syncStatus.isRunning) {
        logger.warn('⚠️ Sync already running, skipping incremental sync');
        return { success: false, count: 0, errors: ['Sync already running'] };
      }

      this.syncStatus.isRunning = true;
      this.syncStatus.progress = 0;

      logger.info('🔄 Starting incremental sync...');

      // Queue'daki pending job'ları işle
      const queueStats = await this.messageQueue.getStats();
      const pendingJobs = queueStats.pending;

      if (pendingJobs > 0) {
        logger.info(`📥 Processing ${pendingJobs} pending jobs`);
        
        // Indexer'ın job'ları işlemesini bekle
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        this.syncStatus.progress = 100;
        this.syncStatus.totalSynced += pendingJobs;
      } else {
        logger.info('📭 No pending jobs to process');
        this.syncStatus.progress = 100;
      }

      this.syncStatus.lastSyncAt = new Date().toISOString();
      this.syncStatus.isRunning = false;

      logger.info('✅ Incremental sync completed');
      return { success: true, count: pendingJobs, errors: [] };

    } catch (error) {
      this.syncStatus.isRunning = false;
      this.syncStatus.errors.push(error instanceof Error ? error.message : 'Unknown error');
      logger.error('❌ Incremental sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync interval'ı başlat
   */
  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.incrementalSync();
      } catch (error) {
        logger.error('❌ Error in sync interval:', error);
      }
    }, this.config.syncInterval);

    // İlk sync'i planla
    this.syncStatus.nextSyncAt = new Date(Date.now() + this.config.syncInterval).toISOString();
    
    logger.info(`⏰ Sync interval started: ${this.config.syncInterval / 1000}s`);
  }

  /**
   * Sync interval'ı durdur
   */
  stopSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.syncStatus.nextSyncAt = null;
      logger.info('⏰ Sync interval stopped');
    }
  }

  /**
   * Sync interval'ı yeniden başlat
   */
  restartSyncInterval(): void {
    this.stopSyncInterval();
    this.startSyncInterval();
  }

  /**
   * Sync status'ını al
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Sync stats'ını al
   */
  async getSyncStats(): Promise<SyncStats> {
    try {
      const indexerStats = this.indexer.getStats();
      const queueStats = await this.messageQueue.getStats();
      
      return {
        totalDocuments: indexerStats.totalProcessed,
        syncedDocuments: indexerStats.totalSuccess,
        failedDocuments: indexerStats.totalFailed,
        syncDuration: indexerStats.avgProcessingTime,
        avgSyncTime: indexerStats.avgProcessingTime,
      };
    } catch (error) {
      logger.error('❌ Error getting sync stats:', error);
      throw error;
    }
  }

  /**
   * Manual sync trigger
   */
  async triggerManualSync(): Promise<{ success: boolean; count: number; errors: string[] }> {
    try {
      logger.info('🔧 Manual sync triggered');
      
      // Incremental sync yap
      const result = await this.incrementalSync();
      
      // Sync interval'ı yeniden başlat
      this.restartSyncInterval();
      
      return result;
    } catch (error) {
      logger.error('❌ Manual sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync configuration'ı güncelle
   */
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Sync interval'ı yeniden başlat
    if (this.config.enabled) {
      this.restartSyncInterval();
    } else {
      this.stopSyncInterval();
    }
    
    logger.info('⚙️ Sync configuration updated');
  }

  /**
   * Sync configuration'ı al
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    syncService: boolean;
    indexer: boolean;
    elasticsearch: boolean;
    redis: boolean;
    status: SyncStatus;
  }> {
    try {
      const indexerHealth = await this.indexer.healthCheck();
      
      return {
        syncService: this.isInitialized,
        indexer: indexerHealth.indexer,
        elasticsearch: indexerHealth.elasticsearch,
        redis: indexerHealth.redis,
        status: this.getSyncStatus(),
      };
    } catch (error) {
      logger.error('❌ Health check failed:', error);
      throw error;
    }
  }

  /**
   * Failed job'ları retry et
   */
  async retryFailedJobs(): Promise<number> {
    return await this.indexer.retryFailedJobs();
  }

  /**
   * Queue'yu temizle
   */
  async clearQueue(queueType: 'pending' | 'processing' | 'completed' | 'failed' = 'completed'): Promise<number> {
    return await this.indexer.clearQueue(queueType);
  }

  /**
   * Sync service'in başlatılıp başlatılmadığını kontrol et
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
} 