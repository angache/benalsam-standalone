# 🚀 Upload Service API Endpoints Documentation

**Son Güncelleme:** 15 Eylül 2025, 10:30  
**Versiyon:** 1.0.0  
**Port:** 3007

---

## 📋 **ENDPOINT KATEGORİLERİ**

### **🏥 HEALTH MONITORING**
**Base Path:** `/api/v1/health`
- `GET /` - Temel sağlık kontrolü
- `GET /detailed` - Detaylı sağlık kontrolü
- `GET /database` - Database sağlık kontrolü
- `GET /redis` - Redis sağlık kontrolü
- `GET /rabbitmq` - RabbitMQ sağlık kontrolü
- `GET /jobs` - Job processor sağlık kontrolü

### **📤 UPLOAD OPERATIONS**
**Base Path:** `/api/v1/upload`
- `POST /listings` - İlan resimleri yükle
- `POST /inventory` - Envanter resimleri yükle
- `POST /single` - Tek resim yükle

### **⚙️ JOB MANAGEMENT**
**Base Path:** `/api/v1/jobs`
- `GET /metrics` - Job metrikleri
- `GET /:id` - Job detayları
- `DELETE /:id` - Job iptal et
- `GET /:id/status` - Job durumu

---

## 📝 **DETAYLI ENDPOINT AÇIKLAMALARI**

### **🏥 HEALTH MONITORING**

#### **GET /api/v1/health**
Temel sağlık kontrolü

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

#### **GET /api/v1/health/detailed**
Detaylı sağlık kontrolü

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "rabbitmq": "healthy",
    "cloudinary": "healthy"
  },
  "metrics": {
    "memory": {
      "heapUsed": 45678912,
      "heapTotal": 67108864,
      "rss": 123456789
    },
    "jobs": {
      "total": 150,
      "pending": 5,
      "processing": 2,
      "completed": 140,
      "failed": 3
    }
  }
}
```

#### **GET /api/v1/health/database**
Database sağlık kontrolü

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "responseTime": 45,
  "timestamp": "2025-09-15T10:30:00.000Z"
}
```

#### **GET /api/v1/health/redis**
Redis sağlık kontrolü

**Response:**
```json
{
  "status": "healthy",
  "redis": "connected",
  "responseTime": 12,
  "memory": {
    "used": 1234567,
    "peak": 2345678
  },
  "timestamp": "2025-09-15T10:30:00.000Z"
}
```

#### **GET /api/v1/health/rabbitmq**
RabbitMQ sağlık kontrolü

**Response:**
```json
{
  "status": "healthy",
  "rabbitmq": "connected",
  "responseTime": 23,
  "queues": {
    "upload.high-priority": 0,
    "upload.normal": 5,
    "upload.batch": 2
  },
  "timestamp": "2025-09-15T10:30:00.000Z"
}
```

#### **GET /api/v1/health/jobs**
Job processor sağlık kontrolü

**Response:**
```json
{
  "status": "healthy",
  "jobProcessor": "running",
  "activeJobs": 2,
  "queueDepth": 5,
  "processingRate": 10.5,
  "timestamp": "2025-09-15T10:30:00.000Z"
}
```

### **📤 UPLOAD OPERATIONS**

#### **POST /api/v1/upload/listings**
İlan resimleri yükle

**Headers:**
```
x-user-id: string (required)
Content-Type: multipart/form-data
```

