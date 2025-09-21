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
    "timestamp": "2025-09-21T08:33:20.370Z",
    "service": "queue-service",
    "version": "1.0.0",
    "uptime": 302.236195667,
    "memory": {
      "rss": 63082496,
      "heapTotal": 164155392,
      "heapUsed": 159753848,
      "external": 9862763,
      "arrayBuffers": 5905789
    },
    "environment": "development"
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

## 🔄 **INTEGRATION NOTES**

### **Database Triggers**
- Automatically processes `elasticsearch_sync_queue` table
- Publishes messages to RabbitMQ exchange `benalsam.listings`
- Handles INSERT, UPDATE, DELETE operations

### **RabbitMQ Exchanges**
- **Exchange:** `benalsam.listings`
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

**📅 Last Updated:** 21 Eylül 2025  
**🔄 Version:** 1.0.0  
**👨‍💻 Service:** benalsam-queue-service
