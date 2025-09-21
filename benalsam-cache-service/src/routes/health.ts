import { Router, Request, Response } from 'express';
import logger from '../config/logger';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'cache-service',
      version: process.env['npm_package_version'] || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env['NODE_ENV']
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