**Body:**
```
images: File[] (required, max 10 files)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadId": "upload_123456789",
    "images": [
      {
        "id": "img_123456789",
        "url": "https://res.cloudinary.com/benalsam/image/upload/v1234567890/benalsam/user123/listings/temp_1234567890_abc123/image1.jpg",
        "thumbnailUrl": "https://res.cloudinary.com/benalsam/image/upload/w_300,h_300,c_fill/v1234567890/benalsam/user123/listings/temp_1234567890_abc123/image1.jpg",
        "mediumUrl": "https://res.cloudinary.com/benalsam/image/upload/w_800,h_600,c_fill/v1234567890/benalsam/user123/listings/temp_1234567890_abc123/image1.jpg",
        "size": 1234567,
        "width": 1920,
        "height": 1080,
        "format": "jpg"
      }
    ],
    "quota": {
      "used": 15.5,
      "limit": 100,
      "remaining": 84.5
    },
    "expiresAt": "2025-09-15T11:30:00.000Z"
  },
  "message": "Images uploaded successfully"
}
```

#### **POST /api/v1/upload/inventory**
Envanter resimleri yükle

**Headers:**
```
x-user-id: string (required)
Content-Type: multipart/form-data
```

**Body:**
```
images: File[] (required, max 10 files)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadId": "upload_123456789",
    "images": [
      {
        "id": "img_123456789",
        "url": "https://res.cloudinary.com/benalsam/image/upload/v1234567890/benalsam/user123/inventory/temp_1234567890_abc123/image1.jpg",
        "thumbnailUrl": "https://res.cloudinary.com/benalsam/image/upload/w_300,h_300,c_fill/v1234567890/benalsam/user123/inventory/temp_1234567890_abc123/image1.jpg",
        "mediumUrl": "https://res.cloudinary.com/benalsam/image/upload/w_800,h_600,c_fill/v1234567890/benalsam/user123/inventory/temp_1234567890_abc123/image1.jpg",
        "size": 1234567,
        "width": 1920,
        "height": 1080,
        "format": "jpg"
      }
    ],
    "quota": {
      "used": 15.5,
      "limit": 100,
      "remaining": 84.5
    },
    "expiresAt": "2025-09-15T11:30:00.000Z"
  },
  "message": "Images uploaded successfully"
}
```

#### **POST /api/v1/upload/single**
Tek resim yükle

**Headers:**
```
x-user-id: string (required)
Content-Type: multipart/form-data
```

**Body:**
```
image: File (required)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "img_123456789",
    "url": "https://res.cloudinary.com/benalsam/image/upload/v1234567890/benalsam/user123/single/image1.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/benalsam/image/upload/w_300,h_300,c_fill/v1234567890/benalsam/user123/single/image1.jpg",
    "mediumUrl": "https://res.cloudinary.com/benalsam/image/upload/w_800,h_600,c_fill/v1234567890/benalsam/user123/single/image1.jpg",
    "size": 1234567,
    "width": 1920,
    "height": 1080,
    "format": "jpg"
  },
  "message": "Image uploaded successfully"
}
```

### **⚙️ JOB MANAGEMENT**

#### **GET /api/v1/jobs/metrics**
Job metrikleri

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "total": 150,
      "pending": 5,
      "processing": 2,
      "completed": 140,
      "failed": 3,
      "cancelled": 0
    },
    "rates": {
      "processingRate": 10.5,
      "completionRate": 95.2,
      "failureRate": 2.0
    },
    "timing": {
      "averageProcessingTime": 2500,
      "averageQueueTime": 500,
      "averageTotalTime": 3000
    }
  }
}
```

#### **GET /api/v1/jobs/:id**
Job detayları

**Parameters:**
- `id`: string (required) - Job ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job_123456789",
    "type": "IMAGE_UPLOAD_PROCESSING",
    "status": "processing",
    "priority": "normal",
    "createdAt": "2025-09-15T10:30:00.000Z",
    "startedAt": "2025-09-15T10:30:05.000Z",
    "completedAt": null,
    "data": {
      "userId": "user123",
      "uploadId": "upload_123456789",
      "imageId": "img_123456789"
    },
    "progress": 65,
    "retryCount": 0,
    "maxRetries": 3,
    "error": null
  }
}
```

#### **DELETE /api/v1/jobs/:id**
Job iptal et

**Parameters:**
- `id`: string (required) - Job ID

