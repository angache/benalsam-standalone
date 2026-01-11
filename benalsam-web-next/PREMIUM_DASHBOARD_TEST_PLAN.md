# Premium Dashboard Test Planı

## 🧪 Test Senaryoları

### 1. Dashboard Sayfası Erişim Testi ✅
**Test Adımları:**
1. `/premium-dashboard` sayfasına git
2. Giriş yapmış kullanıcı olarak erişim kontrolü
3. Giriş yapmamış kullanıcı `/auth/login?redirect=/premium-dashboard` yönlendirmesi

**Beklenen Sonuç:**
- ✅ Giriş yapmış kullanıcı dashboard'u görebilmeli
- ✅ Giriş yapmamış kullanıcı login sayfasına yönlendirilmeli

### 2. Plan Bilgileri Yükleme Testi ⏳
**Test Adımları:**
1. Dashboard açıldığında `getUserActivePlan()` fonksiyonu çağrılıyor mu?
2. RPC fonksiyonu `get_user_active_plan` çalışıyor mu?
3. Plan bilgileri (adı, fiyat, bitiş tarihi) görünüyor mu?

**Beklenen Sonuç:**
- ✅ Mevcut plan bilgileri gösterilmeli (Basic/Advanced/Corporate)
- ✅ Plan fiyatı ve bitiş tarihi görünmeli
- ✅ Plan rozetleri (Temel/Gelişmiş/Kurumsal) görünmeli

**Kontrol SQL:**
```sql
-- RPC fonksiyonunu test et
SELECT * FROM get_user_active_plan('GERÇEK_USER_ID');
```

### 3. Kullanım İstatistikleri Yükleme Testi ⏳
**Test Adımları:**
1. Dashboard açıldığında `getUserMonthlyUsage()` fonksiyonu çağrılıyor mu?
2. RPC fonksiyonu `get_or_create_monthly_usage` çalışıyor mu?
3. İstatistikler (ilan, teklif, mesaj, öne çıkanlar) görünüyor mu?
4. Progress bar'lar doğru gösteriliyor mu?

**Beklenen Sonuç:**
- ✅ İlan sayısı: X / Limit
- ✅ Teklif sayısı: X / Limit
- ✅ Mesaj sayısı: X / Limit
- ✅ Öne çıkanlar sayısı: X / Limit
- ✅ Progress bar'lar doğru yüzdeyi göstermeli

**Kontrol SQL:**
```sql
-- RPC fonksiyonunu test et
SELECT * FROM get_or_create_monthly_usage('GERÇEK_USER_ID');

-- monthly_usage_stats tablosunu kontrol et
SELECT * FROM monthly_usage_stats WHERE user_id = 'GERÇEK_USER_ID';
```

### 4. Plan Karşılaştırma Testi ⏳
**Test Adımları:**
1. 3 plan kartı (Basic, Advanced, Corporate) görünüyor mu?
2. Her planın özellikleri listeleniyor mu?
3. "En Popüler" ve "Mevcut Plan" rozetleri doğru gösteriliyor mu?
4. Plan fiyatları doğru mu?

**Beklenen Sonuç:**
- ✅ 3 plan kartı görünmeli
- ✅ Plan özellikleri listelenmeli
- ✅ Fiyatlar doğru gösterilmeli
- ✅ Mevcut plan vurgulanmalı

**Kontrol SQL:**
```sql
SELECT slug, name, price_monthly, is_active FROM subscription_plans;
```

### 5. Detaylı Özellik Karşılaştırma Tablosu Testi ⏳
**Test Adımları:**
1. Karşılaştırma tablosu görünüyor mu?
2. Tüm kategoriler ve özellikler listeleniyor mu?
3. ✅ ve ❌ işaretleri doğru gösteriliyor mu?

**Beklenen Sonuç:**
- ✅ Tablo görünmeli
- ✅ Tüm kategoriler listelenmeli (Teklif Verme, Öne Çıkarma, İletişim, Analiz, Destek)
- ✅ Her özellik için doğru değerler gösterilmeli

### 6. Abonelik Yönetimi Testi ⏳
**Test Adımları:**
1. Mevcut plan "Basic" değilse, "Aboneliği Yenile" ve "Aboneliği İptal Et" butonları görünüyor mu?
2. "Aboneliği Yenile" butonuna tıklandığında:
   - Onay mesajı gösteriliyor mu?
   - `renewSubscription()` fonksiyonu çağrılıyor mu?
   - Başarılı olursa veriler yenileniyor mu?
3. "Aboneliği İptal Et" butonuna tıklandığında:
   - Onay mesajı gösteriliyor mu?
   - `cancelSubscription()` fonksiyonu çağrılıyor mu?
   - Başarılı olursa veriler güncelleniyor mu?

**Beklenen Sonuç:**
- ✅ Premium plan kullanıcıları için butonlar görünmeli
- ✅ Basic plan kullanıcıları için butonlar görünmemeli
- ✅ İşlemler başarılı olmalı
- ✅ Toast bildirimleri gösterilmeli

