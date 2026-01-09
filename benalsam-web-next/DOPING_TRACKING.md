# Doping Takip ve Yönetim Sistemi

> **📚 Detaylı Dokümantasyon:** `DOPING_EXPIRATION_SYSTEM.md` dosyasına bakın.

## 📋 Genel Bakış

Doping takip sistemi, kullanıcıların satın aldığı doping özelliklerinin sürelerini takip eder ve süre dolduğunda otomatik olarak iptal eder. Ayrıca kullanıcılara bildirim gönderir.

**Durum:** ✅ Production Ready  
**Kurulum Tarihi:** 2026-01-09

## 🎯 Özellikler

### ✅ Tamamlanan Özellikler

1. **Expiration Tracking API** (`/api/doping/check-expiration`)
   - Süresi dolan doping'leri otomatik olarak iptal eder
   - İstatistikler döner (kaç doping iptal edildi, kaç bildirim gönderildi)
   - GET endpoint'i ile istatistikleri görüntüleme (expire etmeden)

2. **Doping Status API** (`/api/doping/status`)
   - Bir ilanın doping durumunu görüntüleme
   - Kalan süre bilgisi
   - Expired durumu kontrolü

3. **Otomatik İptal**
   - `showcase_expires_at` kontrolü → `is_showcase = false`
   - `urgent_expires_at` kontrolü → `is_urgent_premium = false`
   - `featured_expires_at` kontrolü → `is_featured = false`

### 🔄 Yapılacaklar

1. **Scheduled Task (Cron Job)**
   - Günlük olarak expiration kontrolü yapacak scheduled task
   - Supabase Edge Function veya admin-backend cron job olarak implement edilebilir

2. **Notification System**
   - Kullanıcıya bildirim gönderme sistemi
   - Push notification (FCM)
   - Email notification
   - In-app notification

3. **Frontend Integration**
   - Doping durumunu gösteren UI component
   - Kalan süre gösterimi
   - Expiration warning (süre dolmadan önce uyarı)

## 📡 API Endpoints

### POST `/api/doping/check-expiration`

Expired doping'leri kontrol eder ve iptal eder.

**Request:**
```json
POST /api/doping/check-expiration
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

### GET `/api/doping/check-expiration`

Expired doping istatistiklerini döner (expire etmeden).

**Request:**
```json
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

### GET `/api/doping/status?listingId=xxx`

Bir ilanın doping durumunu görüntüler.

**Request:**
```json
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
        "uppedAt": "2026-01-09T07:00:00.000Z"
      }
    }
  }
}
```

## 🔧 Scheduled Task Kurulumu

### Seçenek 1: Supabase Edge Function (Önerilen)

Supabase Edge Function ile günlük cron job oluşturabilirsiniz:

```typescript
// supabase/functions/check-doping-expiration/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const response = await fetch('https://your-domain.com/api/doping/check-expiration', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
  })
  
  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Cron Schedule:**
```sql
-- Supabase Dashboard'da cron job oluşturun
-- Schedule: 0 2 * * * (Her gün saat 02:00'de)
```

### Seçenek 2: Admin Backend Cron Job

Admin backend'de node-cron kullanarak:

```typescript
// benalsam-admin-backend/src/services/dopingExpirationService.ts
import * as cron from 'node-cron'

export class DopingExpirationService {
  start() {
    // Her gün saat 02:00'de çalış
    cron.schedule('0 2 * * *', async () => {
      await fetch('http://localhost:3000/api/doping/check-expiration', {
        method: 'POST',
      })
    })
  }
}
```

### Seçenek 3: Vercel Cron Jobs

Vercel kullanıyorsanız, `vercel.json` dosyasına ekleyin:

```json
{
  "crons": [
    {
      "path": "/api/doping/check-expiration",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## 📝 Notification System

Şu anda notification gönderme fonksiyonu sadece log yapıyor. Production'da şunları implement etmeniz gerekiyor:

1. **Notifications Table Oluşturma:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

2. **Notification Gönderme:**
```typescript
await supabaseAdmin.from('notifications').insert({
  user_id: userId,
  type: 'doping_expired',
  title: 'Doping Süresi Doldu',
  message: `${listingTitle} ilanınızın ${dopingName} doping süresi doldu.`,
  metadata: { listingId, dopingType },
  read: false,
})
```

3. **Push Notification (FCM):**
```typescript
// FCM service ile push notification gönder
await fcmService.sendToUser(userId, {
  title: 'Doping Süresi Doldu',
  body: `${listingTitle} ilanınızın ${dopingName} doping süresi doldu.`,
  data: { type: 'doping_expired', listingId },
})
```

## 🎨 Frontend Integration

### Doping Status Component Örneği

```typescript
// components/DopingStatus.tsx
const DopingStatus = ({ listingId }: { listingId: string }) => {
  const { data } = useQuery({
    queryKey: ['doping-status', listingId],
    queryFn: () => fetch(`/api/doping/status?listingId=${listingId}`).then(r => r.json()),
  })

  if (!data?.success) return null

  const { status } = data.data

  return (
    <div>
      {status.showcase.active && (
        <Badge>
          Kategori Vitrini
          {status.showcase.daysRemaining !== null && (
            <span> ({status.showcase.daysRemaining} gün kaldı)</span>
          )}
        </Badge>
      )}
      {/* ... diğer doping'ler */}
    </div>
  )
}
```

## 🔍 Monitoring

- Expiration check log'ları: `[Doping Expiration]` prefix'i ile
- İstatistikler: Her check sonrası stats döner
- Hata takibi: `stats.errors` ile hata sayısı takip edilir

## 📚 İlgili Dosyalar

- `/api/doping/check-expiration/route.ts` - Expiration check endpoint
- `/api/doping/status/route.ts` - Doping status endpoint
- `/components/MyListings/DopingModal.tsx` - Doping satın alma modal'ı

