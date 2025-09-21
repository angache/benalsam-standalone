import { Router, IRouter, Request, Response } from 'express';
import elasticsearchConfig from '../config/elasticsearch';
import logger from '../config/logger';

const router: IRouter = Router();

/**
 * Health check endpoint
 * GET /api/v1/health
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Check Elasticsearch health
    const esHealth = await elasticsearchConfig.healthCheck();
    
    // Get memory usage
    const usedMemory = process.memoryUsage();
    const totalMemory = usedMemory.heapTotal;
    const memoryPercentage = (usedMemory.heapUsed / totalMemory) * 100;
    
    // Determine overall health
    const isHealthy = esHealth.status === 'healthy';
    const responseTime = Date.now() - startTime;
    
    const health = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'search-service',
      version: process.env.SERVICE_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: usedMemory.heapUsed,
        total: totalMemory,
        percentage: Math.round(memoryPercentage * 100) / 100
      },
      elasticsearch: {
        status: esHealth.status,
        responseTime: esHealth.responseTime || 0
      }
    };
    
    const statusCode = isHealthy ? 200 : 503;
    
    logger.info('Health check requested', { 
      health, 
      service: 'search-service' 
    });
    
    res.status(statusCode).json(health);
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      service: 'search-service',
      version: process.env.SERVICE_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });
  }
});

export default router;
