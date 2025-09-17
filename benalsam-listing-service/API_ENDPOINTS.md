# 📚 Benalsam Listing Service - API Endpoints

## 🌐 Base URL
```
Development: http://localhost:3008/api/v1
Production: https://listing.benalsam.com/api/v1
```

## 🔐 Authentication
All endpoints require authentication via `x-user-id` header:
```bash
curl -H "x-user-id: user-123" http://localhost:3008/api/v1/listings
```

---

## 📋 Listings Endpoints

### **1. Get All Listings**
```http
GET /api/v1/listings
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `search` | string | - | Search term |
| `status` | string | - | Filter by status |
| `category` | string | - | Filter by category |
| `sortBy` | string | created_at | Sort field |
| `sortOrder` | string | desc | Sort order (asc/desc) |

**Example Request:**
```bash
curl -H "x-user-id: user-123" \
  "http://localhost:3008/api/v1/listings?page=1&limit=20&search=phone&category=Electronics"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "listing-123",
      "title": "iPhone 13 Pro",
      "description": "Excellent condition",
      "category": "Electronics",
      "budget": 15000,
      "status": "active",
      "created_at": "2025-09-15T10:30:00Z",
      "updated_at": "2025-09-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  }
}
```

---

### **2. Get Single Listing**
```http
GET /api/v1/listings/:id
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Listing ID |

**Example Request:**
```bash
curl -H "x-user-id: user-123" \
  "http://localhost:3008/api/v1/listings/listing-123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "listing-123",
    "title": "iPhone 13 Pro",
    "description": "Excellent condition iPhone 13 Pro",
    "category": "Electronics",
    "budget": 15000,
    "location": "Istanbul",
    "urgency": "medium",
    "images": ["image1.jpg", "image2.jpg"],
    "mainImageIndex": 0,
    "status": "active",
    "isFeatured": false,
    "isUrgentPremium": false,
    "isShowcase": false,
    "geolocation": {
      "lat": 41.0082,
      "lng": 28.9784
    },
    "condition": ["excellent"],
    "attributes": {
      "brand": "Apple",
      "model": "iPhone 13 Pro",
      "color": "Space Gray"
    },
    "created_at": "2025-09-15T10:30:00Z",
    "updated_at": "2025-09-15T10:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Listing not found"
}
```

---

### **3. Create New Listing**
```http
POST /api/v1/listings
```

**Request Body:**
```json
{
  "title": "iPhone 13 Pro",
  "description": "Excellent condition iPhone 13 Pro",
  "category": "Electronics",
  "budget": 15000,
  "location": "Istanbul",
  "urgency": "medium",
  "images": ["image1.jpg", "image2.jpg"],
  "mainImageIndex": 0,
  "autoRepublish": false,
  "contactPreference": "both",
  "acceptTerms": true,
  "isFeatured": false,
  "isUrgentPremium": false,
  "isShowcase": false,
  "geolocation": {
    "lat": 41.0082,
    "lng": 28.9784
  },
  "condition": ["excellent"],
  "attributes": {
    "brand": "Apple",
    "model": "iPhone 13 Pro",
    "color": "Space Gray"
  },
  "duration": 30
}
```

**Required Fields:**
- `title` (string)
- `description` (string)
- `category` (string)
- `budget` (number)
- `acceptTerms` (boolean)

**Example Request:**
```bash
curl -X POST http://localhost:3008/api/v1/listings \
  -H "x-user-id: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "iPhone 13 Pro",
    "description": "Excellent condition",
    "category": "Electronics",
    "budget": 15000,
    "acceptTerms": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-456",
    "message": "Listing creation started",
    "status": "processing"
  }
}
```

---

### **4. Update Listing**
```http
PUT /api/v1/listings/:id
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Listing ID |

**Request Body:**
```json
{
  "title": "Updated iPhone 13 Pro",
  "description": "Updated description",
  "budget": 16000
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:3008/api/v1/listings/listing-123 \
  -H "x-user-id: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated iPhone 13 Pro",
    "budget": 16000
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-789",
    "message": "Listing update started",
    "status": "processing"
  }
}
```

---

### **5. Delete Listing**
```http
DELETE /api/v1/listings/:id
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Listing ID |

**Example Request:**
```bash
curl -X DELETE http://localhost:3008/api/v1/listings/listing-123 \
  -H "x-user-id: user-123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-101",
    "message": "Listing deletion started",
    "status": "processing"
  }
}
```

---

