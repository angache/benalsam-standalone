/**
 * Redis Configuration
 * 
 * @fileoverview Redis connection configuration for Listing Service
 * @author Benalsam Team
 * @version 1.0.0
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';
const redisPassword = process.env['REDIS_PASSWORD'];
const redisDb = parseInt(process.env['REDIS_DB'] || '0');

// Create Redis client
export const redisClient: RedisClientType = createClient({
  url: redisUrl,
  ...(redisPassword && { password: redisPassword }),
  database: redisDb,
  socket: {
    // Artan geri bekleme: 100ms → 5s (üst sınır)
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        logger.error('❌ Redis reconnection failed after 20 attempts');
        return new Error('Redis reconnection failed');
      }
      const delay = Math.min(100 * Math.pow(1.3, retries), 5000);
      return delay;
    },
    // Bağlantı ve canlılık
    keepAlive: 30000,
    connectTimeout: 15000,
    noDelay: true
  }
});

// Connection status
let isConnected = false;

/**
 * Connect to Redis
 */
export async function connectRedis(): Promise<void> {
  try {
    logger.info('🔌 Connecting to Redis...');
    
    redisClient.on('error', (error) => {
      logger.error('❌ Redis client error:', error);
      isConnected = false;
    });
    
    redisClient.on('connect', () => {
      logger.info('🔌 Redis client connected');
    });
    
    redisClient.on('ready', () => {
      logger.info('✅ Redis client ready');
      isConnected = true;
    });
    
    redisClient.on('end', () => {
      logger.warn('⚠️ Redis client connection ended');
      isConnected = false;
    });
    
    await redisClient.connect();
    
    // Test connection ve 30sn aralıklarla health ping
    await redisClient.ping();
    try {
      setInterval(async () => {
        if (redisClient.isOpen) {
          try {
            await redisClient.ping();
          } catch (err) {
            logger.warn('⚠️ Redis ping failed', err as Error);
          }
        }
      }, 30000);
    } catch (e) {
      logger.warn('⚠️ Redis ping scheduler could not be started');
    }
    logger.info('✅ Redis connected successfully');
    
  } catch (error) {
    logger.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * Get Redis connection status
 */
export function getRedisStatus(): boolean {
  return isConnected && redisClient.isReady;
}

/**
 * Health check for Redis
 */
export async function redisHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    ready: boolean;
    responseTime: number;
    error?: string;
  };
}> {
  const startTime = Date.now();
  
  try {
    await redisClient.ping();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      details: {
        connected: isConnected,
        ready: redisClient.isReady,
        responseTime
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      details: {
        connected: isConnected,
        ready: redisClient.isReady,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info('✅ Redis disconnected');
    }
  } catch (error) {
    logger.error('❌ Error disconnecting from Redis:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 SIGINT received, closing Redis connection...');
  await disconnectRedis();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  logger.info('🛑 SIGTERM received, closing Redis connection...');
  await disconnectRedis();
  process.exit(0);
});
