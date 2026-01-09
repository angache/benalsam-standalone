# 🔐 Environment Variables Documentation

> **Son Güncelleme:** 2025-01-XX  
> **Versiyon:** 1.0.0

Bu dokümantasyon Benalsam Web Next projesinin environment variable'larını açıklar.

---

## 📋 İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Required Variables](#required-variables)
3. [Optional Variables](#optional-variables)
4. [Environment Types](#environment-types)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Hızlı Başlangıç

### 1. `.env.example` Dosyası Oluştur

Proje root'unda `.env.example` dosyası oluşturun ve aşağıdaki içeriği ekleyin:

```bash
# benalsam-web-next/.env.example
cp ENV_VARIABLES.md .env.example  # Bu dosyadaki örnekleri kullanarak
```

### 2. `.env.local` Dosyası Oluştur

```bash
cp .env.example .env.local
# .env.local dosyasını düzenleyin ve gerçek değerleri girin
```

### 3. Gerekli Değerleri Doldurun

Aşağıdaki **Required Variables** bölümündeki tüm değişkenleri doldurun.

---

## 🔐 Required Variables

Bu değişkenler uygulamanın çalışması için **zorunludur**.

### Supabase Configuration

```env
# Supabase Project URL
# Get from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous Key (Public)
# Get from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Supabase Service Role Key (Server-only, SECRET)
# Get from: https://app.supabase.com/project/_/settings/api
# ⚠️ NEVER expose this to the client!
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
```

### Admin Backend Configuration

```env
# Admin Backend API URL
# Development: http://localhost:3002/api/v1
# Production: http://your-vps-ip:3002/api/v1
NEXT_PUBLIC_ADMIN_BACKEND_URL=http://localhost:3002/api/v1

# Admin Backend JWT Secret (Server-only, SECRET)
# Used for JWT token verification with admin backend
# ⚠️ NEVER expose this to the client!
ADMIN_BACKEND_JWT_SECRET=your-admin-backend-jwt-secret-here
```

### Environment Configuration

```env
# Application Environment
# Options: development, production, test
NEXT_PUBLIC_APP_ENV=development

# Node Environment (automatically set by Next.js)
# Options: development, production, test
NODE_ENV=development
```

---

## 🔧 Optional Variables

Bu değişkenler **isteğe bağlıdır** ve varsayılan değerlerle çalışır.

### Payment Configuration (Optional - Mock Mode Default)

```env
# Payment Provider
# Options: mock, stripe, iyzico
# Default: mock (development mode - no real payment required)
PAYMENT_PROVIDER=mock

# Stripe Configuration (Only if PAYMENT_PROVIDER=stripe)
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...  # Server-only, SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Client-safe

# İyzico Configuration (Only if PAYMENT_PROVIDER=iyzico)
# Get from: https://dev.iyzipay.com/tr
IYZICO_API_KEY=your-iyzico-api-key  # Server-only, SECRET
IYZICO_SECRET_KEY=your-iyzico-secret-key  # Server-only, SECRET
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com  # Sandbox for testing
```

**Payment Provider Notes:**
- **Mock Mode (Default)**: No real payment accounts needed. Perfect for development/testing.
- **Stripe**: International payments. Set `PAYMENT_PROVIDER=stripe` and add Stripe keys.
- **İyzico**: Turkish market payments. Set `PAYMENT_PROVIDER=iyzico` and add İyzico keys.

### Feature Flags

```env
# Enable/disable analytics tracking
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Enable/disable admin features
NEXT_PUBLIC_ENABLE_ADMIN_FEATURES=true

# Enable/disable analytics charts
NEXT_PUBLIC_ENABLE_ANALYTICS_CHARTS=true

# Enable/disable bulk operations
NEXT_PUBLIC_ENABLE_BULK_OPERATIONS=true
```

### Performance & Monitoring

```env
# Enable performance monitoring (Web Vitals)
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=false

# Enable error tracking
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=false

# Sentry DSN (for error tracking)
# Get from: https://sentry.io/settings/projects/
NEXT_PUBLIC_SENTRY_DSN=
```

### Microservices Configuration (Optional)

Bu değişkenler sadece local microservices kullanıyorsanız gereklidir.

```env
# Upload Service
# NEXT_PUBLIC_UPLOAD_SERVICE_URL=http://localhost:3007/api/v1

# Listing Service
# NEXT_PUBLIC_LISTING_SERVICE_URL=http://localhost:3008/api/v1

# Search Service (Elasticsearch)
# NEXT_PUBLIC_SEARCH_SERVICE_URL=http://localhost:3016/api/v1

# Elasticsearch Service
# NEXT_PUBLIC_ELASTICSEARCH_SERVICE_URL=http://localhost:3006/api/v1

# Categories Service
# NEXT_PUBLIC_CATEGORIES_SERVICE_URL=http://localhost:3015/api/v1

# Cache Service
# NEXT_PUBLIC_CACHE_SERVICE_URL=http://localhost:3014/api/v1
```

---

## 🌍 Environment Types

### Development

```env
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_ADMIN_BACKEND_URL=http://localhost:3002/api/v1
```

### Production

```env
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_ADMIN_BACKEND_URL=http://your-vps-ip:3002/api/v1
```

### Testing

```env
NODE_ENV=test
NEXT_PUBLIC_APP_ENV=test
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_ADMIN_BACKEND_URL=http://localhost:3002/api/v1
```

---

## 🔒 Security Best Practices

### 1. **NEXT_PUBLIC_* Variables**

- `NEXT_PUBLIC_*` prefix'li değişkenler **browser'a expose edilir**
- Bu değişkenler client-side JavaScript bundle'ına dahil edilir
- ⚠️ **ASLA** secret'ları `NEXT_PUBLIC_*` ile başlatmayın!

### 2. **Server-only Variables**

- `NEXT_PUBLIC_` prefix'i olmayan değişkenler sadece **server-side** erişilebilir
- API routes ve Server Components'te kullanılabilir
- Örnekler: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_BACKEND_JWT_SECRET`

### 3. **Secret Management**

- ✅ `.env.local` dosyasını **ASLA** commit etmeyin
- ✅ Development ve production için **farklı secret'lar** kullanın
- ✅ Secret'ları **düzenli olarak rotate** edin
- ✅ `.gitignore` dosyasında `.env*` pattern'i olduğundan emin olun

### 4. **Environment-specific Values**

- Development: `localhost` URL'leri kullanın
- Production: Production URL/IP'leri kullanın
- Staging: Staging environment değerlerini kullanın

---

## 📝 Complete .env.example Template

Aşağıdaki template'i kopyalayıp `.env.example` dosyası olarak kaydedin:

```env
# ============================================================================
# BENALSAM WEB NEXT - ENVIRONMENT VARIABLES
# ============================================================================
# Copy this file to .env.local and fill in your values
# cp .env.example .env.local

# ============================================================================
# 🔐 REQUIRED VARIABLES
# ============================================================================

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Admin Backend Configuration
NEXT_PUBLIC_ADMIN_BACKEND_URL=http://localhost:3002/api/v1
ADMIN_BACKEND_JWT_SECRET=your-admin-backend-jwt-secret-here

# Environment Configuration
NEXT_PUBLIC_APP_ENV=development
NODE_ENV=development

# ============================================================================
# 🔧 OPTIONAL VARIABLES
# ============================================================================

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_ADMIN_FEATURES=true
NEXT_PUBLIC_ENABLE_ANALYTICS_CHARTS=true
NEXT_PUBLIC_ENABLE_BULK_OPERATIONS=true

# Performance & Monitoring
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=false
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=false
NEXT_PUBLIC_SENTRY_DSN=

# ============================================================================
# 🔌 MICROSERVICES CONFIGURATION (Optional)
# ============================================================================
# NEXT_PUBLIC_UPLOAD_SERVICE_URL=http://localhost:3007/api/v1
# NEXT_PUBLIC_LISTING_SERVICE_URL=http://localhost:3008/api/v1
# NEXT_PUBLIC_SEARCH_SERVICE_URL=http://localhost:3016/api/v1
# NEXT_PUBLIC_ELASTICSEARCH_SERVICE_URL=http://localhost:3006/api/v1
# NEXT_PUBLIC_CATEGORIES_SERVICE_URL=http://localhost:3015/api/v1
# NEXT_PUBLIC_CACHE_SERVICE_URL=http://localhost:3014/api/v1
```

---

## 🔍 Troubleshooting

### Missing Environment Variables

Eğer uygulama başlatılırken environment variable hatası alıyorsanız:

1. `.env.local` dosyasının proje root'unda olduğundan emin olun
2. Tüm **Required Variables** bölümündeki değişkenlerin doldurulduğunu kontrol edin
3. Değişken isimlerinin doğru yazıldığından emin olun (büyük/küçük harf duyarlı)
4. Next.js development server'ı yeniden başlatın

### Server-only Variables Not Working

Eğer server-only variable'lara erişemiyorsanız:

1. Değişkenin `NEXT_PUBLIC_` prefix'i **olmamalı**
2. Sadece API routes ve Server Components'te kullanılabilir
3. Client Components'te kullanılamaz

### Environment Variables Not Updating

Değişkenleri güncelledikten sonra:

1. Next.js development server'ı **yeniden başlatın**
2. Browser cache'ini temizleyin
3. `.env.local` dosyasının doğru konumda olduğundan emin olun

---

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Configuration](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Son Güncelleme:** 2025-01-XX

