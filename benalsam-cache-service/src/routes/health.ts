import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';
import { redisWithCircuitBreaker, redis } from '../config/redis';
import { redisCircuitBreaker, memoryCacheCircuitBreaker, supabaseCircuitBreaker, cacheOperationCircuitBreaker } from '../utils/circuitBreaker';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    // Redis bağlantı durumunu kontrol et
    let redisStatus = 'disconnected';
    let redisError = null;
    try {
      await redisWithCircuitBreaker.ping();
      redisStatus = 'connected';
    } catch (error) {
      logger.warn('Redis ping failed:', { error, service: 'cache-service' });
      redisStatus = 'error';
      redisError = error instanceof Error ? error.message : 'Unknown error';
    }

    const healthCheck = {
      status: redisStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'cache-service',
      version: process.env['npm_package_version'] || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env['NODE_ENV'],
      redis: {
        status: redisStatus,
        host: process.env['REDIS_HOST'] || 'localhost',
        port: process.env['REDIS_PORT'] || '6379',
        error: redisError,
        connectionState: redis.status
      },
      circuitBreakers: {
        redis: redisCircuitBreaker.getMetrics(),
        memoryCache: memoryCacheCircuitBreaker.getMetrics(),
        supabase: supabaseCircuitBreaker.getMetrics(),
        cacheOperation: cacheOperationCircuitBreaker.getMetrics()
      }
    };

    logger.info('Health check requested', { healthCheck, service: 'cache-service' });
    
    res.status(200).json({
      success: true,
      data: healthCheck
    });
  } catch (error) {
    logger.error('Health check failed:', { error, service: 'cache-service' });
    res.status(500).json({
      success: false,
      message: 'Health check failed'
    });
  }
});

export { router as healthRoutes };
