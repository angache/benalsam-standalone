# ⚙️ Job System Documentation

## 📊 Overview

The Upload Service uses a sophisticated job system for processing image uploads and related operations asynchronously. This system ensures reliable processing, error handling, and monitoring of all upload-related tasks.

## 🏗️ Architecture

### **Job Flow**
```
Upload Request → Job Created → RabbitMQ → Job Processor → Cloudinary → Database Update → Notification
```

### **Components**
- **Job Creator**: Creates jobs for upload operations
- **RabbitMQ**: Message queuing system
- **Job Processor**: Processes jobs from the queue
- **Job Storage**: Redis for job state management
- **Monitoring**: Job metrics and health checks

## 📋 Job Types

### **Image Upload Jobs**

| Job Type | Description | Status | Priority |
|----------|-------------|--------|----------|
| `IMAGE_UPLOAD_REQUESTED` | Image upload initiated | ✅ | Normal |
| `IMAGE_UPLOAD_PROCESSING` | Image processing in progress | ✅ | Normal |
| `IMAGE_UPLOAD_COMPLETED` | Upload completed successfully | ✅ | Normal |
| `IMAGE_UPLOAD_FAILED` | Upload failed | ✅ | Normal |

### **Image Processing Jobs**

| Job Type | Description | Status | Priority |
|----------|-------------|--------|----------|
| `IMAGE_RESIZE` | Image resizing | ✅ | Normal |
| `THUMBNAIL_GENERATE` | Thumbnail generation | ✅ | Normal |
| `METADATA_EXTRACT` | Metadata extraction | ✅ | Normal |
| `VIRUS_SCAN` | Virus scanning | ✅ | High |

### **System Jobs**

| Job Type | Description | Status | Priority |
|----------|-------------|--------|----------|
| `DATABASE_UPDATE` | Database update | ✅ | Normal |
| `NOTIFICATION_SEND` | Notification sending | ✅ | Low |
| `CLEANUP_TEMP_FILES` | Temporary file cleanup | ✅ | Low |

## 🔄 Job Lifecycle

### **1. Job Creation**
```typescript
const job = await jobProcessorService.createJob({
  type: 'IMAGE_UPLOAD_REQUESTED',
  priority: 'normal',
  data: {
    userId: 'user123',
    uploadId: 'upload_123456789',
    imageId: 'img_123456789'
  }
});
```

### **2. Job Processing**
```typescript
// Job processor picks up the job
await jobProcessorService.processJob(job);

// Job status changes to 'processing'
job.status = 'processing';
job.startedAt = new Date();

// Process the job
await processImageUpload(job.data);

// Job status changes to 'completed'
job.status = 'completed';
job.completedAt = new Date();
```

### **3. Job Completion**
```typescript
// Job is marked as completed
await jobProcessorService.completeJob(job.id);

// Notification is sent
await sendNotification(job);
```

## 📊 Job Status

### **Status Flow**
```
pending → processing → completed
   ↓         ↓           ↓
cancelled  failed    completed
```

### **Status Descriptions**

| Status | Description | Next Actions |
|--------|-------------|--------------|
| `pending` | Job created, waiting to be processed | Process or cancel |
| `processing` | Job is being processed | Complete or fail |
| `completed` | Job completed successfully | Archive |
| `failed` | Job failed, retry available | Retry or cancel |
| `cancelled` | Job was cancelled | Archive |

## 🔧 Job Configuration

### **Priority Levels**

| Priority | Description | Queue | Processing Order |
|----------|-------------|-------|------------------|
| `high` | Critical jobs | `upload.high-priority` | First |
| `normal` | Standard jobs | `upload.normal` | Second |
| `low` | Background jobs | `upload.batch` | Last |

### **Retry Configuration**

```typescript
const retryConfig = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  backoffMultiplier: 2,
  maxRetryDelay: 30000 // 30 seconds
};
```

### **Timeout Configuration**

```typescript
const timeoutConfig = {
  processingTimeout: 300000, // 5 minutes
  queueTimeout: 600000, // 10 minutes
  cleanupTimeout: 3600000 // 1 hour
};
```

## 📈 Monitoring

### **Job Metrics**

```typescript
const metrics = {
  total: 150,
  pending: 5,
  processing: 2,
  completed: 140,
  failed: 3,
  cancelled: 0
};
```

