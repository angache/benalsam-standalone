import Redis from 'ioredis';
import logger from './logger';

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

export default redis;