**Kontrol SQL:**
```sql
-- Mevcut aboneliği kontrol et
SELECT * FROM premium_subscriptions WHERE user_id = 'GERÇEK_USER_ID' AND status = 'active';

-- İptal sonrası kontrol
SELECT * FROM premium_subscriptions WHERE user_id = 'GERÇEK_USER_ID';
```

### 7. Plan Yükseltme Testi ⏳ (Mock)
**Test Adımları:**
1. Bir plan kartında "Yükselt" butonuna tıkla
2. Toast mesajı gösteriliyor mu? ("🚧 Ödeme Sistemi Yakında!")
3. Console'da hata var mı?

**Beklenen Sonuç:**
- ✅ Toast mesajı gösterilmeli
- ✅ Hata olmamalı
- ⚠️ Ödeme entegrasyonu olmadığı için sadece mock mesaj

### 8. Loading States Testi ⏳
**Test Adımları:**
1. Dashboard ilk açıldığında loading skeleton gösteriliyor mu?
2. Veriler yüklenirken loading state doğru mu?
3. İptal/yenileme işlemlerinde loading spinner gösteriliyor mu?

**Beklenen Sonuç:**
- ✅ Loading skeleton gösterilmeli
- ✅ Loading state'ler doğru çalışmalı

### 9. Error Handling Testi ⏳
**Test Adımları:**
1. RPC fonksiyonu hata verirse ne oluyor?
2. API çağrısı başarısız olursa toast mesajı gösteriliyor mu?
3. Console'da hata logları var mı?

**Beklenen Sonuç:**
- ✅ Hata durumunda toast mesajı gösterilmeli
- ✅ Console'da detaylı error log olmalı
- ✅ Sayfa çökmemeli

### 10. Responsive Design Testi ⏳
**Test Adımları:**
1. Desktop görünümünde tüm öğeler görünüyor mu?
2. Tablet görünümünde layout doğru mu?
3. Mobile görünümünde responsive mi?

**Beklenen Sonuç:**
- ✅ Tüm ekran boyutlarında düzgün görünmeli
- ✅ Grid layout'lar responsive olmalı

## 🔍 Console Kontrol Listesi

Açtığınızda kontrol edin:

```javascript
// 1. RPC fonksiyon çağrıları
// Network tab'da şunlar görünmeli:
// - POST /rest/v1/rpc/get_user_active_plan
// - POST /rest/v1/rpc/get_or_create_monthly_usage

// 2. Hata kontrolü
// Console'da şunlar olmamalı:
// - ❌ [ERROR] [PremiumDashboard] Error loading user data
// - ❌ [ERROR] [PremiumService] Error getting user plan
// - ❌ [ERROR] [PremiumService] Error getting user usage

// 3. Başarı logları
// Console'da şunlar görünmeli:
// - ✅ RPC çağrıları başarılı
// - ✅ Veriler yüklendi
```

## 📊 Network Tab Kontrol Listesi

1. **RPC Çağrıları:**
   - `get_user_active_plan` → 200 OK
   - `get_or_create_monthly_usage` → 200 OK

2. **Response Kontrolü:**
   - `get_user_active_plan` dönen veri:
     ```json
     {
       "plan_id": "uuid",
       "plan_name": "Temel Plan",
       "plan_slug": "basic",
       "features": {},
       "limits": {},
       "expires_at": null
     }
     ```
   - `get_or_create_monthly_usage` dönen veri:
     ```json
     {
       "offers_count": 0,
       "messages_count": 0,
       "listings_count": 0,
       "featured_offers_count": 0,
       "month_year": "2025-01"
     }
     ```

## ✅ Test Sonuçları

Her test sonucunu işaretleyin:

- [ ] 1. Dashboard Erişim Testi
- [ ] 2. Plan Bilgileri Yükleme Testi
- [ ] 3. Kullanım İstatistikleri Yükleme Testi
- [ ] 4. Plan Karşılaştırma Testi
- [ ] 5. Detaylı Özellik Karşılaştırma Tablosu Testi
- [ ] 6. Abonelik Yönetimi Testi
- [ ] 7. Plan Yükseltme Testi
- [ ] 8. Loading States Testi
- [ ] 9. Error Handling Testi
- [ ] 10. Responsive Design Testi

## 🐛 Bilinen Sorunlar

1. **Ödeme Entegrasyonu Yok:**
   - Plan yükseltme sadece mock toast mesajı gösteriyor
   - Gerçek ödeme entegrasyonu yapılmalı

2. **Ödeme Geçmişi Placeholder:**
   - Ödeme geçmişi bölümü henüz implement edilmedi

## 📝 Notlar

- Test ederken gerçek user ID kullanın
- Supabase RPC fonksiyonlarının çalıştığından emin olun
- Console ve Network tab'ları açık tutun

