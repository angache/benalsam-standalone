import express, { Router, Request, Response } from 'express';
import { serviceRegistry } from '../services/serviceRegistry';
import { authenticateToken } from '../middleware/auth';
import logger from '../config/logger';
import type { AuthenticatedRequest } from '../types';

const router: Router = express.Router();

/**
 * Service Registry API Routes
 * 
 * Bu routes Service Registry'yi yönetir ve servisler arası iletişimi sağlar
 */

// Get all services
router.get('/services', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const services = serviceRegistry.getServices();
    
    return res.json({
      success: true,
      data: {
        services,
        count: services.length
      }
    });
  } catch (error) {
    logger.error('Service Registry services error:', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to get services'
    });
  }
});

// Health check for all services
router.get('/health', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const healthChecks = await serviceRegistry.healthCheckAll();
    
    const healthyServices = healthChecks.filter(h => h.healthy);
    const unhealthyServices = healthChecks.filter(h => !h.healthy);
    
    return res.json({
      success: true,
      data: {
        overall: unhealthyServices.length === 0 ? 'healthy' : 'degraded',
        healthy: healthyServices.length,
        unhealthy: unhealthyServices.length,
        total: healthChecks.length,
        services: healthChecks
      }
    });
  } catch (error) {
    logger.error('Service Registry health check error:', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to perform health checks'
    });
  }
});

// Health check for specific service
router.get('/health/:serviceName', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serviceName } = req.params;
    const healthCheck = await serviceRegistry.healthCheck(serviceName);
    
    return res.json({
      success: true,
      data: healthCheck
    });
  } catch (error) {
    logger.error(`Service Registry health check error for ${req.params.serviceName}:`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to perform health check'
    });
  }
});

// Test service communication
router.post('/test/:serviceName', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serviceName } = req.params;
    const { method = 'GET', endpoint = '/api/v1/health', data } = req.body;
    
    const result = await serviceRegistry.request(
      serviceName,
      method,
      endpoint,
      data
    );
    
    return res.json({
      success: true,
      data: {
        service: serviceName,
        method,
        endpoint,
        result
      }
    });
  } catch (error) {
    logger.error(`Service Registry test error for ${req.params.serviceName}:`, { error });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    });
  }
});

export { router as serviceRegistryRoutes };
