import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from './logger';

// Default metrics collection
collectDefaultMetrics({ register });

// API request metrics
export const httpRequestDuration = new Histogram({
  name: 'listing_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const httpRequestsTotal = new Counter({
  name: 'listing_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Database operation metrics
export const databaseOperationDuration = new Histogram({
  name: 'listing_service_database_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const databaseOperationsTotal = new Counter({
  name: 'listing_service_database_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'table', 'status']
});

// Listing specific metrics
export const listingsCreatedTotal = new Counter({
  name: 'listing_service_listings_created_total',
  help: 'Total number of listings created',
  labelNames: ['category', 'status']
});

export const listingsUpdatedTotal = new Counter({
  name: 'listing_service_listings_updated_total',
  help: 'Total number of listings updated',
  labelNames: ['category', 'status']
});

export const listingsDeletedTotal = new Counter({
  name: 'listing_service_listings_deleted_total',
  help: 'Total number of listings deleted',
  labelNames: ['category']
});

export const activeListingsCount = new Gauge({
  name: 'listing_service_active_listings_count',
  help: 'Current number of active listings',
  labelNames: ['category']
});

// Job processing metrics
export const jobProcessingDuration = new Histogram({
  name: 'listing_service_job_processing_duration_seconds',
  help: 'Duration of job processing in seconds',
  labelNames: ['job_type', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const jobsProcessedTotal = new Counter({
  name: 'listing_service_jobs_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['job_type', 'status']
});

export const jobsFailedTotal = new Counter({
  name: 'listing_service_jobs_failed_total',
  help: 'Total number of failed jobs',
  labelNames: ['job_type', 'error_type']
});

// System health metrics
export const databaseHealth = new Gauge({
  name: 'listing_service_database_health_status',
  help: 'Database health status (1=healthy, 0=unhealthy)'
});

export const redisHealth = new Gauge({
  name: 'listing_service_redis_health_status',
  help: 'Redis health status (1=healthy, 0=unhealthy)'
});

export const rabbitmqHealth = new Gauge({
  name: 'listing_service_rabbitmq_health_status',
  help: 'RabbitMQ health status (1=healthy, 0=unhealthy)'
});

// Circuit breaker metrics
export const circuitBreakerState = new Gauge({
  name: 'listing_service_circuit_breaker_state',
  help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
  labelNames: ['breaker_name']
});

export const circuitBreakerFailures = new Counter({
  name: 'listing_service_circuit_breaker_failures_total',
  help: 'Total number of circuit breaker failures',
  labelNames: ['breaker_name']
});

// Error rate metrics
export const errorRate = new Gauge({
  name: 'listing_service_error_rate',
  help: 'Error rate percentage'
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(databaseOperationDuration);
register.registerMetric(databaseOperationsTotal);
register.registerMetric(listingsCreatedTotal);
register.registerMetric(listingsUpdatedTotal);
register.registerMetric(listingsDeletedTotal);
register.registerMetric(activeListingsCount);
register.registerMetric(jobProcessingDuration);
register.registerMetric(jobsProcessedTotal);
register.registerMetric(jobsFailedTotal);
register.registerMetric(databaseHealth);
register.registerMetric(redisHealth);
register.registerMetric(rabbitmqHealth);
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
