import Redis from 'ioredis';
import { logger } from './logger';
import { redisCircuitBreaker } from '../utils/circuitBreaker';

const redisConfig = {
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379'),
  ...(process.env['REDIS_PASSWORD'] && { password: process.env['REDIS_PASSWORD'] }),
  db: parseInt(process.env['REDIS_DB'] || '0'),
  retryDelayOnFailover: 1000,
  maxRetriesPerRequest: 5,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 30000, // 30 saniye
  commandTimeout: 15000, // 15 saniye
  retryDelayOnClusterDown: 300,
  enableOfflineQueue: false,
  // ECONNRESET için ek resilience
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    logger.info(`🔄 Redis retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
  // Connection pool settings
  maxLoadingTimeout: 10000,
  enableReadyCheck: true,
  // Auto reconnect on connection loss
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    return err.message.includes(targetError);
  }
};

export const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logger.info('✅ Redis connected', { service: 'cache-service' });
});

redis.on('error', (error: any) => {
  logger.error('❌ Redis connection error:', { 
    error: error.message, 
    code: error.code,
    errno: error.errno,
    syscall: error.syscall,
    service: 'cache-service' 
  });
  
  // ECONNRESET için özel handling
  if (error.code === 'ECONNRESET') {
    logger.warn('🔄 Redis connection reset, attempting reconnection...');
  }
});

redis.on('close', () => {
  logger.warn('⚠️ Redis connection closed', { service: 'cache-service' });
});

/**
 * Disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  try {
    if (redis.status === 'ready') {
      await redis.quit();
      logger.info('✅ Redis disconnected gracefully', { service: 'cache-service' });
    }
  } catch (error) {
    logger.error('❌ Error disconnecting from Redis:', error, { service: 'cache-service' });
  }
}

// Circuit breaker wrapped Redis operations
export const redisWithCircuitBreaker = {
  async ping(): Promise<string> {
    return await redisCircuitBreaker.execute(async () => {
      return await redis.ping();
    }, 'redis-ping');
  },

  async get(key: string): Promise<string | null> {
    return await redisCircuitBreaker.execute(async () => {
      return await redis.get(key);
    }, 'redis-get');
  },

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    return await redisCircuitBreaker.execute(async () => {
      if (ttl) {
        return await redis.setex(key, ttl, value);
      } else {
        return await redis.set(key, value);
      }
    }, 'redis-set');
  },

  async del(key: string): Promise<number> {
    return await redisCircuitBreaker.execute(async () => {
      return await redis.del(key);
    }, 'redis-del');
  },

  async exists(key: string): Promise<number> {
    return await redisCircuitBreaker.execute(async () => {
      return await redis.exists(key);
    }, 'redis-exists');
  },

  async expire(key: string, seconds: number): Promise<number> {
    return await redisCircuitBreaker.execute(async () => {
      return await redis.expire(key, seconds);
    }, 'redis-expire');
  },

  async ttl(key: string): Promise<number> {
    return await redisCircuitBreaker.execute(async () => {
      return await redis.ttl(key);
    }, 'redis-ttl');
  },

  async keys(pattern: string): Promise<string[]> {
    return await redisCircuitBreaker.execute(async () => {
      return await redis.keys(pattern);
    }, 'redis-keys');
  },

  async flushdb(): Promise<'OK'> {
    return await redisCircuitBreaker.execute(async () => {
      return await redis.flushdb();
    }, 'redis-flushdb');
  },

  async info(section?: string): Promise<string> {
    return await redisCircuitBreaker.execute(async () => {
      if (section) {
        return await redis.info(section);
      } else {
        return await redis.info();
      }
    }, 'redis-info');
  }
};

export default redis;
