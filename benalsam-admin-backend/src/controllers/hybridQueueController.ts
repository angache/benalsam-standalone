import { Request, Response } from 'express';
import { hybridQueueService } from '../services/hybridQueueService';
import { queueServiceClient } from '../services/queueServiceClient';
import logger from '../config/logger';

export class HybridQueueController {
  /**
   * Hybrid queue transition durumunu getir
   */
  async getTransitionStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = hybridQueueService.getTransitionStatus();
      
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to get transition status:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get transition status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Transition percentage'ini güncelle
   */
  async updateTransitionPercentage(req: Request, res: Response): Promise<void> {
    try {
      const { percentage } = req.body;
      
      if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
        res.status(400).json({
          success: false,
          error: 'Invalid percentage value',
          message: 'Percentage must be a number between 0 and 100',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      hybridQueueService.updateTransitionPercentage(percentage);
      
      const newStatus = hybridQueueService.getTransitionStatus();
      
      res.json({
        success: true,
        data: {
          message: `Transition percentage updated to ${percentage}%`,
          newStatus,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to update transition percentage:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to update transition percentage',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Yeni queue service'i tamamen aktif et
   */
  async enableNewQueue(req: Request, res: Response): Promise<void> {
    try {
      hybridQueueService.enableNewQueue();
      
      const status = hybridQueueService.getTransitionStatus();
      
      res.json({
        success: true,
        data: {
          message: 'New queue service fully enabled',
          status,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to enable new queue:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to enable new queue',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Eski queue system'e geri dön
   */
  async fallbackToOldQueue(req: Request, res: Response): Promise<void> {
    try {
      hybridQueueService.fallbackToOldQueue();
      
      const status = hybridQueueService.getTransitionStatus();
      
      res.json({
        success: true,
        data: {
          message: 'Fallback to old queue system',
          status,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to fallback to old queue:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fallback to old queue',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Yeni queue service health check
   */
  async checkNewQueueHealth(req: Request, res: Response): Promise<void> {
    try {
      const isHealthy = await hybridQueueService.checkNewQueueHealth();
      
      res.json({
        success: true,
        data: {
          healthy: isHealthy,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to check new queue health:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to check new queue health',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Yeni queue service stats
   */
  async getNewQueueStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await hybridQueueService.getNewQueueStats();
      
      if (!stats) {
        res.status(503).json({
          success: false,
          error: 'New queue service unavailable',
          message: 'Failed to get queue statistics',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to get new queue stats:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get new queue stats',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Test job'ı hybrid queue'ya gönder
   */
  async sendTestJob(req: Request, res: Response): Promise<void> {
    try {
      const { type, operation, table, recordId, changeData } = req.body;
      
      // Validation
      if (!type || !operation || !table || !recordId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'type, operation, table, and recordId are required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const jobData = {
        type: type as 'ELASTICSEARCH_SYNC',
        operation: operation as 'INSERT' | 'UPDATE' | 'DELETE',
        table,
        recordId: Number(recordId),
        changeData: changeData || {},
      };

      const result = await hybridQueueService.processJob(jobData);
      
      res.json({
        success: result.success,
        data: {
          result,
          jobData,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to send test job:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to send test job',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Queue service'i pause et
   */
  async pauseQueues(req: Request, res: Response): Promise<void> {
    try {
      await queueServiceClient.pauseQueues();
      
      res.json({
        success: true,
        data: {
          message: 'All queues paused successfully',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to pause queues:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to pause queues',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Queue service'i resume et
   */
  async resumeQueues(req: Request, res: Response): Promise<void> {
    try {
      await queueServiceClient.resumeQueues();
      
      res.json({
        success: true,
        data: {
          message: 'All queues resumed successfully',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to resume queues:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to resume queues',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Completed job'ları temizle
   */
  async cleanCompletedJobs(req: Request, res: Response): Promise<void> {
    try {
      const { olderThan } = req.body;
      
      await queueServiceClient.cleanCompletedJobs(olderThan);
      
      res.json({
        success: true,
        data: {
          message: 'Completed jobs cleaned successfully',
          olderThan: olderThan || '24 hours',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to clean completed jobs:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to clean completed jobs',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Export singleton instance
export const hybridQueueController = new HybridQueueController();
