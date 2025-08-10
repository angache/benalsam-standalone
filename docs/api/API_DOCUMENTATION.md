# 📚 Admin Backend API Documentation

## 🌐 **BASE URL**
```
Production: https://admin.benalsam.com/api/v1
Development: http://localhost:3002/api/v1
```

## 🔐 **AUTHENTICATION**
Tüm API endpoint'leri JWT token authentication gerektirir (health ve monitoring endpoint'leri hariç).

```bash
# Request header
Authorization: Bearer <jwt_token>
```

---

## 🏥 **HEALTH CHECK ENDPOINTS**

### **1. Basic Health Check**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-19T08:54:21.070Z",
  "uptime": 10.934633714,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "elasticsearch": "healthy"
  }
}
```

**Status Codes:**
- `200`: All services healthy
- `503`: One or more services unhealthy

---

### **2. Detailed Health Check**
```http
GET /health/detailed
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-19T08:54:37.498Z",
  "uptime": 27.352134471,
  "memory": {
    "rss": 404754432,
    "heapTotal": 337895424,
    "heapUsed": 310566328,
    "external": 9089310,
    "arrayBuffers": 4946749
  },
  "cpu": {
    "user": 12160453,
    "system": 3378248
  },
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 270,
      "details": {
        "connection": "active",
        "queryTime": "270ms"
      }
    },
    "redis": {
      "status": "healthy",
      "responseTime": 45,
      "details": {
        "connection": "active",
        "pingResponse": "PONG",
        "responseTime": "45ms"
      }
    },
    "elasticsearch": {
      "status": "healthy",
      "responseTime": 74,
      "details": {
        "clusterStatus": "green",
        "numberOfNodes": 1,
        "activeShards": 0,
        "responseTime": "74ms"
      }
    }
  }
}
```

---

### **3. Individual Service Health Checks**

#### **Database Health**
```http
GET /health/database
```

**Response:**
```json
{
  "status": "healthy",
  "service": "database",
  "responseTime": "270ms",
  "timestamp": "2025-07-19T08:54:21.070Z"
}
```

#### **Redis Health**
```http
GET /health/redis
```

**Response:**
```json
{
  "status": "healthy",
  "service": "redis",
  "pingResponse": "PONG",
  "responseTime": "45ms",
  "timestamp": "2025-07-19T08:54:21.070Z"
}
```

#### **Elasticsearch Health**
```http
GET /health/elasticsearch
```

**Response:**
```json
{
  "status": "healthy",
  "service": "elasticsearch",
  "clusterStatus": "green",
  "numberOfNodes": 1,
  "activeShards": 0,
  "responseTime": "74ms",
  "timestamp": "2025-07-19T08:54:21.070Z"
}
```

---

## 📊 **MONITORING ENDPOINTS**

### **1. System Metrics**
```http
GET /monitoring/metrics
```

**Response:**
```json
{
  "timestamp": "2025-07-19T08:55:01.960Z",
  "system": {
    "uptime": 51.858902941,
    "memory": {
      "rss": 354336768,
      "heapTotal": 289763328,
      "heapUsed": 282475416,
      "external": 9097135,
      "arrayBuffers": 4906704
    },
    "cpu": {
      "user": 20413186,
      "system": 4255949
    },
    "nodeVersion": "v20.19.4",
    "platform": "linux",
    "arch": "arm64"
  },
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 267,
      "connections": 1
    },
    "redis": {
      "status": "healthy",
      "responseTime": 45,
      "memory": {
        "used": 1048576,
        "peak": 2097152
      },
      "keys": 150
    },
    "elasticsearch": {
      "status": "healthy",
      "responseTime": 211,
      "indices": 1,
      "documents": 1500
    }
  },
  "application": {
    "requests": {
      "total": 1250,
      "success": 1200,
      "error": 50,
      "averageResponseTime": 245
    },
    "errors": {
      "total": 50,
      "byType": {
        "ValidationError": 20,
        "DatabaseError": 15,
        "ElasticsearchError": 10,
        "RedisError": 5
      }
    }
  }
}
```

---

### **2. Performance Metrics**
```http
GET /monitoring/performance
```

**Response:**
```json
{
  "timestamp": "2025-07-19T08:55:01.960Z",
  "database": {
    "queries": {
      "total": 1250,
      "slow": 25,
      "averageTime": 45
    }
  },
  "api": {
    "endpoints": {
      "/api/v1/health": {
        "requests": 500,
        "averageResponseTime": 120,
        "errorRate": 0.02
      },
      "/api/v1/monitoring/metrics": {
        "requests": 200,
        "averageResponseTime": 180,
        "errorRate": 0.01
      }
    },
    "responseTimes": {
      "p50": 150,
      "p90": 300,
      "p95": 450,
      "p99": 800
    },
    "errorRates": {
      "overall": 0.04,
      "byEndpoint": {
        "/api/v1/health": 0.02,
        "/api/v1/monitoring/metrics": 0.01
      }
    }
  },
  "cache": {
    "hitRate": 0.85,
    "missRate": 0.15,
    "totalRequests": 5000
  }
}
```

---

### **3. Error Tracking**
```http
GET /monitoring/errors
```

**Response:**
```json
{
  "timestamp": "2025-07-19T08:55:01.960Z",
  "recent": [
    {
      "timestamp": "2025-07-19T08:54:30.123Z",
      "error": "Database connection timeout",
      "type": "DatabaseError",
      "endpoint": "/api/v1/admin/users",
      "method": "GET",
      "statusCode": 500,
      "stack": "Error: Connection timeout..."
    },
    {
      "timestamp": "2025-07-19T08:54:25.456Z",
      "error": "Validation failed",
      "type": "ValidationError",
      "endpoint": "/api/v1/admin/users",
      "method": "POST",
      "statusCode": 400,
      "details": {
        "field": "email",
        "message": "Invalid email format"
      }
    }
  ],
  "summary": {
    "total": 50,
    "byType": {
      "ValidationError": 20,
      "DatabaseError": 15,
      "ElasticsearchError": 10,
      "RedisError": 5
    },
    "byEndpoint": {
      "/api/v1/admin/users": 25,
      "/api/v1/admin/categories": 15,
      "/api/v1/admin/listings": 10
    }
  }
}
```

---

### **4. Service Status**
```http
GET /monitoring/status
```

**Response:**
```json
{
  "timestamp": "2025-07-19T08:55:01.960Z",
  "overall": "healthy",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "elasticsearch": "healthy"
  },
  "uptime": 354.459648246,
  "version": "1.0.0",
  "environment": "production"
}
```

---

## 🔍 **ELASTICSEARCH ENDPOINTS**

### **1. Search Listings**
```http
POST /elasticsearch/search
```

**Request Body:**
```json
{
  "query": "ev arayan",
  "filters": {
    "category": "real-estate",
    "location": "istanbul",
    "budget": {
      "min": 1000000,
      "max": 5000000
    },
    "urgency": "high"
  },
  "sort": "relevance",
  "page": 1,
  "limit": 20
}
```

**Response:**
```json
{
  "total": 150,
  "page": 1,
  "limit": 20,
  "results": [
    {
      "id": "listing_123",
      "title": "Ev arayan kişi",
      "description": "İstanbul'da ev arıyorum",
      "category": "real-estate",
      "location": "istanbul",
      "budget": 3000000,
      "urgency": "high",
      "created_at": "2025-07-19T08:00:00Z",
      "score": 0.95
    }
  ],
  "aggregations": {
    "categories": [
      { "key": "real-estate", "count": 100 },
      { "key": "furniture", "count": 50 }
    ],
    "locations": [
      { "key": "istanbul", "count": 80 },
      { "key": "ankara", "count": 70 }
    ]
  }
}
```

---

### **2. Index Management**

#### **Reindex All Documents**
```http
POST /elasticsearch/reindex
```

**Response:**
```json
{
  "success": true,
  "message": "Reindexing started",
  "jobId": "reindex_20250719_085500",
  "timestamp": "2025-07-19T08:55:00.000Z"
}
```

#### **Get Index Statistics**
```http
GET /elasticsearch/stats
```

**Response:**
```json
{
  "indices": {
    "benalsam_listings": {
      "documents": 1500,
      "size": "2.5GB",
      "shards": 1,
      "replicas": 0,
      "health": "green"
    }
  },
  "cluster": {
    "status": "green",
    "nodes": 1,
    "activeShards": 1,
    "totalShards": 1
  }
}
```

---

## 👥 **ADMIN MANAGEMENT ENDPOINTS**

### **1. User Management**

#### **Get All Users**
```http
GET /admin/users
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search term
- `status` (string): Filter by status (active, inactive, blocked)
- `role` (string): Filter by role (admin, user, moderator)

