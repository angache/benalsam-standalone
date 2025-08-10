# 📊 Benalsam Analytics Sistemi

## 🎯 **Genel Bakış**

Benalsam Analytics sistemi, web sitesi ve mobil uygulamanın performansını, kullanıcı davranışlarını ve iş metriklerini kapsamlı bir şekilde izleyen gelişmiş bir monitoring platformudur.

---

## 🚀 **Hızlı Başlangıç**

### **1. Sistem Durumu Kontrolü**
```bash
# PM2 servislerini kontrol et
pm2 status

# Admin-backend loglarını görüntüle
pm2 logs admin-backend

# Sistem kaynaklarını izle
pm2 monit
```

### **2. Analytics Dashboard Erişimi**
```
🌐 Admin UI: http://localhost:3003
🔧 Admin Backend: http://localhost:3002
📊 Elasticsearch: http://209.227.228.96:9200
```

### **3. Temel API Testleri**
```bash
# Performance Dashboard
curl -X GET "http://localhost:3002/api/v1/performance/dashboard" \
  -H "Authorization: Bearer <token>"

# User Journey Analysis
curl -X GET "http://localhost:3002/api/v1/user-journey/analysis" \
  -H "Authorization: Bearer <token>"

# Alert Summary
curl -X GET "http://localhost:3002/api/v1/analytics-alerts/summary" \
  -H "Authorization: Bearer <token>"
```

---

## 📚 **Dokümantasyon**

### **📖 Kullanıcı Rehberi**
- **[Analytics Sistemi Kullanıcı Rehberi](./ANALYTICS_SYSTEM_GUIDE.md)**
  - Sistemin ne olduğu ve nasıl çalıştığı
  - Pratik örnekler ve faydalar
  - Kullanıcı dostu açıklamalar

### **🔧 Teknik Dokümantasyon**
- **[Teknik Dokümantasyon](./ANALYTICS_TECHNICAL_DOCUMENTATION.md)**
  - API endpoint'leri
  - Servis yapıları
  - Deployment konfigürasyonu
  - Troubleshooting rehberi

### **📋 TODO ve Geliştirme**
- **[Analytics Production Enhancement TODO](../../../todos/active/ANALYTICS_PRODUCTION_ENHANCEMENT_TODO.md)**
  - Tamamlanan görevler
  - Devam eden geliştirmeler
  - Gelecek planları

---

## 🏗️ **Sistem Mimarisi**

```
📱 Mobile App / 🌐 Web Site
         ↓
    📊 Analytics Tracking
         ↓
    🔧 Backend API (Node.js + Express)
         ↓
    📊 Analytics Services
         ↓
    🗄️ Elasticsearch Database
         ↓
    📊 Admin Dashboard (React)
```

---

## 🔧 **Tamamlanan Özellikler**

### ✅ **Phase 1: Performance Monitoring**
- [x] System metrics (CPU, Memory, Uptime)
- [x] API performance tracking
- [x] Elasticsearch monitoring
- [x] Real-time dashboard
- [x] Performance alerts

### ✅ **Phase 2: User Journey Tracking**
- [x] User behavior tracking
- [x] Journey analysis
- [x] Drop-off point detection
- [x] Engagement scoring
- [x] Optimization recommendations

### ✅ **Phase 3: Analytics Alerts**
- [x] Custom alert rules
- [x] Email notifications
- [x] Slack integration
- [x] Alert lifecycle management
- [x] Alert summary dashboard

### 🔄 **Phase 4: Data Export** (Devam Ediyor)
- [ ] CSV export
- [ ] JSON export
- [ ] Excel reports
- [ ] Scheduled exports

---

## 📊 **Kullanım Örnekleri**

### **1. Performance Monitoring**
```javascript
// System metrics
{
  "cpu_usage": 25.5,
  "memory_usage": 99.9,
  "api_response_time": 150,
  "error_rate": 0.5
}
```

### **2. User Journey**
```javascript
// User behavior
{
  "total_journeys": 1250,
  "conversion_rate": 25.5,
  "drop_off_points": [
    {
      "page_name": "Search",
      "drop_off_rate": 30.0
    }
  ]
}
```

### **3. Alerts**
```javascript
// Alert summary
{
  "active_alerts": 2,
  "critical_alerts": 1,
  "alerts_by_severity": {
    "critical": 1,
    "high": 1
  }
}
```

---

## 🚨 **Alert Örnekleri**

### **System Alerts**
```
🚨 CRITICAL: Memory usage %99
⚠️ Server çökebilir!
🔧 Hemen RAM ekle veya restart et
```

### **Business Alerts**
```
🚨 HIGH: Bugün sadece 10 ilan oluşturuldu
📍 Normal: Günde 100 ilan
🔧 Reklamları kontrol et
```

### **Performance Alerts**
```
🚨 MEDIUM: API response time 2000ms
📍 Kullanıcılar bekleyip ayrılıyor
🔧 Database query'leri optimize et
```

---

## 🔧 **Geliştirme**

### **Yeni Özellik Ekleme**
1. Service dosyasını oluştur (`packages/admin-backend/src/services/`)
2. Route dosyasını oluştur (`packages/admin-backend/src/routes/`)
3. API service'i güncelle (`packages/admin-ui/src/services/api.ts`)
4. Test et ve dokümantasyonu güncelle

### **Deployment**
```bash
# Build
cd packages/admin-backend && pnpm build

# Restart
pm2 restart ecosystem.config.js --only admin-backend

# Check status
pm2 status
```

---

## 📞 **Destek**

### **Ekip İletişimi**
- **Backend Geliştirme**: Backend ekibi
- **Frontend Geliştirme**: Frontend ekibi
- **DevOps**: DevOps ekibi
- **Product**: Product ekibi

### **Yararlı Komutlar**
```bash
# Service durumu
pm2 status

# Log görüntüleme
pm2 logs admin-backend

# Sistem izleme
pm2 monit

# Elasticsearch kontrolü
curl -X GET "http://209.227.228.96:9200/_cluster/health"
```

---

## 📈 **Gelecek Planları**

### **Kısa Vadeli (1-2 Hafta)**
- [ ] Data Export sistemi tamamlama
- [ ] Email notification konfigürasyonu
- [ ] Dashboard UI iyileştirmeleri

### **Orta Vadeli (1-2 Ay)**
- [ ] Machine Learning entegrasyonu
- [ ] Predictive analytics
- [ ] Advanced reporting

### **Uzun Vadeli (3-6 Ay)**
- [ ] Real-time collaboration
- [ ] Advanced visualization
- [ ] AI-powered insights

---

## 🎯 **Sonuç**

Benalsam Analytics sistemi, modern web uygulamaları için gerekli olan tüm monitoring ve analytics özelliklerini sağlar:

- ✅ **Proaktif Monitoring**: Sorunları önceden tespit eder
- ✅ **User Experience**: Kullanıcı davranışlarını anlar
- ✅ **Business Intelligence**: İş kararlarını destekler
- ✅ **Performance Optimization**: Sistem performansını artırır

---

*Bu dokümantasyon sürekli güncellenmektedir. Son güncelleme: 29 Temmuz 2025* 