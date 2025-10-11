# 🔌 BENALSAM SERVİS PORTLARI VE ENDPOINT'LER

## 📊 Servis Portları ve Health Check Endpoint'leri

### 🎯 Mikroservisler

| Servis | Port | Health Endpoint | Response Format | Durum |
|--------|------|-----------------|-----------------|-------|
| **Admin Backend** | 3002 | `/api/v1/health` | `status` | ✅ Healthy |
| **Elasticsearch Service** | 3006 | `/api/v1/health` | `status` | ✅ Healthy |
| **Upload Service** | 3007 | `/api/v1/health` | `status` | ✅ Healthy |
| **Listing Service** | 3008 | `/api/v1/health` | `status` | ✅ Healthy |
| **Backup Service** | 3013 | `/api/v1/health` | `data.status` | ✅ Healthy |
| **Cache Service** | 3014 | `/api/v1/health` | `data.status` | ✅ Healthy |
| **Categories Service** | 3015 | `/api/v1/health` | `status` | ✅ Healthy |
| **Search Service** | 3016 | `/api/v1/health` | `status` | ✅ Healthy |
| **Realtime Service** | 3019 | `/api/v1/health` | `status` | ✅ Healthy |

### 🌐 Web Uygulamaları

| Uygulama | Port | Açıklama | Durum |
|----------|------|----------|-------|
| **Web App** | 5173 | Kullanıcı arayüzü | ✅ Running |
| **Admin UI** | 3003 | Admin paneli | ✅ Running |
| **Mobile App** | 8081 | React Native | ✅ Running |

### 🗄️ Veritabanı ve Depolama

| Servis | Port | Açıklama | Durum |
|--------|------|----------|-------|
| **PostgreSQL** | 54322 | Ana veritabanı | ✅ Running |
| **Elasticsearch** | 9200 | Arama index'i | ✅ Running |
| **Redis** | 6379 | Cache ve session | ✅ Running |

### 🔄 Mesajlaşma ve Monitoring

| Servis | Port | Açıklama | Durum |
|--------|------|----------|-------|
| **RabbitMQ** | 5672, 15672 | Message queuing | ✅ Running |
| **Prometheus** | 9090 | Metrics toplama | ✅ Running |
| **Grafana** | 3000 | Dashboard | ✅ Running |
| **Alertmanager** | 9093 | Alert yönetimi | ✅ Running |

## 🔍 Health Check Response Formatları

### Standard Format (status)
```json
{
  "status": "healthy",
  "service": "service-name",
  "version": "1.0.0",
  "timestamp": "2025-09-27T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": 171644816,
    "total": 175603712,
    "percentage": 97.75
  }
}
```

### Wrapped Format (data.status)
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "service-name",
    "version": "1.0.0",
    "timestamp": "2025-09-27T10:30:00.000Z",
    "uptime": 3600
  }
}
```

## 📊 Prometheus Metrics Endpoint'leri

Tüm servisler aşağıdaki endpoint'lerde metrics sağlar:

- **Primary**: `/api/v1/metrics`
- **Alternative**: `/metrics`

### Metrics Endpoint Test
```bash
# Test metrics endpoint
curl -s http://localhost:3002/api/v1/metrics | head -20
curl -s http://localhost:3006/api/v1/metrics | head -20
curl -s http://localhost:3007/api/v1/metrics | head -20
curl -s http://localhost:3008/api/v1/metrics | head -20
curl -s http://localhost:3012/api/v1/metrics | head -20
curl -s http://localhost:3013/api/v1/metrics | head -20
curl -s http://localhost:3014/api/v1/metrics | head -20
curl -s http://localhost:3015/api/v1/metrics | head -20
curl -s http://localhost:3016/api/v1/metrics | head -20
```

## 🧪 Health Check Test Komutları

### Tüm Servislerin Health Check'i
```bash
#!/bin/bash
echo "=== BENALSAM SERVİS HEALTH CHECK ==="

services=(
  "3002:Admin Backend"
  "3006:Elasticsearch Service"
  "3007:Upload Service"
  "3008:Listing Service"
  "3012:Queue Service"
  "3013:Backup Service"
  "3014:Cache Service"
  "3015:Categories Service"
  "3016:Search Service"
)