### **6. Moderate Listing (Admin Only)**
```http
POST /api/v1/listings/:id/moderate
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Listing ID |

**Request Body:**
```json
{
  "action": "approve",
  "reason": "Listing meets all requirements"
}
```

**Actions:**
- `approve` - Approve the listing
- `reject` - Reject the listing
- `re-evaluate` - Mark for re-evaluation

**Example Request:**
```bash
curl -X POST http://localhost:3008/api/v1/listings/listing-123/moderate \
  -H "x-user-id: admin-123" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "reason": "Listing meets all requirements"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-202",
    "message": "Listing moderation started",
    "status": "processing"
  }
}
```

---

### **7. Get Job Status**
```http
GET /api/v1/listings/jobs/:jobId
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jobId` | string | Yes | Job ID |

**Example Request:**
```bash
curl -H "x-user-id: user-123" \
  "http://localhost:3008/api/v1/listings/jobs/job-456"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-456",
    "status": "completed",
    "progress": 100,
    "result": {
      "listingId": "listing-123",
      "message": "Listing created successfully"
    },
    "error": null,
    "createdAt": "2025-09-15T10:30:00Z",
    "updatedAt": "2025-09-15T10:30:05Z",
    "completedAt": "2025-09-15T10:30:05Z"
  }
}
```

**Job Statuses:**
- `pending` - Job is waiting to be processed
- `processing` - Job is currently being processed
- `completed` - Job completed successfully
- `failed` - Job failed with error
- `cancelled` - Job was cancelled

---

### **8. Cancel Job**
```http
DELETE /api/v1/listings/jobs/:jobId
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jobId` | string | Yes | Job ID |

**Example Request:**
```bash
curl -X DELETE http://localhost:3008/api/v1/listings/jobs/job-456 \
  -H "x-user-id: user-123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-456",
    "message": "Job cancelled successfully"
  }
}
```

---

## 🔧 Jobs Endpoints

### **1. Get Job Metrics**
```http
GET /api/v1/jobs/metrics
```

**Example Request:**
```bash
curl http://localhost:3008/api/v1/jobs/metrics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalJobs": 150,
      "pendingJobs": 5,
      "processingJobs": 2,
      "completedJobs": 140,
      "failedJobs": 3,
      "cancelledJobs": 0,
      "averageProcessingTime": 2500,
      "successRate": 93.33
    },
    "timestamp": "2025-09-15T10:30:00Z"
  }
}
```

---

### **2. Get Job Details**
```http
GET /api/v1/jobs/:id
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Job ID |

**Example Request:**
```bash
curl -H "x-user-id: user-123" \
  "http://localhost:3008/api/v1/jobs/job-456"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-456",
    "type": "LISTING_CREATE_REQUESTED",
    "status": "completed",
    "priority": "high",
    "userId": "user-123",
    "payload": {
      "listingData": {
        "title": "iPhone 13 Pro",
        "description": "Excellent condition",
        "category": "Electronics",
        "budget": 15000
      },
      "metadata": {
        "source": "listing-service",
        "userAgent": "Mozilla/5.0...",
        "ipAddress": "192.168.1.1"
      }
    },
    "result": {
      "listingId": "listing-123",
      "message": "Listing created successfully"
    },
    "error": null,
    "retryCount": 0,
    "maxRetries": 3,
    "createdAt": "2025-09-15T10:30:00Z",
    "updatedAt": "2025-09-15T10:30:05Z",
    "completedAt": "2025-09-15T10:30:05Z",
    "traceId": "trace-789"
  }
}
```

---

### **3. Cancel Job**
```http
DELETE /api/v1/jobs/:id
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Job ID |

**Example Request:**
```bash
curl -X DELETE http://localhost:3008/api/v1/jobs/job-456 \
  -H "x-user-id: user-123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-456",
    "message": "Job cancelled successfully"
  }
}
```

---

### **4. Get Job Status**
```http
GET /api/v1/jobs/:id/status
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Job ID |

**Example Request:**
```bash
curl -H "x-user-id: user-123" \
  "http://localhost:3008/api/v1/jobs/job-456/status"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-456",
    "status": "processing",
    "progress": 50,
    "result": null,
    "error": null,
    "createdAt": "2025-09-15T10:30:00Z",
    "updatedAt": "2025-09-15T10:30:02Z",
    "completedAt": null
  }
}
```

---

## 🏥 Health Endpoints

### **1. Basic Health Check**
```http
GET /api/v1/health
```

**Example Request:**
```bash
curl http://localhost:3008/api/v1/health
```

**Response:**
```json
{
  "service": "Benalsam Listing Service",
  "status": "healthy",
  "timestamp": "2025-09-15T10:30:00Z",
  "version": "1.0.0",
  "uptime": 3600,
  "memory": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576,
    "arrayBuffers": 524288
  },
  "serviceStatus": {
    "running": true,
    "initialized": true
  },
  "jobMetrics": {
    "totalJobs": 150,
    "pendingJobs": 5,
    "processingJobs": 2,
    "completedJobs": 140,
    "failedJobs": 3
  }
}
```

