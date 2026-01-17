# 🔧 VPS Search Service CORS Hatası - Çözüm

## 🐛 Hata

```
Access to fetch at 'https://api.benalsam.com/api/v1/search/listings' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## 🔍 Sorun

VPS'deki Search Service'in CORS ayarlarında `http://localhost:3000` yok.

Search Service `benalsam-shared-types/server` paketinden `SECURITY_CONFIGS` kullanıyor:
- **Development**: `origin: true` (tüm origin'lere izin)
- **Production**: `origin: ['https://admin.benalsam.com', 'https://benalsam.com']` (sadece production domain'leri)

VPS'de `NODE_ENV=production` olduğu için `localhost:3000` reddediliyor.

---

## ✅ Çözüm

### 1. Kod Güncellemesi (Yapıldı ✅)

Search Service'in `src/index.ts` dosyası güncellendi:
- `CORS_ORIGIN` environment variable'ı artık okunuyor
- Eğer `CORS_ORIGIN` set edilmişse, o kullanılıyor

### 2. VPS'de Environment Variable Ekleme

VPS'deki Search Service'in `.env` dosyasına `CORS_ORIGIN` ekleyin:

```bash
# VPS'e SSH ile bağlan
ssh root@46.62.212.96

# Search Service .env dosyasını düzenle
nano /opt/benalsam/services/benalsam-search-service/.env

# Şu satırı ekleyin:
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,https://benalsam.vercel.app

# Servisi yeniden başlat
pm2 restart benalsam-search-service

# Logları kontrol et
pm2 logs benalsam-search-service --lines 20
```

---

## 📋 Tüm Servisler için CORS Ayarları

Aynı sorunu diğer servislerde de yaşamamak için, tüm servislerin `.env` dosyalarına ekleyin:

### Categories Service
```bash
nano /opt/benalsam/services/benalsam-categories-service/.env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,https://benalsam.vercel.app
pm2 restart benalsam-categories-service
```

### Upload Service
```bash
nano /opt/benalsam/services/benalsam-upload-service/.env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,https://benalsam.vercel.app
pm2 restart benalsam-upload-service
```

### Listing Service
```bash
nano /opt/benalsam/services/benalsam-listing-service/.env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,https://benalsam.vercel.app
pm2 restart benalsam-listing-service
```

---

## 🔄 Kod Değişiklikleri

Search Service'in `src/index.ts` dosyası güncellendi:

**Önceki:**
```typescript
const securityConfig = SECURITY_CONFIGS[environment] || SECURITY_CONFIGS.development;
```

**Sonrası:**
```typescript
const baseSecurityConfig = SECURITY_CONFIGS[environment] || SECURITY_CONFIGS.development;

// Override CORS origin if CORS_ORIGIN environment variable is set
const corsOrigin = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : baseSecurityConfig.cors?.origin;

const securityConfig = {
  ...baseSecurityConfig,
  cors: {
    ...baseSecurityConfig.cors,
    origin: corsOrigin || baseSecurityConfig.cors?.origin,
  }
};
```

---

## 🚀 Sonraki Adımlar

1. **Kodu VPS'e deploy edin:**
   ```bash
   # Local'de build edin
   cd benalsam-search-service
   npm run build
   
   # VPS'e kopyalayın
   rsync -avz --exclude 'node_modules' --exclude '.git' \
     dist/ root@46.62.212.96:/opt/benalsam/services/benalsam-search-service/dist/
   ```

2. **VPS'de `.env` dosyasına `CORS_ORIGIN` ekleyin**

3. **Servisi yeniden başlatın:**
   ```bash
   pm2 restart benalsam-search-service
   ```

---

## 🔍 Kontrol

CORS ayarlarını ekledikten sonra:

1. **Browser console'da hata kaybolmalı**
2. **Network tab'de istekler başarılı olmalı (200 OK)**
3. **Search Service çalışmalı**

---

## ✅ Tamamlandı!

CORS ayarlarını ekledikten sonra frontend'i yeniden test edin!