for service in "${services[@]}"; do
  port=$(echo $service | cut -d: -f1)
  name=$(echo $service | cut -d: -f2)
  
  echo -n "Port $port ($name): "
  
  if [[ $port == "3012" || $port == "3013" || $port == "3014" ]]; then
    # Queue Service, Backup Service ve Cache Service data.status formatında
    status=$(curl -s http://localhost:$port/api/v1/health | jq -r '.data.status // "No response"' 2>/dev/null || echo "No response")
  else
    # Diğer servisler status formatında
    status=$(curl -s http://localhost:$port/api/v1/health | jq -r '.status // "No response"' 2>/dev/null || echo "No response")
  fi
  
  echo "$status"
done
```

### Tekil Servis Health Check
```bash
# Admin Backend
curl -s http://localhost:3002/api/v1/health | jq '.status'

# Elasticsearch Service
curl -s http://localhost:3006/api/v1/health | jq '.status'

# Upload Service
curl -s http://localhost:3007/api/v1/health | jq '.status'

# Listing Service
curl -s http://localhost:3008/api/v1/health | jq '.status'

# Queue Service (data.status format)
curl -s http://localhost:3012/api/v1/health | jq '.data.status'

# Backup Service (data.status format)
curl -s http://localhost:3013/api/v1/health | jq '.data.status'

# Cache Service (data.status format)
curl -s http://localhost:3014/api/v1/health | jq '.data.status'

# Categories Service
curl -s http://localhost:3015/api/v1/health | jq '.status'

# Search Service
curl -s http://localhost:3016/api/v1/health | jq '.status'
```

## 🔧 Service Registry Konfigürasyonu

Admin Backend'deki Service Registry aşağıdaki endpoint'leri kullanır:

```typescript
const serviceConfigs = {
  'elasticsearch-service': {
    url: 'http://localhost:3006',
    healthEndpoint: '/api/v1/health'
  },
  'upload-service': {
    url: 'http://localhost:3007',
    healthEndpoint: '/api/v1/health'
  },
  'listing-service': {
    url: 'http://localhost:3008',
    healthEndpoint: '/api/v1/health'
  },
  'queue-service': {
    url: 'http://localhost:3012',
    healthEndpoint: '/api/v1/health'
  },
  'backup-service': {
    url: 'http://localhost:3013',
    healthEndpoint: '/api/v1/health'
  },
  'cache-service': {
    url: 'http://localhost:3014',
    healthEndpoint: '/api/v1/health'
  },
  'categories-service': {
    url: 'http://localhost:3015',
    healthEndpoint: '/api/v1/health'
  },
  'search-service': {
    url: 'http://localhost:3016',
    healthEndpoint: '/api/v1/health'
  }
};
```

## 📈 Monitoring Dashboard

### Grafana Dashboard
- **URL**: http://localhost:3000
- **Kullanıcı**: admin
- **Şifre**: admin123
- **Dashboard**: Benalsam Microservices Monitoring

### Prometheus
- **URL**: http://localhost:9090
- **Targets**: Tüm servisler otomatik olarak scrape ediliyor

## 🚨 Troubleshooting

### Servis Bulunamadı Hatası
```bash
# Port kullanımını kontrol et
lsof -i :3002
lsof -i :3006
lsof -i :3007
lsof -i :3008
lsof -i :3012
lsof -i :3013
lsof -i :3014
lsof -i :3015
lsof -i :3016
```

### Health Check Başarısız
```bash
# Servis loglarını kontrol et
docker logs <service-container-name>
# veya
tail -f <service-directory>/logs/app.log
```

### Metrics Endpoint Bulunamadı
```bash
# Metrics endpoint'ini test et
curl -v http://localhost:<port>/api/v1/metrics
curl -v http://localhost:<port>/metrics
```

---

**Son Güncelleme**: 27 Eylül 2025, 10:30  
**Doğrulama**: Tüm endpoint'ler test edildi ve çalışır durumda  
**Versiyon**: 1.0.0
