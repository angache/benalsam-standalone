import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from './logger';

// Default metrics collection
collectDefaultMetrics({ register });

// HTTP request metrics
export const httpRequestCounter = new Counter({
  name: 'cache_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'cache_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.5, 1, 2, 5],
});

// Cache operation metrics
export const cacheOperationDurationSeconds = new Histogram({
  name: 'cache_service_operation_duration_seconds',
  help: 'Duration of cache operations in seconds',
  labelNames: ['operation', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
});

export const cacheOperationsTotal = new Counter({
  name: 'cache_service_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'status'],
});

export const cacheHitsTotal = new Counter({
  name: 'cache_service_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['key_pattern'],
});

export const cacheMissesTotal = new Counter({
  name: 'cache_service_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['key_pattern'],
});

export const cacheEvictionsTotal = new Counter({
  name: 'cache_service_evictions_total',
  help: 'Total number of cache evictions',
  labelNames: ['reason'],
});

// Redis connection metrics
export const redisConnectionHealth = new Gauge({
  name: 'cache_service_redis_connection_health',
  help: 'Redis connection health status (1=healthy, 0=unhealthy)',
});

export const redisMemoryUsage = new Gauge({
  name: 'cache_service_redis_memory_usage_bytes',
  help: 'Redis memory usage in bytes',
});

export const redisKeyCount = new Gauge({
  name: 'cache_service_redis_key_count',
  help: 'Total number of keys in Redis',
});

// System health metrics
export const serviceHealth = new Gauge({
  name: 'cache_service_health_status',
  help: 'Cache Service health status (1=healthy, 0=unhealthy)',
});

export const redisHealth = new Gauge({
  name: 'cache_service_redis_health_status',
  help: 'Redis health status (1=healthy, 0=unhealthy)',
});

export const rabbitmqHealth = new Gauge({
  name: 'cache_service_rabbitmq_health_status',
  help: 'RabbitMQ health status (1=healthy, 0=unhealthy)',
});

export const databaseHealth = new Gauge({
  name: 'cache_service_database_health_status',
  help: 'Database health status (1=healthy, 0=unhealthy)',
});

// Register all metrics
register.registerMetric(httpRequestCounter);
register.registerMetric(httpRequestDurationSeconds);
register.registerMetric(cacheOperationDurationSeconds);
register.registerMetric(cacheOperationsTotal);
register.registerMetric(cacheHitsTotal);
register.registerMetric(cacheMissesTotal);
register.registerMetric(cacheEvictionsTotal);
register.registerMetric(redisConnectionHealth);
register.registerMetric(redisMemoryUsage);
register.registerMetric(redisKeyCount);
register.registerMetric(serviceHealth);
register.registerMetric(redisHealth);
register.registerMetric(rabbitmqHealth);
register.registerMetric(databaseHealth);

export const collectMetrics = async () => {
  try {
    const metrics = await register.metrics();
    return metrics;
  } catch (error) {
    logger.error('❌ Error collecting metrics:', error);
    throw error;
  }
};

logger.info('✅ Prometheus metrics initialized', { service: 'cache-service' });
