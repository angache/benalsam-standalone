# 🔍 VPS Bağlantı Kontrol Rehberi

VPS'den veri gelip gelmediğini kontrol etmek için birkaç yöntem:

---

## 🎯 Hızlı Kontrol Yöntemleri

### 1. Browser Console'da Kontrol

Frontend çalışırken browser console'u açın (F12) ve şunu yazın:

```javascript
// Environment config'i görmek için
import { config } from '@/config/environment'
console.log('Admin API URL:', config.adminApi.url)
console.log('Use VPS:', process.env.USE_VPS_SERVICES)
```

**Beklenen Çıktı (VPS kullanıyorsa):**
```
Admin API URL: https://api.benalsam.com/api/v1/admin
Use VPS: true
```

**Beklenen Çıktı (Local kullanıyorsa):**
```
Admin API URL: http://localhost:3002/api/v1
Use VPS: undefined veya false
```

---

### 2. Network Tab'de Kontrol

1. Browser'da **Developer Tools** açın (F12)
2. **Network** tab'ine gidin
3. Sayfayı yenileyin (F5)
4. API isteklerini filtreleyin (XHR veya Fetch)

**VPS kullanıyorsanız:**
- İstekler `https://api.benalsam.com` adresine gider
- Request URL: `https://api.benalsam.com/api/v1/admin/...`

**Local kullanıyorsanız:**
- İstekler `http://localhost:3002` adresine gider
- Request URL: `http://localhost:3002/api/v1/...`

---

### 3. Terminal'de Kontrol Scripti

```bash
./scripts/check-vps-connection.sh
```

Bu script:
- VPS health endpoint'lerini kontrol eder
- Local endpoint'lerin çalışmadığını doğrular
- Environment variables'ı kontrol eder

---

### 4. Manuel API Test

Terminal'de:

```bash
# VPS endpoint'ini test et
curl https://api.benalsam.com/api/v1/admin/health | jq

# Local endpoint'ini test et (çalışmamalı)
curl http://localhost:3002/api/v1/health
```

**VPS kullanıyorsanız:**
- VPS endpoint'i `200 OK` döndürür
- Local endpoint'i `Connection refused` veya timeout verir

---

### 5. Frontend'de Debug Log

Frontend başlatıldığında console'da otomatik olarak şunu görmelisiniz:

```
🔧 Environment Config: {
  environment: 'development',
  adminApiUrl: 'https://api.benalsam.com/api/v1/admin',  // VPS URL
  useVpsServices: '✅ VPS',
  ...
}
🌐 API Source: VPS (api.benalsam.com)
```

**Eğer local kullanıyorsanız:**
```
adminApiUrl: 'http://localhost:3002/api/v1',
useVpsServices: '❌ Local',
🌐 API Source: Local (localhost)
```

---

## 🔍 Detaylı Kontrol

### Environment Variables Kontrolü

```bash
# .env.local dosyasını kontrol et
cat benalsam-web-next/.env.local | grep USE_VPS

# Beklenen:
# USE_VPS_SERVICES=true
# NEXT_PUBLIC_USE_VPS_SERVICES=true
```

### Port Kontrolü

```bash
# Local servislerin çalışmadığını kontrol et
lsof -i :3002,3006,3007,3008,3013,3014,3015,3016,3019

# Beklenen: Hiçbir process çalışmamalı (VPS kullanıyorsanız)
```

### VPS Log Kontrolü

VPS'de backend loglarını kontrol edin:

```bash
# VPS'e SSH ile bağlan
ssh root@46.62.212.96

# PM2 loglarını kontrol et
pm2 logs benalsam-admin-backend --lines 50

# Request'lerin geldiğini görmelisiniz
```

---

## ✅ Kontrol Checklist

- [ ] Browser console'da `adminApiUrl` VPS URL'i gösteriyor
- [ ] Network tab'de istekler `api.benalsam.com` adresine gidiyor
- [ ] Local endpoint'ler çalışmıyor (Connection refused)
- [ ] VPS endpoint'leri çalışıyor (200 OK)
- [ ] Environment variables doğru ayarlı
- [ ] Frontend console'da "✅ VPS" mesajı görünüyor

---

## 🐛 Sorun Giderme

### Sorun: Hala local'e bağlanıyor

**Çözüm:**
1. `.env.local` dosyasını kontrol edin
2. Frontend'i yeniden başlatın (`npm run dev`)
3. Browser cache'ini temizleyin (Hard Refresh: Cmd+Shift+R)

### Sorun: VPS'e bağlanamıyor

**Çözüm:**
1. VPS servislerinin çalıştığını kontrol edin:
   ```bash
   curl https://api.benalsam.com/api/v1/admin/health
   ```
2. CORS ayarlarını kontrol edin
3. SSL sertifikasını kontrol edin

### Sorun: Her iki taraf da çalışıyor

**Çözüm:**
1. Local servisleri durdurun:
   ```bash
   ./scripts/local-services-stop.sh
   ```
2. Port'ları kontrol edin:
   ```bash
   lsof -i :3002
   ```

---

## 📊 Test Senaryoları

### Senaryo 1: VPS Kullanımı

```bash
# 1. Local servisleri durdur
./scripts/local-services-stop.sh

# 2. Environment variable ayarla
echo "USE_VPS_SERVICES=true" >> benalsam-web-next/.env.local

# 3. Frontend'i başlat
cd benalsam-web-next && npm run dev

# 4. Browser'da kontrol et
# - Console'da "✅ VPS" mesajı
# - Network tab'de "api.benalsam.com" istekleri
```

### Senaryo 2: Local Kullanımı

```bash
# 1. Environment variable'ı kaldır
sed -i '' '/USE_VPS_SERVICES/d' benalsam-web-next/.env.local

# 2. Local servisleri başlat
./scripts/local-services-start.sh

# 3. Frontend'i başlat
cd benalsam-web-next && npm run dev

# 4. Browser'da kontrol et
# - Console'da "❌ Local" mesajı
# - Network tab'de "localhost" istekleri
```

---

## 🎯 Özet

**VPS kullanıyorsanız:**
- ✅ Browser console: `adminApiUrl: 'https://api.benalsam.com/...'`
- ✅ Network tab: İstekler `api.benalsam.com` adresine gidiyor
- ✅ Local endpoint'ler çalışmıyor
- ✅ VPS endpoint'leri çalışıyor

**Local kullanıyorsanız:**
- ✅ Browser console: `adminApiUrl: 'http://localhost:3002/...'`
- ✅ Network tab: İstekler `localhost` adresine gidiyor
- ✅ Local endpoint'ler çalışıyor

