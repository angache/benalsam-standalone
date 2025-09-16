# 🚀 BENALSAM UPLOAD SERVICE

## 📊 SERVİS DURUMU

**Port**: 3007  
**Durum**: ✅ Aktif  
**Son Güncelleme**: 15 Eylül 2025, 10:30

## 🎯 SERVİS AÇIKLAMASI

Upload Service, image upload, processing ve Cloudinary entegrasyonu için özel olarak tasarlanmış bir microservice'dir. Bu servis, tüm image upload işlemlerini merkezi olarak yönetir ve job system ile asenkron processing sağlar.

## 🏗️ MİMARİ

### **Ana Bileşenler**
- **Express.js**: Web framework
- **Cloudinary**: Image storage ve processing
- **RabbitMQ**: Message queuing
- **Redis**: Caching ve rate limiting
- **Job System**: Background processing
- **Prometheus**: Metrics collection

### **Özellikler**
- ✅ Image upload (single/multiple)
- ✅ Image processing (resize, thumbnail)
- ✅ Cloudinary integration
- ✅ Rate limiting
- ✅ Quota management
- ✅ Job system
- ✅ Health monitoring
- ✅ Error handling
- ✅ Validation

## 🚀 HIZLI BAŞLATMA

### 1. Servisi Başlat

```bash
cd benalsam-upload-service
npm install
npm run dev
```

### 2. Health Check

```bash
curl http://localhost:3007/api/v1/health
```

### 3. Test Upload

```bash
curl -X POST http://localhost:3007/api/v1/upload/listings \
  -H "x-user-id: test-user-123" \
  -F "images=@./test-image.png"
```

## 📋 API ENDPOİNTLERİ

### **Health & Monitoring**
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health check
- `GET /api/v1/health/database` - Database health
- `GET /api/v1/health/redis` - Redis health
- `GET /api/v1/health/rabbitmq` - RabbitMQ health
- `GET /api/v1/health/jobs` - Job processor health

### **Upload Operations**
- `POST /api/v1/upload/listings` - Upload listing images
- `POST /api/v1/upload/inventory` - Upload inventory images
- `POST /api/v1/upload/single` - Upload single image

### **Job Management**
- `GET /api/v1/jobs/metrics` - Job metrics
- `GET /api/v1/jobs/:id` - Get job details
- `DELETE /api/v1/jobs/:id` - Cancel job
- `GET /api/v1/jobs/:id/status` - Get job status

## 🔧 KONFİGÜRASYON

### **Environment Variables**

```bash
# Server
PORT=3007
NODE_ENV=development

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://benalsam:benalsam123@localhost:5672

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Quota
DEFAULT_QUOTA_MB=100
DEFAULT_QUOTA_IMAGES=50
```

### **Cloudinary Configuration**

```typescript
// Cloudinary folder structure
benalsam/
├── {userId}/
│   ├── listings/
│   │   ├── temp_{timestamp}_{randomId}/
│   │   └── {listingId}/
│   └── inventory/
│       ├── temp_{timestamp}_{randomId}/
│       └── {itemId}/
```

## 🧪 TEST SENARYOLARI

### 1. Health Check Test

```bash
# Basic health check
curl -s "http://localhost:3007/api/v1/health" | jq '.status'

# Detailed health check
curl -s "http://localhost:3007/api/v1/health/detailed" | jq '.status'
```

### 2. Image Upload Test

```bash
# Upload single image
curl -X POST "http://localhost:3007/api/v1/upload/single" \
  -H "x-user-id: test-user-123" \
  -F "image=@./test-image.png"

# Upload multiple images for listing
curl -X POST "http://localhost:3007/api/v1/upload/listings" \
  -H "x-user-id: test-user-123" \
  -F "images=@./image1.png" \
  -F "images=@./image2.png"
```

### 3. Job System Test

```bash
# Get job metrics
curl -s "http://localhost:3007/api/v1/jobs/metrics" | jq '.data.metrics'

# Get specific job
curl -s "http://localhost:3007/api/v1/jobs/{jobId}" | jq '.data'
```

### 4. Rate Limiting Test

```bash
# Test rate limiting (make multiple requests)
for i in {1..10}; do
  curl -s "http://localhost:3007/api/v1/health" | jq '.status'
  sleep 1
done
```

## 📊 MONİTORİNG

### **Prometheus Metrics**

```bash
# Prometheus metrics endpoint
curl http://localhost:3007/api/v1/health/prometheus
```

### **Grafana Dashboard**

- **URL**: http://localhost:3000
- **Service**: Upload Service
- **Metrics**: Image uploads, processing time, error rates

### **Health Monitoring**

```bash
# All health endpoints
curl http://localhost:3007/api/v1/health
curl http://localhost:3007/api/v1/health/detailed
curl http://localhost:3007/api/v1/health/database
curl http://localhost:3007/api/v1/health/redis
curl http://localhost:3007/api/v1/health/rabbitmq
curl http://localhost:3007/api/v1/health/jobs
```

## 🔄 JOB SYSTEM

### **Job Types**

