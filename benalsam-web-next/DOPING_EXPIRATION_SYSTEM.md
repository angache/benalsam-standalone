# 🎯 Doping Expiration Tracking System - Detaylı Dokümantasyon

**Oluşturulma Tarihi:** 2026-01-09  
**Versiyon:** 1.0.0  
**Durum:** ✅ Production Ready

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Sistem Mimarisi](#sistem-mimarisi)
3. [Kurulum](#kurulum)
4. [Database Şeması](#database-şeması)
5. [API Endpoints](#api-endpoints)
6. [Cron Job Yapılandırması](#cron-job-yapılandırması)
7. [Kullanım Örnekleri](#kullanım-örnekleri)
8. [Monitoring ve Logging](#monitoring-ve-logging)
9. [Troubleshooting](#troubleshooting)
10. [Bakım ve Güncellemeler](#bakım-ve-güncellemeler)

---

## 🎯 Genel Bakış

Doping Expiration Tracking System, kullanıcıların satın aldığı doping özelliklerinin sürelerini otomatik olarak takip eder ve süre dolduğunda:

1. ✅ Doping özelliklerini otomatik olarak iptal eder
2. ✅ Kullanıcılara bildirim gönderir
3. ✅ İstatistikler tutar
4. ✅ Günlük otomatik kontrol yapar

### Desteklenen Doping Türleri

- **Kategori Vitrini** (`is_showcase`) - `showcase_expires_at`
- **Acil İlan** (`is_urgent_premium`) - `urgent_expires_at`
- **Öne Çıkan İlan** (`is_featured`) - `featured_expires_at`
- **Güncel Tut** (`upped_at`) - Süre limiti yok, sadece tarih takibi

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                    Doping Expiration System                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Cron Job     │    │  API Endpoint │    │  Database     │
│  (pg_cron)    │    │  (Manual)     │    │  Function     │
│               │    │               │    │               │
│  Her gün      │    │  POST /api/   │    │  check_       │
│  02:00        │───▶│  doping/      │───▶│  doping_       │
│               │    │  check-       │    │  expiration() │
│               │    │  expiration   │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │  Expired Listings │
                    │  Detection        │
                    └───────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Update       │    │  Create       │    │  Return       │
│  Listings     │    │  Notifications│    │  Statistics   │
│               │    │               │    │               │
│  - Disable    │    │  - recipient_ │    │  - expired_   │
│    doping     │    │    user_id    │    │    count      │
│  - Clear      │    │  - type       │    │  - notif_     │
│    expires_at │    │  - data       │    │    sent       │
└───────────────┘    └───────────────┘    └───────────────┘
```

### Veri Akışı

1. **Cron Job Tetikleme** → Her gün saat 02:00'de `pg_cron` çalışır
2. **Fonksiyon Çağrısı** → `check_doping_expiration()` fonksiyonu çağrılır
3. **Expired Detection** → Süresi dolan doping'ler tespit edilir
4. **Update Listings** → Doping özellikleri iptal edilir
5. **Create Notifications** → Kullanıcılara bildirim oluşturulur
6. **Return Statistics** → İstatistikler döner

---

## 🚀 Kurulum

### Adım 1: Migration Dosyasını Uygulama

**Dosya:** `supabase/migrations/20260109_doping_expiration_tracking.sql`

**Yöntem 1: Supabase Dashboard (Önerilen)**
1. Supabase Dashboard > SQL Editor
2. Migration dosyasının içeriğini kopyala-yapıştır
3. Run butonuna tıkla
4. "Success. No rows returned" mesajını kontrol et

**Yöntem 2: Supabase CLI**
```bash
cd benalsam-web-next
supabase migration up
```

**Kontrol:**
```sql
-- Fonksiyonun oluşturulduğunu kontrol et
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'check_doping_expiration';

-- Index'lerin oluşturulduğunu kontrol et
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'listings' 
AND indexname LIKE '%expires_at%';
```

### Adım 2: pg_cron Extension'ını Aktifleştirme

**Supabase Dashboard > Database > Extensions:**
1. `pg_cron` extension'ını bul
2. Enable butonuna tıkla

**Veya SQL ile:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Adım 3: Cron Job Oluşturma

**Supabase Dashboard > SQL Editor:**

```sql
SELECT cron.schedule(
  'check-doping-expiration',  -- Job name (unique)
  '0 2 * * *',                -- Schedule: Her gün saat 02:00 (UTC)
  $$SELECT check_doping_expiration()$$
);
```

**Sonuç:** `schedule` kolonunda `1` değeri dönmeli (job ID)

**Kontrol:**
```sql
-- Tüm cron job'ları listele
SELECT * FROM cron.job;

-- Belirli job'ı görüntüle
SELECT * FROM cron.job WHERE jobname = 'check-doping-expiration';
```

### Adım 4: Test Etme

**Manuel Test:**
```sql
SELECT check_doping_expiration();
```

**Beklenen Sonuç:**
```
check_doping_expiration
-----------------------
(0, 0)  -- (expired_count, notifications_sent)
```

---

## 🗄️ Database Şeması

### `listings` Tablosu (Mevcut)

Doping ile ilgili kolonlar:

```sql
-- Doping boolean flags
is_showcase BOOLEAN DEFAULT false
is_urgent_premium BOOLEAN DEFAULT false
is_featured BOOLEAN DEFAULT false

-- Expiration dates
showcase_expires_at TIMESTAMP WITH TIME ZONE
urgent_expires_at TIMESTAMP WITH TIME ZONE
featured_expires_at TIMESTAMP WITH TIME ZONE

-- Up to date (no expiration, just timestamp)
upped_at TIMESTAMP WITH TIME ZONE
```

### `notifications` Tablosu (Mevcut)

Mevcut şema:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recipient_user_id UUID NOT NULL,  -- Kullanıcı ID
  type TEXT NOT NULL,                -- Notification type
  data JSONB,                        -- Notification data (title, message, metadata)
  is_read BOOLEAN DEFAULT false
);
```

**Doping Expiration Notification Format:**
```json
{
  "type": "doping_expired",
  "data": {
    "title": "Doping Süresi Doldu",
    "message": "İlan başlığı ilanınızın Kategori Vitrini doping süresi doldu.",
    "listingId": "uuid",
    "dopingType": "showcase" | "urgent" | "featured"
  },
  "is_read": false
}
```

### Index'ler

**Listings Tablosu:**
```sql
-- Expired doping'leri hızlı bulmak için
CREATE INDEX idx_listings_showcase_expires_at 
  ON listings(showcase_expires_at) 
  WHERE is_showcase = true AND showcase_expires_at IS NOT NULL;

CREATE INDEX idx_listings_urgent_expires_at 
  ON listings(urgent_expires_at) 
  WHERE is_urgent_premium = true AND urgent_expires_at IS NOT NULL;

CREATE INDEX idx_listings_featured_expires_at 
  ON listings(featured_expires_at) 
  WHERE is_featured = true AND featured_expires_at IS NOT NULL;
```

**Notifications Tablosu:**
```sql
CREATE INDEX idx_notifications_recipient_user_id ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
```

### Database Function

**`check_doping_expiration()` Fonksiyonu:**

```sql
CREATE OR REPLACE FUNCTION check_doping_expiration()
RETURNS TABLE (
  expired_count INTEGER,
  notifications_sent INTEGER
) AS $$
DECLARE
  showcase_count INTEGER := 0;
  urgent_count INTEGER := 0;
  featured_count INTEGER := 0;
  total_notifications INTEGER := 0;
  expired_listing_id UUID;
  expired_listing_user_id UUID;
  expired_listing_title TEXT;
BEGIN
  -- Expire showcase dopings
  FOR expired_listing_id, expired_listing_user_id, expired_listing_title IN
    SELECT id, user_id, title
    FROM listings
    WHERE 
      is_showcase = true
      AND showcase_expires_at IS NOT NULL
      AND showcase_expires_at < NOW()
  LOOP
    UPDATE listings
    SET 
      is_showcase = false,
      showcase_expires_at = NULL,
      updated_at = NOW()
    WHERE id = expired_listing_id;
    
    showcase_count := showcase_count + 1;
    
    INSERT INTO notifications (recipient_user_id, type, data, is_read)
    VALUES (
      expired_listing_user_id,
      'doping_expired',
      jsonb_build_object(
        'title', 'Doping Süresi Doldu',
        'message', expired_listing_title || ' ilanınızın Kategori Vitrini doping süresi doldu.',
        'listingId', expired_listing_id,
        'dopingType', 'showcase'
      ),
      false
    );
  END LOOP;

  -- Expire urgent dopings (aynı mantık)
  -- Expire featured dopings (aynı mantık)

  total_notifications := showcase_count + urgent_count + featured_count;

  RETURN QUERY SELECT 
    (showcase_count + urgent_count + featured_count)::INTEGER AS expired_count,
    total_notifications::INTEGER AS notifications_sent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Özellikler:**
- `SECURITY DEFINER`: Fonksiyon sahibi (postgres) yetkileriyle çalışır
- Loop-based processing: Her expired listing'i tek tek işler
- Transaction-safe: Tüm işlemler tek transaction içinde

---

## 📡 API Endpoints

### POST `/api/doping/check-expiration`

Expired doping'leri kontrol eder ve iptal eder.

**Auth:** Opsiyonel (sistem/cron için)

**Request:**
```http
POST /api/doping/check-expiration
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Doping expiration check completed",
    "stats": {
      "expiredShowcase": 5,
      "expiredUrgent": 3,
      "expiredFeatured": 2,
      "notificationsSent": 10,
      "errors": 0
    }
  }
}
```

**Kullanım Senaryoları:**
- Cron job tarafından otomatik çağrılır
- Admin panel'den manuel tetiklenebilir
- Monitoring sisteminden çağrılabilir

### GET `/api/doping/check-expiration`

Expired doping istatistiklerini döner (expire etmeden).

**Auth:** Opsiyonel

**Request:**
```http
GET /api/doping/check-expiration
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Doping expiration statistics",
    "stats": {
      "expiredShowcase": 5,
      "expiredUrgent": 3,
      "expiredFeatured": 2,
      "totalExpired": 10
    },
    "timestamp": "2026-01-09T07:30:00.000Z"
  }
}
```

**Kullanım Senaryoları:**
- Dashboard'da istatistik göstermek için
- Monitoring için
- Debugging için

### GET `/api/doping/status?listingId=xxx`

Bir ilanın doping durumunu görüntüler.

**Auth:** Gerekli (sadece ilan sahibi)

**Request:**
```http
GET /api/doping/status?listingId=775c2264-4216-4215-b428-7a6d00eb6c42
```

**Response:**
```json
{
  "success": true,
  "data": {
    "listingId": "775c2264-4216-4215-b428-7a6d00eb6c42",
    "listingTitle": "İlan Başlığı",
    "status": {
      "showcase": {
        "active": true,
        "expiresAt": "2026-01-15T00:00:00.000Z",
        "expired": false,
        "daysRemaining": 5
      },
      "urgent": {
        "active": false,
        "expiresAt": null,
        "expired": false,
        "daysRemaining": null
      },
      "featured": {
        "active": true,
        "expiresAt": "2026-01-20T00:00:00.000Z",
        "expired": false,
        "daysRemaining": 10
      },
      "upToDate": {
        "active": true,
        "uppedAt": "2026-01-09T00:00:00.000Z"
      }
    }
  }
}
```

**Kullanım Senaryoları:**
- Frontend'de doping durumunu göstermek için
- Kullanıcıya kalan süreyi göstermek için
- Expiration warning göstermek için

---

## ⏰ Cron Job Yapılandırması

### Mevcut Yapılandırma

**Job Name:** `check-doping-expiration`  
**Schedule:** `0 2 * * *` (Her gün saat 02:00 UTC)  
**SQL Command:** `SELECT check_doping_expiration();`

### Cron Job Yönetimi

**Job'ı Görüntüleme:**
```sql
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job 
WHERE jobname = 'check-doping-expiration';
```

**Job'ı Durdurma:**
```sql
SELECT cron.unschedule('check-doping-expiration');
```

**Job'ı Güncelleme:**
```sql
-- Önce eski job'ı sil
SELECT cron.unschedule('check-doping-expiration');

-- Yeni schedule ile oluştur
SELECT cron.schedule(
  'check-doping-expiration',
  '0 3 * * *',  -- Yeni schedule: Her gün saat 03:00
  $$SELECT check_doping_expiration()$$
);
```

**Job Execution History:**
```sql
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-doping-expiration')
ORDER BY start_time DESC
LIMIT 10;
```

### Schedule Format (Cron Expression)

```
┌───────────── dakika (0 - 59)
│ ┌─────────── saat (0 - 23)
│ │ ┌───────── gün (1 - 31)
│ │ │ ┌─────── ay (1 - 12)
│ │ │ │ ┌───── haftanın günü (0 - 6) (0 = Pazar)
│ │ │ │ │
* * * * *
```

**Örnekler:**
- `0 2 * * *` - Her gün saat 02:00
- `0 */6 * * *` - Her 6 saatte bir
- `0 2 * * 1` - Her Pazartesi saat 02:00
- `0 2 1 * *` - Her ayın 1'i saat 02:00

---

## 💻 Kullanım Örnekleri

### Örnek 1: Manuel Expiration Check

**Supabase Dashboard > SQL Editor:**
```sql
SELECT check_doping_expiration();
```

**Beklenen Sonuç:**
```
check_doping_expiration
-----------------------
(5, 5)  -- 5 doping expired, 5 notification sent
```

### Örnek 2: API'den Expiration Check

**cURL:**
```bash
curl -X POST http://localhost:3000/api/doping/check-expiration \
  -H "Content-Type: application/json"
```

**JavaScript/TypeScript:**
```typescript
const response = await fetch('/api/doping/check-expiration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});

const data = await response.json();
console.log('Expired:', data.data.stats.expiredCount);
console.log('Notifications:', data.data.stats.notificationsSent);
```

### Örnek 3: Doping Status Kontrolü

**Frontend Component:**
```typescript
const { data } = useQuery({
  queryKey: ['doping-status', listingId],
  queryFn: async () => {
    const response = await fetch(`/api/doping/status?listingId=${listingId}`);
    return response.json();
  },
});

// Kullanım
if (data?.data.status.showcase.active) {
  const daysLeft = data.data.status.showcase.daysRemaining;
  if (daysLeft <= 3) {
    // Warning göster
  }
}
```

### Örnek 4: Expired Doping'leri Bulma

**SQL:**
```sql
-- Showcase doping'leri (expired)
SELECT id, title, user_id, showcase_expires_at
FROM listings
WHERE 
  is_showcase = true
  AND showcase_expires_at IS NOT NULL
  AND showcase_expires_at < NOW();

-- Tüm expired doping'ler
SELECT 
  id,
  title,
  user_id,
  CASE 
    WHEN is_showcase = true AND showcase_expires_at < NOW() THEN 'showcase'
    WHEN is_urgent_premium = true AND urgent_expires_at < NOW() THEN 'urgent'
    WHEN is_featured = true AND featured_expires_at < NOW() THEN 'featured'
  END as expired_doping_type
FROM listings
WHERE 
  (is_showcase = true AND showcase_expires_at < NOW())
  OR (is_urgent_premium = true AND urgent_expires_at < NOW())
  OR (is_featured = true AND featured_expires_at < NOW());
```

---

## 📊 Monitoring ve Logging

### Database Function Logging

Fonksiyon içinde log tutmak için:

```sql
-- Log tablosu oluştur (opsiyonel)
CREATE TABLE IF NOT EXISTS doping_expiration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expired_count INTEGER,
  notifications_sent INTEGER,
  execution_time_ms INTEGER,
  error_message TEXT
);

-- Fonksiyona logging ekle
-- (Migration dosyasında örnek var)
```

### API Logging

**Production Logger:**
```typescript
logger.info('[Doping Expiration] Check completed', {
  expiredCount: stats.expiredCount,
  notificationsSent: stats.notificationsSent,
  timestamp: new Date().toISOString(),
});
```

**Log Format:**
```
✅ [INFO] [Doping Expiration] Check completed {
  expiredCount: 5,
  notificationsSent: 5,
  timestamp: "2026-01-09T02:00:00.000Z"
}
```

### Monitoring Queries

**Son 24 saatteki expiration'lar:**
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as notification_count,
  COUNT(DISTINCT recipient_user_id) as affected_users
FROM notifications
WHERE 
  type = 'doping_expired'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Cron job execution history:**
```sql
SELECT 
  start_time,
  end_time,
  status,
  return_message,
  EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-doping-expiration')
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Sorun 1: Cron Job Çalışmıyor

**Kontrol:**
```sql
-- Job aktif mi?
SELECT active FROM cron.job WHERE jobname = 'check-doping-expiration';

-- Son execution ne zaman?
SELECT MAX(start_time) as last_run
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-doping-expiration');
```

**Çözüm:**
- Job'ı yeniden schedule et
- pg_cron extension'ının aktif olduğunu kontrol et
- Supabase plan'ının cron job'ları desteklediğini kontrol et

### Sorun 2: Fonksiyon Hata Veriyor

**Kontrol:**
```sql
-- Fonksiyon var mı?
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'check_doping_expiration';

-- Fonksiyonu test et
SELECT check_doping_expiration();
```

**Yaygın Hatalar:**
- `column "user_id" does not exist` → Migration'ı kontrol et
- `relation "notifications" does not exist` → Notifications tablosu yok
- `permission denied` → SECURITY DEFINER kontrolü yap

### Sorun 3: Notification Gönderilmiyor

**Kontrol:**
```sql
-- Son expiration'larda notification var mı?
SELECT * FROM notifications
WHERE type = 'doping_expired'
ORDER BY created_at DESC
LIMIT 10;

-- Expired doping var mı ama notification yok mu?
SELECT 
  l.id,
  l.title,
  l.user_id,
  CASE 
    WHEN l.is_showcase = true AND l.showcase_expires_at < NOW() THEN 'showcase'
    WHEN l.is_urgent_premium = true AND l.urgent_expires_at < NOW() THEN 'urgent'
    WHEN l.is_featured = true AND l.featured_expires_at < NOW() THEN 'featured'
  END as expired_type
FROM listings l
WHERE 
  (l.is_showcase = true AND l.showcase_expires_at < NOW())
  OR (l.is_urgent_premium = true AND l.urgent_expires_at < NOW())
  OR (l.is_featured = true AND l.featured_expires_at < NOW())
AND NOT EXISTS (
  SELECT 1 FROM notifications n
  WHERE n.recipient_user_id = l.user_id
  AND n.type = 'doping_expired'
  AND n.data->>'listingId' = l.id::text
  AND n.created_at > NOW() - INTERVAL '1 day'
);
```

### Sorun 4: Performance Sorunları

**Kontrol:**
```sql
-- Index'ler var mı?
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'listings' 
AND indexname LIKE '%expires_at%';

-- Expired listing sayısı
SELECT 
  COUNT(*) FILTER (WHERE is_showcase = true AND showcase_expires_at < NOW()) as showcase_expired,
  COUNT(*) FILTER (WHERE is_urgent_premium = true AND urgent_expires_at < NOW()) as urgent_expired,
  COUNT(*) FILTER (WHERE is_featured = true AND featured_expires_at < NOW()) as featured_expired
FROM listings;
```

**Optimizasyon:**
- Index'lerin oluşturulduğunu kontrol et
- Batch processing için fonksiyonu optimize et
- Execution time'ı logla

---

## 🔄 Bakım ve Güncellemeler

### Düzenli Bakım Görevleri

**Haftalık:**
- Cron job execution history kontrolü
- Error log kontrolü
- Performance metrikleri kontrolü

**Aylık:**
- Expired doping istatistikleri analizi
- Notification delivery rate kontrolü
- Index performance kontrolü

### Güncelleme Senaryoları

**Yeni Doping Türü Ekleme:**
1. `listings` tablosuna yeni kolonlar ekle
2. `check_doping_expiration()` fonksiyonuna yeni loop ekle
3. Migration dosyasını güncelle
4. Test et

**Schedule Değiştirme:**
```sql
-- Mevcut job'ı sil
SELECT cron.unschedule('check-doping-expiration');

-- Yeni schedule ile oluştur
SELECT cron.schedule(
  'check-doping-expiration',
  '0 */6 * * *',  -- Her 6 saatte bir
  $$SELECT check_doping_expiration()$$
);
```

**Notification Format Değiştirme:**
1. `check_doping_expiration()` fonksiyonundaki INSERT statement'ı güncelle
2. Migration dosyasını güncelle
3. Test et

---

## 📚 İlgili Dosyalar

### Migration Dosyası
- `supabase/migrations/20260109_doping_expiration_tracking.sql`

### API Routes
- `src/app/api/doping/check-expiration/route.ts`
- `src/app/api/doping/status/route.ts`

### Edge Functions
- `supabase/functions/check-doping-expiration/index.ts`

### Dokümantasyon
- `DOPING_TRACKING.md` - Genel bakış
- `API_ENDPOINTS.md` - API dokümantasyonu
- `DOPING_EXPIRATION_SYSTEM.md` - Bu dosya (detaylı dokümantasyon)

---

## ✅ Checklist

### Kurulum Checklist
- [x] Migration dosyası uygulandı
- [x] Index'ler oluşturuldu
- [x] `check_doping_expiration()` fonksiyonu oluşturuldu
- [x] pg_cron extension aktifleştirildi
- [x] Cron job oluşturuldu
- [x] Fonksiyon test edildi

### Production Checklist
- [ ] Monitoring dashboard kuruldu
- [ ] Alerting sistemi kuruldu
- [ ] Error tracking aktif
- [ ] Performance monitoring aktif
- [ ] Backup stratejisi hazır

---

## 🎯 Sonuç

Doping Expiration Tracking System başarıyla kuruldu ve çalışıyor. Sistem:

✅ Günlük otomatik kontrol yapıyor  
✅ Expired doping'leri otomatik iptal ediyor  
✅ Kullanıcılara bildirim gönderiyor  
✅ İstatistikler tutuyor  
✅ Production-ready

**Son Güncelleme:** 2026-01-09  
**Versiyon:** 1.0.0

