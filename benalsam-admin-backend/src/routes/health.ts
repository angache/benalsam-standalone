import express, { IRouter } from 'express';
import { redis } from '../config/redis';
import { elasticsearchClient } from '../services/elasticsearchService';
import { supabase } from '../config/supabase';
import Redis from 'ioredis';
import logger from '../config/logger';

const router: IRouter = express.Router();

// Ana health check endpoint
router.get('/', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        redis: 'unknown',
        elasticsearch: 'unknown'
      }
    };

    // Database health check
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      healthStatus.services.database = 'healthy';
    } catch (error) {
      healthStatus.services.database = 'unhealthy';
      healthStatus.status = 'degraded';
    }

    // Redis health check
    try {
      await redis.ping();
      healthStatus.services.redis = 'healthy';
    } catch (error) {
      healthStatus.services.redis = 'unhealthy';
      healthStatus.status = 'degraded';
    }

    // Elasticsearch health check
    try {
      const health = await elasticsearchClient.cluster.health();
      if (health.status === 'red') {
        healthStatus.services.elasticsearch = 'unhealthy';
        healthStatus.status = 'degraded';
      } else {
        healthStatus.services.elasticsearch = 'healthy';
      }
    } catch (error) {
      healthStatus.services.elasticsearch = 'unhealthy';
      healthStatus.status = 'degraded';
    }

    // Eğer herhangi bir servis unhealthy ise genel durum degraded
    const unhealthyServices = Object.values(healthStatus.services).filter(
      status => status === 'unhealthy'
    ).length;

    if (unhealthyServices > 0) {
      healthStatus.status = 'degraded';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      services: {
        database: 'unknown',
        redis: 'unknown',
        elasticsearch: 'unknown'
      }
    });
  }
});

// Detaylı health check endpoint
router.get('/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          status: 'unknown',
          responseTime: 0,
          details: {}
        },
        redis: {
          status: 'unknown',
          responseTime: 0,
          details: {}
        },
        elasticsearch: {
          status: 'unknown',
          responseTime: 0,
          details: {}
        }
      }
    };

    // Database detailed check
    const dbStart = Date.now();
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1);
      
      const dbResponseTime = Date.now() - dbStart;
      
      if (error) throw error;
      
      detailedHealth.services.database = {
        status: 'healthy',
        responseTime: dbResponseTime,
        details: {
          connection: 'active',
          queryTime: `${dbResponseTime}ms`
        }
      };
    } catch (error) {
      detailedHealth.services.database = {
        status: 'unhealthy',
        responseTime: Date.now() - dbStart,
        details: {
          error: (error as Error).message,
          connection: 'failed'
        }
      };
      detailedHealth.status = 'degraded';
    }

    // Redis detailed check
    const redisStart = Date.now();
    try {
      const redisPing = await redis.ping();
      const redisResponseTime = Date.now() - redisStart;
      
      detailedHealth.services.redis = {
        status: 'healthy',
        responseTime: redisResponseTime,
        details: {
          connection: 'active',
          pingResponse: redisPing,
          responseTime: `${redisResponseTime}ms`
        }
      };
    } catch (error) {
      detailedHealth.services.redis = {
        status: 'unhealthy',
        responseTime: Date.now() - redisStart,
        details: {
          error: (error as Error).message,
          connection: 'failed'
        }
      };
      detailedHealth.status = 'degraded';
    }

    // Elasticsearch detailed check
    const esStart = Date.now();
    try {
      const health = await elasticsearchClient.cluster.health();
      const esResponseTime = Date.now() - esStart;
      
      detailedHealth.services.elasticsearch = {
        status: health.status === 'red' ? 'unhealthy' : 'healthy',
        responseTime: esResponseTime,
        details: {
          clusterStatus: health.status,
          numberOfNodes: health.number_of_nodes,
          activeShards: health.active_shards,
          responseTime: `${esResponseTime}ms`
        }
      };
      
      if (health.status === 'red') {
        detailedHealth.status = 'degraded';
      }
    } catch (error) {
      detailedHealth.services.elasticsearch = {
        status: 'unhealthy',
        responseTime: Date.now() - esStart,
        details: {
          error: (error as Error).message,
          connection: 'failed'
        }
      };
      detailedHealth.status = 'degraded';
    }

    const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(detailedHealth);

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      services: {
        database: { status: 'unknown', responseTime: 0, details: {} },
        redis: { status: 'unknown', responseTime: 0, details: {} },
        elasticsearch: { status: 'unknown', responseTime: 0, details: {} }
      }
    });
  }
});

