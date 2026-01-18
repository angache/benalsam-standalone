# 🔐 Vercel Environment Variables

Bu dosya Vercel'e deploy ederken eklenmesi gereken environment variable'ları listeler.

**Son Güncelleme**: 18 Ocak 2026

## 📋 Vercel Dashboard'da Eklenecek Variables

Vercel Dashboard → Project Settings → Environment Variables bölümüne aşağıdaki değişkenleri ekleyin:

### 🔴 Required (Zorunlu)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud3JlY2twZWVuaGJkdGFwbXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5OTgwNzAsImV4cCI6MjA2NTU3NDA3MH0.2lzsxTj4hoKTcZeoCGMsUC3Cmsm1pgcqXP-3j_GV_Ys

# VPS Services Flag
NEXT_PUBLIC_USE_VPS_SERVICES=true

# API URLs (Production - VPS)
NEXT_PUBLIC_API_URL=https://api.benalsam.com/api/v1/admin
NEXT_PUBLIC_API_BASE_URL=https://api.benalsam.com
NEXT_PUBLIC_ADMIN_BACKEND_URL=https://api.benalsam.com/api/v1/admin
NEXT_PUBLIC_ADMIN_BACKEND_WS_URL=wss://api.benalsam.com

# Microservice URLs (Production - VPS)
NEXT_PUBLIC_CATEGORIES_SERVICE_URL=https://api.benalsam.com/api/v1/categories
NEXT_PUBLIC_SEARCH_SERVICE_URL=https://api.benalsam.com/api/v1/search
NEXT_PUBLIC_UPLOAD_SERVICE_URL=https://api.benalsam.com/api/v1/upload
NEXT_PUBLIC_LISTING_SERVICE_URL=https://api.benalsam.com/api/v1/listings
NEXT_PUBLIC_ELASTICSEARCH_URL=https://api.benalsam.com/api/v1/elasticsearch
NEXT_PUBLIC_ELASTICSEARCH_PUBLIC_URL=https://api.benalsam.com/api/v1/elasticsearch

# Environment
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

### 🔒 Server-Only Variables (SECRET - Kritik!)

Bu değişkenler sadece server-side (API routes) kullanılır ve browser'a expose edilmez:

```env
# Supabase Service Role Key (SECRET - Server-only)
# ⚠️ Bu key çok hassas! Sadece Vercel'de ekleyin, asla client'a expose etmeyin!
SUPABASE_SERVICE_ROLE_KEY=<supabase-dashboard-api-settings-service_role-secret>
```

**Bu key'i almak için:**
1. https://supabase.com/dashboard adresine git
2. Projeyi seç
3. **Settings** → **API**
4. **Project API keys** bölümünde `service_role` (secret) kısmını kopyala

### 🟡 Optional (İsteğe Bağlı)

```env
# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ADMIN_FEATURES=true

# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_RELEASE=benalsam-web-next@1.0.0
NEXT_PUBLIC_SENTRY_ENABLE_DEV=false
```

## 📝 Vercel'de Ekleme Adımları

1. Vercel Dashboard'a gidin: https://vercel.com/dashboard
2. Projenizi seçin
3. **Settings** → **Environment Variables** bölümüne gidin
4. Her değişkeni ekleyin:
   - **Name**: Değişken adı (örn: `NEXT_PUBLIC_API_URL`)
   - **Value**: Değişken değeri
   - **Environment**: `Production`, `Preview`, `Development` (hepsini seçin)
5. **Save** butonuna tıklayın

## ⚠️ Önemli Notlar

### 1. NEXT_PUBLIC_* Prefix
- Bu prefix'li değişkenler **browser'a expose edilir**
- Secret'ları ASLA bu prefix ile başlatmayın!

### 2. Server-Only Variables
- `SUPABASE_SERVICE_ROLE_KEY` gibi secret'lar sadece API routes'da kullanılır
- Browser'da erişilemez (güvenli)

### 3. Environment Selection
- Production, Preview ve Development için aynı değerleri kullanabilirsiniz
- Preview deployments için farklı değerler ayarlayabilirsiniz

### 4. Deployment Sonrası
- Değişkenleri ekledikten sonra yeni bir deployment yapın
- Vercel değişiklik algıladığında otomatik redeploy eder

## 🔍 Test

### Browser Console'da (client-side)
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
// Output: https://api.benalsam.com/api/v1/admin
```

### Server-side (API route'da)
```javascript
console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY)
// Output: eyJhbGciOiJIUzI1NiIs... (sadece server'da görünür)
```

## 📚 Daha Fazla Bilgi

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Son Güncelleme**: 18 Ocak 2026
