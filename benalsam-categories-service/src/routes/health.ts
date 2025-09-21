import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database';
import CacheService from '../utils/cacheService';
import logger from '../config/logger';
import { ServiceHealth } from '../types/category';

const router = Router();

/**
 * @route GET /api/v1/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check database health
    const dbHealth = await checkDatabaseHealth();
    
    // Check cache service health
    const cacheHealth = await CacheService.healthCheck();
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;
    
    const health: ServiceHealth = {
      status: dbHealth.status === 'healthy' && cacheHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
      service: 'categories-service',
      version: process.env.SERVICE_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: Math.round(memoryPercentage * 100) / 100
      },
      database: {
        status: dbHealth.status as 'healthy' | 'unhealthy',
        responseTime: dbHealth.responseTime || 0
      },
      cache: {
        status: cacheHealth.status as 'healthy' | 'unhealthy',
        responseTime: cacheHealth.responseTime || 0
      }
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    logger.info('Health check requested', { health, service: 'categories-service' });
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed:', { error, service: 'categories-service' });
    
    const errorHealth: ServiceHealth = {
      status: 'unhealthy',
      service: 'categories-service',
      version: process.env.SERVICE_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      },
      database: {
        status: 'unhealthy',
        responseTime: 0
      },
      cache: {
        status: 'unhealthy',
        responseTime: 0
      }
    };
    
    res.status(503).json(errorHealth);
  }
});

export default router;
