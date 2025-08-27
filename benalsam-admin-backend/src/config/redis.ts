import Redis from 'ioredis';
import logger from './logger';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true,
  enableReadyCheck: true,
  maxLoadingTimeout: 10000,
  // Arkadaşının önerdiği iyileştirmeler
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    logger.info(`🔄 Redis retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
  // Bağlantı timeout ayarları
  connectTimeout: 10000,
  commandTimeout: 5000,
  // Keep alive ayarları
  keepAlive: 30000,
  // Auto reconnect ayarları
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  // Error handling
  enableOfflineQueue: true, // false'dan true'ya değiştirildi
  // Connection pooling
  family: 4, // IPv4
  // TLS ayarları (eğer gerekirse)
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined
};

// Create Redis client
export const redis = new Redis(redisConfig);

// Redis event handlers
redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (error: Error) => {
  // ECONNRESET hatasını özel olarak handle et
  if (error.message.includes('ECONNRESET')) {
    logger.warn('⚠️ Redis connection reset, attempting to reconnect...', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } else {
    logger.error('❌ Redis connection error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

redis.on('close', () => {
  logger.warn('⚠️ Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('🔄 Redis reconnecting...');
});

redis.on('ready', () => {
  logger.info('✅ Redis ready');
});

// Test Redis connection
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    await redis.ping();
    logger.info('✅ Redis connection test successful');
    return true;
  } catch (error) {
    logger.error('❌ Redis connection test failed:', error);
    return false;
  }
};

// Redis health check with detailed status
export const getRedisHealthStatus = async () => {
  try {
    const startTime = Date.now();
    await redis.ping();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
      info: {
        host: redis.options.host,
        port: redis.options.port,
        connected: redis.status === 'ready',
        status: redis.status
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      info: {
        host: redis.options.host,
        port: redis.options.port,
        connected: redis.status === 'ready',
        status: redis.status
      }
    };
  }
};

export default redis; 