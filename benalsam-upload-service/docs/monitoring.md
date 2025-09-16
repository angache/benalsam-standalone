# 📊 Monitoring Documentation

## 📊 Overview

The Upload Service includes comprehensive monitoring capabilities to track performance, health, and operational metrics. This monitoring system provides real-time insights into service status and helps identify issues before they impact users.

## 🏗️ Monitoring Architecture

### **Monitoring Stack**
```
Upload Service → Prometheus → Grafana → Alertmanager
```

### **Components**
- **Health Checks**: Service health monitoring
- **Prometheus Metrics**: Custom metrics collection
- **Grafana Dashboards**: Visual monitoring
- **Alertmanager**: Alert management
- **Logging**: Structured logging with Winston

## 🏥 Health Checks

### **Health Endpoints**

| Endpoint | Description | Response Time | Frequency |
|----------|-------------|---------------|-----------|
| `/api/v1/health` | Basic health check | < 100ms | 30s |
| `/api/v1/health/detailed` | Detailed health check | < 500ms | 60s |
| `/api/v1/health/database` | Database health | < 200ms | 30s |
| `/api/v1/health/redis` | Redis health | < 100ms | 30s |
| `/api/v1/health/rabbitmq` | RabbitMQ health | < 200ms | 30s |
| `/api/v1/health/jobs` | Job processor health | < 100ms | 30s |

### **Health Check Implementation**

```typescript
// Basic health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Detailed health check
app.get('/api/v1/health/detailed', async (req, res) => {
  const health = await checkAllServices();
  res.json({
    status: health.overall,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: health.services,
    metrics: health.metrics
  });
});
```

## 📈 Prometheus Metrics

### **Custom Metrics**

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `upload_requests_total` | Counter | Total upload requests | `method`, `endpoint`, `status` |
| `upload_duration_seconds` | Histogram | Upload processing time | `method`, `endpoint` |
| `upload_file_size_bytes` | Histogram | Uploaded file sizes | `type` |
| `upload_quota_usage_bytes` | Gauge | Quota usage per user | `user_id` |
| `job_processing_duration_seconds` | Histogram | Job processing time | `job_type` |
| `job_queue_depth` | Gauge | Job queue depth | `queue_name` |
| `cloudinary_requests_total` | Counter | Cloudinary API requests | `operation`, `status` |
| `redis_operations_total` | Counter | Redis operations | `operation`, `status` |

### **System Metrics**

| Metric Name | Type | Description |
|-------------|------|-------------|
| `nodejs_memory_heap_used_bytes` | Gauge | Heap memory usage |
| `nodejs_memory_heap_total_bytes` | Gauge | Total heap memory |
| `nodejs_memory_rss_bytes` | Gauge | Resident set size |
| `nodejs_process_cpu_seconds_total` | Counter | CPU usage |
| `nodejs_eventloop_lag_seconds` | Gauge | Event loop lag |

### **Metrics Implementation**

```typescript
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Upload metrics
const uploadRequestsTotal = new Counter({
  name: 'upload_requests_total',
  help: 'Total number of upload requests',
  labelNames: ['method', 'endpoint', 'status']
});

const uploadDurationSeconds = new Histogram({
  name: 'upload_duration_seconds',
  help: 'Upload processing duration in seconds',
  labelNames: ['method', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

const uploadFileSizeBytes = new Histogram({
  name: 'upload_file_size_bytes',
  help: 'Uploaded file sizes in bytes',
  labelNames: ['type'],
  buckets: [1024, 10240, 102400, 1048576, 10485760, 104857600]
});

// Job metrics
const jobQueueDepth = new Gauge({
  name: 'job_queue_depth',
  help: 'Number of jobs in queue',
  labelNames: ['queue_name']
});

const jobProcessingDurationSeconds = new Histogram({
  name: 'job_processing_duration_seconds',
  help: 'Job processing duration in seconds',
  labelNames: ['job_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});
```

## 📊 Grafana Dashboards

### **Upload Service Dashboard**

#### **Panels**
1. **Service Health**: Overall service status
2. **Upload Metrics**: Request rate, success rate, error rate
3. **File Processing**: File sizes, processing times
4. **Job System**: Queue depth, processing rate
5. **Resource Usage**: CPU, memory, disk usage
6. **Cloudinary Integration**: API calls, response times
7. **Error Tracking**: Error rates, error types

#### **Dashboard Configuration**

```json
{
  "dashboard": {
    "title": "Upload Service Monitoring",
    "panels": [
      {
        "title": "Upload Requests",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(upload_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Upload Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(upload_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Job Queue Depth",
        "type": "singlestat",
        "targets": [
          {
            "expr": "sum(job_queue_depth)",
            "legendFormat": "Total Jobs"
          }
        ]
      }
    ]
  }
}
```

## 🚨 Alerting

### **Alert Rules**

| Alert Name | Condition | Severity | Description |
|------------|-----------|----------|-------------|
| `UploadServiceDown` | `up{job="upload-service"} == 0` | Critical | Service is down |
| `HighErrorRate` | `rate(upload_requests_total{status="error"}[5m]) > 0.1` | Warning | High error rate |
| `SlowUploads` | `histogram_quantile(0.95, rate(upload_duration_seconds_bucket[5m])) > 30` | Warning | Slow upload processing |
| `JobQueueBackup` | `job_queue_depth > 100` | Warning | Job queue backup |
| `HighMemoryUsage` | `nodejs_memory_heap_used_bytes / nodejs_memory_heap_total_bytes > 0.8` | Warning | High memory usage |
| `CloudinaryErrors` | `rate(cloudinary_requests_total{status="error"}[5m]) > 0.05` | Warning | Cloudinary API errors |

