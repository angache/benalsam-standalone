# 💳 Payment System - Dokümantasyon

**Tarih:** 7 Ocak 2025  
**Durum:** ✅ Mock Mode Hazır, Production Providers Placeholder

---

## 📋 Genel Bakış

Payment System, platformdaki tüm ödeme işlemlerini yöneten modüler bir altyapıdır. Mock mode ile development'ta gerçek payment hesabı olmadan test edilebilir, production'da Stripe veya İyzico'ya kolayca geçiş yapılabilir.

---

## 🎯 Özellikler

### ✅ Tamamlanan
- ✅ Mock Payment Provider (development/test için)
- ✅ Payment Service Interface (IPaymentProvider)
- ✅ Stripe Provider (placeholder - SDK eklendiğinde aktif)
- ✅ İyzico Provider (placeholder - SDK eklendiğinde aktif)
- ✅ Payment API Routes (create-intent, verify)
- ✅ Payment Checkout Component
- ✅ DopingModal Payment Integration

### 🔄 Planlanan
- ⏳ Subscription Checkout Flow
- ⏳ Payment History
- ⏳ Refund Management
- ⏳ Webhook Handling

---

## 🏗️ Mimari

### Payment Provider Interface

Tüm payment provider'lar `IPaymentProvider` interface'ini implement eder:

```typescript
interface IPaymentProvider {
  createPaymentIntent(request: PaymentRequest): Promise<PaymentIntent>
  verifyPayment(paymentIntentId: string): Promise<PaymentResult>
  createSubscription(request: SubscriptionRequest): Promise<SubscriptionResult>
  cancelSubscription(subscriptionId: string): Promise<void>
  getSubscriptionStatus(subscriptionId: string): Promise<PaymentStatus>
  processWebhook(event: WebhookEvent): Promise<void>
  refundPayment(paymentId: string, amount?: number): Promise<PaymentResult>
}
```

### Provider Seçimi

Provider, environment variable'a göre otomatik seçilir:

```typescript
// .env.local
PAYMENT_PROVIDER=mock  // mock, stripe, iyzico
```

**Priority:**
1. `PAYMENT_PROVIDER` env variable (if set)
2. Mock provider (default for development)

---

## 🔧 Kullanım

### 1. Mock Mode (Development)

**Avantajlar:**
- ✅ Gerçek payment hesabı gerektirmez
- ✅ Test için mükemmel
- ✅ %90 başarı simülasyonu
- ✅ Anında işlem (simülasyon)

**Kullanım:**
```typescript
// .env.local (ya da hiçbir şey set etme - default mock)
PAYMENT_PROVIDER=mock
```

**Örnek Kullanım:**
```typescript
import { getPaymentService } from '@/services/paymentService'

const paymentService = getPaymentService() // Automatically uses mock

// Create payment intent
const intent = await paymentService.createPaymentIntent({
  amount: 4900, // ₺49.00 (cents)
  currency: 'TRY',
  items: [{ id: 'doping-1', name: 'Featured Listing', amount: 4900 }],
  customerEmail: 'user@example.com',
})

// Verify payment (mock mode - simulates success)
const result = await paymentService.verifyPayment(intent.id)
```

### 2. Stripe Mode (Production - TODO)

**Gereksinimler:**
- Stripe account
- Stripe SDK: `npm install stripe @stripe/stripe-js`
- Environment variables

