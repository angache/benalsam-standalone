# 🌐 Web Admin Panel

Modern React tabanlı admin paneli - admin-backend ile tam entegre.

## 🚀 Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
pnpm install

# Geliştirme sunucusunu başlat
pnpm run dev

# Production build
pnpm run build

# Testleri çalıştır
pnpm run test:run
```

## 📋 Özellikler

### 🔐 Authentication & Security
- ✅ **JWT Authentication**: Güvenli giriş sistemi
- ✅ **User Management**: Admin kullanıcı yönetimi
- ✅ **Session Management**: Enterprise-level session logging
- ✅ **Security Audit**: Otomatik güvenlik kontrolleri

### 🔍 Search & Analytics
- ✅ **Turkish Search**: Elasticsearch Türkçe arama desteği
- ✅ **Real-time Analytics**: Canlı kullanıcı aktivite takibi
- ✅ **User Behavior Tracking**: Kullanıcı davranış analizi
- ✅ **Performance Metrics**: Sistem performans takibi

### 📊 Content Management
- ✅ **Listing Management**: İlan moderasyonu ve yönetimi
- ✅ **Analytics Dashboard**: Gerçek zamanlı analitik
- ✅ **Queue System**: PostgreSQL-based background processing
- ✅ **Elasticsearch Integration**: Advanced search capabilities

### 🎨 User Experience
- ✅ **Responsive Design**: Mobil uyumlu arayüz
- ✅ **Dark/Light Theme**: Tema desteği
- ✅ **Real-time Updates**: WebSocket entegrasyonu
- ✅ **Haptic Feedback**: Dokunsal geri bildirim

### ⚙️ Settings & Configuration
- ✅ **Ayarlar 2.0**: Modern responsive settings layout
  - Desktop: Sidebar navigation
  - Mobile: Compact single-page layout
  - Account settings (Profil, Güvenlik, Bildirimler)
  - Platform settings (Dil, Para Birimi, Tema)
  - Support settings (Yardım, İletişim, Geri Bildirim)

### 🛠️ Technical Excellence
- ✅ **TypeScript**: Tam tip güvenliği
- ✅ **Testing**: %90+ test coverage
- ✅ **Performance**: Optimized bundle size
- ✅ **Monitoring**: Sentry + Performance tracking

## 🛠️ Teknolojiler

### Frontend Stack
- **Framework**: React 18 + TypeScript + Vite
- **State Management**: React Query + Zustand
- **UI Components**: Material-UI + Framer Motion
- **Styling**: Tailwind CSS + CSS Modules

### Backend Integration
- **Admin Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Supabase) + Elasticsearch
- **Queue System**: PostgreSQL-based background processing
- **Search Engine**: Elasticsearch with Turkish analyzer

### Development Tools
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Build Tool**: Vite

### Monitoring & Analytics
- **Error Tracking**: Sentry integration
- **Performance**: Core Web Vitals monitoring
- **Analytics**: User behavior tracking
- **Security**: Automated security audits

## 📚 Dokümantasyon

Detaylı dokümantasyon için: [📖 Web Admin Integration Documentation](../docs/WEB_ADMIN_INTEGRATION_DOCUMENTATION.md)

## 🔧 Geliştirme

### Environment Variables
```bash
# .env.local
VITE_ADMIN_API_URL=http://localhost:3002/api/v1
VITE_ADMIN_WS_URL=ws://localhost:3002
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=your-sentry-dsn
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Komutlar
```bash
pnpm run dev          # Geliştirme sunucusu
pnpm run build        # Production build
pnpm run test:run     # Testleri çalıştır
pnpm run test:ui      # Test UI
pnpm run lint         # Linting
pnpm run type-check   # Type checking
pnpm run security-audit # Güvenlik audit
```

## 🔍 Elasticsearch Turkish Search

### Özellikler
- **Built-in Turkish Analyzer**: Native Elasticsearch Turkish analyzer
- **Location Field Optimization**: Text-based location mapping
- **Turkish Language Support**: Mükemmel Türkçe arama desteği
- **Search Performance**: ~130ms average response time

### Teknik Detaylar
- **Index Mapping**: Optimized field types ve analyzers
- **Connection Management**: Health check ve monitoring
- **Search Operations**: Turkish search support
- **Queue Integration**: PostgreSQL-based sync system

## 🔄 Queue System

### Background Processing
- **PostgreSQL Queue**: `elasticsearch_sync_queue` tablosu
- **Job Processing**: 5 saniye aralıklarla otomatik sync
- **Status Tracking**: pending, processing, completed, failed
- **Error Handling**: Retry mechanism ve error logging

### Queue Management
- **Job Statistics**: Real-time queue monitoring
- **Background Processing**: Interval-based job processing
- **Error Recovery**: Automatic retry mechanism
- **Health Monitoring**: Service status tracking

## 🎨 Ayarlar 2.0 - Yeni Özellik

### Responsive Layout
- **Desktop (1024px+)**: Sidebar navigation + content area
- **Mobile (<1024px)**: Compact single-page layout
- **Auto-resize**: Pencere boyutu değişiminde otomatik güncelleme

### Settings Categories
- **Hesap**: Profil, Güven Puanı, Güvenlik, Bildirimler, Gizlilik
- **Platform**: Dil, Para Birimi, Konum, Kategori, Tema, Sohbet Ayarları
- **Destek**: Yardım, İletişim, Geri Bildirim, Hakkında

### Technical Features
- **Route Structure**: Direct routes for better performance
- **Children Props**: Flexible component composition
- **Animation**: Smooth page transitions with Framer Motion
- **Active States**: Visual feedback for current page
- **Optimized Spacing**: Mobile-optimized padding (py-2)

## 🚀 Deployment

### Production Build
```bash
pnpm run build:prod
```

### CI/CD Pipeline
GitHub Actions ile otomatik deployment:
- ✅ Test çalıştırma
- ✅ Security audit
- ✅ Production build
- ✅ Deployment

## 📊 Monitoring

- **Error Tracking**: Sentry entegrasyonu
- **Performance**: Core Web Vitals monitoring
- **Analytics**: User behavior tracking
- **Security**: Automated security audits

## 🤝 Katkıda Bulunma

1. Feature branch oluştur
2. Kod yaz ve test et
3. Pull request aç
4. Code review bekle
5. Merge et

## 📞 Destek

- **Dokümantasyon**: [📖 Detaylı Dokümantasyon](../docs/WEB_ADMIN_INTEGRATION_DOCUMENTATION.md)
- **Issues**: GitHub Issues
- **Slack**: #web-admin

---

**Versiyon**: 2.0.0  
**Durum**: Production Ready ✅  
**Son Güncelleme**: 2025-01-09  
**Yeni Özellikler**: 
- ✅ Elasticsearch Turkish Search Integration
- ✅ PostgreSQL Queue System
- ✅ Ayarlar 2.0 Responsive Layout
- ✅ Real-time Analytics Dashboard 