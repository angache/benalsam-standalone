import { Router } from 'express';
import { elasticsearchService } from '../services/elasticsearchService';
import { queueConsumer } from '../services/queueConsumer';
import { rabbitmqConfig } from '../config/rabbitmq';
import { supabaseConfig } from '../config/supabase';
import logger from '../config/logger';

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
      }
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
        avg(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time
      `)
      .group('status');

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

export default router;
