import { Request, Response } from 'express';
import { getAllQueueStats } from '../queues/index';
import { checkElasticsearchSyncProcessorHealth } from '../processors/elasticsearchSyncProcessor';
import { redisClient } from '../config/redis';
import { ApiResponse, HealthCheckResponse } from '../types/queue';
import logger from '../utils/logger';

// Get detailed health check
export const getHealthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();
    
    logger.info('🏥 Performing health check', {
      userId: req.ip,
    });

    // Check Redis connection
    const redisHealth = await checkRedisHealth();
    
    // Check queue health
    const queueHealth = await checkQueueHealth();
    
    // Check processor health
    const processorHealth = await checkElasticsearchSyncProcessorHealth();
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryHealth = {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    };

    const responseTime = Date.now() - startTime;
    
    // Determine overall health
    const isHealthy = redisHealth.connected && 
                     queueHealth.elasticsearchSync.status === 'healthy' &&
                     processorHealth.status === 'healthy';

    const healthResponse: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: memoryHealth,
      redis: redisHealth,
      queues: {
        elasticsearchSync: {
          status: queueHealth.elasticsearchSync.status as 'healthy' | 'unhealthy',
          stats: queueHealth.elasticsearchSync.stats,
        },
      },
      processors: {
        elasticsearchSync: {
          status: processorHealth.status as 'healthy' | 'unhealthy',
          timestamp: processorHealth.timestamp,
          ...(processorHealth.error && { error: processorHealth.error }),
        },
      },
      responseTime,
    };

    logger.info('✅ Health check completed', {
      status: healthResponse.status,
      responseTime,
      redisConnected: redisHealth.connected,
      queueStatus: queueHealth.elasticsearchSync.status,
      processorStatus: processorHealth.status,
    });

    res.status(isHealthy ? 200 : 503).json({
      success: true,
      data: healthResponse,
      timestamp: new Date().toISOString(),
    } as ApiResponse<HealthCheckResponse>);

  } catch (error) {
    logger.error('❌ Health check failed:', error);

    res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Failed to perform health check',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

// Check Redis health
const checkRedisHealth = async () => {
  try {
    const startTime = Date.now();
    
    // Test Redis connection
    await redisClient.ping();
    
    const latency = Date.now() - startTime;
    
    return {
      connected: true,
      latency,
    };
  } catch (error) {
    logger.error('❌ Redis health check failed:', error);
    
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// Check queue health
const checkQueueHealth = async () => {
  try {
    const stats = await getAllQueueStats();
    
    // Determine queue health based on stats
    const isHealthy = stats.elasticsearchSync.failed === 0 && 
                     stats.elasticsearchSync.active < 10; // Not too many active jobs
    
    return {
      elasticsearchSync: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        stats: {
          total: stats.elasticsearchSync.waiting + stats.elasticsearchSync.active + stats.elasticsearchSync.completed + stats.elasticsearchSync.failed + stats.elasticsearchSync.delayed,
          pending: 0, // Bull doesn't have pending
          processing: 0, // Bull doesn't have processing
          completed: stats.elasticsearchSync.completed,
          failed: stats.elasticsearchSync.failed,
          delayed: stats.elasticsearchSync.delayed,
          active: stats.elasticsearchSync.active,
          waiting: stats.elasticsearchSync.waiting,
          paused: 0, // Bull doesn't have paused in stats
          avgProcessingTime: 0, // Will be calculated later
        },
      },
    };
  } catch (error) {
    logger.error('❌ Queue health check failed:', error);
    
    return {
      elasticsearchSync: {
        status: 'unhealthy',
        stats: {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          active: 0,
          waiting: 0,
          paused: 0,
          avgProcessingTime: 0,
        },
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
};

// Get system metrics
export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('📊 Getting system metrics', {
      userId: req.ip,
    });

    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      queueStats: await getAllQueueStats(),
      redis: await checkRedisHealth(),
    };

    logger.info('✅ System metrics retrieved successfully');

    res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    } as ApiResponse);

  } catch (error) {
    logger.error('❌ Failed to get system metrics:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to get system metrics',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};