**Kullanım:**
```typescript
// .env.local
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Not:** Stripe provider şu anda placeholder. SDK eklendiğinde aktif olacak.

### 3. İyzico Mode (Production - TODO)

**Gereksinimler:**
- İyzico account
- İyzico SDK: `npm install iyzipay`
- Environment variables

**Kullanım:**
```typescript
// .env.local
PAYMENT_PROVIDER=iyzico
IYZICO_API_KEY=your-api-key
IYZICO_SECRET_KEY=your-secret-key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
```

**Not:** İyzico provider şu anda placeholder. SDK eklendiğinde aktif olacak.

---

## 📡 API Routes

### POST `/api/payments/create-intent`

Payment intent oluşturur (one-time payments).

**Request:**
```json
{
  "amount": 4900,
  "currency": "TRY",
  "items": [
    {
      "id": "doping-1",
      "name": "Featured Listing",
      "description": "7 gün öne çıkarılmış ilan",
      "amount": 4900,
      "quantity": 1
    }
  ],
  "description": "İlan dopingi",
  "metadata": {
    "listingId": "listing-uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentIntent": {
      "id": "mock_pi_...",
      "clientSecret": "mock_secret_...",
      "status": "pending",
      "amount": 4900,
      "currency": "TRY",
      "provider": "mock"
    }
  }
}
```

### POST `/api/payments/verify`

Payment status'ünü doğrular.

**Request:**
```json
{
  "paymentIntentId": "mock_pi_..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "mock_pi_...",
      "status": "succeeded",
      "amount": 4900,
      "currency": "TRY",
      "provider": "mock",
      "providerTransactionId": "mock_txn_...",
      "paidAt": "2025-01-07T12:00:00Z"
    }
  }
}
```

---

## 🎨 UI Components

### PaymentCheckout Component

Payment flow UI'ı yönetir.

**Kullanım:**
```tsx
import PaymentCheckout from '@/components/Payment/PaymentCheckout'

<PaymentCheckout
  isOpen={showPayment}
  onClose={() => setShowPayment(false)}
  paymentIntent={paymentIntent}
  amount={4900}
  currency="TRY"
  description="İlan dopingi ödemesi"
  onSuccess={(result) => {
    console.log('Payment successful!', result)
    // Handle success
  }}
  onError={(error) => {
    console.error('Payment error', error)
    // Handle error
  }}
/>
```

**Özellikler:**
- ✅ Loading states
- ✅ Success/error handling
- ✅ Mock mode indicator
- ✅ Automatic payment simulation (mock mode)

### DopingModal Integration

DopingModal artık payment flow kullanıyor:

```tsx
// DopingModal içinde
const handlePurchase = async () => {
  // 1. Create payment intent
  const response = await fetch('/api/payments/create-intent', { ... })
  const intent = response.data.paymentIntent

  // 2. Show payment checkout
  setPaymentIntent(intent)
  setShowPaymentCheckout(true)
}

// Payment başarılı olduğunda
const handlePaymentSuccess = async (result) => {
  // 3. Apply doping to listing
  await fetch(`/api/listings/${listingId}`, {
    method: 'PATCH',
    body: JSON.stringify({ /* doping fields */ })
  })
}
```

---

## 🧪 Test

### Mock Provider Test

Mock provider'ı test etmek için:

```typescript
import { MockPaymentProvider } from '@/services/paymentService/providers/mockProvider'

const provider = new MockPaymentProvider()

// Create payment intent
const intent = await provider.createPaymentIntent({
  amount: 4900,
  currency: 'TRY',
  items: [{ id: 'test', name: 'Test Item', amount: 4900 }],
  customerEmail: 'test@example.com',
})

// Simulate payment success
const result = await provider.simulatePaymentSuccess(intent.id)
console.log(result.status) // 'succeeded'
```

---

## 🔐 Security

### Environment Variables

**Server-only (SECRET):**
- `STRIPE_SECRET_KEY` - ⚠️ Never expose to client
- `IYZICO_API_KEY` - ⚠️ Never expose to client
- `IYZICO_SECRET_KEY` - ⚠️ Never expose to client

**Client-safe:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Safe to expose
- `PAYMENT_PROVIDER` - Safe to expose

### Best Practices

1. **Never store payment data in database** - Use provider transaction IDs
2. **Always verify payments server-side** - Use webhooks
3. **Use HTTPS in production** - Required for payment providers
4. **Rate limiting** - Payment endpoints have strict rate limiting
5. **Logging** - All payment operations are logged (no sensitive data)

---

## 🚀 Production'a Geçiş

### Stripe'a Geçiş

1. **Stripe Account Oluştur**
   - https://dashboard.stripe.com/register

2. **Stripe SDK Ekle**
   ```bash
   npm install stripe @stripe/stripe-js
   ```

3. **Environment Variables Set Et**
   ```env
   PAYMENT_PROVIDER=stripe
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