**Response:**
```json
{
  "total": 150,
  "page": 1,
  "limit": 20,
  "users": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "status": "active",
      "created_at": "2025-07-01T00:00:00Z",
      "last_login": "2025-07-19T08:00:00Z"
    }
  ]
}
```

#### **Update User**
```http
PUT /admin/users/:id
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "role": "moderator",
  "status": "active"
}
```

#### **Block User**
```http
POST /admin/users/:id/block
```

**Request Body:**
```json
{
  "reason": "Violation of terms of service",
  "duration": "7d" // 7 days, permanent, etc.
}
```

---

### **2. Category Management**

#### **Get All Categories**
```http
GET /admin/categories
```

**Response:**
```json
{
  "categories": [
    {
      "id": "cat_123",
      "name": "Real Estate",
      "slug": "real-estate",
      "parent_id": null,
      "level": 1,
      "order": 1,
      "active": true,
      "attributes": [
        {
          "name": "property_type",
          "type": "select",
          "options": ["apartment", "house", "villa"]
        }
      ]
    }
  ]
}
```

#### **Create Category**
```http
POST /admin/categories
```

**Request Body:**
```json
{
  "name": "New Category",
  "slug": "new-category",
  "parent_id": "cat_123",
  "order": 5,
  "attributes": [
    {
      "name": "condition",
      "type": "select",
      "options": ["new", "used", "refurbished"]
    }
  ]
}
```

