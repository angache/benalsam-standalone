import { Router, Request, Response } from 'express';
import { healthCheckService, HealthStatus, DetailedHealthCheck } from '../config/healthCheck';
import logger from '../config/logger';

const router = Router();

// Basic health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthStatus = await healthCheckService.getOverallHealth();
    
    // Convert checks to services for frontend compatibility
    const services: Record<string, 'healthy' | 'unhealthy' | 'degraded'> = {};
    Object.entries(healthStatus.checks).forEach(([key, check]) => {
      services[key] = check.status;
    });
    
    const response = {
      status: healthStatus.status,
      timestamp: healthStatus.timestamp,
      uptime: healthStatus.uptime,
      version: healthStatus.version,
      environment: healthStatus.environment,
      services
    };
    
    // Set appropriate HTTP status code based on health status
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed health check endpoint
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const detailedHealth = await healthCheckService.getDetailedHealth();
    
    // Convert array to services object for frontend compatibility
    const services: Record<string, any> = {};
    detailedHealth.forEach(service => {
      const serviceName = service.name.toLowerCase().replace(' health', '');
      services[serviceName] = {
        status: service.status,
        responseTime: service.responseTime,
        lastChecked: service.lastChecked,
        details: service.details,
        error: service.error
      };
    });
    
    const response = {
      services,
      timestamp: new Date().toISOString()
    };
    
    // Set appropriate HTTP status code
    const statusCode = 200; // Always return 200 for detailed health check
    
    res.status(statusCode).json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Detailed health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Detailed health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Individual service health checks
router.get('/api', async (req: Request, res: Response) => {
  try {
    const apiHealth = await healthCheckService.checkApiHealth();
    const statusCode = apiHealth.status === 'healthy' ? 200 : 
                      apiHealth.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: apiHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ API health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'API health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/database', async (req: Request, res: Response) => {
  try {
    const databaseHealth = await healthCheckService.checkDatabaseHealth();
    const statusCode = databaseHealth.status === 'healthy' ? 200 : 
                      databaseHealth.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: databaseHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Database health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Database health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/redis', async (req: Request, res: Response) => {
  try {
    const redisHealth = await healthCheckService.checkRedisHealth();
    const statusCode = redisHealth.status === 'healthy' ? 200 : 
                      redisHealth.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: redisHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Redis health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Redis health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/elasticsearch', async (req: Request, res: Response) => {
  try {
    const elasticsearchHealth = await healthCheckService.checkElasticsearchHealth();
    const statusCode = elasticsearchHealth.status === 'healthy' ? 200 : 
                      elasticsearchHealth.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: elasticsearchHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Elasticsearch health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Elasticsearch health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/memory', async (req: Request, res: Response) => {
  try {
    const memoryHealth = await healthCheckService.checkMemoryHealth();
    const statusCode = memoryHealth.status === 'healthy' ? 200 : 
                      memoryHealth.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: memoryHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Memory health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Memory health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/disk', async (req: Request, res: Response) => {
  try {
    const diskHealth = await healthCheckService.checkDiskHealth();
    const statusCode = diskHealth.status === 'healthy' ? 200 : 
                      diskHealth.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: diskHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Disk health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Disk health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Uptime monitoring endpoint
router.get('/uptime', async (req: Request, res: Response) => {
  try {
    const healthStatus = await healthCheckService.getOverallHealth();
    
    const uptimeInfo = {
      uptime: healthStatus.uptime,
      uptimeFormatted: formatUptime(healthStatus.uptime),
      startTime: new Date(Date.now() - healthStatus.uptime).toISOString(),
      currentTime: new Date().toISOString(),
      status: healthStatus.status,
      version: healthStatus.version,
      environment: healthStatus.environment
    };
    
    res.json({
      success: true,
      data: uptimeInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Uptime check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Uptime check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// SLA monitoring endpoint
router.get('/sla', async (req: Request, res: Response) => {
  try {
    const healthStatus = await healthCheckService.getOverallHealth();
    const detailedHealth = await healthCheckService.getDetailedHealth();
    
    // Calculate SLA metrics
    const criticalServices = detailedHealth.filter(service => service.critical);
    const healthyCriticalServices = criticalServices.filter(service => service.status === 'healthy');
    const slaPercentage = criticalServices.length > 0 ? 
      (healthyCriticalServices.length / criticalServices.length) * 100 : 100;
    
    const slaInfo = {
      overallSLA: slaPercentage.toFixed(2) + '%',
      criticalServices: criticalServices.length,
      healthyCriticalServices: healthyCriticalServices.length,
      degradedCriticalServices: criticalServices.filter(s => s.status === 'degraded').length,
      unhealthyCriticalServices: criticalServices.filter(s => s.status === 'unhealthy').length,
      slaTarget: '99.9%',
      slaStatus: slaPercentage >= 99.9 ? 'meeting' : 'below_target',
      lastCheck: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: slaInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ SLA check failed:', error);
    res.status(500).json({
      success: false,
      message: 'SLA check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to format uptime
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export default router;
