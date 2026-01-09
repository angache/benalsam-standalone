# 🚀 Vercel Deployment Guide

**Tarih:** 9 Ocak 2025  
**Durum:** ✅ Hazır (Notlar ile)

---

## ✅ Vercel Deployment Hazırlığı

### 1. Proje Durumu

- ✅ Next.js 16.1.1 projesi
- ✅ Build script mevcut (`npm run build`)
- ✅ TypeScript yapılandırması
- ✅ Environment variables dokümante edilmiş
- ⚠️ **Not:** Build script'te `--turbopack` flag'i var, Vercel'de sorun olabilir

---

## 📋 Deployment Adımları

### Adım 1: Vercel Hesabı ve Proje Oluşturma

1. **Vercel'e giriş yapın**
   - https://vercel.com adresine gidin
   - GitHub/GitLab/Bitbucket hesabınızla giriş yapın

2. **Yeni proje oluşturun**
   - "Add New Project" butonuna tıklayın
   - Repository'nizi seçin
   - Root directory: `benalsam-web-next` olarak ayarlayın

### Adım 2: Build Ayarları

**Framework Preset:** Next.js  
**Root Directory:** `benalsam-web-next`  
**Build Command:** `npm run build` (Vercel otomatik algılar, ama kontrol edin)  
**Output Directory:** `.next` (Vercel otomatik algılar)  
**Install Command:** `npm install`

⚠️ **Önemli:** `package.json`'daki build script'te `--turbopack` flag'i var. Vercel'de bu sorun çıkarabilir. Eğer build hatası alırsanız, `package.json`'daki build script'i şu şekilde değiştirin:

```json
"build": "next build"
```

### Adım 3: Environment Variables

Vercel Dashboard > Project Settings > Environment Variables bölümüne aşağıdaki değişkenleri ekleyin:

#### 🔐 Required Variables (Production)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Admin Backend Configuration
NEXT_PUBLIC_ADMIN_BACKEND_URL=https://your-vps-ip:3002/api/v1
ADMIN_BACKEND_JWT_SECRET=your-admin-backend-jwt-secret-here

# Environment Configuration
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production

# Site URL (Vercel otomatik verir ama manuel de ayarlayabilirsiniz)
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

#### 🔧 Optional Variables

```env
# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ADMIN_FEATURES=true
NEXT_PUBLIC_ENABLE_ANALYTICS_CHARTS=true
NEXT_PUBLIC_ENABLE_BULK_OPERATIONS=true

# Performance & Monitoring
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true

# Payment Provider (Mock mode için şimdilik)
PAYMENT_PROVIDER=mock

# Sentry (opsiyonel)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
```

### Adım 4: Domain Ayarları (Opsiyonel)

1. Vercel Dashboard > Project Settings > Domains
2. Custom domain ekleyin (örn: `benalsam.com`)
3. DNS kayıtlarını yapılandırın

---

## ⚠️ Önemli Notlar

### 1. Turbopack Flag Sorunu

`package.json`'daki build script:
```json
"build": "next build --turbopack"
```

Vercel'de bu flag sorun çıkarabilir. Eğer build hatası alırsanız:

**Çözüm 1:** `package.json`'ı güncelleyin:
```json
"build": "next build"
```

**Çözüm 2:** Vercel Build Settings'te override edin:
- Build Command: `npm run build` (turbopack flag'i olmadan)

### 2. Admin Backend URL

Production'da Admin Backend'iniz VPS'te çalışıyorsa:
- `NEXT_PUBLIC_ADMIN_BACKEND_URL` değerini production VPS IP'sine ayarlayın
- HTTPS kullanıyorsanız, SSL sertifikası olmalı
- CORS ayarlarını kontrol edin

### 3. Supabase CORS Ayarları

Supabase Dashboard > Settings > API > CORS:
- Vercel domain'inizi ekleyin: `https://your-project.vercel.app`
- Production domain'inizi ekleyin: `https://your-domain.com`

### 4. Environment Variables Sıralaması

Vercel'de environment variables'ları şu sırayla ayarlayın:
1. **Production** (production branch için)
2. **Preview** (preview deployments için)
3. **Development** (development branch için)

---

## 🧪 Test Deployment

### 1. Preview Deployment

Her commit'te otomatik preview deployment oluşturulur:
- Branch push → Preview URL oluşturulur
- Pull Request → Preview URL oluşturulur

### 2. Production Deployment

Main/master branch'e merge → Production deployment

---

## 🔍 Troubleshooting

### Build Hatası: "Turbopack is not available"

**Çözüm:**
```json
// package.json
"build": "next build"  // --turbopack flag'ini kaldırın
```

### Build Hatası: "Module not found"

**Çözüm:**
- `node_modules` temizleyin: `rm -rf node_modules package-lock.json`
- Yeniden install: `npm install`
- Commit edin ve push edin

### Runtime Hatası: "Environment variable not found"

**Çözüm:**
- Vercel Dashboard > Environment Variables kontrol edin
- `NEXT_PUBLIC_*` prefix'li değişkenlerin doğru olduğundan emin olun
- Redeploy yapın

### API Route Timeout

**Çözüm:**
- `vercel.json` dosyasında `maxDuration` ayarını artırın (şu an 30 saniye)
- Veya Vercel Pro plan'a geçin (60 saniye limit)

---

## 📊 Monitoring

### Vercel Analytics

1. Vercel Dashboard > Analytics
2. Web Vitals tracking aktif
3. Real User Monitoring (RUM)

### Error Tracking

- Sentry entegrasyonu (opsiyonel)
- Vercel Logs (Dashboard > Logs)

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables hazır
- [ ] Build script kontrol edildi (turbopack flag)
- [ ] Supabase CORS ayarları yapıldı
- [ ] Admin Backend URL production'a ayarlandı
- [ ] Domain ayarları yapıldı (opsiyonel)

### Post-Deployment
- [ ] Site açılıyor mu? (https://your-project.vercel.app)
- [ ] Login çalışıyor mu?
- [ ] API routes çalışıyor mu?
- [ ] Database bağlantısı çalışıyor mu?
- [ ] Admin Backend bağlantısı çalışıyor mu?

---

## 💡 Best Practices

### 1. Environment Variables

- ✅ Production ve Preview için farklı değerler kullanın
- ✅ Secret'ları asla commit etmeyin
- ✅ `.env.local` dosyasını `.gitignore`'a ekleyin

### 2. Build Optimization

- ✅ Unused dependencies temizleyin
- ✅ Image optimization aktif
- ✅ Code splitting kullanın

### 3. Security

- ✅ HTTPS zorunlu (Vercel otomatik)
- ✅ Environment variables güvenli
- ✅ API routes rate limiting aktif

---

## 📝 Quick Start

```bash
# 1. Vercel CLI ile deploy (opsiyonel)
npm i -g vercel
vercel login
vercel

# 2. Veya GitHub'a push edin, Vercel otomatik deploy eder
git push origin main
```

---

## 🎯 Sonuç

✅ **Vercel'de deploy edilebilir!**

**Tahmini Süre:** 15-30 dakika (ilk deployment)

**Notlar:**
- Turbopack flag'ini kaldırmanız gerekebilir
- Environment variables'ları doğru ayarlayın
- Supabase CORS ayarlarını yapın

**Sorun olursa:** Vercel Dashboard > Logs bölümünden hataları kontrol edin.

