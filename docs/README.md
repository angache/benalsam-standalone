# 📚 Benalsam Projesi - Dokümantasyon

Bu klasör, Benalsam projesinin tüm dokümantasyonunu içerir.

## 📁 Klasör Yapısı

### 🏗️ **project/**
Proje ile ilgili ana dokümantasyon:
- `PROJECT_STANDARDS.md` - Proje standartları ve kurallar
- `PROJECT_SUMMARY.md` - Proje özeti ve genel bakış
- `PRIVACY_POLICY.md` - Gizlilik politikası
- `CHANGELOG.md` - Proje değişiklik geçmişi

### 📖 **guides/**
Geliştirme rehberleri ve nasıl yapılır dokümantasyonu:
- `DOCKER_GUIDE.md` - Docker kullanım rehberi (Standalone projeler için güncellenmiş)
- `PM2_SETUP.md` - PM2 kurulum ve kullanım
- `PM2_DEVELOPMENT_GUIDE.md` - PM2 geliştirme rehberi
- `QUICK_START.md` - Hızlı başlangıç rehberi
- `LERNA_PNPM_MONOREPO.md` - Lerna ve pnpm monorepo rehberi (Deprecated)
- `ENV_QUICK_REFERENCE.md` - Environment hızlı referans
- `ENVIRONMENT_CONFIGURATION.md` - Environment konfigürasyonu
- `ERROR_BOUNDARY_README.md` - Error boundary kullanımı
- `FIREBASE_DISTRIBUTION.md` - Firebase dağıtım rehberi
- `MIGRATION_GUIDE.md` - Migration rehberi
- `MIGRATION_INSTRUCTIONS.md` - Migration talimatları
- `TESTING_README.md` - Test yazma rehberi

### 📋 **todos/**
TODO dosyaları ve planlama dokümantasyonu:
- `ANALYTICS_REPORT_PLAN.md` - Analytics rapor planı
- `ELASTICSEARCH_PRODUCTION_DEPLOYMENT_TODO.md` - Elasticsearch production TODO
- `TODO_YARIN.md` - Yarınki TODO'lar
- `TYPE_CONSISTENCY_TODO.md` - Type consistency TODO
- `AI_USAGE_SYSTEM_CHANGES.md` - AI kullanım sistemi değişiklikleri
- `CACHE_SYSTEM_TODO.md` - Cache sistemi TODO
- `RESPONSIVE_TODO.md` - Responsive tasarım TODO
- `TODO.md` - Genel TODO listesi

### 🏛️ **architecture/**
Mimari dokümantasyonu:
- `DATABASE_SCHEMA_DOCUMENTATION.md` - Veritabanı şeması
- `DEVELOPMENT_SETUP_GUIDE.md` - Geliştirme kurulum rehberi
- `MOBILE_APP_DOCUMENTATION.md` - Mobile app dokümantasyonu
- `MONOREPO_GUIDE.md` - Monorepo rehberi (Deprecated - Standalone yapıya geçildi)
- `SECURITY_DOCUMENTATION.md` - Güvenlik dokümantasyonu
- `SHARED_TYPES_GUIDE.md` - Shared types rehberi (NPM Package olarak güncellenmiş)
- `SHARED_TYPES_INTEGRATION.md` - Shared types entegrasyonu (NPM Package olarak güncellenmiş)

### 🚀 **deployment/**
Deployment dokümantasyonu:
- `ADMIN_PANEL_DEPLOYMENT_GUIDE.md` - Admin panel deployment (Standalone projeler için güncellenmiş)
- `DEPLOYMENT_GUIDE.md` - Genel deployment rehberi (Standalone projeler için güncellenmiş)
- `DOCKER_SETUP_HOWTO.md` - Docker kurulum nasıl yapılır (Standalone projeler için güncellenmiş)
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Production deployment (Standalone projeler için güncellenmiş)
- `VPS_DEPLOYMENT_COMPLETE_GUIDE.md` - VPS deployment tam rehber (Standalone projeler için güncellenmiş)
- `VPS_ENVIRONMENT_SETUP.md` - VPS environment kurulumu
- `VPS_PM2_SETUP.md` - VPS PM2 kurulumu
- `VPS_PNPM_SETUP.md` - VPS pnpm kurulumu (Deprecated - npm kullanılıyor)
- `VPS_QUICK_START.md` - VPS hızlı başlangıç
- `vps-migration/` - VPS migration dosyaları