| Job Type | Açıklama | Status |
|----------|----------|--------|
| `IMAGE_UPLOAD_REQUESTED` | Image upload başlatıldı | ✅ |
| `IMAGE_UPLOAD_PROCESSING` | Image processing | ✅ |
| `IMAGE_UPLOAD_COMPLETED` | Upload tamamlandı | ✅ |
| `IMAGE_UPLOAD_FAILED` | Upload başarısız | ✅ |
| `IMAGE_RESIZE` | Image boyutlandırma | ✅ |
| `THUMBNAIL_GENERATE` | Thumbnail oluşturma | ✅ |
| `METADATA_EXTRACT` | Metadata çıkarma | ✅ |
| `VIRUS_SCAN` | Virus tarama | ✅ |
| `DATABASE_UPDATE` | Database güncelleme | ✅ |
| `NOTIFICATION_SEND` | Bildirim gönderme | ✅ |
| `CLEANUP_TEMP_FILES` | Geçici dosya temizleme | ✅ |

### **Job Processing Flow**

```
Upload Request → Job Created → RabbitMQ → Job Processor → Cloudinary → Database Update → Notification
```

## 🛡️ GÜVENLİK

### **Rate Limiting**
- **Window**: 15 dakika
- **Max Requests**: 100 request
- **Per User**: User ID bazında limit

### **Quota Management**
- **Default Quota**: 100MB, 50 images
- **Per User**: User ID bazında quota
- **Validation**: Upload öncesi quota kontrolü

### **File Validation**
- **File Types**: PNG, JPG, JPEG, WEBP
- **Max Size**: 10MB per image
- **Max Images**: 10 images per request
- **Virus Scan**: Upload sonrası tarama

## 📁 PROJE YAPISI

```
benalsam-upload-service/
├── src/
│   ├── config/
│   │   ├── database.ts          # Supabase configuration
│   │   ├── logger.ts            # Winston logger
│   │   ├── redis.ts             # Redis configuration
│   │   └── rabbitmq.ts          # RabbitMQ configuration
│   ├── controllers/
│   │   └── uploadController.ts  # Upload operations
│   ├── middleware/
│   │   ├── errorHandler.ts      # Error handling
│   │   └── rateLimiter.ts       # Rate limiting
│   ├── routes/
│   │   ├── upload.ts            # Upload routes
│   │   ├── health.ts            # Health check routes
│   │   └── jobs.ts              # Job management routes
│   ├── services/
│   │   ├── cloudinaryService.ts # Cloudinary integration
│   │   ├── jobProcessor.ts      # Job processing
│   │   └── quotaService.ts      # Quota management
│   ├── types/
│   │   ├── upload.ts            # Upload types
│   │   └── jobs.ts              # Job types
│   ├── utils/
│   │   └── validation.ts        # Validation utilities
│   └── index.ts                 # Main application
├── package.json
├── tsconfig.json
├── env.example
└── README.md
```

## 🔧 GELİŞTİRME

### **Development Setup**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### **Environment Setup**

```bash
# Copy environment file
cp env.example .env

# Edit environment variables
nano .env
```

### **Testing**

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test
npm test -- --grep "upload"
```

## 🚀 DEPLOYMENT

### **Docker**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3007
CMD ["npm", "start"]
```

### **Docker Compose**

```yaml
version: '3.8'
services:
  upload-service:
    build: .
    ports:
      - "3007:3007"
    environment:
      - NODE_ENV=production
      - PORT=3007
    depends_on:
      - redis
      - rabbitmq
```

## 📈 PERFORMANS

### **Optimization**
- **Image Compression**: Otomatik sıkıştırma
- **Thumbnail Generation**: Çoklu boyutlar
- **CDN Integration**: Cloudinary CDN
- **Caching**: Redis cache
- **Rate Limiting**: DDoS koruması

### **Monitoring**
- **Upload Speed**: MB/s
- **Processing Time**: ms
- **Error Rate**: %
- **Queue Depth**: messages
- **Memory Usage**: MB

## 🐛 TROUBLESHOOTING

### **Common Issues**

1. **Cloudinary Connection Error**
   ```bash
   # Check environment variables
   echo $CLOUDINARY_CLOUD_NAME
   echo $CLOUDINARY_API_KEY
   echo $CLOUDINARY_API_SECRET
   ```

2. **Redis Connection Error**
   ```bash
   # Check Redis status
   redis-cli ping
   ```

3. **RabbitMQ Connection Error**
   ```bash
   # Check RabbitMQ status
   curl http://localhost:15672/api/overview
   ```

4. **Rate Limiting**
   ```bash
   # Check rate limit headers
   curl -I http://localhost:3007/api/v1/health
   ```

### **Logs**

```bash
# View logs
tail -f logs/upload-service.log

# View error logs
grep "ERROR" logs/upload-service.log
```

## 📚 DOKÜMANTASYON

- [API Endpoints](API_ENDPOINTS.md) - Detaylı API dokümantasyonu
- [Job System](docs/job-system.md) - Job processing detayları
- [Cloudinary Integration](docs/cloudinary.md) - Cloudinary setup
- [Monitoring](docs/monitoring.md) - Monitoring ve alerting

## 🤝 KATKIDA BULUNMA

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 LİSANS

MIT License - see [LICENSE](LICENSE) file for details.

---

**Geliştirici**: Benalsam Team  
**Versiyon**: 1.0.0  
**Son Güncelleme**: 15 Eylül 2025, 10:30
