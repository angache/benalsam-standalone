# 🚀 **BENALSAM QUEUE SERVICE - API ENDPOINTS**

## 📊 **SERVICE BİLGİLERİ**
- **Service Name:** benalsam-queue-service
- **Port:** 3012
- **Environment:** Development/Production
- **Base URL:** `http://localhost:3012`

---

## 🔍 **HEALTH & MONITORING**

### **Health Check**
```http
GET /api/v1/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-25T18:41:51.283Z",
    "service": "queue-service",
    "version": "1.0.0",
    "uptime": 60.835640667,
    "memory": {
      "rss": 66715648,
      "heapTotal": 182321152,
      "heapUsed": 177735728,
      "external": 9036391,
      "arrayBuffers": 5060619
    },
    "environment": "development",
    "architecture": "enterprise-polling",
    "queue": {
      "pending": 0,
      "processing": 7,
      "completed": 214,
      "failed": 3,
      "debug": 252,
      "sent": 38,
      "skipped": 30,
      "stuckJobs": 0,
      "isHealthy": true
    },
    "circuitBreaker": {
      "state": "CLOSED",
      "failureCount": 0,
      "successCount": 0,
      "isHealthy": true
    },
    "realtime": {
      "isConnected": false,
      "reconnectAttempts": 0,
      "maxReconnectAttempts": 5,
      "mode": "fallback-polling"
    }
  }
}
```

---

## 🔧 **QUEUE MANAGEMENT**

### **Queue Statistics**
```http
GET /api/v1/queue/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pending": 0,
    "processing": 0,
    "completed": 15,
    "failed": 2,
    "total": 17
  }
}
```

### **Clear Queue**
```http
POST /api/v1/queue/clear
Content-Type: application/json

{
  "queueType": "completed" // pending, processing, completed, failed
}
```

### **Retry Failed Jobs**
```http
POST /api/v1/queue/retry-failed
```

### **🧹 Enterprise Stuck Job Cleanup**
```http
POST /api/v1/health/cleanup-stuck-jobs
```

**Description:** Manually clean up stuck processing jobs (5+ minutes old)

**Response:**
```json
{
  "success": true,
  "message": "Cleanup completed: 3 jobs cleaned, 0 failed",
  "data": {
    "totalStuckJobs": 3,
    "cleanedJobs": 3,
    "failedJobs": 0
  }
}
```

**Auto Cleanup:** Runs automatically every 5 polling cycles (25 seconds)

---

## 🗄️ **DATABASE TRIGGER BRIDGE**

### **Bridge Status**
```http
GET /api/v1/bridge/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "lastProcessed": "2025-09-21T08:30:15.123Z",
    "processedJobsCount": 45,
    "errorCount": 2,
    "uptime": 1800000
  }
}
```

### **Bridge Health Check**
```http
GET /api/v1/bridge/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "healthy": true,
    "message": "Database trigger bridge is healthy",
    "details": {
      "isProcessing": true,
      "lastProcessed": "2025-09-21T08:30:15.123Z",
      "processedJobsCount": 45,
      "errorCount": 2,
      "pendingJobsCount": 3,
      "pendingJobs": [
        {
          "id": 123,
          "created_at": "2025-09-21T08:29:45.123Z"
        }
      ]
    }
  }
}
```

---

## 🐰 **RABBITMQ MANAGEMENT**

### **Connection Status**
```http
GET /api/v1/rabbitmq/status
```

### **Publish Test Message**
```http
POST /api/v1/rabbitmq/publish
Content-Type: application/json

{
  "exchange": "benalsam.listings",
  "routingKey": "listing.test",
  "message": {
    "test": true,
    "timestamp": "2025-09-21T08:30:15.123Z"
  }
}
```

---

## 📝 **JOB MANAGEMENT**

### **Get Job Details**
```http
GET /api/v1/jobs/:jobId
```

### **Job History**
```http
GET /api/v1/jobs/history?limit=50&offset=0
```

---

## 🔐 **AUTHENTICATION**

**Note:** Queue service currently runs without authentication in development. For production, implement JWT-based authentication.

---

## 📊 **MONITORING & LOGS**

### **Service Logs**
```http
GET /api/v1/logs?level=info&limit=100
```

### **Performance Metrics**
```http
GET /api/v1/metrics
```

---

## 🚨 **ERROR HANDLING**

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "timestamp": "2025-09-21T08:30:15.123Z"
}
```

---

## 🏢 **ENTERPRISE FEATURES**

### **🛡️ Circuit Breaker Pattern**
- **Purpose:** Prevents cascading failures during database issues
- **Configuration:** 10 failure threshold, 15s recovery timeout
- **Monitoring:** Available in health check endpoint

### **🧹 Stuck Job Management**
- **Auto Cleanup:** Every 5 polling cycles (25 seconds)
- **Timeout:** 5 minutes for processing jobs
- **Retry Logic:** Max 3 retries before marking as failed
- **Manual Cleanup:** Available via API endpoint

### **📊 Real-time Monitoring**
- **Queue Statistics:** Live job counts by status
- **Stuck Job Detection:** Automatic identification and cleanup
- **Health Status:** Degraded when stuck jobs detected
- **Architecture Mode:** Event-driven vs Enterprise-polling

### **⚡ Performance Optimizations**
- **Batch Processing:** 20 jobs per batch (increased from 5)
- **Connection Pooling:** Supabase connection optimization
- **Timeout Management:** 30s database query timeout
- **Graceful Shutdown:** 5s cleanup period

### **🔄 Architecture Modes**
- **Event-Driven:** Zero-polling with Supabase Realtime (currently disabled)
- **Enterprise-Polling:** 5-second interval with stuck job cleanup (active)

---

## 🔄 **INTEGRATION NOTES**

### **Database Triggers**
- Automatically processes `elasticsearch_sync_queue` table
- Publishes messages to RabbitMQ exchange `benalsam.jobs`
- Handles UPDATE, DELETE operations (routing keys: `listing.update`, `listing.delete`)

### **RabbitMQ Exchanges**
- **Exchange:** `benalsam.jobs`
- **Routing Keys:**
  - `listing.insert`
  - `listing.update`
  - `listing.delete`
  - `listing.status.active`
  - `listing.status.pending_approval`
  - `listing.status.rejected`

### **Redis Queues**
- **Main Queue:** `elasticsearch_sync`
- **Processing Queue:** `elasticsearch_sync:processing`
- **Completed Queue:** `elasticsearch_sync:completed`
- **Failed Queue:** `elasticsearch_sync:failed`

---

**📅 Last Updated:** 25 Eylül 2025  
**🔄 Version:** 1.1.0 (Enterprise Edition)  
**👨‍💻 Service:** benalsam-queue-service  
**🏢 Features:** Circuit Breaker, Stuck Job Cleanup, Real-time Monitoring
