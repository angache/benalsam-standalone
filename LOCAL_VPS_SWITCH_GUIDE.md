# 🔄 Local ↔ VPS Servis Geçiş Rehberi

Bu rehber, local servisler ve VPS servisleri arasında kolayca geçiş yapmak için kullanılır.

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: VPS Kullan (Local Servisleri Durdur)

**Ne zaman:** Production'a yakın test yapmak, VPS servislerini kullanmak istediğinizde.

**Adımlar:**

1. **Local servisleri durdur:**
   ```bash
   ./scripts/local-services-stop.sh
   ```

2. **Environment variable ayarla:**
   ```bash
   # Terminal'de (geçici)
   export USE_VPS_SERVICES=true
   
   # Veya .env dosyasında (kalıcı)
   echo "USE_VPS_SERVICES=true" >> benalsam-web-next/.env.local
   ```

3. **Frontend'i yeniden başlat:**
   ```bash
   cd benalsam-web-next
   npm run dev
   ```

**Sonuç:** Frontend VPS'deki servislere bağlanır (`https://api.benalsam.com`).

---

### Senaryo 2: Local Servisleri Kullan (VPS'den Geri Dön)

**Ne zaman:** Local development yapmak, VPS'e bağlanmadan test etmek istediğinizde.

**Adımlar:**

1. **Environment variable'ı kaldır veya false yap:**
   ```bash
   # Terminal'de (geçici)
   export USE_VPS_SERVICES=false
   unset USE_VPS_SERVICES
   
   # Veya .env dosyasından kaldır
   sed -i '' '/USE_VPS_SERVICES/d' benalsam-web-next/.env.local
   ```

2. **Local servisleri başlat:**
   ```bash
   ./scripts/local-services-start.sh
   ```

3. **Frontend'i yeniden başlat:**
   ```bash
   cd benalsam-web-next
   npm run dev
   ```

**Sonuç:** Frontend local servislere bağlanır (`http://localhost:3002`).

---

## 📋 Environment Variables

### Frontend (benalsam-web-next)

**VPS kullanmak için:**
```env
# .env.local veya .env
USE_VPS_SERVICES=true
# veya
NEXT_PUBLIC_USE_VPS_SERVICES=true
```

**Local kullanmak için:**
```env
# .env.local veya .env
USE_VPS_SERVICES=false
# veya değişkeni kaldırın
```

### Otomatik Davranış

- **Production mode (`NODE_ENV=production`)**: Otomatik olarak VPS kullanır
- **Development mode (`NODE_ENV=development`)**: Otomatik olarak local kullanır
- **Override**: `USE_VPS_SERVICES=true/false` ile override edebilirsiniz

---

## 🔧 Script'ler

### 1. Local Servisleri Durdur

```bash
./scripts/local-services-stop.sh
```

**Ne yapar:**
- Tüm local mikroservisleri durdurur (port 3002-3019)
- Process'leri graceful shutdown ile kapatır
- Gerekirse force kill yapar

**Kullanım:**
```bash
# VPS kullanmak için
./scripts/local-services-stop.sh
export USE_VPS_SERVICES=true
cd benalsam-web-next && npm run dev
```

---

### 2. Local Servisleri Başlat

```bash
./scripts/local-services-start.sh
```

**Ne yapar:**
- Tüm local mikroservisleri başlatır
- Her servis için `npm run dev` çalıştırır
- Background'da çalıştırır (nohup)
- Log'ları `/tmp/<service-name>.log` dosyasına yazar

**Kullanım:**
```bash
# Local kullanmak için
export USE_VPS_SERVICES=false
./scripts/local-services-start.sh
cd benalsam-web-next && npm run dev
```

---

## 🎛️ Hızlı Geçiş Komutları

### VPS'e Geçiş (Tek Komut)

```bash
./scripts/local-services-stop.sh && \
export USE_VPS_SERVICES=true && \
cd benalsam-web-next && npm run dev
```

### Local'e Geçiş (Tek Komut)

```bash
export USE_VPS_SERVICES=false && \
./scripts/local-services-start.sh && \
cd benalsam-web-next && npm run dev
```

---

## 📊 Servis Durumunu Kontrol Et

### Local Servisler

```bash
# Hangi portlar kullanılıyor?
lsof -i :3002,3006,3007,3008,3013,3014,3015,3016,3019 | grep LISTEN

# Belirli bir servis çalışıyor mu?
lsof -i :3002  # Admin Backend
```

### VPS Servisler

```bash
# Health endpoint'lerini kontrol et
curl https://api.benalsam.com/api/v1/admin/health | jq
```

---

## 🔍 Debug

### Frontend Hangi Servisleri Kullanıyor?

Browser console'da:
```javascript
// Environment config'i kontrol et
console.log('Admin API URL:', process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL)
console.log('Use VPS:', process.env.USE_VPS_SERVICES)
```

Veya kod içinde:
```typescript
import { config } from '@/config/environment'
console.log('Admin API:', config.adminApi.url)
console.log('Use VPS:', config.isVPS)
```

### Local Servis Logları

```bash
# Belirli bir servisin log'unu gör
tail -f /tmp/benalsam-admin-backend.log

# Tüm servis loglarını gör
tail -f /tmp/benalsam-*.log
```

---

## ⚠️ Önemli Notlar

1. **Environment Variables:**
   - `USE_VPS_SERVICES` → Server-side (API routes)
   - `NEXT_PUBLIC_USE_VPS_SERVICES` → Client-side (browser)
   - İkisini de ayarlamak en iyisi

2. **Port Çakışmaları:**
   - Local servisler çalışırken VPS'e geçiş yaparsanız port çakışması olmaz
   - Ama kaynak kullanımı olur (her iki tarafta da çalışır)

3. **CORS:**
   - VPS servisleri `https://benalsam.vercel.app` için CORS ayarlı
   - Local servisler `http://localhost:5173` için CORS ayarlı

4. **SSL:**
   - VPS servisleri HTTPS kullanır (`https://api.benalsam.com`)
   - Local servisler HTTP kullanır (`http://localhost:3002`)

---

## 🚀 Önerilen Workflow

### Development (Local)

```bash
# 1. Local servisleri başlat
./scripts/local-services-start.sh

# 2. Frontend'i başlat (otomatik local kullanır)
cd benalsam-web-next
npm run dev
```

### Production Testing (VPS)

```bash
# 1. Local servisleri durdur
./scripts/local-services-stop.sh

# 2. VPS kullan
export USE_VPS_SERVICES=true

# 3. Frontend'i başlat
cd benalsam-web-next
npm run dev
```

### Production Deploy (Vercel)

```bash
# Vercel'de otomatik olarak VPS kullanır (NODE_ENV=production)
# Environment variables'ı Vercel Dashboard'dan ayarlayın
```

---

## 📚 İlgili Dosyalar

- `benalsam-web-next/src/config/environment.ts` - Environment config
- `scripts/local-services-stop.sh` - Local servisleri durdur
- `scripts/local-services-start.sh` - Local servisleri başlat
- `VPS_CHECK_COMMANDS.md` - VPS servis kontrolü