### 🔧 **api/**
API dokümantasyonu:
- `API_DOCUMENTATION_NEW.md` - Yeni API dokümantasyonu
- `API_DOCUMENTATION.md` - API dokümantasyonu
- `ELASTICSEARCH_API_ARCHITECTURE.md` - Elasticsearch API mimarisi
- `ELASTICSEARCH_API_DECISION.md` - Elasticsearch API kararları

### ⚡ **features/**
Özellik dokümantasyonu:
- `ADMIN_RBAC_QUICK_START.md` - Admin RBAC hızlı başlangıç
- `ADMIN_ROLE_BASED_ACCESS_CONTROL.md` - Admin role-based access control
- `ELASTICSEARCH_IMPLEMENTATION_GUIDE.md` - Elasticsearch implementasyon rehberi
- `ELASTICSEARCH_INTEGRATION_STRATEGY.md` - Elasticsearch entegrasyon stratejisi
- `ELASTICSEARCH_PRODUCTION_DEPLOYMENT_GUIDE.md` - Elasticsearch production deployment
- `ELASTICSEARCH_SEARCH_SYSTEM_GUIDE.md` - Elasticsearch arama sistemi rehberi
- `ELASTICSEARCH_SEARCH_SYSTEM_REPORT.md` - Elasticsearch arama sistemi raporu
- `ELASTICSEARCH_TURKISH_SEARCH_INTEGRATION.md` - Elasticsearch Türkçe arama entegrasyonu
- `ELASTICSEARCH_USAGE_EXAMPLES.md` - Elasticsearch kullanım örnekleri
- `INVENTORY_SYSTEM_DOCUMENTATION.md` - Inventory sistemi dokümantasyonu
- `TODO_WEB_ADMIN_INTEGRATION.md` - Web admin entegrasyon TODO
- `WEB_ADMIN_INTEGRATION_DOCUMENTATION.md` - Web admin entegrasyon dokümantasyonu

### 🧪 **testing/**
Test dokümantasyonu:
- `README.md` - Test dokümantasyonu ana sayfası

### 🗑️ **deprecated/**
Eski dokümantasyon (artık kullanılmıyor):
- `CTO_TECHNICAL_AUDIT_REPORT.md` - CTO teknik audit raporu
- `ELASTICSEARCH_SIMPLE_SCENARIO.md` - Elasticsearch basit senaryo
- `ELASTICSEARCH_TIMING_ANALYSIS.md` - Elasticsearch zamanlama analizi
- `ELASTICSEARCH_TODO.md` - Elasticsearch TODO
- `README.md` - Deprecated dokümantasyon açıklaması
- `TECHNOLOGY_BEST_PRACTICES_AUDIT.md` - Teknoloji en iyi uygulamalar audit'i
- `TODO_COMPLETION_REPORT.md` - TODO tamamlama raporu
- `VPS_ELASTICSEARCH_SETUP.md` - VPS Elasticsearch kurulumu
- `WEB_ADMIN_BACKEND_INTEGRATION.md` - Web admin backend entegrasyonu

## 🔍 Hızlı Başlangıç

### Yeni Geliştirici İçin:
1. `project/PROJECT_SUMMARY.md` - Proje genel bakışını incele (Standalone yapı için güncellenmiş)
2. `architecture/DEVELOPMENT_SETUP_GUIDE.md` - Geliştirme ortamını kur
3. `guides/DOCKER_GUIDE.md` - Docker kullanımı (Standalone projeler için)
4. `guides/PM2_SETUP.md` - PM2 kurulumunu yap

### Deployment İçin:
1. `deployment/DEPLOYMENT_GUIDE.md` - Genel deployment rehberi (Standalone projeler için güncellenmiş)
2. `deployment/VPS_DEPLOYMENT_COMPLETE_GUIDE.md` - VPS deployment (Standalone projeler için güncellenmiş)
3. `guides/DOCKER_GUIDE.md` - Docker kullanımı (Standalone projeler için güncellenmiş)

### API Geliştirme İçin:
1. `api/API_DOCUMENTATION_NEW.md` - API dokümantasyonu
2. `features/ELASTICSEARCH_IMPLEMENTATION_GUIDE.md` - Elasticsearch implementasyonu

### Standalone Proje Yapısı İçin:
1. Her proje bağımsız repository olarak çalışır
2. `npm` package manager kullanılır (pnpm yerine)
3. Her proje kendi `.env` dosyasına sahiptir
4. Shared types NPM package olarak yayınlanmıştır

---

**Son Güncelleme:** 2025-01-09  
**Toplam Doküman:** 69 dosya  
**Kategoriler:** 8 ana kategori