---

### **3. Listing Management**

#### **Get All Listings**
```http
GET /admin/listings
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status (active, inactive, pending)
- `category` (string): Filter by category
- `user_id` (string): Filter by user

**Response:**
```json
{
  "total": 500,
  "page": 1,
  "limit": 20,
  "listings": [
    {
      "id": "listing_123",
      "title": "Ev arayan kişi",
      "description": "İstanbul'da ev arıyorum",
      "category": "real-estate",
      "user_id": "user_123",
      "status": "active",
      "created_at": "2025-07-19T08:00:00Z",
      "views": 150,
      "favorites": 25
    }
  ]
}
```

#### **Update Listing Status**
```http
PUT /admin/listings/:id/status
```

**Request Body:**
```json
{
  "status": "inactive",
  "reason": "Inappropriate content"
}
```

---

## 📈 **ANALYTICS ENDPOINTS**

### **1. Dashboard Statistics**
```http
GET /analytics/dashboard
```

**Response:**
```json
{
  "timestamp": "2025-07-19T08:55:01.960Z",
  "overview": {
    "total_users": 1500,
    "total_listings": 5000,
    "active_listings": 4500,
    "total_categories": 50
  },
  "growth": {
    "users": {
      "daily": 25,
      "weekly": 150,
      "monthly": 600
    },
    "listings": {
      "daily": 100,
      "weekly": 700,
      "monthly": 2800
    }
  },
  "engagement": {
    "average_views_per_listing": 45,
    "average_favorites_per_listing": 8,
    "conversion_rate": 0.15
  }
}
```

---

### **2. User Analytics**
```http
GET /analytics/users
```

**Query Parameters:**
- `period` (string): Time period (day, week, month, year)
- `start_date` (string): Start date (ISO format)
- `end_date` (string): End date (ISO format)

**Response:**
```json
{
  "period": "month",
  "start_date": "2025-06-19",
  "end_date": "2025-07-19",
  "metrics": {
    "new_users": 600,
    "active_users": 1200,
    "returning_users": 800,
    "churn_rate": 0.05
  },
  "trends": [
    {
      "date": "2025-07-01",
      "new_users": 20,
      "active_users": 40
    }
  ],
  "demographics": {
    "age_groups": {
      "18-25": 300,
      "26-35": 450,
      "36-45": 350,
      "46+": 400
    },
    "locations": {
      "istanbul": 800,
      "ankara": 400,
      "izmir": 300
    }
  }
}
```

---

## 🔧 **SYSTEM ENDPOINTS**

### **1. System Configuration**
```http
GET /system/config
```

**Response:**
```json
{
  "environment": "production",
  "version": "1.0.0",
  "features": {
    "elasticsearch": true,
    "redis": true,
    "backup": true,
    "monitoring": true
  },
  "limits": {
    "max_file_size": "10MB",
    "max_listings_per_user": 10,
    "max_images_per_listing": 10
  }
}
```

---

### **2. Feature Flags**
```http
GET /system/features
```

**Response:**
```json
{
  "features": {
    "advanced_search": {
      "enabled": true,
      "beta": false
    },
    "ai_recommendations": {
      "enabled": true,
      "beta": true
    },
    "premium_features": {
      "enabled": true,
      "beta": false
    }
  }
}
```

---

## 🚨 **ERROR RESPONSES**

### **Standard Error Format**
```json
{
  "error": "Error type",
  "message": "Human readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-07-19T08:55:01.960Z",
  "details": {
    "field": "email",
    "value": "invalid-email"
  }
}
```

### **Common Error Codes**
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `422`: Validation Error - Invalid data
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error
- `503`: Service Unavailable - Service temporarily unavailable

### **Validation Error Example**
```json
{
  "error": "ValidationError",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "timestamp": "2025-07-19T08:55:01.960Z",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "value": "123"
    }
  ]
}
```

---

## 📝 **RATE LIMITING**

### **Rate Limits**
- **Health/Monitoring endpoints**: 100 requests/minute
- **Search endpoints**: 60 requests/minute
- **Admin endpoints**: 30 requests/minute
- **Analytics endpoints**: 20 requests/minute

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### **Rate Limit Exceeded Response**
```json
{
  "error": "RateLimitExceeded",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}
