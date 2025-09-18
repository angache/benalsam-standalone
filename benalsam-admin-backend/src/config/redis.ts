import Redis from 'ioredis';
import logger from './logger';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true,
  enableReadyCheck: true,
  maxLoadingTimeout: 15000,
  // Artırımlı geri bekleme ve üst sınır
  retryStrategy: (times: number) => {
    const delay = Math.min(100 * Math.pow(1.3, times), 5000);
    logger.info(`🔄 Redis retry attempt ${times}, delay: ${Math.round(delay)}ms`);
    return delay;
  },
  // Bağlantı timeout ayarları
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '15000'),
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '10000'),
  // Keep alive ayarları
  keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE || '30000'),
  // Auto reconnect ayarları
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '5'),
  retryDelayOnFailover: 200,
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

redis.on('ready', () => {
  logger.info('✅ Redis ready');
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

// Periyodik ping ile bağlantı sağlığını izle
try {
  setInterval(async () => {
    try {
      await redis.ping();
    } catch (err) {
      logger.warn('⚠️ Redis ping failed', err as Error);
    }
  }, 30000);
} catch {
  // ignore scheduler errors
}

// Graceful shutdown
const shutdown = async () => {
  try {
    if ((redis as any).status !== 'end') {
      await redis.quit();
      logger.info('✅ Redis disconnected');
    }
  } catch (e) {
    logger.error('❌ Error during Redis disconnect', e as Error);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

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