# 🚀 Admin Backend API Endpoints Documentation

**Son Güncelleme:** 2025-09-22  
**Versiyon:** 1.3.0  
**Toplam Endpoint Sayısı:** ~170+

---

## 📋 **ENDPOINT KATEGORİLERİ**

### **🔐 AUTHENTICATION & AUTHORIZATION**
**Base Path:** `/api/v1/auth`
- `POST /login` - Admin girişi
- `POST /refresh-token` - Token yenileme
- `GET /profile` - Admin profili (Auth gerekli)
- `PUT /profile` - Admin profili güncelleme (Auth gerekli)
- `POST /logout` - Çıkış yapma (Auth gerekli)
- `POST /create-admin` - Yeni admin oluşturma (Sadece Super Admin)

### **📋 LISTINGS MANAGEMENT**
**Base Path:** `/api/v1/listings`
- `GET /` - Tüm ilanları listele (Auth gerekli)
- `GET /:id` - Tek ilan detayı (Auth gerekli)
- `PUT /:id` - İlan güncelleme (Auth gerekli)
- `DELETE /:id` - İlan silme (Auth gerekli) - RabbitMQ mesajı gönderir
- `POST /:id/moderate` - İlan moderasyonu (Auth gerekli)
- `POST /:id/re-evaluate` - İlanı yeniden değerlendirme (Auth gerekli)
- `POST /test/create` - Test ilanları oluşturma

### **👥 USERS MANAGEMENT**
**Base Path:** `/api/v1/users`
- `GET /` - Kullanıcıları listele (Auth gerekli)
- `GET /:id` - Kullanıcı detayı (Auth gerekli)
- `PUT /:id` - Kullanıcı güncelleme (Auth gerekli)
- `DELETE /:id` - Kullanıcı silme (Auth gerekli)

### **🏷️ CATEGORIES MANAGEMENT**
**Base Path:** `/api/v1/categories`
- `GET /` - Kategorileri listele
- `GET /:id` - Kategori detayı
- `POST /` - Yeni kategori oluştur
- `PUT /:id` - Kategori güncelleme
- `DELETE /:id` - Kategori silme

### **🔍 ELASTICSEARCH MANAGEMENT**
**Base Path:** `/api/v1/elasticsearch`
- `GET /indices` - Tüm indeksleri listele
- `GET /search/:index` - İndekste arama yap
- `GET /document/:index/:id` - Belge detayı
- `GET /stats/:index` - İndeks istatistikleri
- `POST /reindex/:index` - İndeksi yeniden oluştur
- `DELETE /index/:index` - İndeksi sil

### **🔄 QUEUE MANAGEMENT (RABBITMQ)**
**Base Path:** `/api/v1/queue`
- `GET /health` - Queue servis sağlık kontrolü
- `GET /stats` - Queue istatistikleri

### **🏥 HEALTH MONITORING**
**Base Path:** `/api/v1/health`
- `GET /` - Temel sağlık kontrolü
- `GET /detailed` - Detaylı sağlık kontrolü
- `GET /database` - Database sağlık kontrolü
- `GET /redis` - Redis sağlık kontrolü
- `GET /redis/test` - Detaylı Redis testi
- `GET /elasticsearch` - Elasticsearch sağlık kontrolü
- `GET /database-trigger-bridge` - Database Trigger Bridge sağlık kontrolü
- `GET /database-trigger-bridge/status` - Database Trigger Bridge durumu

### **📈 ANALYTICS & MONITORING**
**Base Path:** `/api/v1/analytics`
- `GET /dashboard` - Analytics dashboard
- `GET /trends` - Trend analizi
- `GET /performance` - Performans metrikleri

**Base Path:** `/api/v1/performance`
- `GET /baseline` - Performans baseline
- `GET /metrics` - Performans metrikleri
- `GET /alerts` - Performans uyarıları

**Base Path:** `/api/v1/monitoring`
- `GET /overview` - Sistem genel durumu
- `GET /alerts` - Sistem uyarıları
- `GET /prometheus` - Prometheus formatında metrics
- `GET /health/prometheus` - Prometheus formatında health check
- `GET /api/v1/query` - Prometheus API compatibility endpoint

### **🔒 SECURITY & RATE LIMITING**
**Base Path:** `/api/v1/security`
- `GET /stats` - Güvenlik istatistikleri
- `GET /threats` - Tehdit analizi

**Base Path:** `/api/v1/rate-limit`
- `GET /status` - Rate limit durumu
- `GET /config` - Rate limit konfigürasyonu

### **💾 CACHE MANAGEMENT**
**Base Path:** `/api/v1/cache`
- `GET /stats` - Cache istatistikleri
- `POST /clear` - Cache temizleme
- `GET /keys` - Cache anahtarları