4. **Stripe Provider'ı Implement Et**
   - `providers/stripeProvider.ts` dosyasındaki TODO'ları tamamla
   - Stripe SDK entegrasyonunu ekle

5. **Test Et**
   - Test mode'da test et (test keys kullan)
   - Production'a geçmeden önce kapsamlı test yap

### İyzico'ya Geçiş

1. **İyzico Account Oluştur**
   - https://dev.iyzipay.com/tr

2. **İyzico SDK Ekle**
   ```bash
   npm install iyzipay
   ```

3. **Environment Variables Set Et**
   ```env
   PAYMENT_PROVIDER=iyzico
   IYZICO_API_KEY=your-api-key
   IYZICO_SECRET_KEY=your-secret-key
   IYZICO_BASE_URL=https://api.iyzipay.com  # Production URL
   ```

4. **İyzico Provider'ı Implement Et**
   - `providers/iyzicoProvider.ts` dosyasındaki TODO'ları tamamla
   - İyzico SDK entegrasyonunu ekle

5. **Test Et**
   - Sandbox mode'da test et
   - Production'a geçmeden önce kapsamlı test yap

---

## 📊 Monitoring & Logging

### Logging

Tüm payment işlemleri loglanır:

```typescript
logger.debug('[PaymentService] Creating payment intent', { amount, currency })
logger.info('[PaymentService] Payment intent created', { id, status })
logger.error('[PaymentService] Payment error', { error })
```

### Metrics

Payment metrikleri için:
- Total payment attempts
- Success/failure rates
- Average payment amount
- Provider usage stats

---

## 🐛 Troubleshooting

### Mock Provider Çalışmıyor

**Problem:** Mock provider payment intent oluşturmuyor

**Çözüm:**
1. `PAYMENT_PROVIDER` env variable'ını kontrol et (mock olmalı veya set edilmemeli)
2. Console log'larını kontrol et
3. API route'larının çalıştığından emin ol

### Payment Intent Oluşturulamıyor

**Problem:** `POST /api/payments/create-intent` hata veriyor

**Çözüm:**
1. Auth check - Login olmuş musun?
2. Rate limiting - Çok fazla istek göndermiş olabilirsin
3. Validation - Request body doğru format'ta mı?

### Payment Doğrulanamıyor

**Problem:** `POST /api/payments/verify` hata veriyor

**Çözüm:**
1. Payment intent ID doğru mu?
2. Payment intent oluşturulmuş mu?
3. Mock provider'da payment simulation çalışıyor mu?

---

## 📚 İlgili Dosyalar

### Core Files
- `src/services/paymentService/types.ts` - Type definitions
- `src/services/paymentService/IPaymentProvider.ts` - Provider interface
- `src/services/paymentService/index.ts` - Main service

### Providers
- `src/services/paymentService/providers/mockProvider.ts` - Mock provider
- `src/services/paymentService/providers/stripeProvider.ts` - Stripe provider (placeholder)
- `src/services/paymentService/providers/iyzicoProvider.ts` - İyzico provider (placeholder)

### API Routes
- `src/app/api/payments/create-intent/route.ts` - Create payment intent
- `src/app/api/payments/verify/route.ts` - Verify payment

### UI Components
- `src/components/Payment/PaymentCheckout.tsx` - Payment checkout UI
- `src/components/MyListings/DopingModal.tsx` - Doping modal (payment integrated)

---

## ✅ Checklist

### Development (Mock Mode)
- [x] Mock provider implement edildi
- [x] Payment API routes oluşturuldu
- [x] Payment checkout component eklendi
- [x] DopingModal payment integration yapıldı
- [ ] Test utilities eklendi
- [ ] Documentation tamamlandı

### Production (Stripe/İyzico)
- [ ] Stripe account oluşturuldu
- [ ] Stripe SDK eklendi
- [ ] Stripe provider implement edildi
- [ ] İyzico account oluşturuldu
- [ ] İyzico SDK eklendi
- [ ] İyzico provider implement edildi
- [ ] Webhook handlers eklendi
- [ ] Payment history eklendi
- [ ] Refund management eklendi

---

**Son Güncelleme:** 7 Ocak 2025  
**Versiyon:** 1.0.0 (Mock Mode Ready)

