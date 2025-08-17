# 📋 **AI-Powered Performance Analysis System - Proje Hatırlatıcısı**

## 🎯 **Proje Özeti**
**AI-powered Performance Analysis System** - Web uygulamasının performansını gerçek zamanlı izleyen, trend analizi yapan ve akıllı alert sistemi sunan kapsamlı bir monitoring sistemi.

## 🏗️ **Sistem Mimarisi**

### **Backend (benalsam-admin-backend)**
- **Port:** 3002
- **Framework:** Express.js + TypeScript
- **Database:** Redis (performance data), Supabase (admin users)
- **Ana Servisler:**
  - `performanceTrendService.ts` - Trend analizi ve alert sistemi
  - `performanceMonitoringService.ts` - Real-time monitoring
  - `redisService.ts` - Redis bağlantısı

### **Frontend (benalsam-admin-ui)**
- **Port:** 3003
- **Framework:** React + TypeScript
- **UI Library:** Material-UI (MUI)
- **Ana Sayfa:** `/trend-analysis` - Performance Trend Analysis

### **Web App (benalsam-web)**
- **Port:** 5173
- **Framework:** React + Vite
- **Performance Tracking:** `performance.ts` - Core Web Vitals tracking

## 🚀 **Kurulum ve Çalıştırma**

### **Backend Başlatma:**
```bash
cd benalsam-admin-backend
pnpm install
pnpm run dev
```

### **Admin UI Başlatma:**
```bash
cd benalsam-admin-ui
pnpm install
pnpm run dev
```

### **Web App Başlatma:**
```bash
cd benalsam-web
pnpm install
pnpm run dev
```

## 🔐 **Authentication**

### **Admin Kullanıcı:**
- **Email:** admin@benalsam.com
- **Role:** SUPER_ADMIN
- **2FA:** Disabled (test için)

### **JWT Token Alımı:**
```bash
curl -X POST "http://localhost:3002/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@benalsam.com","password":"admin123456"}'
```

## 📊 **Performance Metrics**

### **Core Web Vitals:**
- **LCP (Largest Contentful Paint):** 0-2500ms = good
- **FCP (First Contentful Paint):** 0-1800ms = good
- **CLS (Cumulative Layout Shift):** 0-0.1 = good
- **INP (Interaction to Next Paint):** 0-200ms = good
- **TTFB (Time to First Byte):** 0-800ms = good

### **Score Hesaplama:**
- **100 puan** başlangıç
- Her metric için puan düşürme
- **85 puan** varsayılan (eksik metrics için)

## 🚀 **API Endpoints**

### **Trend Analysis:**
- `GET /api/v1/trends/analysis` - Trend analizi
- `GET /api/v1/trends/alerts` - Aktif alertler
- `POST /api/v1/trends/alerts/generate` - Alert oluştur
- `PUT /api/v1/trends/alerts/:id/resolve` - Alert çöz

### **Performance Data:**
- `POST /api/v1/trends/performance-data` - Web app'ten veri al
- `DELETE /api/v1/trends/performance-data` - Test verilerini temizle

### **Debug:**
- `GET /api/v1/trends/debug/keys` - Redis key'lerini listele
- `GET /api/v1/trends/debug/data/:route` - Route data'sını kontrol et

## 🔄 **Veri Akışı**

### **1. Web App → Backend:**
```
Web App (performance.ts) 
  → POST /api/v1/trends/performance-data
  → Redis (perf:data:*)
```

### **2. Backend → Admin UI:**
```
Redis (perf:data:*)
  → performanceTrendService.ts
  → Trend Analysis
  → Admin UI (/trend-analysis)
```

## 📁 **Önemli Dosyalar**

### **Backend:**
- `src/services/performanceTrendService.ts` - Ana trend analizi
- `src/routes/trendAnalysis.ts` - API endpoints
- `src/routes/performance.ts` - Performance analysis
- `src/services/redisService.ts` - Redis bağlantısı

### **Admin UI:**
- `src/pages/TrendAnalysis.tsx` - Ana trend sayfası
- `src/components/Layout/Sidebar.tsx` - Navigation
- `src/services/api.ts` - API client

### **Web App:**
- `src/utils/performance.ts` - Performance tracking
- `src/hooks/useRoutePerformance.js` - Route performance

## ⚠️ **Bilinen Sorunlar ve Çözümler**

### **1. Score: NaN Hatası**
**Sorun:** Backend'de score hesaplanamıyor
**Çözüm:** `calculatePerformanceScore` fonksiyonunda eksik metrics kontrolü eklendi

### **2. API Endpoint Çakışması**
**Sorun:** Çift `/api/v1` URL'de
**Çözüm:** Web app'te `API_ENDPOINT` düzeltildi

### **3. Trend Analysis'te Az Veri**
**Sorun:** Sadece TTFB ve INP var
**Çözüm:** Diğer metrics için varsayılan score (85) kullanılıyor

## 🧪 **Test Senaryoları**

### **1. Performance Data Gönderme:**
```bash
curl -X POST "http://localhost:3002/api/v1/trends/performance-data" \
  -H "Content-Type: application/json" \
  -d '{"route":"/test","metrics":{"lcp":1500,"fcp":800,"cls":0.05,"ttfb":200,"fid":100},"score":85}'
```

### **2. Trend Analysis Kontrolü:**
```bash
curl -X GET "http://localhost:3002/api/v1/trends/analysis" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Alert Oluşturma:**
```bash
curl -X POST "http://localhost:3002/api/v1/trends/alerts/generate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 **Sonraki Adımlar**

### **1. Eksik Metrics Tamamlama:**
- LCP, FCP, CLS metrics'lerinin web app'te tam ölçülmesi
- Sayfa yükleme sürelerini bekletme
- Kullanıcı etkileşimi için INP ölçümü

### **2. Alert Sistemi Geliştirme:**
- Email/Slack entegrasyonu
- Threshold ayarları
- Alert geçmişi

### **3. Dashboard Geliştirme:**
- Real-time charts
- Performance history
- Route-specific analytics

## 🔧 **Hızlı Komutlar**

### **Backend Restart:**
```bash
cd benalsam-admin-backend && pnpm run dev
```

### **Redis Temizleme:**
```bash
curl -X DELETE "http://localhost:3002/api/v1/trends/performance-data" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Debug Keys:**
```bash
curl -X GET "http://localhost:3002/api/v1/trends/debug/keys" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📝 **Önemli Notlar**

### **Threshold Değerleri:**
```typescript
TREND_THRESHOLDS = {
  degradation: -5,  // 5 puan düşüş
  improvement: 5,   // 5 puan artış
  critical: -10     // 10 puan düşüş
}
```

### **Redis Key Patterns:**
- `perf:data:*` - Güncel performance data
- `perf:history:*` - Geçmiş performance data
- `perf:trend:*` - Trend analizi sonuçları
- `perf:alert:*` - Alert verileri

### **CORS Ayarları:**
- Backend: `localhost:3003` whitelist'te
- Web App: `localhost:3002` backend'e bağlanıyor

---

**✅ Not:** Bu sistem şu anda çalışır durumda. Web app'te sayfa ziyaretleri yapıldığında performance data otomatik olarak backend'e gönderiliyor ve Admin UI'da gerçek zamanlı olarak görüntüleniyor.

**📅 Son Güncelleme:** Bu dosya projenin mevcut durumunu yansıtır ve gelecekteki geliştirmeler için referans olarak kullanılabilir.
