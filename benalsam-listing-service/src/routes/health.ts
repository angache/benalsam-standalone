/**
 * Health Routes
 * 
 * @fileoverview Health check endpoints for Listing Service
 * @author Benalsam Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { listingService } from '../services/listingService';
import { jobProcessorService } from '../services/jobProcessor';
import { healthCheck as databaseHealthCheck } from '../config/database';
import { redisHealthCheck } from '../config/redis';
import { rabbitmqHealthCheck } from '../config/rabbitmq';
import { logger } from '../config/logger';
import { databaseCircuitBreaker, externalServiceCircuitBreaker, fileOperationCircuitBreaker } from '../utils/circuitBreaker';

const router = Router();

/**
 * Basic health check
 * GET /api/v1/health
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const serviceStatus = listingService.getStatus();
    const jobMetrics = jobProcessorService.getMetrics();
    
    const health = {
      service: 'Benalsam Listing Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      serviceStatus,
      jobMetrics,
      circuitBreakers: {
        database: databaseCircuitBreaker.getMetrics(),
        externalService: externalServiceCircuitBreaker.getMetrics(),
        fileOperation: fileOperationCircuitBreaker.getMetrics()
      }
    };

    res.json(health);
  } catch (error) {
    logger.error('❌ Health check failed:', error);
    res.status(500).json({
      service: 'Benalsam Listing Service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Detailed health check
 * GET /api/v1/health/detailed
 */
router.get('/detailed', async (_req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check all components in parallel
    const [
      serviceStatus,
      jobMetrics,
      databaseHealth,
      redisHealth,
      rabbitmqHealth
    ] = await Promise.all([
      Promise.resolve(listingService.getStatus()),
      Promise.resolve(jobProcessorService.getMetrics()),
      databaseHealthCheck(),
      redisHealthCheck(),
      rabbitmqHealthCheck()
    ]);

    const responseTime = Date.now() - startTime;
    
    const overallStatus = 
      serviceStatus.running &&
      databaseHealth.status === 'healthy' &&
      redisHealth.status === 'healthy' &&
      rabbitmqHealth.status === 'healthy' ? 'healthy' : 'unhealthy';

    const health = {
      service: 'Benalsam Listing Service',
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      responseTime,
      memory: process.memoryUsage(),
      components: {
        service: {
          status: serviceStatus.running ? 'healthy' : 'unhealthy',
          details: serviceStatus
        },
        database: databaseHealth,
        redis: redisHealth,
        rabbitmq: rabbitmqHealth,
        jobProcessor: {
          status: 'healthy',
          details: jobMetrics
        }
      }
    };

    res.status(overallStatus === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    logger.error('❌ Detailed health check failed:', error);
    res.status(500).json({
      service: 'Benalsam Listing Service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Database health check
 * GET /api/v1/health/database
 */
router.get('/database', async (_req: Request, res: Response) => {
  try {
    const health = await databaseHealthCheck();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    logger.error('❌ Database health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Redis health check
 * GET /api/v1/health/redis
 */
router.get('/redis', async (_req: Request, res: Response) => {
  try {
    const health = await redisHealthCheck();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    logger.error('❌ Redis health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * RabbitMQ health check
 * GET /api/v1/health/rabbitmq
 */
router.get('/rabbitmq', async (_req: Request, res: Response) => {
  try {
    const health = await rabbitmqHealthCheck();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    logger.error('❌ RabbitMQ health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Job processor health check
 * GET /api/v1/health/jobs
 */
router.get('/jobs', async (_req: Request, res: Response) => {
  try {
    const metrics = jobProcessorService.getMetrics();
    
    const health = {
      status: 'healthy',
      details: {
        metrics,
        activeJobs: metrics.processingJobs,
        queueStatus: 'running'
      }
    };

    res.json(health);
  } catch (error) {
    logger.error('❌ Job processor health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
