import { Router } from 'express';
import { getRedisClient } from '../config/redis';
import { getChannel } from '../config/rabbitmq';
import { logger } from '../config/logger';
import { cloudinaryCircuitBreaker, redisCircuitBreaker, rabbitmqCircuitBreaker, fileOperationCircuitBreaker } from '../utils/circuitBreaker';

const router = Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'upload-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
    circuitBreakers: {
      cloudinary: cloudinaryCircuitBreaker.getMetrics(),
      redis: redisCircuitBreaker.getMetrics(),
      rabbitmq: rabbitmqCircuitBreaker.getMetrics(),
      fileOperation: fileOperationCircuitBreaker.getMetrics()
    }
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const health = {
      service: 'upload-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
      dependencies: {
        redis: 'unknown',
        rabbitmq: 'unknown'
      }
    };

    // ✅ OPTIMIZED: Parallel health checks with timeouts
    const healthChecks = await Promise.allSettled([
      // Redis health check (500ms timeout)
      Promise.race([
        getRedisClient().ping().then(() => 'healthy'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 500))
      ]),
      
      // RabbitMQ health check (500ms timeout)
      Promise.race([
        Promise.resolve().then(() => {
          const channel = getChannel();
          return channel ? 'healthy' : 'unhealthy';
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('RabbitMQ timeout')), 500))
      ])
    ]);

    // Process results
    const [redisResult, rabbitmqResult] = healthChecks;
    
    health.dependencies.redis = redisResult.status === 'fulfilled' ? 'healthy' : 'unhealthy';
    health.dependencies.rabbitmq = rabbitmqResult.status === 'fulfilled' ? 'healthy' : 'unhealthy';
    
    if (health.dependencies.redis !== 'healthy' || health.dependencies.rabbitmq !== 'healthy') {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      service: 'upload-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Prometheus format health check
router.get('/prometheus', async (req, res) => {
  try {
    let redisStatus = 0;
    let rabbitmqStatus = 0;

    // Check Redis
    try {
      const redisClient = getRedisClient();
      await redisClient.ping();
      redisStatus = 1;
    } catch (error) {
      redisStatus = 0;
    }

    // Check RabbitMQ
    try {
      const channel = getChannel();
      if (channel) {
        rabbitmqStatus = 1;
      }
    } catch (error) {
      rabbitmqStatus = 0;
    }

    const overallStatus = (redisStatus === 1 && rabbitmqStatus === 1) ? 1 : 0;

    const prometheusMetrics = `# HELP upload_service_health Upload Service health status
# TYPE upload_service_health gauge
upload_service_health{service="upload-service"} ${overallStatus}

# HELP upload_service_uptime_seconds Upload Service uptime in seconds
# TYPE upload_service_uptime_seconds counter
upload_service_uptime_seconds{service="upload-service"} ${process.uptime()}

# HELP upload_service_memory_heap_bytes Upload Service heap memory usage
# TYPE upload_service_memory_heap_bytes gauge
upload_service_memory_heap_bytes{service="upload-service"} ${process.memoryUsage().heapUsed}

# HELP upload_service_memory_rss_bytes Upload Service RSS memory usage
# TYPE upload_service_memory_rss_bytes gauge
upload_service_memory_rss_bytes{service="upload-service"} ${process.memoryUsage().rss}

# HELP redis_connection_status Redis connection status
# TYPE redis_connection_status gauge
redis_connection_status{service="upload-service"} ${redisStatus}

# HELP rabbitmq_connection_status RabbitMQ connection status
# TYPE rabbitmq_connection_status gauge
rabbitmq_connection_status{service="upload-service"} ${rabbitmqStatus}
`;

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(prometheusMetrics);

  } catch (error) {
    logger.error('Prometheus health check failed:', error);
    res.status(500).send(`# HELP upload_service_health Upload Service health status
# TYPE upload_service_health gauge
upload_service_health{service="upload-service"} 0
`);
  }
});

export default router;
