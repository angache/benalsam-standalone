import express, { IRouter } from 'express';
import { redis } from '../config/redis';
import { elasticsearchClient } from '../services/elasticsearchService';
import { supabase } from '../config/supabase';
import logger from '../config/logger';
import { monitoringController } from '../controllers/monitoringController';
import { authMiddleware } from '../middleware/auth';

const router: IRouter = express.Router();

// System metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      services: {
        database: {
          status: 'unknown',
          responseTime: 0,
          connections: 0
        },
        redis: {
          status: 'unknown',
          responseTime: 0,
          memory: {},
          keys: 0
        },
        elasticsearch: {
          status: 'unknown',
          responseTime: 0,
          indices: 0,
          documents: 0
        }
      },
      application: {
        requests: {
          total: 0,
          success: 0,
          error: 0,
          averageResponseTime: 0
        },
        errors: {
          total: 0,
          byType: {}
        }
      }
    };

    // Database metrics
    const dbStart = Date.now();
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1);
      
      const dbResponseTime = Date.now() - dbStart;
      
      if (error) throw error;
      
      metrics.services.database = {
        status: 'healthy',
        responseTime: dbResponseTime,
        connections: 1 // Supabase manages connections
      };
    } catch (error) {
      metrics.services.database = {
        status: 'unhealthy',
        responseTime: Date.now() - dbStart,
        connections: 0
      };
    }

    // Redis metrics
    const redisStart = Date.now();
    try {
      const redisInfo = await redis.info();
      const redisResponseTime = Date.now() - redisStart;
      
      // Parse Redis info
      const infoLines = redisInfo.split('\r\n');
      const redisMemory: any = {};
      let keyCount = 0;
      
      infoLines.forEach((line: string) => {
        if (line.startsWith('used_memory:')) {
          redisMemory.used = parseInt(line.split(':')[1]);
        }
        if (line.startsWith('used_memory_peak:')) {
          redisMemory.peak = parseInt(line.split(':')[1]);
        }
        if (line.startsWith('db0:')) {
          const keysMatch = line.match(/keys=(\d+)/);
          if (keysMatch) keyCount = parseInt(keysMatch[1]);
        }
      });
      
      metrics.services.redis = {
        status: 'healthy',
        responseTime: redisResponseTime,
        memory: redisMemory,
        keys: keyCount
      };
    } catch (error) {
      metrics.services.redis = {
        status: 'unhealthy',
        responseTime: Date.now() - redisStart,
        memory: {},
        keys: 0
      };
    }

    // Elasticsearch metrics
    const esStart = Date.now();
    try {
      const health = await elasticsearchClient.cluster.health();
      const indices = await elasticsearchClient.cat.indices({ format: 'json' });
      const esResponseTime = Date.now() - esStart;
      
      let totalDocuments = 0;
      indices.forEach((index: any) => {
        totalDocuments += parseInt(index['docs.count'] || '0');
      });
      
      metrics.services.elasticsearch = {
        status: health.status === 'red' ? 'unhealthy' : 'healthy',
        responseTime: esResponseTime,
        indices: indices.length,
        documents: totalDocuments
      };
    } catch (error) {
      metrics.services.elasticsearch = {
        status: 'unhealthy',
        responseTime: Date.now() - esStart,
        indices: 0,
        documents: 0
      };
    }

    res.json(metrics);

  } catch (error) {
    logger.error('Error fetching metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: (error as Error).message
    });
  }
});

// Performance metrics endpoint
router.get('/performance', async (req, res) => {
  try {
    const performance = {
      timestamp: new Date().toISOString(),
      database: {
        queries: {
          total: 0,
          slow: 0,
          averageTime: 0
        }
      },
      api: {
        endpoints: {},
        responseTimes: {},
        errorRates: {}
      },
      cache: {
        hitRate: 0,
        missRate: 0,
        totalRequests: 0
      }
    };

    // Bu endpoint gelecekte daha detaylı performance metrics için kullanılacak
    // Şimdilik temel bilgileri döndürüyoruz

    res.json(performance);

  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch performance metrics',
      message: (error as Error).message
    });
  }
});

// Error tracking endpoint
router.get('/errors', async (req, res) => {
  try {
    const errors = {
      timestamp: new Date().toISOString(),
      recent: [],
      summary: {
        total: 0,
        byType: {},
        byEndpoint: {}
      }
    };

    // Bu endpoint gelecekte error tracking için kullanılacak
    // Şimdilik temel bilgileri döndürüyoruz

    res.json(errors);

  } catch (error) {
    logger.error('Error fetching error metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch error metrics',
      message: (error as Error).message
    });
  }
});

// Service status endpoint
router.get('/status', async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      services: {
        database: 'unknown',
        redis: 'unknown',
        elasticsearch: 'unknown'
      },
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // Check database
    try {
      await supabase.from('admin_users').select('count').limit(1);
      status.services.database = 'healthy';
    } catch (error) {
      status.services.database = 'unhealthy';
      status.overall = 'degraded';
    }

    // Check Redis
    try {
      await redis.ping();
      status.services.redis = 'healthy';
    } catch (error) {
      status.services.redis = 'unhealthy';
      status.overall = 'degraded';
    }

    // Check Elasticsearch
    try {
      const health = await elasticsearchClient.cluster.health();
      status.services.elasticsearch = health.status === 'red' ? 'unhealthy' : 'healthy';
      if (health.status === 'red') {
        status.overall = 'degraded';
      }
    } catch (error) {
      status.services.elasticsearch = 'unhealthy';
      status.overall = 'degraded';
    }

    const statusCode = status.overall === 'healthy' ? 200 : 503;
    res.status(statusCode).json(status);

  } catch (error) {
    logger.error('Error fetching service status:', error);
    res.status(503).json({
      overall: 'unhealthy',
      error: 'Failed to fetch service status',
      message: (error as Error).message
    });
  }
});

export default router; 