```

---

## 🔐 **AUTHENTICATION & AUTHORIZATION**

### **JWT Token Format**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_123",
    "email": "admin@benalsam.com",
    "role": "admin",
    "permissions": ["users:read", "users:write", "listings:read"],
    "iat": 1640000000,
    "exp": 1640086400
  }
}
```

### **Required Permissions**
- `users:read` - View users
- `users:write` - Create/update users
- `users:delete` - Delete users
- `listings:read` - View listings
- `listings:write` - Create/update listings
- `listings:delete` - Delete listings
- `categories:read` - View categories
- `categories:write` - Create/update categories
- `analytics:read` - View analytics
- `system:read` - View system info

---

## 📊 **PAGINATION**

### **Standard Pagination Format**
```json
{
  "total": 150,
  "page": 1,
  "limit": 20,
  "total_pages": 8,
  "has_next": true,
  "has_prev": false,
  "results": [...]
}
```

### **Pagination Headers**
```http
X-Total-Count: 150
X-Page: 1
X-Limit: 20
X-Total-Pages: 8
```

---

## 🔍 **SEARCH & FILTERING**

### **Search Parameters**
- `q` or `query`: Search term
- `category`: Filter by category
- `status`: Filter by status
- `date_from`: Filter by start date
- `date_to`: Filter by end date
- `sort`: Sort field (created_at, updated_at, name, etc.)
- `order`: Sort order (asc, desc)

### **Example Search Request**
```http
GET /admin/users?q=john&status=active&sort=created_at&order=desc&page=1&limit=20
```

---

## 📞 **SUPPORT**

### **API Support**
- **Email**: api-support@benalsam.com
- **Documentation**: https://docs.benalsam.com/api
- **Status Page**: https://status.benalsam.com

### **Rate Limiting Issues**
If you're hitting rate limits, consider:
1. Implementing caching
2. Reducing request frequency
3. Using bulk endpoints where available
4. Contacting support for rate limit increases

### **Error Reporting**
When reporting errors, please include:
1. Request URL and method
2. Request headers (excluding Authorization)
3. Request body (if applicable)
4. Response status code
5. Response body
6. Timestamp of the request

---

*Bu dokümantasyon sürekli güncellenmektedir. Son güncelleme: 2025-07-19* 