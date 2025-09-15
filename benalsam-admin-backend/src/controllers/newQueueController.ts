import { Request, Response } from 'express';
import { newQueueService } from '../services/newQueueService';
import logger from '../config/logger';

export class NewQueueController {
  /**
   * Test job gönder
   */
  async sendTestJob(req: Request, res: Response) {
    try {
      logger.info('🧪 Sending test job to new queue service');
      
      const result = await newQueueService.sendTestJob();
      
      res.json({
        success: true,
        data: {
          message: 'Test job sent successfully',
          job: result,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to send test job:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Queue service health check
   */
  async checkHealth(req: Request, res: Response) {
    try {
      const isHealthy = await newQueueService.checkHealth();
      
      res.json({
        success: true,
        data: {
          healthy: isHealthy,
          service: 'RabbitMQ Queue Service',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Health check failed:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Queue stats
   */
  async getQueueStats(req: Request, res: Response) {
    try {
      const stats = await newQueueService.getQueueStats();
      
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to get queue stats:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Custom job gönder
   */
  async addJob(req: Request, res: Response) {
    try {
      const jobData = req.body;
      
      logger.info('🚀 Adding custom job to new queue service', { jobData });
      
      const result = await newQueueService.addJob(jobData);
      
      res.json({
        success: true,
        data: {
          message: 'Job added successfully',
          job: result,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to add job:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const newQueueController = new NewQueueController();
