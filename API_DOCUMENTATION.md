# 📚 BENALSAM API DOCUMENTATION

## 🏗️ Microservices Architecture

Benalsam platformu 8 ana microservice'ten oluşan enterprise-grade bir mimariye sahiptir:

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **Admin Backend** | 3002 | Admin operations, moderation, system management | `/api/v1/health` |
| **Elasticsearch Service** | 3006 | Search, indexing, sync operations | `/health` |
| **Upload Service** | 3007 | Image upload, processing, Cloudinary integration | `/api/v1/health` |
| **Listing Service** | 3008 | Listing CRUD operations, job processing | `/api/v1/health` |
| **Queue Service** | 3012 | RabbitMQ message processing, real-time messaging | `/api/v1/health` |
| **Cache Service** | 3014 | Cache management, analytics | `/api/v1/health` |
| **Categories Service** | 3015 | Category management, CRUD operations | `/api/v1/health` |
| **Search Service** | 3016 | Advanced search capabilities | `/api/v1/health` |

---

## 🔧 Enterprise Patterns

### **Circuit Breaker Pattern**
Tüm servislerde implement edilmiştir:
- **Database Circuit Breaker**: Database bağlantı hatalarını yönetir
- **External Service Circuit Breaker**: 3rd party API hatalarını yönetir
- **Cache Circuit Breaker**: Cache service hatalarını yönetir
- **File Operation Circuit Breaker**: Dosya işlem hatalarını yönetir

### **Graceful Shutdown**
Enterprise-level graceful shutdown:
- Signal handling (SIGTERM, SIGINT, uncaughtException, unhandledRejection)
- HTTP server close
- External service disconnect
- 10 saniye timeout protection

### **Health Monitoring**
Comprehensive health monitoring:
- Service health (uptime, memory, response time)
- Dependency health (database, Redis, RabbitMQ, Elasticsearch)
- Circuit breaker metrics
- Queue statistics

### **Prometheus Monitoring**
Enterprise-level metrics collection:
- System metrics (CPU, memory, uptime)
- Application metrics (request count, response time, error rate)
- Business metrics (job processing, queue statistics)
- Direct access: `/metrics` ve `/api/v1/metrics` endpoints

---

## 📊 Admin Backend API (Port 3002)

### **Authentication**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### **Listings Management**
```http
GET /api/v1/listings
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "listing_id",
        "title": "Listing Title",
        "description": "Listing Description",
        "status": "approved",
        "created_at": "2025-09-26T19:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

### **Listing Moderation**
```http
POST /api/v1/listings/{id}/moderate
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "action": "approve", // or "reject"
  "reason": "Moderation reason"
}
```

### **Health Check**
```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-26T19:00:00Z",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "elasticsearch": "healthy"
  },
  "circuitBreakers": {
    "database": {
      "state": "CLOSED",
      "isHealthy": true
    }
  }
}
```

### **Prometheus Metrics**
```http
GET /metrics
GET /api/v1/metrics
```

---

## 🔍 Elasticsearch Service API (Port 3006)

### **Search Operations**
```http
POST /api/v1/search/listings
Content-Type: application/json

{
  "query": "search term",
  "filters": {
    "category": "electronics",
    "price_range": {
      "min": 100,
      "max": 1000
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "listing_id",
        "title": "Search Result",
        "score": 0.95
      }
    ],
    "total": 50,
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_pages": 3
    }
  }
}
```

### **Index Management**
```http
DELETE /api/v1/search/listings/{id}
```

### **Health Check**
```http
GET /health
```

### **Prometheus Metrics**
```http
GET /metrics
GET /api/v1/metrics
```

---

## 📤 Upload Service API (Port 3007)

### **Image Upload**
```http
POST /api/v1/upload/listings
Content-Type: multipart/form-data

{
  "images": [file1, file2, file3],
  "listing_id": "listing_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploaded_images": [
      {
        "id": "image_id",
        "url": "https://cloudinary.com/image.jpg",
        "public_id": "cloudinary_public_id"
      }
    ],
    "job_id": "upload_job_id"
  }
}
```

### **Job Status**
```http
GET /api/v1/jobs/{job_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "job_id",
    "status": "completed",
    "progress": 100,
    "result": {
      "uploaded_images": [...]
    }
  }
}
```

### **Health Check**
```http
GET /api/v1/health
```

### **Prometheus Metrics**
```http
GET /api/v1/metrics
```

---

## 📝 Listing Service API (Port 3008)

### **Create Listing**
```http
POST /api/v1/listings
Content-Type: application/json
x-user-id: user_id

{
  "title": "Listing Title",
  "description": "Listing Description",
  "category": "electronics",
  "attributes": {
    "brand": "Apple",
    "model": "iPhone 15"
  },
  "location": {
    "city": "Istanbul",
    "district": "Kadikoy"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "listing_id": "listing_id",
    "job_id": "processing_job_id",
    "status": "processing"
  }
}
```

### **Get Listings**
```http
GET /api/v1/listings
x-user-id: user_id
```

### **Update Listing**
```http
PUT /api/v1/listings/{id}
Content-Type: application/json
x-user-id: user_id