**Base Path:** `/api/v1/api-cache`
- `GET /status` - API cache durumu
- `POST /invalidate` - API cache geçersiz kılma

### **📊 CACHE DASHBOARD (TEMPORARY)**
**Base Path:** `/api/v1/cache-analytics`
- `GET /dashboard` - Cache analytics dashboard (mock data)

**Base Path:** `/api/v1/geographic-cache`
- `GET /stats` - Geographic cache statistics (mock data)

**Base Path:** `/api/v1/predictive-cache`
- `GET /behavior-stats` - Predictive cache behavior stats (mock data)

**Base Path:** `/api/v1/cache-compression`
- `GET /stats` - Cache compression statistics (mock data)

### **📤 DATA EXPORT**
**Base Path:** `/api/v1/data-export`
- `POST /export` - Veri dışa aktarma
- `GET /status/:id` - Export durumu

**Base Path:** `/api/v1/data-export-v2`
- `POST /export` - V2 veri dışa aktarma
- `GET /status/:id` - V2 export durumu

### **🔄 ADMIN MANAGEMENT**
**Base Path:** `/api/v1/admin-management`
- `GET /roles` - Admin rolleri (Auth gerekli)
- `GET /permissions` - İzinler (Auth gerekli)
- `POST /assign-role` - Rol atama (Auth gerekli)

### **🧪 TESTING & DEVELOPMENT**
**Base Path:** `/api/v1/test`
- `POST /listings/create` - Test ilanları oluştur
- `DELETE /listings/clear` - Test ilanları temizle

### **📁 FILE UPLOAD**
**Base Path:** `/api/v1/upload`
- `POST /image` - Resim yükleme
- `POST /document` - Doküman yükleme

### **🖼️ UPLOAD SERVICE (Port 3007)**
**Base Path:** `/api/v1/upload`
- `POST /listings` - Listing image'ları yükleme (Cloudinary)
- `POST /profiles` - Profile image'ları yükleme (Cloudinary)
- `POST /categories` - Category image'ları yükleme (Cloudinary)
- `GET /health` - Upload Service sağlık kontrolü
- `GET /jobs` - Job durumu kontrolü

**Base Path:** `/api/v1/listings`
- `POST /create` - Listing oluşturma (RabbitMQ job)
- `PUT /:id` - Listing güncelleme (RabbitMQ job)
- `GET /status/:jobId` - Job durumu sorgulama

### **📋 LISTING SERVICE (Port 3008)**
**Base Path:** `/api/v1/listings`
- `GET /` - Tüm listing'leri listele
- `GET /:id` - Tek listing detayı
- `POST /` - Yeni listing oluştur (direct)
- `PUT /:id` - Listing güncelleme
- `DELETE /:id` - Listing silme
- `GET /health` - Listing Service sağlık kontrolü
- `GET /jobs/metrics` - Job processing metrikleri

### **🤖 AI SUGGESTIONS**
**Base Path:** `/api/v1/ai-suggestions`
- `POST /generate` - AI önerileri oluştur
- `GET /history` - Öneri geçmişi

### **📦 INVENTORY MANAGEMENT**
**Base Path:** `/api/v1/inventory`
- `GET /items` - Envanter öğeleri
- `POST /items` - Yeni envanter öğesi
- `PUT /items/:id` - Envanter öğesi güncelleme

### **🔍 SEARCH**
**Base Path:** `/api/v1/search`
- `GET /query` - Arama sorgusu
- `GET /suggestions` - Arama önerileri

### **📊 TREND ANALYSIS**
**Base Path:** `/api/v1/trends`
- `GET /analysis` - Trend analizi
- `GET /predictions` - Trend tahminleri

### **📅 SCHEDULING & BACKUP**
**Base Path:** `/api/v1/scheduling`
- `GET /jobs` - Zamanlanmış işler
- `POST /jobs` - Yeni zamanlanmış iş

**Base Path:** `/api/v1/backup`
- `POST /create` - Yedek oluştur
- `GET /list` - Yedek listesi
- `POST /restore/:id` - Yedek geri yükle

---

## 🌐 **PUBLIC ENDPOINTS (No Auth Required)**

- `GET /health` - Ana sağlık kontrolü
- `GET /api/v1/health` - API sağlık kontrolü
- `GET /api/v1/categories` - Kategoriler (public)

---

## 📝 **CHANGELOG**

### **2025-09-22 - v1.3.0**
- ✅ Upload Service endpoint'leri eklendi (Port 3007)
- ✅ Listing Service endpoint'leri eklendi (Port 3008)
- ✅ Image upload flow tamamen entegre edildi
- ✅ RabbitMQ job processing sistemi çalışır hale getirildi
- ✅ End-to-end listing creation flow tamamlandı
- ✅ Cloudinary integration tamamen çalışır durumda