### **Performance Metrics**

```typescript
const performance = {
  processingRate: 10.5, // jobs per minute
  completionRate: 95.2, // percentage
  failureRate: 2.0, // percentage
  averageProcessingTime: 2500, // milliseconds
  averageQueueTime: 500, // milliseconds
  averageTotalTime: 3000 // milliseconds
};
```

### **Health Checks**

```bash
# Job processor health
curl http://localhost:3007/api/v1/health/jobs

# Job metrics
curl http://localhost:3007/api/v1/jobs/metrics

# Specific job status
curl http://localhost:3007/api/v1/jobs/job_123456789/status
```

## 🔄 Queue Management

### **RabbitMQ Queues**

| Queue Name | Purpose | Priority | TTL |
|------------|---------|----------|-----|
| `upload.high-priority` | Critical jobs | High | 1 hour |
| `upload.normal` | Standard jobs | Normal | 24 hours |
| `upload.batch` | Background jobs | Low | 7 days |
| `processing.images` | Image processing | Normal | 2 hours |
| `notifications` | Notifications | Low | 1 day |
| `upload.events` | Event logging | Low | 30 days |

### **Dead Letter Queues**

| Queue Name | Purpose | TTL |
|------------|---------|-----|
| `upload.high-priority.dlq` | Failed high priority jobs | 7 days |
| `upload.normal.dlq` | Failed normal jobs | 30 days |
| `upload.batch.dlq` | Failed batch jobs | 90 days |

## 🛠️ Implementation

### **Job Creation**

```typescript
// Create a new job
const job = await jobProcessorService.createJob({
  type: 'IMAGE_UPLOAD_REQUESTED',
  priority: 'normal',
  data: {
    userId: 'user123',
    uploadId: 'upload_123456789',
    imageId: 'img_123456789'
  },
  retryConfig: {
    maxRetries: 3,
    retryDelay: 5000
  }
});
```

### **Job Processing**

```typescript
// Process a job
await jobProcessorService.processJob(job);

// Update job status
await jobProcessorService.updateJobStatus(job.id, 'processing');

// Complete job
await jobProcessorService.completeJob(job.id);
```

### **Job Monitoring**

```typescript
// Get job metrics
const metrics = await jobProcessorService.getMetrics();

// Get job details
const job = await jobProcessorService.getJob(jobId);

// Get job status
const status = await jobProcessorService.getJobStatus(jobId);
```

## 🔍 Troubleshooting

### **Common Issues**

1. **Job Stuck in Processing**
   ```bash
   # Check job status
   curl http://localhost:3007/api/v1/jobs/job_123456789
   
   # Check job processor health
   curl http://localhost:3007/api/v1/health/jobs
   ```

2. **High Failure Rate**
   ```bash
   # Check job metrics
   curl http://localhost:3007/api/v1/jobs/metrics
   
   # Check failed jobs
   curl http://localhost:3007/api/v1/jobs?status=failed
   ```

3. **Queue Backup**
   ```bash
   # Check queue depth
   curl http://localhost:3007/api/v1/health/rabbitmq
   
   # Check processing rate
   curl http://localhost:3007/api/v1/jobs/metrics
   ```

### **Debug Commands**

```bash
# Check all job statuses
curl http://localhost:3007/api/v1/jobs/metrics | jq '.data.metrics'

# Check specific job
curl http://localhost:3007/api/v1/jobs/job_123456789 | jq '.data'

# Check job processor health
curl http://localhost:3007/api/v1/health/jobs | jq '.data'
```

## 📚 Best Practices

### **Job Design**
- Keep jobs small and focused
- Use appropriate priority levels
- Implement proper error handling
- Set reasonable timeouts
- Use idempotent operations

### **Monitoring**
- Monitor job metrics regularly
- Set up alerts for failures
- Track processing times
- Monitor queue depths
- Check error rates

### **Error Handling**
- Implement retry logic
- Use dead letter queues
- Log errors properly
- Notify on failures
- Clean up failed jobs

## 🔗 Related Documentation

- [API Endpoints](../API_ENDPOINTS.md)
- [Service README](../README.md)
- [Cloudinary Integration](cloudinary.md)
- [Monitoring Guide](monitoring.md)

---

**Last Updated**: 15 Eylül 2025, 10:30  
**Version**: 1.0.0
