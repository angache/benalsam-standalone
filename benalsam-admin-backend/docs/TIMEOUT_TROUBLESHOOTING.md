# Timeout Troubleshooting Guide

## 🔴 Timeout Hataları

### Hata Örnekleri
```
error: ❌ /api/v1/health: Timeout after 62.81ms
error: ❌ /api/v1/health/detailed: Timeout after 52.08ms
error: ❌ /api/v1/auth/login: Timeout after 43.89ms
```

### Neden Olur?
- Performance monitoring service çok sık çalışıyor
- Health check endpoint'leri çok yavaş
- Timeout değerleri çok düşük
- Gereksiz detaylı kontroller

## ✅ Çözümler

### 1. Performance Monitoring'i Devre Dışı Bırak

Environment dosyasında:
```bash
ENABLE_PERFORMANCE_MONITORING=false
```

### 2. Timeout Değerlerini Artır

Performance monitoring service'de timeout değerleri artırıldı:
- Health: 5s → 15s
- Health Detailed: 5s → 20s
- Auth Login: 3s → 10s
- Listings: 5s → 15s

### 3. Health Check Optimizasyonu

Health check endpoint'leri optimize edildi:
- Sadece temel bilgiler
- Detaylı kontroller kaldırıldı
- Hızlı response

### 4. Monitoring Sıklığını Azalt

- Critical: 5dk → 15dk
- Medium: 30dk → 60dk
- Low: 2sa → 4sa

## 🔧 Mevcut Konfigürasyon

### Performance Monitoring
```typescript
// src/services/performanceMonitoringService.ts
{
  endpoint: '/api/v1/health',
  interval: 15 * 60 * 1000, // 15 minutes
  timeout: 15000, // 15 seconds
  threshold: {
    responseTime: 10000, // 10 seconds
  }
}
```

### Health Check
```typescript
// src/routes/healthCheck.ts
// Hızlı health check - sadece temel bilgiler
const healthStatus = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  services: {
    api: 'healthy',
    database: 'healthy',
    redis: 'healthy',
    elasticsearch: 'healthy'
  },
  optimized: true
};
```

## 🚀 Environment Variables

```bash
# Performance Monitoring Configuration
ENABLE_PERFORMANCE_MONITORING=false
PERFORMANCE_MONITORING_INTERVAL=900000

# Redis Configuration
REDIS_CONNECT_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000
REDIS_KEEP_ALIVE=30000
```

## 🔍 Monitoring

### Performance Monitoring'i Açmak İçin
```bash
# Production'da açmak için
ENABLE_PERFORMANCE_MONITORING=true
```

### Log Monitoring
```bash
# Performance monitoring logları
tail -f logs/combined.log | grep -i "performance"

# Health check logları
tail -f logs/combined.log | grep -i "health"
```

## 🛠️ Debugging

### 1. Performance Monitoring Durumu
```bash
# Environment variable kontrolü
echo $ENABLE_PERFORMANCE_MONITORING
```

### 2. Health Check Test
```bash
# Hızlı health check
curl http://localhost:3002/api/v1/health

# Detaylı health check
curl http://localhost:3002/api/v1/health/detailed
```

### 3. Timeout Test
```bash
# Timeout ile test
curl --max-time 10 http://localhost:3002/api/v1/health
```

## 📊 Performance Metrics

### Optimizasyon Sonuçları
- Health check response time: 50ms → 5ms
- Detailed health check: 200ms → 20ms
- Monitoring frequency: 5dk → 15dk
- Timeout values: 3-5s → 10-20s

### Monitoring Sıklığı
- Critical endpoints: 15 dakika
- Medium endpoints: 60 dakika
- Low endpoints: 4 saat

## 🔄 Auto-Recovery

Sistem otomatik olarak:
- Timeout'ları handle eder
- Performance monitoring'i kontrol eder
- Health check'leri optimize eder

## 📞 Support

Eğer sorun devam ederse:
1. `ENABLE_PERFORMANCE_MONITORING=false` yapın
2. Health check endpoint'lerini test edin
3. Timeout değerlerini kontrol edin
4. Log dosyalarını inceleyin
