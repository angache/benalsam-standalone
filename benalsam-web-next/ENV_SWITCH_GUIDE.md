# 🔄 Environment Switch Guide

Bu proje iki farklı environment dosyası kullanır:
- **`.env.local`** → Aktif environment dosyası (Next.js tarafından otomatik yüklenir)
- **`.env.local.example`** → Localhost servisleri için template
- **`.env.vps`** → VPS servisleri için template

---

## 📋 Dosya Yapısı

```
benalsam-web-next/
├── .env.local              # Aktif environment (gitignore'da)
├── .env.local.example      # Localhost template (git'te)
├── .env.vps                # VPS template (git'te)
└── scripts/
    └── switch-env.sh       # Environment switch script
```

---

## 🚀 Kullanım

### 1. Localhost Servisleri Kullanmak İçin

```bash
npm run env:local
```

Bu komut:
- `.env.local.example` dosyasını `.env.local` olarak kopyalar
- `USE_VPS_SERVICES=false` ayarlar
- Tüm servisler `localhost` adreslerine yönlendirilir

**Sonrası:**
```bash
npm run dev
```

---

### 2. VPS Servisleri Kullanmak İçin

```bash
npm run env:vps
```

Bu komut:
- `.env.vps` dosyasını `.env.local` olarak kopyalar
- `USE_VPS_SERVICES=true` ayarlar
- Tüm servisler `https://api.benalsam.com` adresine yönlendirilir

**Sonrası:**
```bash
npm run dev
```

---

## 📝 Manuel Kullanım

Script kullanmak istemiyorsanız, manuel olarak da yapabilirsiniz:

```bash
# VPS'e geçiş
cp .env.vps .env.local

# Localhost'a geçiş
cp .env.local.example .env.local
```

---

## 🔍 Kontrol

Environment switch'ten sonra, frontend'i başlatın ve log'larda kontrol edin:

**Localhost (Doğru):**
```
baseURL: 'http://localhost:3015'
USE_VPS_SERVICES=false
```

**VPS (Doğru):**
```
baseURL: 'https://api.benalsam.com/api/v1/categories'
USE_VPS_SERVICES=true
```

---

## ⚠️ Önemli Notlar

1. **`.env.local` dosyası git'e commit edilmez** (`.gitignore`'da)
2. **`.env.local.example` ve `.env.vps` git'te tutulur** (template dosyalar)
3. **Her switch'te `.env.local` yedeklenir** (`.env.local.backup.YYYYMMDD_HHMMSS`)
4. **Frontend'i her switch'ten sonra yeniden başlatın**

---

## 🛠️ Script Detayları

`scripts/switch-env.sh` script'i:
- Mevcut `.env.local` dosyasını yedekler
- Seçilen template'i `.env.local` olarak kopyalar
- Özet bilgi gösterir

**Script'i manuel çalıştırmak:**
```bash
bash scripts/switch-env.sh local   # Localhost
bash scripts/switch-env.sh vps     # VPS
```

---

## 📊 Environment Karşılaştırması

| Özellik | Localhost | VPS |
|---------|-----------|-----|
| **Admin Backend** | `http://localhost:3002` | `https://api.benalsam.com/api/v1/admin` |
| **Categories** | `http://localhost:3015` | `https://api.benalsam.com/api/v1/categories` |
| **Search** | `http://localhost:3016` | `https://api.benalsam.com/api/v1/search` |
| **Upload** | `http://localhost:3007` | `https://api.benalsam.com/api/v1/upload` |
| **Listing** | `http://localhost:3008` | `https://api.benalsam.com/api/v1/listings` |
| **USE_VPS_SERVICES** | `false` | `true` |

---

## 🎯 Önerilen Workflow

1. **Local development:** `npm run env:local` → `npm run dev`
2. **VPS testing:** `npm run env:vps` → `npm run dev`
3. **Production:** Vercel environment variables kullanılır

---

## 🔧 Sorun Giderme

### Sorun: Script çalışmıyor

**Çözüm:**
```bash
chmod +x scripts/switch-env.sh
```

### Sorun: Template dosyaları bulunamıyor

**Çözüm:**
Template dosyalarının mevcut olduğundan emin olun:
```bash
ls -la .env.local.example .env.vps
```

### Sorun: Frontend hala eski environment'ı kullanıyor

**Çözüm:**
1. Frontend'i tamamen durdurun (Ctrl+C)
2. `.next` klasörünü silin: `rm -rf .next`
3. Frontend'i yeniden başlatın: `npm run dev`

---

## ✅ Tamamlandı!

Artık kolayca localhost ve VPS arasında geçiş yapabilirsiniz!

