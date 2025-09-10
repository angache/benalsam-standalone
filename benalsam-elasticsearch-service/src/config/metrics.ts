import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import logger from './logger';

// Default metrics collection
collectDefaultMetrics({ register });

// Message processing metrics
export const messageProcessingDuration = new Histogram({
  name: 'elasticsearch_message_processing_duration_seconds',
  help: 'Time spent processing messages',
  labelNames: ['operation', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const messagesProcessedTotal = new Counter({
  name: 'elasticsearch_messages_processed_total',
  help: 'Total number of messages processed',
  labelNames: ['operation', 'status']
});

export const messagesFailedTotal = new Counter({
  name: 'elasticsearch_messages_failed_total',
  help: 'Total number of failed messages',
  labelNames: ['operation', 'error_type']
});

// Queue metrics
export const queueDepth = new Gauge({
  name: 'elasticsearch_queue_depth',
  help: 'Current queue depth',
  labelNames: ['queue_name']
});

export const activeConsumers = new Gauge({
  name: 'elasticsearch_active_consumers',
  help: 'Number of active consumers',
  labelNames: ['queue_name']
});

// System health metrics
export const elasticsearchHealth = new Gauge({
  name: 'elasticsearch_health_status',
  help: 'Elasticsearch health status (1=healthy, 0=unhealthy)'
});

export const rabbitmqHealth = new Gauge({
  name: 'rabbitmq_health_status',
  help: 'RabbitMQ health status (1=healthy, 0=unhealthy)'
});

export const supabaseHealth = new Gauge({
  name: 'supabase_health_status',
  help: 'Supabase health status (1=healthy, 0=unhealthy)'
});

// Job status metrics
export const jobStatusCount = new Gauge({
  name: 'elasticsearch_job_status_count',
  help: 'Number of jobs by status',
  labelNames: ['status']
});

// Error rate calculation
export const errorRate = new Gauge({
  name: 'elasticsearch_error_rate',
  help: 'Error rate percentage'
});

// Register all metrics
register.registerMetric(messageProcessingDuration);
register.registerMetric(messagesProcessedTotal);
register.registerMetric(messagesFailedTotal);
register.registerMetric(queueDepth);
register.registerMetric(activeConsumers);
register.registerMetric(elasticsearchHealth);
register.registerMetric(rabbitmqHealth);
register.registerMetric(supabaseHealth);
register.registerMetric(jobStatusCount);
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
  // Prometheus client doesn't expose hashMap directly
  // We'll calculate error rate differently or remove this for now
  // For now, set to 0 and we can implement proper calculation later
  errorRate.set(0);
};

logger.info('✅ Prometheus metrics initialized');
