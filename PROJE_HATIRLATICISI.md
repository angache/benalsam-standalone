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
- **Test Sayfası:** `/performance-test` - Performance metrics test sayfası

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

### **İyileştirilmiş Metrics Collection:**
- **Timeout-based collection:** 15 saniye sonra force send
- **Minimum metrics:** En az 3 metric toplandığında gönder
- **Enhanced LCP tracking:** 5 saniye maxWaitTime
- **Real-time monitoring:** Console'da canlı metrics görüntüleme

## 🚀 **API Endpoints**

### **Trend Analysis:**
- `GET /api/v1/trends/analysis` - Trend analizi
- `GET /api/v1/trends/alerts` - Aktif alertler
- `POST /api/v1/trends/alerts/generate` - Alert oluştur
- `PUT /api/v1/trends/alerts/:id/resolve` - Alert çöz
- `GET /api/v1/trends/history/:route` - Route geçmişi (Yeni)
- `GET /api/v1/trends/summary` - Performance summary (Yeni)

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
- `src/utils/performance.ts` - Performance tracking (İyileştirildi)
- `src/hooks/useRoutePerformance.js` - Route performance
- `src/pages/PerformanceTestPage.jsx` - Performance test sayfası (Yeni)
- `src/config/performance.ts` - Performance configuration

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

### **4. Performance Tracking Kısıtlı**
**Sorun:** Sadece development ve admin için aktif
**Çözüm:** Normal kullanıcılar için %1 sampling rate (sistem yükü için)

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

### **4. Performance Test Sayfası:**
```
http://localhost:5173/performance-test
```
- **LCP Test:** Sayfa yükleme simülasyonu
- **FCP Test:** İlk içerik görüntüleme
- **CLS Test:** Layout shift simülasyonu
- **INP Test:** Kullanıcı etkileşimi simülasyonu
- **TTFB Test:** Otomatik ölçüm

### **Dashboard Test:**
```bash
# Admin UI'da dashboard'ı aç
http://localhost:3003/trend-analysis

# Real-time mode'u aktif et
# Auto refresh'i aç
# Charts'ları test et (Line, Bar, Pie)
# Route-specific analysis yap
```

## 🎯 **Sonraki Adımlar**

### **1. ✅ Eksik Metrics Tamamlama (TAMAMLANDI):**
- ✅ LCP, FCP, CLS metrics'lerinin web app'te tam ölçülmesi
- ✅ Sayfa yükleme sürelerini bekletme
- ✅ Kullanıcı etkileşimi için INP ölçümü
- ✅ Timeout-based collection sistemi
- ✅ Performance test sayfası oluşturuldu

### **2. ✅ Dashboard Geliştirme (TAMAMLANDI):**
- ✅ Real-time charts (Line, Bar, Pie charts)
- ✅ Interactive performance monitoring
- ✅ Real-time mode ve auto-refresh
- ✅ Historical data visualization
- ✅ Metrics breakdown charts
- ✅ Route-specific analysis
- ✅ Enhanced UI with icons and better layout

### **3. Alert Sistemi Geliştirme:**
- Email/Slack entegrasyonu
- Threshold ayarları
- Alert geçmişi

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

### **Performance Test:**
```bash
# Web app'te test sayfasını aç
http://localhost:5173/performance-test

# Console'da metrics'leri izle
# Network tab'da backend'e gönderilen data'yı kontrol et
```