### **Alert Configuration**

```yaml
# prometheus.yml
rule_files:
  - "upload-service-alerts.yml"

# upload-service-alerts.yml
groups:
  - name: upload-service
    rules:
      - alert: UploadServiceDown
        expr: up{job="upload-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Upload Service is down"
          description: "Upload Service has been down for more than 1 minute"
      
      - alert: HighErrorRate
        expr: rate(upload_requests_total{status="error"}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Upload Service error rate is {{ $value }} errors per second"
      
      - alert: SlowUploads
        expr: histogram_quantile(0.95, rate(upload_duration_seconds_bucket[5m])) > 30
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow upload processing"
          description: "95th percentile upload time is {{ $value }} seconds"
```

## 📝 Logging

### **Log Levels**

| Level | Description | Usage |
|-------|-------------|-------|
| `error` | Error conditions | Failed operations, exceptions |
| `warn` | Warning conditions | Deprecated features, fallbacks |
| `info` | Informational messages | Service startup, health checks |
| `debug` | Debug information | Detailed processing info |
| `verbose` | Verbose information | Request/response details |

### **Log Format**

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### **Structured Logging**

```typescript
// Upload request logging
logger.info('Upload request received', {
  userId: 'user123',
  uploadId: 'upload_123456789',
  fileCount: 3,
  totalSize: 1234567,
  endpoint: '/api/v1/upload/listings'
});

// Error logging
logger.error('Upload failed', {
  userId: 'user123',
  uploadId: 'upload_123456789',
  error: error.message,
  stack: error.stack,
  endpoint: '/api/v1/upload/listings'
});

// Job processing logging
logger.info('Job processing started', {
  jobId: 'job_123456789',
  jobType: 'IMAGE_UPLOAD_PROCESSING',
  userId: 'user123',
  priority: 'normal'
});
```

## 🔍 Troubleshooting

### **Common Issues**

1. **Service Health Check Failing**
   ```bash
   # Check service status
   curl http://localhost:3007/api/v1/health
   
   # Check detailed health
   curl http://localhost:3007/api/v1/health/detailed
   ```

2. **High Error Rate**
   ```bash
   # Check error logs
   grep "ERROR" logs/upload-service.log
   
   # Check metrics
   curl http://localhost:3007/api/v1/health/prometheus | grep upload_requests_total
   ```

3. **Slow Uploads**
   ```bash
   # Check upload duration metrics
   curl http://localhost:3007/api/v1/health/prometheus | grep upload_duration_seconds
   
   # Check Cloudinary health
   curl http://localhost:3007/api/v1/health/detailed | jq '.services.cloudinary'
   ```

4. **Job Queue Backup**
   ```bash
   # Check job queue depth
   curl http://localhost:3007/api/v1/jobs/metrics | jq '.data.metrics'
   
   # Check job processor health
   curl http://localhost:3007/api/v1/health/jobs
   ```

### **Debug Commands**

```bash
# Check all health endpoints
curl http://localhost:3007/api/v1/health
curl http://localhost:3007/api/v1/health/detailed
curl http://localhost:3007/api/v1/health/database
curl http://localhost:3007/api/v1/health/redis
curl http://localhost:3007/api/v1/health/rabbitmq
curl http://localhost:3007/api/v1/health/jobs

# Check metrics
curl http://localhost:3007/api/v1/health/prometheus

# Check job metrics
curl http://localhost:3007/api/v1/jobs/metrics

# Check logs
tail -f logs/upload-service.log
grep "ERROR" logs/upload-service.log
```

## 📊 Performance Monitoring

### **Key Performance Indicators (KPIs)**

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| **Upload Success Rate** | > 99% | < 99% | < 95% |
| **Average Upload Time** | < 5s | > 10s | > 30s |
| **95th Percentile Upload Time** | < 15s | > 30s | > 60s |
| **Job Processing Rate** | > 10/min | < 5/min | < 1/min |
| **Memory Usage** | < 70% | > 80% | > 90% |
| **CPU Usage** | < 70% | > 80% | > 90% |

### **Performance Optimization**

```typescript
// Image processing optimization
const optimizationOptions = {
  quality: 'auto',
  fetch_format: 'auto',
  flags: 'progressive',
  transformation: [
    { width: 800, height: 600, crop: 'fill' },
    { quality: 'auto', fetch_format: 'auto' }
  ]
};

// Caching optimization
const cacheOptions = {
  ttl: 3600, // 1 hour
  max: 1000, // 1000 items
  checkperiod: 600 // 10 minutes
};
```

## 🔗 Related Documentation

- [API Endpoints](../API_ENDPOINTS.md)
- [Job System](job-system.md)
- [Cloudinary Integration](cloudinary.md)
- [Service README](../README.md)

---

**Last Updated**: 15 Eylül 2025, 10:30  
**Version**: 1.0.0
