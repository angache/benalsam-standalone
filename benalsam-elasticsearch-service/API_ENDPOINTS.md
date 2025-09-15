# 🔍 Elasticsearch Service API Endpoints Documentation

**Son Güncelleme:** 2025-09-15  
**Versiyon:** 1.1.0  
**Toplam Endpoint Sayısı:** ~20+

---

## 📋 **ENDPOINT KATEGORİLERİ**

### **🔍 SEARCH & QUERY**
**Base Path:** `/api/v1/search`
- `GET /listings` - İlan arama
- `GET /stats` - Arama istatistikleri
- `GET /suggestions` - Arama önerileri

### **🏥 HEALTH MONITORING**
**Base Path:** `/api/v1/health`
- `GET /` - Temel sağlık kontrolü
- `GET /detailed` - Detaylı sağlık kontrolü (Prometheus formatında)

### **📈 METRICS & MONITORING**
**Base Path:** `/api/v1/monitoring`
- `GET /prometheus` - Prometheus formatında metrics
- `GET /overview` - Sistem genel durumu

### **🔄 QUEUE MANAGEMENT**
**Base Path:** `/api/v1/queue`
- `GET /health` - Queue consumer sağlık kontrolü
- `GET /stats` - Queue istatistikleri
- `GET /jobs` - Job durumları

### **📊 ELASTICSEARCH MANAGEMENT**
**Base Path:** `/api/v1/elasticsearch`
- `GET /indices` - Tüm indeksleri listele
- `GET /stats` - Elasticsearch istatistikleri
- `POST /reindex` - İndeksi yeniden oluştur

---

## 🌐 **PUBLIC ENDPOINTS (No Auth Required)**

- `GET /health` - Ana sağlık kontrolü
- `GET /api/v1/health` - API sağlık kontrolü
- `GET /api/v1/search/listings` - İlan arama (public)

---

## 📝 **CHANGELOG**

### **2025-09-15 - v1.1.0**
- ✅ Prometheus metrics endpoint'leri eklendi (`/api/v1/monitoring/prometheus`)
- ✅ Prometheus health check endpoint'i eklendi (`/api/v1/health/detailed`)
- ✅ RabbitMQ queue setup endpoint'leri eklendi
- ✅ Queue consumer health check endpoint'leri eklendi

### **2025-09-01 - v1.0.0**
- ✅ Temel search endpoint'leri eklendi
- ✅ Health monitoring endpoint'leri eklendi
- ✅ Elasticsearch management endpoint'leri eklendi

---

## 🔧 **USAGE EXAMPLES**

### **Health Check**
```bash
# Temel sağlık kontrolü
curl http://localhost:3006/health

# Detaylı sağlık kontrolü (Prometheus formatında)
curl http://localhost:3006/api/v1/health/detailed

# API sağlık kontrolü
curl http://localhost:3006/api/v1/health
```

### **Search Operations**
```bash
# İlan arama
curl "http://localhost:3006/api/v1/search/listings?q=nokia"

# Arama istatistikleri
curl http://localhost:3006/api/v1/search/stats

# Arama önerileri
curl "http://localhost:3006/api/v1/search/suggestions?q=nok"
```

### **Prometheus Metrics**
```bash
# Prometheus formatında metrics
curl http://localhost:3006/api/v1/monitoring/prometheus

# Sistem genel durumu
curl http://localhost:3006/api/v1/monitoring/overview
```

### **Queue Management**
```bash
# Queue consumer sağlık kontrolü
curl http://localhost:3006/api/v1/queue/health

# Queue istatistikleri
curl http://localhost:3006/api/v1/queue/stats

# Job durumları
curl http://localhost:3006/api/v1/queue/jobs
```

### **Elasticsearch Management**
```bash
# İndeksleri listele
curl http://localhost:3006/api/v1/elasticsearch/indices

# Elasticsearch istatistikleri
curl http://localhost:3006/api/v1/elasticsearch/stats

# İndeksi yeniden oluştur
curl -X POST http://localhost:3006/api/v1/elasticsearch/reindex
```

---

## ⚠️ **NOTES**

- **Auth Required:** Çoğu endpoint authentication gerektirmez (public service)
- **Rate Limiting:** Search endpoint'lerinde rate limiting aktif
- **Health Checks:** Tüm servisler için health check endpoint'leri mevcut
- **Queue Consumer:** RabbitMQ mesaj işleme için kritik endpoint
- **Prometheus Integration:** Monitoring sistemi için metrics endpoint'leri

---

## 📞 **SUPPORT**

Endpoint'lerle ilgili sorunlar için:
1. Health check endpoint'lerini kontrol et
2. Log'ları incele
3. Queue consumer durumunu kontrol et
4. Elasticsearch bağlantısını kontrol et

---

**Bu dokümantasyon sürekli güncellenir. Yeni endpoint'ler eklendikçe veya mevcut olanlar değiştikçe bu dosya güncellenir.**
