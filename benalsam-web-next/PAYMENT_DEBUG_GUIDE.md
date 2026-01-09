# 🐛 Payment System Debug Guide

**Tarih:** 7 Ocak 2025  
**Sorun:** Payment intent creation error (boş error mesajı)

---

## 🔍 Debug Checklist

### 1. **Browser Console Kontrolü**

Hata alındığında browser console'da şunları kontrol edin:

```javascript
// Network tab'da `/api/payments/create-intent` request'ini kontrol edin
// Status code nedir? (200, 400, 401, 500?)
// Response body nedir?
```

**Kontrol Edilecekler:**
- ✅ Request gönderildi mi? (Network tab)
- ✅ Response status code ne? (200, 400, 401, 500?)
- ✅ Response body nedir? (JSON parse edilebiliyor mu?)
- ✅ CORS hatası var mı?
- ✅ Authentication header'ları doğru mu?

### 2. **Server Log Kontrolü**

Next.js server console'unda şu log'ları arayın:

```
[Payment API] Request received
[Payment API] User authenticated
[Payment API] Rate limit check passed
[Payment API] Validation passed
[Payment API] Getting payment service
[Payment API] Payment service initialized
[Payment API] Creating payment intent
[Payment API] Payment intent created successfully
```

**Eğer bir log eksikse, o noktada hata var demektir.**

### 3. **Environment Variables Kontrolü**

`.env.local` dosyasında:

```bash
# Payment provider (mock default)
PAYMENT_PROVIDER=mock

# Eğer Stripe kullanıyorsanız:
# STRIPE_SECRET_KEY=sk_test_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Eğer İyzico kullanıyorsanız:
# IYZICO_API_KEY=...
# IYZICO_SECRET_KEY=...
```

### 4. **Rate Limiting Kontrolü**

Rate limiting'e takılmış olabilirsiniz. Kontrol etmek için:

```bash
# Server console'da şu log'u arayın:
[Payment API] Rate limit exceeded
```

**Çözüm:** 1 dakika bekleyin veya rate limit'i reset edin.

### 5. **Validation Kontrolü**

Request body validation hatası olabilir. Kontrol etmek için:

**Request Body Format:**
```json
{
  "amount": 4900,  // Cents (₺49.00 = 4900 kuruş)
  "currency": "TRY",
  "items": [
    {
      "id": "doping-1",
      "name": "Featured Listing",
      "description": "7 gün öne çıkarılmış ilan",
      "amount": 4900,  // Cents
      "quantity": 1
    }
  ],
  "description": "İlan dopingi",
  "metadata": {
    "listingId": "listing-uuid",
    "dopingIds": "showcase,featured"
  }
}
```

**Validation Requirements:**
- `amount`: Minimum 100 (₺1.00)
- `currency`: Must be 'TRY', 'USD', or 'EUR'
- `items`: Array with at least 1 item
- Each item must have: `id`, `name`, `amount` (positive integer)

### 6. **Payment Service Initialization Kontrolü**

Payment service başlatılamıyor olabilir. Kontrol etmek için:

```bash
# Server console'da şu log'u arayın:
[PaymentService] Initializing payment provider
[PaymentService] Using Mock Payment Provider (development mode)
```

**Eğer bu log yoksa:** Payment service initialization'da hata var.

---

## 🔧 Common Issues & Solutions

### Issue 1: "Empty Error Message `{}`"

**Neden:** Error objesi serialize edilemiyor.

**Çözüm:** 
- ✅ Error handling iyileştirildi (production-logger.ts)
- ✅ Error serialization eklendi
- ✅ Daha detaylı error logging

**Test:** Tekrar deneyin, şimdi detaylı error mesajı görmelisiniz.

### Issue 2: "Payment intent creation error" - Network Error

**Neden:** API route'una ulaşılamıyor.

**Kontrol Edilecekler:**
1. Development server çalışıyor mu? (`npm run dev`)
2. API route doğru mu? (`/api/payments/create-intent`)
3. CORS hatası var mı? (Network tab)
4. Authentication cookie'leri doğru mu?

### Issue 3: "Unauthorized" Error

**Neden:** Kullanıcı login olmamış.

**Çözüm:**
1. Login sayfasına gidin (`/auth/login`)
2. Giriş yapın
3. Tekrar deneyin

### Issue 4: "Rate limit exceeded" Error

**Neden:** Çok fazla istek gönderilmiş.

**Çözüm:**
1. 1 dakika bekleyin
2. Rate limit otomatik olarak reset olacak

### Issue 5: "Validation failed" Error

**Neden:** Request body formatı hatalı.

**Kontrol Edilecekler:**
1. `amount` minimum 100 olmalı (₺1.00)
2. `currency` 'TRY', 'USD', veya 'EUR' olmalı
3. `items` array en az 1 item içermeli
4. Her item'da `id`, `name`, `amount` olmalı

---

## 🧪 Test Senaryoları

### Senaryo 1: Başarılı Payment Intent

**Adımlar:**
1. Login olun
2. İlanlarım sayfasına gidin
3. Bir ilan için doping satın almayı deneyin
4. Doping seçin (örn: Featured Listing, 1 hafta, ₺75)
5. "Satın Al" butonuna tıklayın

**Beklenen:**
- ✅ Payment intent oluşturulur
- ✅ Payment checkout modal açılır
- ✅ Mock mode indicator görünür

### Senaryo 2: Validation Error

**Test:**
```javascript
// Browser console'da:
fetch('/api/payments/create-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 50,  // ❌ Minimum 100 olmalı
    currency: 'TRY',
    items: [{ id: 'test', name: 'Test', amount: 50 }]
  })
}).then(r => r.json()).then(console.log)
```

**Beklenen:**
- ❌ Validation error
- ✅ Error mesajı: "Validation failed"
- ✅ Details: `amount` minimum 100 olmalı

### Senaryo 3: Unauthorized Error

**Test:**
1. Logout olun
2. İlanlarım sayfasına gidin (redirect edileceksiniz)
3. API'yi direkt çağırın

**Beklenen:**
- ❌ Unauthorized error (401)
- ✅ Error mesajı: "Oturum açmanız gerekiyor"

---

## 📊 Debug Logging

### Client-Side (Browser Console)

```javascript
// DopingModal component'inde
logger.debug('[DopingModal] Creating payment intent', { ... })
logger.error('[DopingModal] Payment intent creation error', { ... })
```

### Server-Side (Next.js Console)

```javascript
// API route'unda
logger.debug('[Payment API] Request received', { ... })
logger.debug('[Payment API] User authenticated', { ... })
logger.debug('[Payment API] Rate limit check passed', { ... })
logger.debug('[Payment API] Validation passed', { ... })
logger.debug('[Payment API] Creating payment intent', { ... })
logger.error('[Payment API] Error creating payment intent', { ... })
```

---

## 🚀 Hızlı Fix

Eğer hala hata alıyorsanız:

1. **Browser Console'u kontrol edin** (Network tab + Console tab)
2. **Server Console'u kontrol edin** (Next.js dev server)
3. **Hata mesajını kopyalayın** ve bu dokümana ekleyin
4. **Request/Response'u kontrol edin** (Network tab'da API request)

**En yaygın sorunlar:**
- ❌ Validation error (request body formatı)
- ❌ Authentication error (login olmamış)
- ❌ Rate limiting (çok fazla istek)
- ❌ Network error (server çalışmıyor)

---

**Son Güncelleme:** 7 Ocak 2025  
**Versiyon:** 1.0.0

