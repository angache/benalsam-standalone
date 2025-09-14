import { Router } from 'express';
import { elasticsearchService } from '../services/elasticsearchService';
import { queueConsumer } from '../services/queueConsumer';
import { rabbitmqConfig } from '../config/rabbitmq';
import { supabaseConfig } from '../config/supabase';
import logger from '../config/logger';
import { 
  elasticsearchHealth, 
  rabbitmqHealth, 
  supabaseHealth,
  queueDepth,
  activeConsumers,
  jobStatusCount
} from '../config/metrics';
import { getCircuitBreakerStatus } from '../config/circuitBreaker';
import { healthService } from '../services/healthService';
import { dlqService } from '../services/dlqService';
import { errorService } from '../services/errorService';

const router = Router();

/**
 * @route   GET /health
 * @desc    Basic health check
 */
router.get('/', async (req, res) => {
  try {
    const status = {
      service: 'elasticsearch-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    };

    res.json(status);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check of all components
 */
router.get('/detailed', async (req, res) => {
  try {
    // Check all components in parallel
    const [
      esHealth,
      rmqHealth,
      dbHealth,
      consumerStatus
    ] = await Promise.all([
      elasticsearchService.checkHealth(),
      rabbitmqConfig.checkConnection(),
      supabaseConfig.checkConnection(),
      queueConsumer.isRunning()
    ]);

    // Get job metrics
    const { data: jobMetrics } = await supabaseConfig.getClient()
      .from('elasticsearch_sync_queue')
      .select('status')
      .then(result => {
        const metrics = {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0
        };
        
        if (result.data) {
          result.data.forEach(job => {
            metrics.total++;
            metrics[job.status as keyof typeof metrics]++;
          });
        }
        
        return { data: metrics };
      });

    // Update metrics
    elasticsearchHealth.set(esHealth.healthy ? 1 : 0);
    rabbitmqHealth.set(rmqHealth ? 1 : 0);
    supabaseHealth.set(dbHealth ? 1 : 0);
    activeConsumers.set({ queue_name: 'elasticsearch.sync' }, consumerStatus ? 1 : 0);
    
    // Update job status metrics
    jobStatusCount.set({ status: 'pending' }, jobMetrics.pending);
    jobStatusCount.set({ status: 'processing' }, jobMetrics.processing);
    jobStatusCount.set({ status: 'completed' }, jobMetrics.completed);
    jobStatusCount.set({ status: 'failed' }, jobMetrics.failed);

    // Get circuit breaker status
    const circuitBreakerStatus = getCircuitBreakerStatus();

    const status = {
      service: {
        name: 'elasticsearch-service',
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      elasticsearch: {
        connected: esHealth.healthy,
        status: esHealth.details.status,
        documents: esHealth.details.numberOfDocuments,
        size: esHealth.details.sizeInBytes
      },
      rabbitmq: {
        connected: rmqHealth,
        consumer: {
          running: consumerStatus
        }
      },
      database: {
        connected: dbHealth
      },
      jobs: {
        ...jobMetrics,
        error_rate: jobMetrics.failed / (jobMetrics.total || 1)
      },
      memory: {
        heap: process.memoryUsage().heapUsed,
        rss: process.memoryUsage().rss
      },
      circuitBreakers: circuitBreakerStatus
    };

    // Overall health status
    const isHealthy = esHealth.healthy && 
                     rmqHealth && 
                     dbHealth && 
                     consumerStatus;

    res.json({
      healthy: isHealthy,
      status: isHealthy ? 'healthy' : 'degraded',
      details: status
    });

  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(500).json({
      healthy: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /health/elasticsearch
 * @desc    Elasticsearch specific health check
 */
router.get('/elasticsearch', async (req, res) => {
  try {
    const health = await elasticsearchService.checkHealth();
    res.json(health);
  } catch (error) {
    logger.error('Elasticsearch health check failed:', error);
    res.status(500).json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /health/rabbitmq
 * @desc    RabbitMQ specific health check
 */
router.get('/rabbitmq', async (req, res) => {
  try {
    const connected = await rabbitmqConfig.checkConnection();
    const consumerRunning = queueConsumer.isRunning();

    res.json({
      healthy: connected && consumerRunning,
      details: {
        connection: connected,
        consumer: consumerRunning
      }
    });
  } catch (error) {
    logger.error('RabbitMQ health check failed:', error);
    res.status(500).json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /health/circuit-breakers
 * @desc    Circuit Breaker status check
 */
router.get('/circuit-breakers', async (req, res) => {
  try {
    const circuitBreakerStatus = getCircuitBreakerStatus();
    
    // Check if any circuit breaker is open (using stats instead of state)
    const isHealthy = circuitBreakerStatus.elasticsearch.enabled && 
                     circuitBreakerStatus.rabbitmq.enabled;
    
    res.json({
      healthy: isHealthy,
      status: isHealthy ? 'all_closed' : 'some_open',
      details: circuitBreakerStatus
    });
  } catch (error) {
    logger.error('Circuit Breaker health check failed:', error);
    res.status(500).json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /health/comprehensive
 * @desc    Comprehensive health check with all components
 */
router.get('/comprehensive', async (req, res) => {
  try {
    const healthResult = await healthService.performHealthCheck();
    
    res.status(healthResult.healthy ? 200 : 503).json(healthResult);
  } catch (error) {
    logger.error('Comprehensive health check failed:', error);
    res.status(500).json({
      healthy: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /health/history
 * @desc    Get health check history
 */
router.get('/history', async (req, res) => {
  try {
    const history = healthService.getHealthHistory();
    const trends = healthService.getHealthTrends();
    
    res.json({
      history,
      trends,
      count: history.length
    });
  } catch (error) {
    logger.error('Health history check failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /health/trends
 * @desc    Get health trends and statistics
 */
router.get('/trends', async (req, res) => {
  try {
    const trends = healthService.getHealthTrends();
    
    res.json(trends);
  } catch (error) {
    logger.error('Health trends check failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /health/dlq
 * @desc    DLQ (Dead Letter Queue) health check
 */
router.get('/dlq', async (req, res) => {
  try {
    const dlqHealth = await dlqService.getHealthStatus();
    const dlqStats = await dlqService.getDLQStats();
    
    res.json({
      healthy: dlqHealth.healthy,
      status: dlqHealth.healthy ? 'operational' : 'error',
      details: {
        ...dlqHealth,
        stats: dlqStats
      }
    });
  } catch (error) {
    logger.error('DLQ health check failed:', error);
    res.status(500).json({
      healthy: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /health/database
 * @desc    Database specific health check with job metrics
 */
router.get('/database', async (req, res) => {
  try {
    const connected = await supabaseConfig.checkConnection();
    
    if (!connected) {
      return res.status(503).json({
        healthy: false,
        error: 'Database connection failed'
      });
    }

    // Get job metrics
    const { data: metrics, error } = await supabaseConfig.getClient()
      .from('elasticsearch_sync_queue')
      .select(`
        status,
        count(*),
        avg(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time,
        status as _group
      `);

    if (error) {
      throw error;
    }

    res.json({
      healthy: true,
      details: {
        connection: connected,
        metrics: metrics || []
      }
    });
  } catch (error) {
    logger.error('Database health check failed:', error);
    res.status(500).json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /health/errors
 * @desc    Error metrics and statistics
 */
router.get('/errors', async (req, res) => {
  try {
    const errorMetrics = errorService.getErrorMetrics();

    res.json({
      healthy: errorMetrics.totalErrors < 100, // Threshold for healthy status
      status: errorMetrics.totalErrors < 100 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      metrics: errorMetrics,
      summary: {
        totalErrors: errorMetrics.totalErrors,
        retryableErrors: errorMetrics.retryableErrors,
        nonRetryableErrors: errorMetrics.nonRetryableErrors,
        dlqMessages: errorMetrics.dlqMessages,
        alertCount: errorMetrics.alertCount
      }
    });
  } catch (error) {
    logger.error('❌ Error fetching error metrics:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      healthy: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /health/jobs
 * @desc    Get job queue status and recent jobs
 */
router.get('/jobs', async (req, res) => {
  try {
    const supabase = supabaseConfig.getClient();
    const { limit = 10, status, operation } = req.query;

    // Build query
    let query = supabase
      .from('elasticsearch_sync_queue')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (operation) {
      query = query.eq('operation', operation);
    }

    const { data: jobs, error } = await query;

    if (error) {
      throw error;
    }

    // Get job statistics
    const { data: stats } = await supabase
      .from('elasticsearch_sync_queue')
      .select('status')
      .not('status', 'is', null);

    const jobStats = stats?.reduce((acc: Record<string, number>, job: any) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      success: true,
      data: {
        jobs: jobs || [],
        statistics: {
          total: jobs?.length || 0,
          byStatus: jobStats
        },
        filters: {
          limit: parseInt(limit as string) || 10,
          status: status || null,
          operation: operation || null
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error fetching jobs:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
