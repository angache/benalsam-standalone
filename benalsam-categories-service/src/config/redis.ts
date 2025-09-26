import { logger } from './logger';

/**
 * Disconnect from Redis
 * Categories service doesn't use Redis directly, but we provide this for consistency
 */
export async function disconnectRedis(): Promise<void> {
  try {
    // Categories service doesn't use Redis directly
    // This is a placeholder for consistency with other services
    logger.info('✅ Redis disconnected gracefully (not used)', { service: 'categories-service' });
  } catch (error) {
    logger.error('❌ Error disconnecting from Redis:', error, { service: 'categories-service' });
  }
}
