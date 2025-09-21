import Redis from 'ioredis';
import logger from './logger';

const redisConfig = {
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379'),
  ...(process.env['REDIS_PASSWORD'] && { password: process.env['REDIS_PASSWORD'] }),
  db: parseInt(process.env['REDIS_DB'] || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

export const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logger.info('✅ Redis connected', { service: 'cache-service' });
});

redis.on('error', (error) => {
  logger.error('❌ Redis connection error:', { error: error.message, service: 'cache-service' });
});

redis.on('close', () => {
  logger.warn('⚠️ Redis connection closed', { service: 'cache-service' });
});

export default redis;
