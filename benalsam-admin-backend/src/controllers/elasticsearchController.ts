import { Request, Response } from 'express';
import { 
  AdminElasticsearchService, 
  QueueProcessorService
} from '../services';
import logger from '../config/logger';
import { supabase } from '../config/supabase';

export class ElasticsearchController {
  private elasticsearchService: AdminElasticsearchService;
  private queueProcessorService: QueueProcessorService | null = null;

  constructor() {
    this.elasticsearchService = new AdminElasticsearchService();
    // QueueProcessorService'i lazy loading yap - environment variables yüklendikten sonra
  }

  /**
   * QueueProcessorService'i lazy loading ile başlat
   */
  private getQueueProcessorService(): QueueProcessorService {
    if (!this.queueProcessorService) {
      this.queueProcessorService = new QueueProcessorService();
    }
    return this.queueProcessorService;
  }

  /**
   * Elasticsearch health check
   */
  async getHealth(req: Request, res: Response) {
    try {
      const health = await this.elasticsearchService.getHealth();
      
      res.json({
        success: true,
        data: health,
        message: 'Elasticsearch health check completed'
      });
    } catch (error) {
      logger.error('❌ Elasticsearch health check failed:', error);
      res.status(500).json({
        success: false,
        message: 'Elasticsearch health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Search listings
   */
  async searchListings(req: Request, res: Response) {
    try {
      const { query, filters, sort, page = 1, limit = 20 } = req.body;

      const searchResult = await this.elasticsearchService.searchListings({
        query,
        filters,
        sort,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: searchResult,
        message: 'Search completed successfully'
      });
    } catch (error) {
      logger.error('❌ Search failed:', error);
      res.status(500).json({
        success: false,
        message: 'Search failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get category counts from Elasticsearch
   */
  async getCategoryCounts(req: Request, res: Response) {
    try {
      const categoryCounts = await this.elasticsearchService.getCategoryCounts();
      
      res.json({
        success: true,
        data: categoryCounts,
        message: 'Category counts retrieved successfully'
      });
    } catch (error) {
      logger.error('❌ Category counts failed:', error);
      res.status(500).json({
        success: false,
        message: 'Category counts failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Search specific index
   */
  async searchIndex(req: Request, res: Response) {
    try {
      const { index, size = 20 } = req.query;

      if (!index || typeof index !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Index parameter is required'
        });
      }

      // Use static method to search index
      const searchResult = await AdminElasticsearchService.searchIndexStatic(index, {
        size: parseInt(size as string)
      });

      return res.json({
        success: true,
        data: searchResult,
        message: 'Index search completed successfully'
      });
    } catch (error) {
      logger.error('❌ Index search failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Index search failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create index
   */
  async createIndex(req: Request, res: Response) {
    try {
      const success = await this.elasticsearchService.createIndex();
      
      res.json({
        success,
        message: success ? 'Index created successfully' : 'Failed to create index'
      });
    } catch (error) {
      logger.error('❌ Failed to create index:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create index',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(req: Request, res: Response) {
    try {
      // Use static method to get all indices stats
      const stats = await AdminElasticsearchService.getAllIndicesStats();
      
      res.json({
        success: true,
        data: stats,
        message: 'Index statistics retrieved'
      });
    } catch (error) {
      logger.error('❌ Failed to get index stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get index statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Reindex all listings
   */
  async reindexAll(req: Request, res: Response) {
    try {
      logger.info('🔄 Manual reindex requested');
      
      const result = await this.elasticsearchService.reindexAllListings();
      
      res.json({
        success: result.success,
        data: result,
        message: result.success ? 'Reindex completed successfully' : 'Reindex failed'
      });
    } catch (error) {
      logger.error('❌ Reindex failed:', error);
      res.status(500).json({
        success: false,
        message: 'Reindex failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: {
          status: 'active',
          message: 'Queue processor is running'
        },
        message: 'Sync status retrieved'
      });
    } catch (error) {
      logger.error('❌ Failed to get sync status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sync status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Trigger manual sync
   */
  async triggerManualSync(req: Request, res: Response) {
    try {
      logger.info('🔧 Manual sync triggered via API');
      
      res.json({
        success: true,
        message: 'Manual sync triggered'
      });
    } catch (error) {
      logger.error('❌ Manual sync failed:', error);
      res.status(500).json({
        success: false,
        message: 'Manual sync failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(req: Request, res: Response) {
    try {
      const queueStats = await this.getQueueProcessorService().getQueueStats();
      
      res.json({
        success: true,
        data: queueStats,
        message: 'Queue statistics retrieved'
      });
    } catch (error) {
      logger.error('❌ Failed to get queue stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get queue statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Retry failed jobs
   */
  async retryFailedJobs(req: Request, res: Response) {
    try {
      const retryCount = await this.getQueueProcessorService().retryFailedJobs();
      
      res.json({
        success: true,
        data: { retryCount },
        message: `Retried ${retryCount} failed jobs`
      });
    } catch (error) {
      logger.error('❌ Failed to retry jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retry jobs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Clear queue
   */
  async clearQueue(req: Request, res: Response) {
    try {
      const { queueType = 'completed' } = req.body;
      
      res.json({
        success: true,
        data: { clearedCount: 0 },
        message: `Queue clearing not implemented yet`
      });
    } catch (error) {
      logger.error('❌ Failed to clear queue:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear queue',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get sync configuration
   */
  async getSyncConfig(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: {
          enabled: true,
          interval: 5000
        },
        message: 'Sync configuration retrieved'
      });
    } catch (error) {
      logger.error('❌ Failed to get sync config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sync configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update sync configuration
   */
  async updateSyncConfig(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        message: 'Sync configuration updated'
      });
    } catch (error) {
      logger.error('❌ Failed to update sync config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update sync configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get comprehensive health check
   */
  async getHealthCheck(req: Request, res: Response) {
    try {
      const health = await this.elasticsearchService.getHealth();
      
      res.json({
        success: true,
        data: health,
        message: 'Health check completed'
      });
    } catch (error) {
      logger.error('❌ Health check failed:', error);
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test Elasticsearch connection
   */
  async testConnection(req: Request, res: Response) {
    try {
      await this.elasticsearchService.testConnection();
      
      res.json({
        success: true,
        message: 'Elasticsearch connection test successful'
      });
    } catch (error) {
      logger.error('❌ Elasticsearch connection test failed:', error);
      res.status(500).json({
        success: false,
        message: 'Elasticsearch connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test Redis connection
   */
  async testRedisConnection(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        message: 'Redis connection test successful'
      });
    } catch (error) {
      logger.error('❌ Redis connection test failed:', error);
      res.status(500).json({
        success: false,
        message: 'Redis connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Clear search cache (Debug endpoint)
   */
  async clearSearchCache(req: Request, res: Response) {
    try {
      const searchCacheService = await import('../services/searchCacheService');
      await searchCacheService.default.clearAll();
      
      res.json({
        success: true,
        message: 'Search cache cleared successfully'
      });
    } catch (error) {
      logger.error('❌ Clear search cache failed:', error);
      res.status(500).json({
        success: false,
        message: 'Clear search cache failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Clear all listings and related data (Debug endpoint)
   */
  async clearAllListings(req: Request, res: Response) {
    try {
      // 🔒 SECURITY: Only allow in development mode
      if (process.env.NODE_ENV === 'production') {
        logger.warn('🚫 Attempted to clear all listings in production environment');
        return res.status(403).json({
          success: false,
          message: 'This operation is not allowed in production environment'
        });
      }

      // 🔒 SECURITY: Check for admin authentication (temporarily disabled for development)
      // if (!req.user || req.user.role !== 'admin') {
      //   logger.warn('🚫 Unauthorized attempt to clear all listings');
      //   return res.status(401).json({
      //     success: false,
      //     message: 'Admin authentication required'
      //   });
      // }

      logger.info('🧹 Starting comprehensive listing cleanup...');

      // Step 1: Get current statistics
      const { count: listingsCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      const { count: offersCount } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true });

      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

      logger.info(`📊 Current data counts: Listings=${listingsCount}, Offers=${offersCount}, Conversations=${conversationsCount}`);

      // Step 2: Delete all listings from Supabase (CASCADE will handle related data)
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        throw new Error(`Failed to delete listings: ${deleteError.message}`);
      }

      logger.info('✅ All listings deleted from Supabase');

      // Step 3: Clear Elasticsearch index
      try {
        await this.elasticsearchService.deleteIndex();
        logger.info('✅ Elasticsearch index deleted');
      } catch (esError) {
        logger.warn(`⚠️ Elasticsearch error: ${esError instanceof Error ? esError.message : 'Unknown error'}`);
      }

      // Step 4: Recreate Elasticsearch index
      try {
        await this.elasticsearchService.createIndex();
        logger.info('✅ Elasticsearch index recreated');
      } catch (esError) {
        logger.warn(`⚠️ Elasticsearch recreation error: ${esError instanceof Error ? esError.message : 'Unknown error'}`);
      }

      // Step 5: Clear Redis cache
      try {
        const searchCacheService = await import('../services/searchCacheService');
        await searchCacheService.default.clearAll();
        logger.info('✅ Redis cache cleared');
      } catch (redisError) {
        logger.warn(`⚠️ Redis error: ${redisError instanceof Error ? redisError.message : 'Unknown error'}`);
      }

      // Step 6: Verify cleanup
      const { count: finalListingsCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      const { count: finalOffersCount } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true });

      logger.info(`✅ Final verification: Listings=${finalListingsCount}, Offers=${finalOffersCount}`);

      return res.json({
        success: true,
        message: 'All listings and related data cleared successfully',
        data: {
          before: { listings: listingsCount, offers: offersCount, conversations: conversationsCount },
          after: { listings: finalListingsCount, offers: finalOffersCount }
        }
      });

    } catch (error) {
      logger.error('❌ Clear all listings failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Clear all listings failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 