**Response:**
```json
{
  "success": true,
  "message": "Job cancelled successfully"
}
```

#### **GET /api/v1/jobs/:id/status**
Job durumu

**Parameters:**
- `id`: string (required) - Job ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job_123456789",
    "status": "processing",
    "progress": 65,
    "createdAt": "2025-09-15T10:30:00.000Z",
    "startedAt": "2025-09-15T10:30:05.000Z",
    "completedAt": null
  }
}
```

---

## 🔧 **USAGE EXAMPLES**

### **Health Check**
```bash
# Temel sağlık kontrolü
curl http://localhost:3007/api/v1/health

# Detaylı sağlık kontrolü
curl http://localhost:3007/api/v1/health/detailed

# Database sağlık kontrolü
curl http://localhost:3007/api/v1/health/database
```

### **Image Upload**
```bash
# Tek resim yükle
curl -X POST http://localhost:3007/api/v1/upload/single \
  -H "x-user-id: test-user-123" \
  -F "image=@./test-image.png"

# İlan resimleri yükle
curl -X POST http://localhost:3007/api/v1/upload/listings \
  -H "x-user-id: test-user-123" \
  -F "images=@./image1.png" \
  -F "images=@./image2.png"

# Envanter resimleri yükle
curl -X POST http://localhost:3007/api/v1/upload/inventory \
  -H "x-user-id: test-user-123" \
  -F "images=@./inventory1.png" \
  -F "images=@./inventory2.png"
```

### **Job Management**
```bash
# Job metrikleri
curl http://localhost:3007/api/v1/jobs/metrics

# Job detayları
curl http://localhost:3007/api/v1/jobs/job_123456789

# Job durumu
curl http://localhost:3007/api/v1/jobs/job_123456789/status

# Job iptal et
curl -X DELETE http://localhost:3007/api/v1/jobs/job_123456789
```

---

## ⚠️ **ERROR RESPONSES**

### **400 Bad Request**
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Invalid file type. Only PNG, JPG, JPEG, WEBP are allowed",
  "code": "INVALID_FILE_TYPE"
}
```

### **401 Unauthorized**
```json
{
  "success": false,
  "error": "UnauthorizedError",
  "message": "User ID is required",
  "code": "MISSING_USER_ID"
}
```

### **413 Payload Too Large**
```json
{
  "success": false,
  "error": "QuotaExceededError",
  "message": "Upload quota exceeded. You have used 95MB of 100MB",
  "code": "QUOTA_EXCEEDED"
}
```

### **429 Too Many Requests**
```json
{
  "success": false,
  "error": "RateLimitError",
  "message": "Too many requests. Please try again later",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "error": "CloudinaryError",
  "message": "Failed to upload image to Cloudinary",
  "code": "CLOUDINARY_UPLOAD_FAILED"
}
```

---

## 📊 **RATE LIMITING**

- **Window**: 15 dakika
- **Max Requests**: 100 request per window
- **Per User**: User ID bazında limit
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 🔒 **AUTHENTICATION**

- **User ID**: `x-user-id` header ile gönderilir
- **Validation**: Her request için user ID kontrolü
- **Quota**: User ID bazında quota yönetimi

---

## 📈 **MONITORING**

- **Prometheus Metrics**: `/api/v1/health/prometheus`
- **Health Checks**: Tüm servisler için health endpoint'leri
- **Job Metrics**: Job processing istatistikleri
- **Upload Metrics**: Upload success/failure rates

---

## 📞 **SUPPORT**

Endpoint'lerle ilgili sorunlar için:
1. Health check endpoint'lerini kontrol et
2. Log'ları incele
3. Rate limiting durumunu kontrol et
4. Quota durumunu kontrol et

**Bu dokümantasyon sürekli güncellenir. Yeni endpoint'ler eklendikçe veya mevcut olanlar değiştikçe bu dosya güncellenir.**
