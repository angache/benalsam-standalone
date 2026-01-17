# 🔧 VPS CORS Hatası - Çözüm

## 🐛 Hata

```
Access to fetch at 'https://api.benalsam.com/api/v1/search/listings' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## 🔍 Sorun

VPS'deki Search Service'in CORS ayarlarında `http://localhost:3000` yok.

Search Service `benalsam-shared-types/server` paketinden `createSecurityMiddleware` kullanıyor ve CORS ayarları environment variable'dan geliyor.

---

## ✅ Çözüm

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

## 🔍 Kontrol

CORS ayarlarını ekledikten sonra:

1. **Browser console'da hata kaybolmalı**
2. **Network tab'de istekler başarılı olmalı (200 OK)**
3. **Search Service çalışmalı**

---

## 📝 Notlar

- `CORS_ORIGIN` environment variable'ı `benalsam-shared-types/server` paketi tarafından okunuyor
- Birden fazla origin için virgülle ayırın: `origin1,origin2,origin3`
- Production'da sadece production domain'leri ekleyin
- Development'ta `localhost` ekleyin

---

## ✅ Tamamlandı!

CORS ayarlarını ekledikten sonra frontend'i yeniden test edin!

