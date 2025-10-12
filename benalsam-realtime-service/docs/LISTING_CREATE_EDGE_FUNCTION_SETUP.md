# 📝 LISTING CREATE EDGE FUNCTION - SETUP GUIDE

## 🎯 Amaç
Listing tablosuna yeni kayıt eklendiğinde otomatik olarak Firebase Realtime DB'ye job oluşturmak.

---

## 🏗️ Mimari

```
Listing INSERT (Supabase)
   ↓ (Database Trigger)
Edge Function (listing-create)
   ↓ (Firebase PUT)
Firebase Realtime DB (jobs/{jobId})
   ↓ (Firebase Listener)
Realtime Service
   ↓ (RabbitMQ Publish)
RabbitMQ (listing.jobs queue)
   ↓ (RabbitMQ Consumer)
Listing Service (Job Processor)
   ↓
Process listing creation
```

---

## 📦 Kurulum Adımları

### 1. Supabase Edge Function Deploy

```bash
# Supabase CLI ile deploy
cd benalsam-realtime-service
supabase functions deploy listing-create

# Veya manuel deploy
# Supabase Dashboard → Edge Functions → Create Function
# Function name: listing-create
# Copy paste: supabase/functions/listing-create/index.ts
```

### 2. Environment Variables (Supabase Dashboard)

```bash
# Edge Function Secrets
FIREBASE_SECRET=your-firebase-auth-secret
FIREBASE_DATABASE_SECRET=your-firebase-database-secret
NODE_ENV=production
```

**Nasıl set edilir:**
- Supabase Dashboard → Settings → Edge Functions → Secrets
- Add secret: `FIREBASE_SECRET`
- Add secret: `FIREBASE_DATABASE_SECRET`

### 3. Database Extension Aktif Etme

```sql
-- Supabase SQL Editor'de çalıştır
CREATE EXTENSION IF NOT EXISTS http;

-- Verify
SELECT extname, extversion FROM pg_extension WHERE extname = 'http';
```

### 4. Database Configuration Parameters

```sql
-- Supabase SQL Editor'de çalıştır
ALTER DATABASE postgres SET app.edge_function_base_url = 'https://YOUR_PROJECT.supabase.co/functions/v1';
ALTER DATABASE postgres SET app.firebase_secret = 'YOUR_FIREBASE_SECRET';

-- Verify
SHOW app.edge_function_base_url;
SHOW app.firebase_secret;
```

**NOT:** `YOUR_PROJECT` kısmını kendi Supabase project ref'iniz ile değiştirin.

### 5. Database Trigger Oluşturma

```bash
# SQL dosyasını çalıştır
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f database/triggers/listing_insert_trigger.sql

# Veya Supabase SQL Editor'de
# database/triggers/listing_insert_trigger.sql dosyasının içeriğini copy-paste edin
```

---

## 🧪 Test

### 1. Manuel Test (SQL)

```sql
-- Test listing insert
INSERT INTO listings (
  id,
  title,
  description,
  category,
  budget,
  user_id,
  status
) VALUES (
  gen_random_uuid(),
  'Test Listing',
  'Test Description',
  'Electronics',
  1000,
  'YOUR_USER_ID',
  'pending'
);

-- Trigger çalıştı mı kontrol et (Logs'da görünür)
-- Supabase Dashboard → Database → Logs
```

### 2. Firebase'de Job Kontrolü

```bash
# Firebase Console'da kontrol
# https://console.firebase.google.com/project/benalsam-2025/database/data/jobs

# Veya curl ile
curl "https://benalsam-2025-default-rtdb.europe-west1.firebasedatabase.app/jobs.json?auth=YOUR_SECRET" | jq
```

### 3. Realtime Service Logs

```bash
# Realtime Service'de job işlendiğini gör
cd benalsam-realtime-service
npm run dev

# Logs'da şunlar görünmeli:
# 📨 Processing enterprise job: job_xxx
# 📤 Job published to RabbitMQ
# ✅ Job processed: job_xxx
```

### 4. Listing Service Logs

```bash
# Listing Service'de job consume edildiğini gör
cd benalsam-listing-service
npm run dev

# Logs'da şunlar görünmeli:
# 📨 Received job message from queue
# 🔄 Processing job: job_xxx (LISTING_CREATE)
# ✅ Listing created successfully
```

---

## 🔧 Troubleshooting

### Problem 1: Edge Function çağrılmıyor

**Çözüm:**
```sql
-- http extension aktif mi?
SELECT * FROM pg_extension WHERE extname = 'http';

-- Yoksa aktif et
CREATE EXTENSION IF NOT EXISTS http;
```

### Problem 2: Authentication failed

**Çözüm:**
```sql
-- Config parametreleri doğru mu?
SHOW app.firebase_secret;

-- Yanlışsa güncelle
ALTER DATABASE postgres SET app.firebase_secret = 'CORRECT_SECRET';
```

### Problem 3: Firebase'e yazılmıyor

**Çözüm:**
- Firebase Database Secret doğru mu?
- Firebase Database Rules'da write permission var mı?
- Firebase URL doğru mu? (europe-west1 region)

**Firebase Rules:**
```json
{
  "rules": {
    "jobs": {
      ".read": false,
      ".write": true
    }
  }
}
```

### Problem 4: Job'lar Firebase'de kalıyor, işlenmiyor

**Çözüm:**
```bash
# Realtime Service çalışıyor mu?
curl http://localhost:3019/api/v1/health

# RabbitMQ bağlantısı var mı?
# Realtime Service logs kontrol et
```

---

## 📊 Monitoring

### Edge Function Logs
```bash
# Supabase CLI ile
supabase functions logs listing-create --follow

# Veya Dashboard'da
# Supabase Dashboard → Edge Functions → listing-create → Logs
```

### Firebase Jobs
```bash
# Firebase Console
# https://console.firebase.google.com/project/benalsam-2025/database/data/jobs

# API ile
curl "https://benalsam-2025-default-rtdb.europe-west1.firebasedatabase.app/jobs.json?auth=SECRET&orderBy=\"status\"&equalTo=\"pending\"" | jq
```

### RabbitMQ Queue
```bash
# RabbitMQ Management UI
# http://localhost:15672
# Queue: listing.jobs

# CLI ile
curl -u benalsam:benalsam123 http://localhost:15672/api/queues/%2F/listing.jobs | jq '.messages'
```

---

## ✅ Success Criteria

Edge Function başarılı çalışıyorsa:
- [x] Listing INSERT olduğunda trigger tetiklenir
- [x] Edge Function çağrılır (logs'da görünür)
- [x] Firebase'de job oluşur (`jobs/{jobId}`)
- [x] Realtime Service job'ı yakalar
- [x] RabbitMQ'ya mesaj gönderir
- [x] Listing Service job'ı işler
- [x] Listing database'e kaydedilir
- [x] Firebase'de job status 'completed' olur

---

**Son Güncelleme:** 11 Ekim 2025  
**Versiyon:** 1.0.0

