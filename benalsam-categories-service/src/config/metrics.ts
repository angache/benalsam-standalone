import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from './logger';

// Default metrics collection
collectDefaultMetrics({ register });

// API request metrics
export const httpRequestDuration = new Histogram({
  name: 'categories_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const httpRequestsTotal = new Counter({
  name: 'categories_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Database operation metrics
export const databaseOperationDuration = new Histogram({
  name: 'categories_service_database_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const databaseOperationsTotal = new Counter({
  name: 'categories_service_database_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'table', 'status']
});

// Category specific metrics
export const categoriesCreatedTotal = new Counter({
  name: 'categories_service_categories_created_total',
  help: 'Total number of categories created',
  labelNames: ['parent_category']
});

export const categoriesUpdatedTotal = new Counter({
  name: 'categories_service_categories_updated_total',
  help: 'Total number of categories updated',
  labelNames: ['parent_category']
});

export const categoriesDeletedTotal = new Counter({
  name: 'categories_service_categories_deleted_total',
  help: 'Total number of categories deleted',
  labelNames: ['parent_category']
});

export const activeCategoriesCount = new Gauge({
  name: 'categories_service_active_categories_count',
  help: 'Current number of active categories',
  labelNames: ['level']
});

// Attribute specific metrics
export const attributesCreatedTotal = new Counter({
  name: 'categories_service_attributes_created_total',
  help: 'Total number of attributes created',
  labelNames: ['category_id']
});

export const attributesUpdatedTotal = new Counter({
  name: 'categories_service_attributes_updated_total',
  help: 'Total number of attributes updated',
  labelNames: ['category_id']
});

export const attributesDeletedTotal = new Counter({
  name: 'categories_service_attributes_deleted_total',
  help: 'Total number of attributes deleted',
  labelNames: ['category_id']
});

// Cache metrics
export const cacheHitsTotal = new Counter({
  name: 'categories_service_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type']
});

export const cacheMissesTotal = new Counter({
  name: 'categories_service_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type']
});

export const cacheOperationsDuration = new Histogram({
  name: 'categories_service_cache_operations_duration_seconds',
  help: 'Duration of cache operations in seconds',
  labelNames: ['operation', 'cache_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5]
});

// System health metrics
export const databaseHealth = new Gauge({
  name: 'categories_service_database_health_status',
  help: 'Database health status (1=healthy, 0=unhealthy)'
});

export const cacheHealth = new Gauge({
  name: 'categories_service_cache_health_status',
  help: 'Cache health status (1=healthy, 0=unhealthy)'
});

// Circuit breaker metrics
export const circuitBreakerState = new Gauge({
  name: 'categories_service_circuit_breaker_state',
  help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
  labelNames: ['breaker_name']
});

export const circuitBreakerFailures = new Counter({
  name: 'categories_service_circuit_breaker_failures_total',
  help: 'Total number of circuit breaker failures',
  labelNames: ['breaker_name']
});

// Error rate metrics
export const errorRate = new Gauge({
  name: 'categories_service_error_rate',
  help: 'Error rate percentage'
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(databaseOperationDuration);
register.registerMetric(databaseOperationsTotal);
register.registerMetric(categoriesCreatedTotal);
register.registerMetric(categoriesUpdatedTotal);
register.registerMetric(categoriesDeletedTotal);
register.registerMetric(activeCategoriesCount);
register.registerMetric(attributesCreatedTotal);
register.registerMetric(attributesUpdatedTotal);
register.registerMetric(attributesDeletedTotal);
register.registerMetric(cacheHitsTotal);
register.registerMetric(cacheMissesTotal);
register.registerMetric(cacheOperationsDuration);
register.registerMetric(databaseHealth);
register.registerMetric(cacheHealth);
register.registerMetric(circuitBreakerState);
register.registerMetric(circuitBreakerFailures);
register.registerMetric(errorRate);

// Metrics collection function
export const collectMetrics = async () => {
  try {
    const metrics = await register.metrics();
    return metrics;
  } catch (error) {
    logger.error('❌ Error collecting metrics:', error);
    throw error;
  }
};

// Update error rate
export const updateErrorRate = () => {
  // Calculate error rate based on recent requests
  // For now, set to 0 and implement proper calculation later
  errorRate.set(0);
};

logger.info('✅ Prometheus metrics initialized');
