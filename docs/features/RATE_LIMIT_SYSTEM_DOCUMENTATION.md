# Rate Limit Sistemi Dokümantasyonu

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Sistem Mimarisi](#sistem-mimarisi)
3. [Güvenlik Özellikleri](#güvenlik-özellikleri)
4. [API Dokümantasyonu](#api-dokümantasyonu)
5. [Konfigürasyon](#konfigürasyon)
6. [Test Kapsamı](#test-kapsamı)
7. [Troubleshooting](#troubleshooting)
8. [Changelog](#changelog)

## 🎯 Genel Bakış

Benalsam projesi için geliştirilmiş **cross-platform rate limiting sistemi**. Bu sistem, kullanıcıların authentication işlemlerini güvenli hale getirmek için çoklu güvenlik katmanları sağlar.

### 🏆 Özellikler
- ✅ **Cross-platform rate limiting** (Web ↔ Mobile)
- ✅ **Progressive delay** (3s → 5s → 10s)
- ✅ **Account lockout** (10+ deneme = 1 saat)
- ✅ **Temporary blocks** (5+ deneme = 15 dakika)
- ✅ **Graceful fallbacks** (Network hatası durumunda)
- ✅ **Redis-based backend** (Merkezi veri yönetimi)
- ✅ **Local storage fallbacks** (Offline güvenlik)

## 🏗️ Sistem Mimarisi

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client  │    │ Admin Backend   │
│                 │    │                 │    │                 │
│ • Local Storage │    │ • AsyncStorage  │    │ • Redis         │
│ • Shared API    │    │ • Shared API    │    │ • Rate Limit    │
│ • Fallbacks     │    │ • Fallbacks     │    │ • API Routes    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Redis Cache   │
                    │                 │
                    │ • Rate Data     │
                    │ • Cross-Platform│
                    │ • Persistence   │
                    └─────────────────┘
```

### 🔄 Veri Akışı

1. **Client Request** → Rate limit kontrolü
2. **Local Check** → AsyncStorage/LocalStorage kontrolü
3. **Shared API** → Admin-backend'e istek
4. **Redis Check** → Merkezi rate limit kontrolü
5. **Response** → Client'a sonuç döndürme

## 🛡️ Güvenlik Özellikleri

### 1. Progressive Delay (İlerleyici Gecikme)
```
1. deneme: ✅ Anında
2. deneme: ✅ Anında  
3. deneme: ⏳ 3 saniye bekleme
4. deneme: ⏳ 5 saniye bekleme
5. deneme: ⏳ 10 saniye bekleme
```

### 2. Temporary Blocks (Geçici Bloklar)
```
5+ deneme (5 dakika içinde): 🔒 15 dakika blok
```

### 3. Account Lockout (Hesap Kilitleme)
```
10+ deneme (1 saat içinde): 🔒 1 saat hesap kilitleme
```

### 4. Cross-Platform Protection
```
Web'de 3 deneme + Mobile'da 2 deneme = 5 deneme (blok)
```

## 📡 API Dokümantasyonu

### Admin-Backend API Endpoints

#### 1. Rate Limit Kontrolü
```http
POST /api/v1/rate-limit/check
Content-Type: application/json

{
  "email": "user@example.com",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allowed": false,
    "error": "TOO_MANY_ATTEMPTS",
    "attempts": 5,
    "timeRemaining": 900,
    "message": "Çok fazla deneme! 15 dakika bekleyin."
  }
}
```

#### 2. Başarısız Deneme Kaydetme
```http
POST /api/v1/rate-limit/record-failed
Content-Type: application/json

{
  "email": "user@example.com",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recorded": true,
    "attempts": 6,
    "message": "Başarısız deneme kaydedildi"
  }
}
```

#### 3. Rate Limit Sıfırlama
```http
POST /api/v1/rate-limit/reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reset": true,
    "message": "Rate limit sıfırlandı"
  }
}
```

### Client-Side Services

#### Web (JavaScript)
```javascript
import { SharedRateLimitService } from '@/services/sharedRateLimitService';

const rateLimitService = new SharedRateLimitService();

// Rate limit kontrolü
const result = await rateLimitService.checkRateLimit('user@example.com');
if (!result.allowed) {
  console.log(`Bekleyin: ${result.timeRemaining} saniye`);
}

// Başarısız deneme kaydetme
await rateLimitService.recordFailedAttempt('user@example.com');
```

#### Mobile (React Native)
```typescript
import { rateLimitService } from '@/services/rateLimitService';

// Rate limit kontrolü
const result = await rateLimitService.checkRateLimit('user@example.com');
if (!result.allowed) {
  Alert.alert('Uyarı', result.message);
}

// Başarısız deneme kaydetme
await rateLimitService.recordFailedAttempt('user@example.com');
```

## ⚙️ Konfigürasyon

### Environment Variables

#### Admin-Backend
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limit Configuration
MAX_ATTEMPTS_PER_5MIN=5
MAX_ATTEMPTS_PER_HOUR=10
TEMP_BLOCK_MINUTES=15
ACCOUNT_LOCK_HOURS=1
PROGRESSIVE_DELAY_SECONDS=3
```

#### Web Client
```env
# API Configuration
VITE_ADMIN_BACKEND_URL=http://localhost:3002
VITE_RATE_LIMIT_ENABLED=true
```

#### Mobile Client
```env
# API Configuration
ADMIN_BACKEND_URL=http://192.168.1.100:3002
RATE_LIMIT_ENABLED=true
```

### Konfigürasyon Değerleri

| Parametre | Değer | Açıklama |
|-----------|-------|----------|
| `MAX_ATTEMPTS_PER_5MIN` | 5 | 5 dakika içinde maksimum deneme |
| `MAX_ATTEMPTS_PER_HOUR` | 10 | 1 saat içinde maksimum deneme |
| `TEMP_BLOCK_MINUTES` | 15 | Geçici blok süresi (dakika) |
| `ACCOUNT_LOCK_HOURS` | 1 | Hesap kilitleme süresi (saat) |
| `PROGRESSIVE_DELAY_SECONDS` | 3 | İlerleyici gecikme başlangıç (saniye) |

## 🧪 Test Kapsamı

### Test Coverage

| Paket | Test Sayısı | Coverage | Durum |
|-------|-------------|----------|-------|
| Admin-Backend | 161 | %100 | ✅ PASS |
| Web | 62 | %100 | ✅ PASS |
| Mobile Rate Limit | 13 | %100 | ✅ PASS |

### Test Senaryoları

#### 1. Brute Force Saldırıları
```typescript
// 5 deneme sonrası blok
expect(result.allowed).toBe(false);
expect(result.error).toBe('TOO_MANY_ATTEMPTS');
expect(result.timeRemaining).toBeGreaterThan(0);
```

#### 2. Cross-Platform Saldırıları
```typescript
// Web'de 3 deneme + Mobile'da 2 deneme = 5 deneme
expect(result.allowed).toBe(false);
expect(result.attempts).toBe(5);
```

#### 3. Progressive Delay
```typescript
// 3. deneme sonrası 3 saniye bekleme
expect(result.error).toBe('PROGRESSIVE_DELAY');
expect(result.timeRemaining).toBe(3);
```

#### 4. Network Güvenlik
```typescript
// API çalışmasa bile güvenlik
expect(result.allowed).toBe(true);
expect(result.message).toBe('Network error - allowing request');
```

### Test Çalıştırma

```bash
# Admin-Backend testleri
cd packages/admin-backend && npm test

# Web testleri  
cd packages/web && npm test

# Mobile testleri
cd packages/mobile && npm test
```

## 🔧 Troubleshooting

### Yaygın Sorunlar

#### 1. Redis Bağlantı Hatası
```
🔴 [Redis] Failed to initialize: TypeError: Cannot read properties of undefined
```

**Çözüm:**
```bash
# Redis servisini kontrol et
docker ps | grep redis

# Redis'i yeniden başlat
docker restart redis
```

#### 2. Cross-Platform Veri Paylaşımı Çalışmıyor
```
Web'de 3 deneme yaptım ama mobile'da 0 görünüyor
```

**Çözüm:**
```bash
# Admin-backend'in çalıştığını kontrol et
curl http://localhost:3002/api/v1/health

# Redis'te veri var mı kontrol et
docker exec -it redis redis-cli
> KEYS *rate_limit*
```

#### 3. Progressive Delay Çalışmıyor
```
3. deneme sonrası bekleme yok
```

**Çözüm:**
```javascript
// Client'ta timeRemaining kontrolü ekle
if (result.timeRemaining > 0) {
  setTimeout(() => {
    // İşlemi tekrar dene
  }, result.timeRemaining * 1000);
}
```

### Debug Logları

#### Admin-Backend
```bash
# Debug loglarını aktifleştir
DEBUG=rate-limit npm start
```

#### Web Client
```javascript
// Console'da debug logları
console.log('🛡️ [SharedRateLimit] Check result:', result);
```

#### Mobile Client
```typescript
// Debug logları
console.log('🛡️ [RateLimit] Checking for:', email);
```

## 📝 Changelog

### v1.0.0 (2025-08-03)
- ✅ Cross-platform rate limiting sistemi
- ✅ Redis-based backend
- ✅ Progressive delay mekanizması
- ✅ Account lockout sistemi
- ✅ Temporary blocks
- ✅ Graceful fallbacks
- ✅ Comprehensive test coverage
- ✅ API dokümantasyonu

### Gelecek Özellikler
- 🔄 IP-based rate limiting
- 🔄 Geographic rate limiting
- 🔄 Machine learning-based anomaly detection
- 🔄 Real-time monitoring dashboard

## 📞 Destek

### Teknik Destek
- **Email:** tech@benalsam.com
- **Slack:** #rate-limit-support
- **GitHub Issues:** [Rate Limit Issues](https://github.com/benalsam/rate-limit/issues)

### Dokümantasyon
- **API Docs:** `/docs/api/rate-limit`
- **Integration Guide:** `/docs/integration/rate-limit`
- **Security Guide:** `/docs/security/rate-limit`

---

**Son Güncelleme:** 2025-08-03  
**Versiyon:** 1.0.0  
**Durum:** Production Ready ✅ 