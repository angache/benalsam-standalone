# ✅ Sentry API Entegrasyonu - Kurulum Tamamlandı

## 📋 Yapılanlar

1. ✅ Sentry API token oluşturuldu
2. ✅ Sentry API client oluşturuldu (`src/services/sentryApi.ts`)
3. ✅ Backend endpoint'leri güncellendi (`src/routes/sentry.ts`)

## 🔧 Yapılması Gerekenler

### 1. Environment Variables Ekle

**ÖNEMLİ:** Environment variables'ı **admin-backend** projesine ekle, **web-next** projesine değil!

`.env` dosyasına şu satırları ekle (`benalsam-admin-backend/.env`):

```env
# Sentry REST API Configuration (for Admin Dashboard)
SENTRY_ORG_SLUG=your-org-slug
SENTRY_PROJECT_SLUG=your-project-slug
SENTRY_AUTH_TOKEN=your-sentry-auth-token-here
```

### 2. Admin Backend'i Başlat

```bash
cd benalsam-admin-backend
npm run dev
```

### 3. Admin UI'ı Başlat

```bash
cd benalsam-admin-ui
npm run dev
```

### 4. Test Et

1. Admin UI'a giriş yap: http://localhost:3003
2. Sentry Dashboard sayfasına git
3. Verilerin gelip gelmediğini kontrol et

## 📊 Endpoint'ler

Backend endpoint'leri şunlar:
- `GET /api/v1/sentry/metrics` - Metrics overview
- `GET /api/v1/sentry/errors` - Error list
- `GET /api/v1/sentry/performance` - Performance data
- `GET /api/v1/sentry/releases` - Release health

## ⚠️ Not

Environment variables'ı **web-next** projesine değil, **admin-backend** projesine eklemeniz gerekiyor!

