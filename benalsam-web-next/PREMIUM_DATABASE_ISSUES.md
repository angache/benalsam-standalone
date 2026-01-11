# Premium Database Bağlantı Sorunları ve Düzeltmeler

## 🚨 Kritik Sorunlar Tespit Edildi

### 1. **Tablo İsim Tutarsızlığı** ✅ DÜZELTİLDİ
- **Sorun:** `getUserPremiumStatus()` fonksiyonu `user_premium_subscriptions` tablosunu kullanıyordu
- **Gerçek Tablo:** `premium_subscriptions`
- **Düzeltme:** `core.ts` dosyasında tablo adı düzeltildi

### 2. **subscription_plans Tablosu Boş** ⚠️ DÜZELTME GEREKLİ
- **Sorun:** `subscription_plans` tablosu mevcut ama boş
- **Etki:** 
  - `createSubscription()` fonksiyonu plan bulamaz
  - `get_user_active_plan` RPC fonksiyonu plan bilgilerini döndüremez
  - Dashboard'da plan bilgileri görünmez
- **Çözüm:** 
  - Migration dosyası oluşturuldu: `20250109_subscription_plans_seed.sql`
  - Basic, Advanced, Corporate planları eklenmeli
  - **ÖNEMLİ:** Bu migration'ı Supabase'de çalıştırmanız gerekiyor!

### 3. **RPC Fonksiyonu Bağımlılığı**
- **get_user_active_plan:**
  - `subscription_plans` tablosuna join yapıyor
  - Aktif abonelik yoksa 'basic' planı döndürüyor
  - **Sorun:** Eğer 'basic' planı `subscription_plans` tablosunda yoksa, hiçbir plan dönmez

### 4. **Kullanım İstatistikleri Tablosu**
- **RPC Fonksiyonu:** `get_or_create_monthly_usage` → `monthly_usage_stats` tablosunu kullanıyor
- **Kod:** `incrementUserUsage()` → `user_monthly_usage` tablosunu kullanıyor
- **Tutarsızlık:** İki farklı tablo ismi kullanılıyor
- **Kontrol Edilmeli:** Hangi tablo gerçekten var?

## 📋 Yapılması Gerekenler

### 1. Migration Çalıştırma
```sql
-- Supabase Dashboard'da veya CLI ile çalıştırın:
-- supabase/migrations/20250109_subscription_plans_seed.sql
```

### 2. Tablo Kontrolü
```sql
-- Kontrol 1: subscription_plans tablosunda planlar var mı?
SELECT * FROM subscription_plans;

-- Kontrol 2: monthly_usage_stats tablosu var mı?
SELECT * FROM monthly_usage_stats LIMIT 1;

-- Kontrol 3: user_monthly_usage tablosu var mı?
SELECT * FROM user_monthly_usage LIMIT 1;

-- Kontrol 4: premium_subscriptions tablosu var mı?
SELECT * FROM premium_subscriptions LIMIT 1;
```

### 3. RPC Fonksiyonları Test
```sql
-- Test 1: get_user_active_plan
SELECT * FROM get_user_active_plan('USER_ID_BURAYA');

-- Test 2: get_or_create_monthly_usage
SELECT * FROM get_or_create_monthly_usage('USER_ID_BURAYA');
```

### 4. Kod Düzeltmeleri
- ✅ `getUserPremiumStatus()` - Tablo adı düzeltildi
- ⚠️ `incrementUserUsage()` - Tablo adı kontrol edilmeli (`monthly_usage_stats` vs `user_monthly_usage`)

## 🔍 Doğrulama Adımları

1. **Migration Çalıştır:**
   ```bash
   # Supabase CLI ile
   supabase db push
   
   # Veya Supabase Dashboard'da SQL Editor'de migration dosyasını çalıştır
   ```

2. **Plan Kontrolü:**
   ```sql
   SELECT slug, name, price_monthly, is_active FROM subscription_plans;
   ```
   Çıktı: 3 satır olmalı (basic, advanced, corporate)

3. **Dashboard Test:**
   - `/premium-dashboard` sayfasını aç
   - Plan bilgilerinin göründüğünü kontrol et
   - Kullanım istatistiklerinin yüklendiğini kontrol et

4. **Abonelik Test:**
   - Bir plan seç ve yükselt butonuna tıkla
   - Console'da hata var mı kontrol et
   - Network tab'da API çağrılarını kontrol et

## ⚠️ Uyarılar

1. **subscription_plans tablosu boşsa:**
   - Dashboard'da plan bilgileri görünmez
   - Plan yükseltme çalışmaz
   - RPC fonksiyonu hata verir

2. **monthly_usage_stats vs user_monthly_usage:**
   - Hangi tablo kullanılıyor kontrol edilmeli
   - Tutarlılık sağlanmalı

3. **Foreign Key Constraints:**
   - `premium_subscriptions.plan_id` → `subscription_plans.id`
   - Eğer plan yoksa, abonelik oluşturulamaz

## ✅ Düzeltilen Dosyalar

1. `src/services/premiumService/core.ts`
   - `getUserPremiumStatus()` - Tablo adı düzeltildi: `user_premium_subscriptions` → `premium_subscriptions`

2. `supabase/migrations/20250109_subscription_plans_seed.sql`
   - Yeni migration dosyası oluşturuldu
   - Basic, Advanced, Corporate planları eklendi