### **Dashboard Test:**
```bash
# Admin UI'da dashboard'ı aç
http://localhost:3003/trend-analysis

# Real-time mode'u aktif et
# Auto refresh'i aç
# Charts'ları test et (Line, Bar, Pie)
# Route-specific analysis yap
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

### **Performance Tracking Configuration:**
```typescript
// Development: Her zaman aktif
// Admin/Moderator: Her zaman aktif
// Normal kullanıcılar: %1 sampling rate (sistem yükü için)
```

---

**✅ Not:** Bu sistem şu anda çalışır durumda. Web app'te sayfa ziyaretleri yapıldığında performance data otomatik olarak backend'e gönderiliyor ve Admin UI'da gerçek zamanlı olarak görüntüleniyor.

**🚀 Yeni Özellikler:**
- ✅ İyileştirilmiş performance tracking
- ✅ Timeout-based metrics collection
- ✅ Performance test sayfası
- ✅ Real-time metrics monitoring
- ✅ Enhanced LCP, FCP, CLS tracking
- ✅ Real-time dashboard charts
- ✅ Interactive performance monitoring
- ✅ Historical data visualization
- ✅ Route-specific analysis
- ✅ Enhanced UI with icons

**📅 Son Güncelleme:** Bu dosya projenin mevcut durumunu yansıtır ve gelecekteki geliştirmeler için referans olarak kullanılabilir.

---

## 🔄 **DEVAM EDEN İŞ: Console.log Migration (Client-Side)**

### **Durum:** ⏸️ YARIDA BIRAKILDI - DEVAM EDİLECEK

**Tarih:** 2025-01-XX  
**Branch:** `fix/project-improvements`  
**İşlem:** Client-side console.log migration (logger utility kullan)

### **Tamamlanan İşlemler:**
- ✅ **Services klasörü**: Tamamlandı (tüm console.log → logger)
- ✅ **CreateListing components**: Tamamlandı
- ✅ **createListingStore**: Tamamlandı
- ✅ **Components (diğer)**: Tamamlandı (17 dosya, 42 instance)
- ✅ **TypeScript hooks**: Tamamlandı (8 dosya, 27 instance)
- ✅ **JavaScript hooks**: Tamamlandı (15 dosya, 81 instance)
  - usePerformance.js (13 instance)
  - useCategoryCounts.js (12 instance)
  - useImageServiceWorker.js (13 instance)
  - useAIPerformanceAnalysis.js (9 instance)
  - usePerformanceMonitor.js (9 instance)
  - useRoutePerformance.js (5 instance)
  - useHomePageData.js (5 instance)
  - useErrorBoundary.js (3 instance)
  - useEditListingForm.js (3 instance)
  - useRecentCategories.js (2 instance)
  - useImageOptimization.js (2 instance)
  - useAppData.jsx (2 instance)
  - useTrustScore.js (1 instance)
  - usePreload.js (1 instance)
  - useListingDetail.js (1 instance)

### **İlerleme:**
- **Tamamlanan:** ~845/1083 match (~78%)
- **Kalan:**
  - **Utils klasörü:** ~129 instance
  - **App klasörü:** ~75 instance
  - **Lib klasörü:** ~24 instance

### **Son Commit:**
```bash
git log --oneline -1
# refactor: Fix remaining console.error in useHomePageData.js - Hooks folder migration complete ✅
```

### **Sonraki Adım:**
1. **Utils klasörüne geç** (~129 console.log instance)
2. **App klasörüne geç** (~75 console.log instance)
3. **Lib klasörüne geç** (~24 console.log instance)

### **Komutlar:**
```bash
# Hangi klasörde console.log kaldığını kontrol et
grep -r "console\.\(log\|error\|warn\|info\|debug\)" benalsam-web-next/src/utils --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l
grep -r "console\.\(log\|error\|warn\|info\|debug\)" benalsam-web-next/src/app --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l
grep -r "console\.\(log\|error\|warn\|info\|debug\)" benalsam-web-next/src/lib --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l

# Logger import pattern
import { logger } from '@/utils/production-logger'

# Migration pattern
# Before: console.log('Message', data)
# After: logger.debug('[ComponentName] Message', { data })
```

### **Notlar:**
- Logger utility hem client hem server tarafında çalışıyor
- Production'da loglar otomatik olarak devre dışı
- Development'ta structured logging kullanılıyor
- Her log mesajına component/service adı prefix ekleniyor
