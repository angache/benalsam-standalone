# 🚀 Queue Service API Endpoints Documentation

**Son Güncelleme:** 2025-09-01  
**Versiyon:** 1.0.0  
**Toplam Endpoint Sayısı:** ~20+

---

## 📋 **ENDPOINT KATEGORİLERİ**

### **🏥 HEALTH MONITORING**
**Base Path:** `/api/v1/health`
- `GET /` - Temel sağlık kontrolü
- `GET /detailed` - Detaylı sağlık kontrolü

### **🔄 QUEUE MANAGEMENT**
**Base Path:** `/api/v1/queue`
- `GET /stats` - Queue istatistikleri
- `POST /clean` - Queue temizleme
- `POST /pause` - Queue'ları duraklat
- `POST /resume` - Queue'ları devam ettir

### **📋 JOB MANAGEMENT**
**Base Path:** `/api/v1/jobs`
- `POST /` - Yeni job oluştur
- `GET /` - Job'ları listele
- `GET /:id` - Tek job detayı
- `POST /:id/retry` - Job'ı yeniden dene
- `DELETE /:id` - Job'ı kaldır

### **🎛️ ADMIN DASHBOARD**
**Base Path:** `/admin/queues`
- `GET /` - Bull Board dashboard
- `GET /api/queues` - Queue API endpoint'leri

---

## 🌐 **PUBLIC ENDPOINTS (No Auth Required)**

- `GET /api/v1/health` - Temel sağlık kontrolü
- `GET /admin/queues` - Bull Board dashboard

---

## 📝 **CHANGELOG**

### **2025-09-01 - v1.0.0**
- ✅ Health monitoring endpoint'leri eklendi
- ✅ Queue management endpoint'leri eklendi
- ✅ Job management endpoint'leri eklendi
- ✅ Bull Board dashboard eklendi

---

## 🔧 **USAGE EXAMPLES**

### **Health Check**
```bash
# Temel sağlık kontrolü
curl http://localhost:3004/api/v1/health

# Detaylı sağlık kontrolü
curl http://localhost:3004/api/v1/health/detailed
```

### **Queue Management**
```bash
# Queue istatistikleri
curl http://localhost:3004/api/v1/queue/stats

# Queue temizleme
curl -X POST http://localhost:3004/api/v1/queue/clean \
  -H "Content-Type: application/json" \
  -d '{"type": "completed", "grace": 0}'
```

### **Job Management**
```bash
# Yeni job oluştur
curl -X POST http://localhost:3004/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "elasticsearch-sync",
    "data": {
      "operation": "INSERT",
      "table": "listings",
      "recordId": "123",
      "changeData": {}
    }
  }'

# Job'ı yeniden dene
curl -X POST http://localhost:3004/api/v1/jobs/123/retry
```

---

## ⚠️ **NOTES**

- **Job Types:** Sadece `elasticsearch-sync` job tipi desteklenir
- **Data Format:** Job data'sı belirli formatta olmalıdır
- **Bull Board:** Dashboard `/admin/queues` path'inde erişilebilir
- **Health Checks:** Tüm servisler için health check endpoint'leri mevcut

---

## 📞 **SUPPORT**

Queue Service ile ilgili sorunlar için:
1. Health check endpoint'lerini kontrol et
2. Bull Board dashboard'ı incele
3. Log'ları kontrol et
4. Redis bağlantısını kontrol et

---

**Bu dokümantasyon sürekli güncellenir. Yeni endpoint'ler eklendikçe veya mevcut olanlar değiştikçe bu dosya güncellenir.**
