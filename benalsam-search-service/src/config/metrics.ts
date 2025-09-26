import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from './logger';

// Default metrics collection
collectDefaultMetrics({ register });

// API request metrics
export const httpRequestDuration = new Histogram({
  name: 'search_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const httpRequestsTotal = new Counter({
  name: 'search_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Search operation metrics
export const searchOperationDuration = new Histogram({
  name: 'search_service_search_operation_duration_seconds',
  help: 'Duration of search operations in seconds',
  labelNames: ['search_type', 'engine'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const searchesTotal = new Counter({
  name: 'search_service_searches_total',
  help: 'Total number of searches performed',
  labelNames: ['search_type', 'engine', 'status']
});

export const searchResultsCount = new Histogram({
  name: 'search_service_search_results_count',
  help: 'Number of results returned per search',
  labelNames: ['search_type', 'engine'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000]
});

// Elasticsearch specific metrics
export const elasticsearchOperationDuration = new Histogram({
  name: 'search_service_elasticsearch_operation_duration_seconds',
  help: 'Duration of Elasticsearch operations in seconds',
  labelNames: ['operation', 'index'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const elasticsearchOperationsTotal = new Counter({
  name: 'search_service_elasticsearch_operations_total',
  help: 'Total number of Elasticsearch operations',
  labelNames: ['operation', 'index', 'status']
});

export const elasticsearchErrorsTotal = new Counter({
  name: 'search_service_elasticsearch_errors_total',
  help: 'Total number of Elasticsearch errors',
  labelNames: ['error_type', 'index']
});

// Supabase fallback metrics
export const supabaseOperationDuration = new Histogram({
  name: 'search_service_supabase_operation_duration_seconds',
  help: 'Duration of Supabase operations in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const supabaseOperationsTotal = new Counter({
  name: 'search_service_supabase_operations_total',
  help: 'Total number of Supabase operations',
  labelNames: ['operation', 'table', 'status']
});

// Cache metrics
export const cacheHitsTotal = new Counter({
  name: 'search_service_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type']
});

export const cacheMissesTotal = new Counter({
  name: 'search_service_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type']
});

export const cacheOperationsDuration = new Histogram({
  name: 'search_service_cache_operations_duration_seconds',
  help: 'Duration of cache operations in seconds',
  labelNames: ['operation', 'cache_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5]
});

// System health metrics
export const elasticsearchHealth = new Gauge({
  name: 'search_service_elasticsearch_health_status',
  help: 'Elasticsearch health status (1=healthy, 0=unhealthy)'
});

export const supabaseHealth = new Gauge({
  name: 'search_service_supabase_health_status',
  help: 'Supabase health status (1=healthy, 0=unhealthy)'
});

export const cacheHealth = new Gauge({
  name: 'search_service_cache_health_status',
  help: 'Cache health status (1=healthy, 0=unhealthy)'
});

// Circuit breaker metrics
export const circuitBreakerState = new Gauge({
  name: 'search_service_circuit_breaker_state',
  help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
  labelNames: ['breaker_name']
});

export const circuitBreakerFailures = new Counter({
  name: 'search_service_circuit_breaker_failures_total',
  help: 'Total number of circuit breaker failures',
  labelNames: ['breaker_name']
});

// Error rate metrics
export const errorRate = new Gauge({
  name: 'search_service_error_rate',
  help: 'Error rate percentage'
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(searchOperationDuration);
register.registerMetric(searchesTotal);
register.registerMetric(searchResultsCount);
register.registerMetric(elasticsearchOperationDuration);
register.registerMetric(elasticsearchOperationsTotal);
register.registerMetric(elasticsearchErrorsTotal);
register.registerMetric(supabaseOperationDuration);
register.registerMetric(supabaseOperationsTotal);
register.registerMetric(cacheHitsTotal);
register.registerMetric(cacheMissesTotal);
register.registerMetric(cacheOperationsDuration);
register.registerMetric(elasticsearchHealth);
register.registerMetric(supabaseHealth);
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
