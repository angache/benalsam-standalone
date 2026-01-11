# Premium Database Durum Kontrol Listesi

## ✅ Tamamlananlar

1. **Migration Dosyası Oluşturuldu:**
   - `supabase/migrations/20250109_subscription_plans_seed.sql`
   - Basic, Advanced, Corporate planları eklendi

2. **Tablo İsim Hatası Düzeltildi:**
   - `getUserPremiumStatus()` → `premium_subscriptions` tablosunu kullanıyor ✅

## ⚠️ Yapılması Gerekenler

### 1. **subscription_plans Tablosu Kontrolü**
Migration çalıştırıldı mı? Kontrol et:

```sql
SELECT * FROM subscription_plans;
```

**Beklenen Sonuç:** 3 satır (basic, advanced, corporate)

### 2. **Kullanım İstatistikleri Tablo Tutarsızlığı** 🔴 KRİTİK

**Sorun:**
- RPC fonksiyonu `get_or_create_monthly_usage` → `monthly_usage_stats` kullanıyor
- `incrementUserUsage()` fonksiyonu → `user_monthly_usage` kullanıyor
- Görselde `user_monthly_usage` tablosu var ve veri içeriyor

**Kontrol Et:**
```sql
-- monthly_usage_stats tablosu var mı?
SELECT * FROM monthly_usage_stats LIMIT 1;

-- user_monthly_usage tablosu var mı?
SELECT * FROM user_monthly_usage LIMIT 1;

-- Hangi tablo kullanılıyor gerçekte?
-- RPC fonksiyonunu test et:
SELECT * FROM get_or_create_monthly_usage('USER_ID_BURAYA');
```

**Çözüm:**
- Eğer `user_monthly_usage` tablosu kullanılıyorsa, `incrementUserUsage()` doğru
- Ama `getUserMonthlyUsage()` RPC fonksiyonunu çağırıyor ve bu `monthly_usage_stats` kullanıyor
- **İkisi de aynı tabloyu kullanmalı!**

### 3. **RPC Fonksiyonu Dönen Veri Yapısı**

**get_or_create_monthly_usage RPC döndürüyor:**
```typescript
{
  offers_count: number
  messages_count: number
  listings_count: number
  featured_offers_count: number
  month_year: string  // "YYYY-MM" format
}
```

**Dashboard'da kullanılan:**
```typescript
{
  listings_count: number
  offers_count: number
  messages_count: number
  featured_offers_count: number
}
```

✅ **Uyumlu görünüyor** - `month_year` kullanılmıyor ama sorun değil

### 4. **Tablo Kolon İsimleri**

**monthly_usage_stats (RPC kullanıyor):**
- `month_year` (TEXT) - "YYYY-MM" format
- `offers_count`
- `messages_count`
- `listings_count`
- `featured_offers_count`

**user_monthly_usage (incrementUserUsage kullanıyor):**
- `month` (TEXT) - Görselde "2025-08" format
- `listings_created` veya `listings_count`?
- `offers_sent` veya `offers_count`?
- `messages_sent` veya `messages_count`?

⚠️ **Kolon isimleri farklı olabilir!**

## 🔧 Önerilen Düzeltmeler

### Senaryo 1: monthly_usage_stats Doğru Tablo
Eğer `monthly_usage_stats` doğru tablo ise:
1. `incrementUserUsage()` fonksiyonunu düzelt: `user_monthly_usage` → `monthly_usage_stats`
2. `month` → `month_year` değiştir
3. Kolon isimlerini kontrol et

### Senaryo 2: user_monthly_usage Doğru Tablo
Eğer `user_monthly_usage` doğru tablo ise:
1. RPC fonksiyonunu değiştir: `monthly_usage_stats` → `user_monthly_usage`
2. `month_year` → `month` değiştir
3. Kolon isimlerini kontrol et (`offers_sent` vs `offers_count`)

## 📝 Hızlı Test Adımları

1. **subscription_plans kontrolü:**
   ```sql
   SELECT slug, name, price_monthly FROM subscription_plans;
   ```

2. **Tablo kontrolü:**
   ```sql
   -- Her iki tabloyu da kontrol et
   SELECT table_name, column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name IN ('monthly_usage_stats', 'user_monthly_usage')
   ORDER BY table_name, ordinal_position;
   ```

3. **RPC fonksiyonu test:**
   ```sql
   SELECT * FROM get_or_create_monthly_usage('GERÇEK_USER_ID');
   ```

4. **Dashboard test:**
   - `/premium-dashboard` sayfasını aç
   - Console'da hata var mı kontrol et
   - Network tab'da API çağrılarını kontrol et

## 🎯 Öncelik Sırası

1. ✅ **subscription_plans seed data'sı** - Migration çalıştır (YAPILDI)
2. 🔴 **Tablo tutarsızlığını çöz** - Hangi tablo doğru?
3. ⚠️ **Kolon isimlerini kontrol et** - `offers_count` vs `offers_sent`?
4. ✅ **Dashboard test** - Tüm özellikler çalışıyor mu?

