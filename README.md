# Benalsam Standalone Projects

Modern, scalable alım ilanları platformu - Monorepo'dan standalone projelere geçiş sonrası yapı.

## 📦 Projects

| Project | Description | Port | Status |
|---------|-------------|------|--------|
| **📱 mobile/** | React Native/Expo Mobile App | 8081 | ✅ Working |
| **🔧 admin-backend/** | Node.js Admin API | 3002 | ✅ Working |
| **🎛️ admin-ui/** | React Admin Dashboard | 3003 | ✅ Working |
| **🌐 web/** | React Web Application | 5173 | ✅ Working |
| **🚀 queue-service/** | Bull Queue Microservice | 3004 | ✅ Working |
| **📦 shared-types/** | NPM Package for Shared Types | - | ✅ Published |
| **🏗️ infrastructure/** | Docker Compose (Redis + ES) | VPS | ✅ Running |

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ versiyonu
- **npm** 9+ versiyonu
- **Docker** (infrastructure için)
- **Expo CLI** (mobile development için)

### Development Setup

#### 1. Infrastructure (VPS)
```bash
cd infrastructure
docker-compose up -d
```

#### 2. Admin Backend
```bash
cd admin-backend
npm install
npm run dev
```

#### 3. Admin UI
```bash
cd admin-ui
npm install
npm run dev
```

#### 4. Web App
```bash
cd web
npm install
npm run dev
```

#### 5. Queue Service
```bash
cd benalsam-queue-service
npm install
npm run dev
```

#### 6. Mobile App
```bash
cd mobile
npm install
npx expo start
```

## 🔧 Environment Configuration

### VPS Infrastructure
- **Redis**: `209.227.228.96:6379`
- **Elasticsearch**: `209.227.228.96:9200`

### Local Development
Her proje kendi `.env` dosyasına sahiptir:

```bash
# Admin Backend (.env)
REDIS_HOST=209.227.228.96
REDIS_URL=redis://209.227.228.96:6379
ELASTICSEARCH_URL=http://209.227.228.96:9200

# Mobile App (.env)
EXPO_PUBLIC_ADMIN_BACKEND_URL=http://192.168.1.6:3002
```

## 📚 Documentation

- **📖 [Project Standards](./docs/project/PROJECT_STANDARDS.md)** - Proje kuralları ve standartları
- **🏗️ [Architecture](./docs/architecture/)** - Sistem mimarisi
- **🚀 [Deployment](./docs/deployment/)** - Deployment rehberleri
- **📋 [TODO](./todos/)** - Aktif görevler ve planlar

### 🚨 **ENDPOINT DOKÜMANTASYON KURALLARI**

**Bu kurallar tüm projeler için geçerlidir ve mutlaka uygulanmalıdır:**

#### ✅ **ZORUNLU KURALLAR:**

1. **Endpoint Çalıştırmadan Önce:**
   - Her projenin kendi `API_ENDPOINTS.md` dosyasından endpoint'in varlığını kontrol et
   - Endpoint'in ne yaptığını ve auth gereksinimlerini oku
   - Dokümantasyonda olmayan endpoint'leri çalıştırma

2. **Yeni Endpoint Eklendiğinde:**
   - İlgili projenin `API_ENDPOINTS.md` dosyasını güncelle
   - Endpoint'i doğru kategoriye ekle
   - Auth gereksinimlerini belirt
   - Changelog'a ekle

3. **Endpoint Kaldırıldığında:**
   - İlgili projenin `API_ENDPOINTS.md` dosyasından kaldır
   - Changelog'a ekle
   - Kullanıcıları bilgilendir

4. **Endpoint Değiştirildiğinde:**
   - İlgili projenin `API_ENDPOINTS.md` dosyasını güncelle
   - Değişiklikleri changelog'a ekle
   - Breaking change'leri belirt

#### 🚫 **YASAK OLANLAR:**

- ❌ Dokümantasyonda olmayan endpoint'leri çalıştırma
- ❌ Endpoint ekleme/kaldırma sonrası dokümantasyonu güncellememe
- ❌ Saçma endpoint'ler çalıştırma
- ❌ Endpoint'lerin ne yaptığını belirtmeden ekleme

#### 📋 **PROJE BAZINDA DOKÜMANTASYON:**

- **Admin Backend**: `admin-backend/API_ENDPOINTS.md`
- **Queue Service**: `benalsam-queue-service/API_ENDPOINTS.md`
- **Web App**: `web/API_ENDPOINTS.md` (gerekirse)
- **Mobile App**: `mobile/API_ENDPOINTS.md` (gerekirse)

#### 🔄 **GÜNCELLEME SÜRECİ:**

1. Endpoint değişikliği yap
2. İlgili projenin `API_ENDPOINTS.md` dosyasını güncelle
3. Changelog'a ekle
4. Commit mesajında belirt
5. PR açarken dokümantasyon güncellemesini kontrol et

**Bu kurallar her geliştirici için zorunludur ve proje kalitesini garanti eder! 🎯**

## 🔄 Migration from Monorepo

### What Changed
- **Monorepo → Standalone**: Her proje bağımsız repository
- **pnpm → npm**: Package manager değişikliği
- **Workspace → NPM Package**: Shared types artık NPM package
- **Docker**: Her proje kendi Dockerfile'ına sahip

### Benefits
- ✅ **Simplified Development**: Her proje bağımsız çalışır
- ✅ **Easy Deployment**: Projeler ayrı ayrı deploy edilebilir
- ✅ **Better Testing**: Her proje kendi test sürecine sahip
- ✅ **Reduced Complexity**: Docker sorunları çözüldü

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Admin UI      │    │   Web App       │
│   (React Native)│    │   (React)       │    │   (React)       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │    Admin Backend API      │
                    │      (Node.js)            │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │    Shared Types           │
                    │    (NPM Package)          │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Infrastructure          │
                    │   (Redis + Elasticsearch) │
                    └───────────────────────────┘
```

## 📊 Project Status

### ✅ Completed
- [x] Monorepo'dan standalone'a geçiş
- [x] Tüm projelerin çalışır durumda olması
- [x] VPS infrastructure kurulumu
- [x] Shared types NPM package
- [x] Environment configuration
- [x] Documentation update

### 🔄 In Progress
- [ ] CI/CD pipeline setup
- [ ] Production deployment
- [ ] Performance optimization
- [ ] Security audit

### 📋 Planned
- [ ] Microservices architecture
- [ ] Advanced analytics
- [ ] Real-time notifications
- [ ] Mobile app optimization

## 🤝 Contributing

1. **Branch Strategy**: `feature/project-name-description`
2. **Commit Convention**: `type(project): description`
3. **Code Review**: Her PR için review gerekli
4. **Testing**: Her proje kendi test sürecine sahip

## 📄 License

Bu proje özel geliştirme projesidir.

---

**Son Güncelleme:** 2025-08-11  
**Versiyon:** 2.0 (Standalone Yapı)  
**Durum:** Production Ready 