{
  "title": "Updated Title",
  "description": "Updated Description"
}
```

### **Delete Listing**
```http
DELETE /api/v1/listings/{id}
x-user-id: user_id
```

### **Health Check**
```http
GET /api/v1/health
```

### **Prometheus Metrics**
```http
GET /api/v1/metrics
```

---

## 🔄 Queue Service API (Port 3012)

### **Queue Statistics**
```http
GET /api/v1/queue/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "queue": {
      "pending": 5,
      "processing": 2,
      "completed": 100,
      "failed": 3,
      "stuckJobs": 0
    },
    "realtime": {
      "isConnected": true,
      "mode": "realtime"
    }
  }
}
```

### **Health Check**
```http
GET /api/v1/health
```

### **Prometheus Metrics**
```http
GET /api/v1/metrics
```

---

## 💾 Cache Service API (Port 3014)

### **Cache Operations**
```http
GET /api/v1/cache/{key}
POST /api/v1/cache/{key}
DELETE /api/v1/cache/{key}
```

### **Cache Statistics**
```http
GET /api/v1/cache/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "memory_cache": {
      "hits": 1000,
      "misses": 100,
      "hit_rate": 0.91
    },
    "redis_cache": {
      "hits": 500,
      "misses": 50,
      "hit_rate": 0.91
    }
  }
}
```

### **Health Check**
```http
GET /api/v1/health
```

### **Prometheus Metrics**
```http
GET /api/v1/metrics
```

---

## 📂 Categories Service API (Port 3015)

### **Get Categories (Tree Structure)**
```http
GET /api/v1/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "category_id",
      "name": "Electronics",
      "slug": "electronics",
      "children": [
        {
          "id": "subcategory_id",
          "name": "Smartphones",
          "slug": "smartphones"
        }
      ]
    }
  ]
}
```

### **Get All Categories (Flat List)**
```http
GET /api/v1/categories/all?page=1&limit=20&search=electronics
```

### **Category Statistics**
```http
GET /api/v1/categories/stats
```

### **Health Check**
```http
GET /api/v1/health
```

### **Prometheus Metrics**
```http
GET /api/v1/metrics
```

---

## 🔍 Search Service API (Port 3016)

### **Search Listings**
```http
POST /api/v1/search/listings
Content-Type: application/json

{
  "query": "search term",
  "filters": {
    "category": "electronics",
    "price_range": {
      "min": 100,
      "max": 1000
    }
  }
}
```

### **Search Suggestions**
```http
GET /api/v1/search/suggestions?q=search_term
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "search term 1",
      "search term 2",
      "search term 3"
    ]
  }
}
```

### **Search Statistics**
```http
GET /api/v1/search/stats
```

### **Health Check**
```http
GET /api/v1/health
```

### **Prometheus Metrics**
```http
GET /api/v1/metrics
```

---

## 🔒 Authentication & Authorization

### **JWT Token Structure**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "admin|user|moderator",
  "iat": 1695758400,
  "exp": 1695844800
}
```

### **Authorization Headers**
```http
Authorization: Bearer jwt_token_here
x-user-id: user_id
```

---

## 📊 Error Handling

### **Standard Error Response**
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2025-09-26T19:00:00Z",
  "path": "/api/v1/endpoint",
  "details": {
    "field": "validation error details"
  }
}
```

### **HTTP Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## 🚀 Rate Limiting

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1695758400
```

### **Rate Limit Response**
```json
{
  "success": false,
  "message": "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.",
  "error": "RATE_LIMIT_EXCEEDED",
  "retry_after": 900
}
```

---

## 📈 Monitoring & Metrics

### **Health Check Response**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2025-09-26T19:00:00Z",
  "service": "service-name",
  "version": "1.0.0",
  "uptime": 3600,
  "memory": {
    "rss": 50000000,
    "heapTotal": 200000000,
    "heapUsed": 150000000
  },
  "circuitBreakers": {
    "database": {
      "state": "CLOSED|OPEN|HALF_OPEN",
      "failureCount": 0,
      "successCount": 100,
      "isHealthy": true
    }
  }
}
```

### **Prometheus Metrics**
Tüm servislerde `/metrics` ve `/api/v1/metrics` endpoint'leri mevcuttur:

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/v1/health",status_code="200"} 100

# HELP http_request_duration_seconds Duration of HTTP requests
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/api/v1/health",le="0.1"} 50
```

---

## 🔧 Development & Testing

### **Local Development**
```bash
# Start all services
npm run dev:all

# Start specific service
cd benalsam-listing-service && npm run dev

# Run tests
npm test

# Health check
curl http://localhost:3008/api/v1/health
```

### **Testing Endpoints**
```bash
# Test all health checks
./scripts/test-health-checks.sh

# Test Prometheus metrics
./scripts/test-metrics.sh

# Performance testing
./scripts/performance-test.sh
```

---

## 📚 Additional Resources

- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Architecture Overview**: [README.md](./README.md)
- **Error Handling**: [ERROR_HANDLING.md](./docs/ERROR_HANDLING.md)
- **Security Guide**: [SECURITY.md](./docs/SECURITY.md)

---

**🎉 Benalsam API Documentation v2.0.0**

For support and updates, visit: [Benalsam GitHub](https://github.com/your-org/benalsam-standalone)