### **2025-09-15 - v1.2.0**
- ✅ DELETE /listings/:id endpoint'i RabbitMQ mesajı gönderir hale getirildi
- ✅ Silme sistemi tam çalışır hale getirildi
- ✅ recordId kullanımı düzeltildi (listingId yerine)
- ✅ Elasticsearch Service ile senkronizasyon sağlandı

### **2025-09-15 - v1.1.0**
- ✅ Prometheus metrics endpoint'leri eklendi (`/api/v1/monitoring/prometheus`)
- ✅ Prometheus health check endpoint'i eklendi (`/api/v1/monitoring/health/prometheus`)
- ✅ Prometheus API compatibility endpoint'i eklendi (`/api/v1/monitoring/api/v1/query`)
- ✅ RabbitMQ exchange ve queue setup endpoint'leri eklendi

### **2025-09-01 - v1.0.0**
- ✅ Database Trigger Bridge health check endpoint'leri eklendi
- ✅ RabbitMQ queue endpoint'leri eklendi
- ✅ Elasticsearch management endpoint'leri eklendi
- ✅ Health monitoring endpoint'leri eklendi

---

## 🔧 **USAGE EXAMPLES**

### **Health Check**
```bash
# Temel sağlık kontrolü
curl http://localhost:3002/api/v1/health

# Database Trigger Bridge sağlık kontrolü
curl http://localhost:3002/api/v1/health/database-trigger-bridge

# Detaylı sağlık kontrolü
curl http://localhost:3002/api/v1/health/detailed
```

### **Queue Management**
```bash
# Queue sağlık kontrolü
curl http://localhost:3002/api/v1/queue/health

# Queue istatistikleri
curl http://localhost:3002/api/v1/queue/stats
```

### **Elasticsearch Management**
```bash
# İndeksleri listele
curl http://localhost:3002/api/v1/elasticsearch/indices

# Belge ara
curl http://localhost:3002/api/v1/elasticsearch/search/listings?q=test
```

### **Prometheus Metrics**
```bash
# Prometheus formatında metrics
curl http://localhost:3002/api/v1/monitoring/prometheus

# Prometheus formatında health check
curl http://localhost:3002/api/v1/monitoring/health/prometheus

# Prometheus API compatibility
curl "http://localhost:3002/api/v1/monitoring/api/v1/query?query=up"
```

### **Upload Service (Port 3007)**
```bash
# Upload Service sağlık kontrolü
curl http://localhost:3007/api/v1/health

# Listing image'ları yükleme
curl -X POST http://localhost:3007/api/v1/upload/listings \
  -H "x-user-id: dff1eb99-c85e-49e8-81af-2ba72dd54c2b" \
  -F "images=@/path/to/image.jpg"

# Listing oluşturma (RabbitMQ job)
curl -X POST http://localhost:3007/api/v1/listings/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: dff1eb99-c85e-49e8-81af-2ba72dd54c2b" \
  -d '{"title":"Test Listing","description":"Test Description","price":100,"category":"Elektronik","location":"İstanbul","images":["https://res.cloudinary.com/classibuy/image/upload/v1758532753/listings/test-user-123/f1dhiwdd06kok5r1oirc.jpg"]}'

# Job durumu sorgulama
curl http://localhost:3007/api/v1/listings/status/4c9458a4-169f-47be-816c-b823556864fc \
  -H "x-user-id: dff1eb99-c85e-49e8-81af-2ba72dd54c2b"
```

### **Listing Service (Port 3008)**
```bash
# Listing Service sağlık kontrolü
curl http://localhost:3008/api/v1/health

# Tüm listing'leri listele
curl http://localhost:3008/api/v1/listings

# Job processing metrikleri
curl http://localhost:3008/api/v1/jobs/metrics
```

---

## ⚠️ **NOTES**

- **Auth Required:** Çoğu endpoint authentication gerektirir
- **Rate Limiting:** Auth endpoint'lerinde rate limiting aktif
- **Health Checks:** Tüm servisler için health check endpoint'leri mevcut
- **Database Trigger Bridge:** Yeni queue sistemi için kritik endpoint

---

## 📞 **SUPPORT**

Endpoint'lerle ilgili sorunlar için:
1. Health check endpoint'lerini kontrol et
2. Log'ları incele
3. Database Trigger Bridge durumunu kontrol et
4. Queue servis sağlığını kontrol et

---

**Bu dokümantasyon sürekli güncellenir. Yeni endpoint'ler eklendikçe veya mevcut olanlar değiştikçe bu dosya güncellenir.**
