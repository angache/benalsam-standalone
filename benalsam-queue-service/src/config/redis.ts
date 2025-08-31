import { createClient } from 'redis';
import config from './index';
import logger from '../utils/logger';

// Create Redis client
const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  ...(config.redis.password && { password: config.redis.password }),
  database: config.redis.db,
});

// Redis connection event handlers
redisClient.on('connect', () => {
  logger.info('✅ Redis client connected', {
    host: config.redis.host,
    port: config.redis.port,
    db: config.redis.db,
  });
});

redisClient.on('ready', () => {
  logger.info('🚀 Redis client ready');
});

redisClient.on('error', (error: any) => {
  logger.error('❌ Redis client error:', error);
});

redisClient.on('end', () => {
  logger.warn('⚠️ Redis client connection ended');
});

redisClient.on('reconnecting', () => {
  logger.info('🔄 Redis client reconnecting...');
});

// Connect to Redis
const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
};

// Disconnect from Redis
const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.disconnect();
    logger.info('✅ Redis client disconnected');
  } catch (error) {
    logger.error('❌ Error disconnecting from Redis:', error);
  }
};

// Health check for Redis
const checkRedisHealth = async (): Promise<{ connected: boolean; latency?: number }> => {
  try {
    const startTime = Date.now();
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
    };
  }
};

export {
  redisClient,
  connectRedis,
  disconnectRedis,
  checkRedisHealth,
};
