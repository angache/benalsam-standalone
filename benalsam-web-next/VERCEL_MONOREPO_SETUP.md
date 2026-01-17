# 🚀 Vercel Monorepo Deployment - benalsam-web-next

Bu rehber, monorepo yapısından sadece `benalsam-web-next` projesini Vercel'e deploy etmek için adımları içerir.

## 📋 Ön Gereksinimler

- ✅ Vercel hesabı (GitHub/GitLab/Bitbucket ile giriş)
- ✅ Repository Vercel'e bağlı
- ✅ Environment variables hazır

---

## 🎯 Vercel Dashboard'da Ayarlar

### 1. Proje Oluşturma/Bağlama

1. **Vercel Dashboard'a gidin**: https://vercel.com/dashboard
2. **"Add New Project"** veya mevcut projeyi seçin
3. **Repository'yi seçin**: `benalsam-standalone` (veya repo adınız)

### 2. Root Directory Ayarlama (ÖNEMLİ!)

**Framework Preset:** Next.js  
**Root Directory:** `benalsam-web-next` ← **BU ÇOK ÖNEMLİ!**

Vercel Dashboard'da:
1. **Settings** → **General** bölümüne gidin
2. **Root Directory** alanını bulun
3. **"Edit"** butonuna tıklayın
4. **`benalsam-web-next`** yazın
5. **Save** butonuna tıklayın

### 3. Build Settings

Vercel otomatik olarak algılar, ama kontrol edin:

- **Framework Preset:** Next.js ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `.next` ✅ (Vercel otomatik algılar)
- **Install Command:** `npm install` ✅

⚠️ **Not:** `package.json`'daki build script'te `--turbopack` flag'i var. Eğer build hatası alırsanız, Vercel Build Settings'te override edin:

**Build Command:** `cd benalsam-web-next && npm run build` (turbopack flag'i olmadan)

---

## 🔐 Environment Variables

Vercel Dashboard → **Settings** → **Environment Variables** bölümüne gidin ve ekleyin:

### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Admin Backend API
NEXT_PUBLIC_ADMIN_BACKEND_URL=https://api.benalsam.com/api/v1
NEXT_PUBLIC_ADMIN_BACKEND_WS_URL=wss://api.benalsam.com

# Environment
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

### Server-Only Variables (API Routes için)

```env
# Supabase Service Role Key (SECRET)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Backend JWT Secret (SECRET)
ADMIN_BACKEND_JWT_SECRET=your-jwt-secret
```

**Environment Selection:** Production, Preview, Development (hepsini seçin)

---

## 🚀 Deployment Yöntemleri

### Yöntem 1: GitHub Integration (Önerilen)

1. Repository'yi Vercel'e bağlayın
2. Root Directory: `benalsam-web-next` ayarlayın
3. Environment variables ekleyin
4. **Deploy** butonuna tıklayın
5. Her push'ta otomatik deploy olur

### Yöntem 2: Vercel CLI

```bash
# Vercel CLI kurulumu
npm i -g vercel

# Login
vercel login

# Proje dizinine git
cd benalsam-web-next

# Deploy
vercel

# Production deploy
vercel --prod
```

**Not:** CLI kullanırken, Vercel otomatik olarak `benalsam-web-next` dizinini algılar.

---

## ⚙️ Vercel CLI ile Root Directory Ayarlama

Eğer CLI kullanıyorsanız, `vercel.json` dosyasına root directory eklenmez. Bunun yerine Vercel Dashboard'da ayarlanır veya CLI'da sorulduğunda belirtilir:

```bash
# İlk deploy'da sorular sorulur:
? Set up and deploy? [Y/n] y
? Which scope? [Your Account]
? Link to existing project? [y/N] n
? What's your project's name? benalsam-web-next
? In which directory is your code located? ./benalsam-web-next
```

---

## 🔧 Build Script Sorunu

`package.json`'daki build script:

```json
"build": "next build --turbopack"
```

Vercel'de bu flag sorun çıkarabilir. İki seçenek:

### Seçenek 1: package.json'ı güncelle (Önerilen)

```json
"build": "next build"
```

### Seçenek 2: Vercel Build Settings'te Override

Vercel Dashboard → Settings → General → Build & Development Settings:

**Build Command:** `cd benalsam-web-next && npm run build` (turbopack flag'i olmadan)

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] Vercel hesabı oluşturuldu
- [ ] Repository Vercel'e bağlandı
- [ ] **Root Directory: `benalsam-web-next` ayarlandı** ← ÖNEMLİ!
- [ ] Environment variables eklendi
- [ ] Build script kontrol edildi (turbopack flag)
- [ ] Backend CORS ayarları yapıldı

### Post-Deployment

- [ ] Site açılıyor mu? (`https://your-project.vercel.app`)
- [ ] API bağlantıları çalışıyor mu?
- [ ] Login çalışıyor mu?
- [ ] Environment variables doğru mu?

---

## 🐛 Troubleshooting

### Sorun: "Cannot find module" veya "Module not found"

**Sebep:** Root directory yanlış ayarlanmış veya node_modules bulunamıyor.

**Çözüm:**
1. Vercel Dashboard → Settings → General
2. Root Directory: `benalsam-web-next` olduğundan emin olun
3. Redeploy yapın

### Sorun: Build başarısız - "Turbopack is not available"

**Sebep:** `--turbopack` flag'i Vercel'de desteklenmiyor.

**Çözüm:**
1. `package.json`'daki build script'i güncelleyin: `"build": "next build"`
2. Commit ve push yapın
3. Veya Vercel Build Settings'te override edin

### Sorun: Environment variables çalışmıyor

**Sebep:** `NEXT_PUBLIC_*` prefix'i eksik veya yanlış yazılmış.

**Çözüm:**
1. Vercel Dashboard → Environment Variables kontrol edin
2. `NEXT_PUBLIC_*` prefix'li değişkenlerin doğru olduğundan emin olun
3. Redeploy yapın

---

## 📚 Daha Fazla Bilgi

- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Vercel Root Directory](https://vercel.com/docs/projects/overview/root-directory)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)

---

## 🎯 Özet

**En Önemli Adım:** Vercel Dashboard'da **Root Directory: `benalsam-web-next`** ayarlayın!

Bu ayar olmadan Vercel tüm monorepo'yu build etmeye çalışır ve hata alırsınız.

