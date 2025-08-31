# 🚀 Benalsam Queue Service

Benalsam projesi için ayrı bir **Queue Microservice** - Bull queue sistemi ile job processing.

## 📋 Özellikler

- ✅ **Bull Queue System** - Redis tabanlı güvenilir job processing
- ✅ **Microservice Architecture** - Bağımsız scaling ve deployment
- ✅ **TypeScript** - Type-safe development
- ✅ **Express.js** - RESTful API
- ✅ **Winston Logging** - Structured logging
- ✅ **Health Checks** - Service monitoring
- ✅ **Rate Limiting** - API protection
- ✅ **CORS Support** - Cross-origin requests
- ✅ **Docker Ready** - Containerization support

## 🏗️ Proje Yapısı

```
benalsam-queue-service/
├── src/
│   ├── config/          # Konfigürasyon dosyaları
│   ├── types/           # TypeScript type tanımları
│   ├── queues/          # Bull queue tanımları
│   ├── processors/      # Job processor'ları
│   ├── controllers/     # API controller'ları
│   ├── routes/          # Express route'ları
│   ├── middleware/      # Custom middleware'ler
│   ├── utils/           # Utility fonksiyonları
│   └── index.ts         # Ana server dosyası
├── logs/                # Log dosyaları
├── dist/                # Build çıktısı
├── package.json
├── tsconfig.json
├── env.example
└── README.md
```

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Environment Variables
```bash
cp env.example .env
# .env dosyasını düzenle
```

### 3. Redis Kurulumu
```bash
# Docker ile Redis
docker run -d --name redis -p 6379:6379 redis:alpine

# Veya local Redis kurulumu
brew install redis  # macOS
sudo apt-get install redis-server  # Ubuntu
```

### 4. Development Server
```bash
npm run dev
```

### 5. Production Build
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Jobs
```
POST   /api/v1/queue/jobs          # Job ekle
GET    /api/v1/queue/jobs          # Job listesi
GET    /api/v1/queue/jobs/:id      # Job detayı
PUT    /api/v1/queue/jobs/:id/retry # Job retry
DELETE /api/v1/queue/jobs/:id      # Job sil
```

### Queues
```
GET    /api/v1/queue/queues        # Queue listesi
GET    /api/v1/queue/queues/:name  # Queue detayı
GET    /api/v1/queue/queues/:name/stats # Queue istatistikleri
POST   /api/v1/queue/queues/:name/pause  # Queue pause
POST   /api/v1/queue/queues/:name/resume # Queue resume
DELETE /api/v1/queue/queues/:name/clean  # Queue temizle
```

### Health & Monitoring
```
GET /api/v1/queue/health           # Detaylı health check
GET /api/v1/queue/metrics          # Prometheus metrics
```

## 🔧 Konfigürasyon

### Environment Variables

```env
# Server Configuration
PORT=3003
NODE_ENV=development

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Bull Queue Configuration
BULL_PREFIX=benalsam
BULL_CONCURRENCY=5
BULL_RETRY_ATTEMPTS=3
BULL_RETRY_DELAY=5000

# External Services
ADMIN_BACKEND_URL=http://localhost:3002
ELASTICSEARCH_URL=http://localhost:9200
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 📊 Job Types

### 1. Elasticsearch Sync Jobs
```typescript
{
  type: 'elasticsearch-sync',
  data: {
    tableName: 'inventory_items',
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    recordId: 'uuid',
    changeData: { ... },
    userId: 'uuid'
  }
}
```

### 2. Email Notification Jobs
```typescript
{
  type: 'email-notification',
  data: {
    to: 'user@example.com',
    subject: 'Welcome!',
    template: 'welcome',
    data: { ... }
  }
}
```

### 3. Data Export Jobs
```typescript
{
  type: 'data-export',
  data: {
    userId: 'uuid',
    exportType: 'csv' | 'json' | 'excel' | 'pdf',
    dataType: 'user_analytics',
    filters: { ... }
  }
}
```

### 4. Image Processing Jobs
```typescript
{
  type: 'image-processing',
  data: {
    imageUrl: 'https://...',
    operations: ['resize', 'compress'],
    outputFormat: 'webp',
    quality: 80
  }
}
```

## 🧪 Test

```bash
# Unit tests
npm test

# Test coverage
npm run test:coverage

# Integration tests
npm run test:integration
```

## 📝 Logging

Loglar `logs/` klasöründe saklanır:
- `queue-service.log` - Genel loglar
- `error.log` - Sadece error logları

## 🐳 Docker

```bash
# Build image
docker build -t benalsam-queue-service .

# Run container
docker run -d \
  --name queue-service \
  -p 3003:3003 \
  --env-file .env \
  benalsam-queue-service
```

## 🔍 Monitoring

### Bull Board Dashboard
```
http://localhost:3003/admin/queues
```

### Health Check
```
http://localhost:3003/health
```

### Metrics (Prometheus)
```
http://localhost:3003/metrics
```

## 🤝 Admin Backend Integration

Queue service, admin backend ile HTTP API üzerinden iletişim kurar:

```typescript
// Admin backend'den job gönderme
const response = await fetch('http://localhost:3003/api/v1/queue/jobs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'elasticsearch-sync',
    data: {
      tableName: 'inventory_items',
      operation: 'INSERT',
      recordId: 'uuid',
      changeData: { ... }
    }
  })
});
```

## 📈 Performance

- **Concurrency**: 5 concurrent jobs (configurable)
- **Retry**: 3 attempts with exponential backoff
- **Memory**: ~50MB base usage
- **Throughput**: 1000+ jobs/minute

## 🔒 Security

- **Rate Limiting**: 100 requests/15 minutes per IP
- **CORS**: Configurable origins
- **Helmet**: Security headers
- **Input Validation**: Express-validator
- **Error Handling**: No sensitive data exposure

## 🚨 Troubleshooting

### Redis Connection Issues
```bash
# Redis status kontrolü
redis-cli ping

# Redis logs
docker logs redis
```

### Queue Issues
```bash
# Queue stats kontrolü
curl http://localhost:3003/api/v1/queue/queues/elasticsearch-sync/stats

# Failed jobs kontrolü
curl http://localhost:3003/api/v1/queue/jobs?status=failed
```

### Memory Issues
```bash
# Memory usage kontrolü
curl http://localhost:3003/health

# Queue cleanup
curl -X DELETE http://localhost:3003/api/v1/queue/queues/elasticsearch-sync/clean
```

## 📞 İletişim

- **Developer**: AI Assistant
- **Reviewer**: Arda Tuna
- **Emergency Contact**: Arda Tuna

---

*Son güncelleme: 2025-08-31*
*Versiyon: 1.0.0*
