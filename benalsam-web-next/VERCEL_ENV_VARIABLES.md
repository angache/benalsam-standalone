# 🔐 Vercel Environment Variables

Bu dosya Vercel'e deploy ederken eklenmesi gereken environment variable'ları listeler.

## 📋 Vercel Dashboard'da Eklenecek Variables

Vercel Dashboard → Project Settings → Environment Variables bölümüne aşağıdaki değişkenleri ekleyin:

### 🔴 Required (Zorunlu)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud3JlY2twZWVuaGJkdGFwbXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5OTgwNzAsImV4cCI6MjA2NTU3NDA3MH0.2lzsxTj4hoKTcZeoCGMsUC3Cmsm1pgcqXP-3j_GV_Ys

# Admin Backend API URL (Production - VPS'deki servislere işaret ediyor)
NEXT_PUBLIC_ADMIN_BACKEND_URL=https://api.benalsam.com/api/v1

# Admin Backend WebSocket URL (Production - VPS'deki servislere işaret ediyor)
NEXT_PUBLIC_ADMIN_BACKEND_WS_URL=wss://api.benalsam.com

# Microservice URLs (Production - VPS'deki servislere işaret ediyor)
# Not: Bu servisler Nginx reverse proxy üzerinden erişilebilir
NEXT_PUBLIC_LISTING_SERVICE_URL=https://api.benalsam.com/api/v1/listings
NEXT_PUBLIC_UPLOAD_SERVICE_URL=https://api.benalsam.com/api/v1/upload
NEXT_PUBLIC_SEARCH_SERVICE_URL=https://api.benalsam.com/api/v1/search

# Environment
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

### 🟡 Optional (İsteğe Bağlı)

```env
# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ADMIN_FEATURES=true
NEXT_PUBLIC_ENABLE_ANALYTICS_CHARTS=true
NEXT_PUBLIC_ENABLE_BULK_OPERATIONS=true

# Performance & Monitoring
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true

# Sentry Error Tracking (Optional)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_RELEASE=benalsam-web-next@1.0.0
NEXT_PUBLIC_SENTRY_ENABLE_DEV=false
```

### 🔒 Server-Only Variables (API Routes için)

Bu değişkenler sadece server-side (API routes) kullanılır ve browser'a expose edilmez:

```env
# Supabase Service Role Key (SECRET - Server-only)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Admin Backend JWT Secret (SECRET - Server-only)
ADMIN_BACKEND_JWT_SECRET=your-admin-backend-jwt-secret-here
```

## 📝 Vercel'de Ekleme Adımları

1. Vercel Dashboard'a gidin: https://vercel.com/dashboard
2. Projenizi seçin
3. **Settings** → **Environment Variables** bölümüne gidin
4. Her değişkeni ekleyin:
   - **Name**: Değişken adı (örn: `NEXT_PUBLIC_ADMIN_BACKEND_URL`)
   - **Value**: Değişken değeri (örn: `https://api.benalsam.com/api/v1`)
   - **Environment**: `Production`, `Preview`, `Development` (hepsini seçin)
5. **Save** butonuna tıklayın

## ⚠️ Önemli Notlar

1. **NEXT_PUBLIC_* Prefix**: Bu prefix'li değişkenler browser'a expose edilir. Secret'ları ASLA bu prefix ile başlatmayın!

2. **Server-Only Variables**: `SUPABASE_SERVICE_ROLE_KEY` ve `ADMIN_BACKEND_JWT_SECRET` gibi secret'lar sadece API routes'da kullanılır.

3. **Environment Selection**: Production, Preview ve Development için aynı değerleri kullanabilirsiniz veya farklı değerler ayarlayabilirsiniz.

4. **Deployment Sonrası**: Değişkenleri ekledikten sonra yeni bir deployment yapın (Vercel otomatik olarak yeniden deploy eder).

## 🔍 Test

Deployment sonrası environment variable'ları kontrol edin:

```bash
# Browser console'da (client-side)
console.log('API URL:', process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL)

# Server-side (API route'da)
console.log('JWT Secret:', process.env.ADMIN_BACKEND_JWT_SECRET)
```

## 📚 Daha Fazla Bilgi

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