---

### **2. Detailed Health Check**
```http
GET /api/v1/health/detailed
```

**Example Request:**
```bash
curl http://localhost:3008/api/v1/health/detailed
```

**Response:**
```json
{
  "service": "Benalsam Listing Service",
  "status": "healthy",
  "timestamp": "2025-09-15T10:30:00Z",
  "version": "1.0.0",
  "uptime": 3600,
  "responseTime": 45,
  "memory": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576,
    "arrayBuffers": 524288
  },
  "components": {
    "service": {
      "status": "healthy",
      "details": {
        "running": true,
        "initialized": true
      }
    },
    "database": {
      "status": "healthy",
      "responseTime": 25,
      "details": {
        "connection": "active",
        "queryTime": "25ms"
      }
    },
    "redis": {
      "status": "healthy",
      "responseTime": 5,
      "details": {
        "connection": "active",
        "pingResponse": "PONG"
      }
    },
    "rabbitmq": {
      "status": "healthy",
      "responseTime": 10,
      "details": {
        "connection": "active",
        "queueStatus": "running"
      }
    },
    "jobProcessor": {
      "status": "healthy",
      "details": {
        "totalJobs": 150,
        "pendingJobs": 5,
        "processingJobs": 2,
        "completedJobs": 140,
        "failedJobs": 3
      }
    }
  }
}
```

---

### **3. Database Health Check**
```http
GET /api/v1/health/database
```

**Example Request:**
```bash
curl http://localhost:3008/api/v1/health/database
```

**Response:**
```json
{
  "status": "healthy",
  "responseTime": 25,
  "details": {
    "connection": "active",
    "queryTime": "25ms"
  }
}
```

---

### **4. Redis Health Check**
```http
GET /api/v1/health/redis
```

**Example Request:**
```bash
curl http://localhost:3008/api/v1/health/redis
```

**Response:**
```json
{
  "status": "healthy",
  "responseTime": 5,
  "details": {
    "connection": "active",
    "pingResponse": "PONG"
  }
}
```

---

### **5. RabbitMQ Health Check**
```http
GET /api/v1/health/rabbitmq
```

**Example Request:**
```bash
curl http://localhost:3008/api/v1/health/rabbitmq
```

**Response:**
```json
{
  "status": "healthy",
  "responseTime": 10,
  "details": {
    "connection": "active",
    "queueStatus": "running"
  }
}
```

---

### **6. Job Processor Health Check**
```http
GET /api/v1/health/jobs
```

**Example Request:**
```bash
curl http://localhost:3008/api/v1/health/jobs
```

**Response:**
```json
{
  "status": "healthy",
  "details": {
    "metrics": {
      "totalJobs": 150,
      "pendingJobs": 5,
      "processingJobs": 2,
      "completedJobs": 140,
      "failedJobs": 3
    },
    "activeJobs": 2,
    "queueStatus": "running"
  }
}
```

---

## ❌ Error Responses

### **400 Bad Request**
```json
{
  "success": false,
  "message": "Missing required fields: title, description, category, budget"
}
```

### **401 Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### **403 Forbidden**
```json
{
  "success": false,
  "message": "Access denied"
}
```

### **404 Not Found**
```json
{
  "success": false,
  "message": "Listing not found"
}
```

### **429 Too Many Requests**
```json
{
  "success": false,
  "message": "Rate limit exceeded"
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 📊 Rate Limiting

The API implements rate limiting to prevent abuse:

- **General API**: 1000 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Job Operations**: 100 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1634567890
```

---

## 🔍 Examples

### **Complete Listing Creation Flow**
```bash
# 1. Create listing
JOB_ID=$(curl -X POST http://localhost:3008/api/v1/listings \
  -H "x-user-id: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "iPhone 13 Pro",
    "description": "Excellent condition",
    "category": "Electronics",
    "budget": 15000,
    "acceptTerms": true
  }' | jq -r '.data.jobId')

# 2. Check job status
curl -H "x-user-id: user-123" \
  "http://localhost:3008/api/v1/listings/jobs/$JOB_ID"

# 3. Get created listing (after job completion)
curl -H "x-user-id: user-123" \
  "http://localhost:3008/api/v1/listings/listing-123"
```

### **Health Monitoring**
```bash
# Check all health endpoints
curl http://localhost:3008/api/v1/health
curl http://localhost:3008/api/v1/health/detailed
curl http://localhost:3008/api/v1/health/database
curl http://localhost:3008/api/v1/health/redis
curl http://localhost:3008/api/v1/health/rabbitmq
curl http://localhost:3008/api/v1/health/jobs
```

---

**Benalsam Listing Service API** - Comprehensive listing management with job system
