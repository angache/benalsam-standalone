# 🔧 VPS Tüm Servisler CORS Düzeltmesi

## ✅ Yapılan Değişiklikler

Tüm servislerin CORS ayarları güncellendi:

### 1. Kod Güncellemeleri ✅

Aşağıdaki servislerin `src/index.ts` dosyaları güncellendi:
- ✅ **Search Service** - `CORS_ORIGIN` environment variable desteği eklendi
- ✅ **Categories Service** - `CORS_ORIGIN` environment variable desteği eklendi
- ✅ **Upload Service** - `CORS_ORIGIN` environment variable desteği eklendi
- ✅ **Backup Service** - `CORS_ORIGIN` environment variable desteği eklendi
- ✅ **Cache Service** - `CORS_ORIGIN` environment variable desteği eklendi
- ✅ **Admin Backend** - `CORS_ORIGIN` environment variable desteği eklendi

**Not:** Listing Service ve Realtime Service zaten `CORS_ORIGIN` destekliyor.

### 2. env.example Güncellemeleri ✅

Tüm servislerin `env.example` dosyalarına `CORS_ORIGIN` eklendi:
- ✅ Search Service
- ✅ Categories Service
- ✅ Upload Service (güncellendi)
- ✅ Backup Service (güncellendi)
- ✅ Cache Service (güncellendi)
- ✅ Admin Backend (güncellendi)

---

## 🚀 VPS'de Yapılacaklar

### 1. Kodu VPS'e Deploy Edin

Her servisi build edip VPS'e deploy edin:

```bash
# Her servis için:
cd benalsam-<service-name>
npm run build

# VPS'e kopyalayın veya git pull yapın
# VPS'de:
cd /opt/benalsam/services/benalsam-<service-name>
git pull  # veya rsync ile kopyalayın
npm run build
pm2 restart benalsam-<service-name>
```

### 2. VPS'de `.env` Dosyalarına `CORS_ORIGIN` Ekleyin

**Otomatik Script (Önerilen):**

```bash
# VPS'e SSH ile bağlan
ssh root@46.62.212.96

# Script'i çalıştırın
bash /path/to/scripts/vps-fix-cors.sh
```

**Manuel Olarak:**

Her servisin `.env` dosyasına şunu ekleyin:

```bash
# VPS'de
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,https://benalsam.vercel.app
```

**Servisler:**
- `/opt/benalsam/services/benalsam-search-service/.env`
- `/opt/benalsam/services/benalsam-categories-service/.env`
- `/opt/benalsam/services/benalsam-upload-service/.env`
- `/opt/benalsam/services/benalsam-backup-service/.env`
- `/opt/benalsam/services/benalsam-cache-service/.env`
- `/opt/benalsam/services/benalsam-admin-backend/.env`
- `/opt/benalsam/services/benalsam-listing-service/.env` (zaten var)
- `/opt/benalsam/services/benalsam-realtime-service/.env` (zaten var)

### 3. Servisleri Yeniden Başlatın

```bash
# Tüm servisleri yeniden başlat
pm2 restart all

# Veya tek tek:
pm2 restart benalsam-search-service
pm2 restart benalsam-categories-service
pm2 restart benalsam-upload-service
pm2 restart benalsam-backup-service
pm2 restart benalsam-cache-service
pm2 restart benalsam-admin-backend
pm2 restart benalsam-listing-service
pm2 restart benalsam-realtime-service
```

---

## 📋 Güncellenen Servisler

| Servis | Kod Güncellemesi | env.example | Durum |
|--------|------------------|-------------|-------|
| Search Service | ✅ | ✅ | Tamamlandı |
| Categories Service | ✅ | ✅ | Tamamlandı |
| Upload Service | ✅ | ✅ | Tamamlandı |
| Backup Service | ✅ | ✅ | Tamamlandı |
| Cache Service | ✅ | ✅ | Tamamlandı |
| Admin Backend | ✅ | ✅ | Tamamlandı |
| Listing Service | ⚠️ Zaten var | ✅ | Kontrol edildi |
| Realtime Service | ⚠️ Zaten var | ✅ | Kontrol edildi |

---

## 🔍 Kontrol

CORS ayarlarını ekledikten sonra:

1. **Browser console'da CORS hatası kaybolmalı**
2. **Network tab'de tüm istekler başarılı olmalı (200 OK)**
3. **Tüm servisler çalışmalı**

---

## ✅ Tamamlandı!

Artık tüm servisler `CORS_ORIGIN` environment variable'ını destekliyor. VPS'de `.env` dosyalarına ekleyip servisleri yeniden başlatın!