// Sadece database health check
router.get('/database', async (req, res) => {
  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - start;
    
    if (error) throw error;
    
    res.json({
      status: 'healthy',
      service: 'database',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'database',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Sadece Redis health check
router.get('/redis', async (req, res) => {
  try {
    const start = Date.now();
    const pingResponse = await redis.ping();
    const responseTime = Date.now() - start;
    
    res.json({
      status: 'healthy',
      service: 'redis',
      pingResponse,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'redis',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detaylı Redis test endpoint
router.get('/redis/test', async (req, res) => {
  try {
    logger.info('🔍 Starting detailed Redis test...');
    
    const testResults = {
      status: 'healthy',
      service: 'redis',
      timestamp: new Date().toISOString(),
      tests: {
        ping: { status: 'unknown', responseTime: 0, details: '' },
        set: { status: 'unknown', responseTime: 0, details: '' },
        get: { status: 'unknown', responseTime: 0, details: '' },
        delete: { status: 'unknown', responseTime: 0, details: '' },
        info: { status: 'unknown', responseTime: 0, details: {} }
      }
    };

    // Test 1: Ping
    try {
      const start = Date.now();
      const pingResponse = await redis.ping();
      const responseTime = Date.now() - start;
      
      testResults.tests.ping = {
        status: 'success',
        responseTime,
        details: `Response: ${pingResponse}`
      };
      logger.info('✅ Redis ping test passed');
    } catch (error) {
      testResults.tests.ping = {
        status: 'failed',
        responseTime: 0,
        details: (error as Error).message
      };
      logger.error('❌ Redis ping test failed:', error);
    }

    // Test 2: Set
    try {
      const start = Date.now();
      await redis.set('test_key', 'test_value', 'EX', 60);
      const responseTime = Date.now() - start;
      
      testResults.tests.set = {
        status: 'success',
        responseTime,
        details: 'Key set successfully with 60s expiration'
      };
      logger.info('✅ Redis set test passed');
    } catch (error) {
      testResults.tests.set = {
        status: 'failed',
        responseTime: 0,
        details: (error as Error).message
      };
      logger.error('❌ Redis set test failed:', error);
    }

    // Test 3: Get
    try {
      const start = Date.now();
      const value = await redis.get('test_key');
      const responseTime = Date.now() - start;
      
      testResults.tests.get = {
        status: 'success',
        responseTime,
        details: `Retrieved value: ${value}`
      };
      logger.info('✅ Redis get test passed');
    } catch (error) {
      testResults.tests.get = {
        status: 'failed',
        responseTime: 0,
        details: (error as Error).message
      };
      logger.error('❌ Redis get test failed:', error);
    }

    // Test 4: Delete
    try {
      const start = Date.now();
      const deleted = await redis.del('test_key');
      const responseTime = Date.now() - start;
      
      testResults.tests.delete = {
        status: 'success',
        responseTime,
        details: `Deleted ${deleted} key(s)`
      };
      logger.info('✅ Redis delete test passed');
    } catch (error) {
      testResults.tests.delete = {
        status: 'failed',
        responseTime: 0,
        details: (error as Error).message
      };
      logger.error('❌ Redis delete test failed:', error);
    }

    // Test 5: Info
    try {
      const start = Date.now();
      const info = await redis.info();
      const responseTime = Date.now() - start;
      
      // Parse Redis info
      const infoLines = info.split('\r\n');
      const infoObj: any = {};
      infoLines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          infoObj[key] = value;
        }
      });
      
      testResults.tests.info = {
        status: 'success',
        responseTime,
        details: {
          version: infoObj.redis_version,
          uptime: infoObj.uptime_in_seconds,
          connected_clients: infoObj.connected_clients,
          used_memory: infoObj.used_memory_human,
          total_commands_processed: infoObj.total_commands_processed
        }
      };
      logger.info('✅ Redis info test passed');
    } catch (error) {
      testResults.tests.info = {
        status: 'failed',
        responseTime: 0,
        details: (error as Error).message
      };
      logger.error('❌ Redis info test failed:', error);
    }

    // Determine overall status
    const failedTests = Object.values(testResults.tests).filter(test => test.status === 'failed').length;
    if (failedTests > 0) {
      testResults.status = 'degraded';
    }

    const statusCode = testResults.status === 'healthy' ? 200 : 503;
    logger.info(`🔍 Redis test completed with status: ${testResults.status}`);
    
    res.status(statusCode).json(testResults);
  } catch (error) {
    logger.error('❌ Redis test failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'redis',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Sadece Elasticsearch health check
router.get('/elasticsearch', async (req, res) => {
  try {
    const start = Date.now();
    const health = await elasticsearchClient.cluster.health();
    const responseTime = Date.now() - start;
    
    const status = health.status === 'red' ? 'unhealthy' : 'healthy';
    const statusCode = status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      status,
      service: 'elasticsearch',
      clusterStatus: health.status,
      numberOfNodes: health.number_of_nodes,
      activeShards: health.active_shards,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'elasticsearch',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 