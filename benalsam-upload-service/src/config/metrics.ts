import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from './logger';

// Default metrics collection
collectDefaultMetrics({ register });

// HTTP request metrics
export const httpRequestCounter = new Counter({
  name: 'upload_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'upload_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.5, 1, 2, 5],
});

// File upload metrics
export const fileUploadDurationSeconds = new Histogram({
  name: 'upload_service_file_upload_duration_seconds',
  help: 'Duration of file upload operations in seconds',
  labelNames: ['file_type', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

export const filesUploadedTotal = new Counter({
  name: 'upload_service_files_uploaded_total',
  help: 'Total number of files uploaded',
  labelNames: ['file_type', 'status'],
});

export const fileUploadSizeBytes = new Histogram({
  name: 'upload_service_file_upload_size_bytes',
  help: 'Size of uploaded files in bytes',
  labelNames: ['file_type'],
  buckets: [1024, 10240, 102400, 1048576, 10485760, 104857600], // 1KB to 100MB
});

// Storage metrics
export const storageOperationDurationSeconds = new Histogram({
  name: 'upload_service_storage_operation_duration_seconds',
  help: 'Duration of storage operations in seconds',
  labelNames: ['operation', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
});

export const storageOperationsTotal = new Counter({
  name: 'upload_service_storage_operations_total',
  help: 'Total number of storage operations',
  labelNames: ['operation', 'status'],
});

// System health metrics
export const serviceHealth = new Gauge({
  name: 'upload_service_health_status',
  help: 'Upload Service health status (1=healthy, 0=unhealthy)',
});

export const redisHealth = new Gauge({
  name: 'upload_service_redis_health_status',
  help: 'Redis health status (1=healthy, 0=unhealthy)',
});

export const rabbitmqHealth = new Gauge({
  name: 'upload_service_rabbitmq_health_status',
  help: 'RabbitMQ health status (1=healthy, 0=unhealthy)',
});

export const databaseHealth = new Gauge({
  name: 'upload_service_database_health_status',
  help: 'Database health status (1=healthy, 0=unhealthy)',
});

// Register all metrics
register.registerMetric(httpRequestCounter);
register.registerMetric(httpRequestDurationSeconds);
register.registerMetric(fileUploadDurationSeconds);
register.registerMetric(filesUploadedTotal);
register.registerMetric(fileUploadSizeBytes);
register.registerMetric(storageOperationDurationSeconds);
register.registerMetric(storageOperationsTotal);
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

logger.info('✅ Prometheus metrics initialized', { service: 'upload-service' });
