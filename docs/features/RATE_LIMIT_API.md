# Rate Limit API Dokümantasyonu

## 📡 API Endpoints

### Base URL
```
http://localhost:3002/api/v1/rate-limit
```

## 🔍 Rate Limit Kontrolü

### POST `/check`

Rate limit durumunu kontrol eder.

#### Request
```http
POST /api/v1/rate-limit/check
Content-Type: application/json

{
  "email": "user@example.com",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "ip": "192.168.1.1"
}
```

#### Response - İzin Verildi
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "timeRemaining": 0,
    "attempts": 2
  }
}
```

#### Response - Progressive Delay
```json
{
  "success": true,
  "data": {
    "allowed": false,
    "error": "PROGRESSIVE_DELAY",
    "timeRemaining": 3,
    "attempts": 3,
    "message": "Çok hızlı deneme! 3 saniye bekleyin."
  }
}
```

#### Response - Geçici Blok
```json
{
  "success": true,
  "data": {
    "allowed": false,
    "error": "TOO_MANY_ATTEMPTS",
    "timeRemaining": 900,
    "attempts": 5,
    "message": "Çok fazla deneme! 15 dakika bekleyin."
  }
}
```

#### Response - Hesap Kilitleme
```json
{
  "success": true,
  "data": {
    "allowed": false,
    "error": "ACCOUNT_LOCKED",
    "timeRemaining": 3600,
    "attempts": 10,
    "message": "Hesabınız güvenlik nedeniyle kilitlendi. 1 saat sonra tekrar deneyin."
  }
}
```

## 📝 Başarısız Deneme Kaydetme

### POST `/record-failed`

Başarısız authentication denemesini kaydeder.

#### Request
```http
POST /api/v1/rate-limit/record-failed
Content-Type: application/json

{
  "email": "user@example.com",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "ip": "192.168.1.1"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "recorded": true,
    "attempts": 3,
    "message": "Başarısız deneme kaydedildi"
  }
}
```

## 🔄 Rate Limit Sıfırlama

### POST `/reset`

Kullanıcının rate limit verilerini sıfırlar.

#### Request
```http
POST /api/v1/rate-limit/reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "reset": true,
    "message": "Rate limit sıfırlandı"
  }
}
```

## 📊 Rate Limit Durumu

### GET `/status`

Kullanıcının rate limit durumunu döndürür.

#### Request
```http
GET /api/v1/rate-limit/status?email=user@example.com
```

#### Response
```json
{
  "success": true,
  "data": {
    "attempts": 2,
    "blocked": false,
    "timeRemaining": 0,
    "nextResetTime": 1640995200000
  }
}
```

## ⚠️ Hata Kodları

### HTTP Status Codes
- `200` - Başarılı
- `400` - Geçersiz request
- `429` - Rate limit aşıldı
- `500` - Server hatası

### Error Types
- `PROGRESSIVE_DELAY` - İlerleyici gecikme
- `TOO_MANY_ATTEMPTS` - Çok fazla deneme
- `ACCOUNT_LOCKED` - Hesap kilitleme
- `NETWORK_ERROR` - Network hatası

## 🔧 Client Implementation

### JavaScript/TypeScript
```typescript
class RateLimitAPI {
  private baseURL = 'http://localhost:3002/api/v1/rate-limit';

  async checkRateLimit(email: string): Promise<RateLimitResult> {
    const response = await fetch(`${this.baseURL}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        userAgent: navigator.userAgent,
        ip: await this.getClientIP(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async recordFailedAttempt(email: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/record-failed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        userAgent: navigator.userAgent,
        ip: await this.getClientIP(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  async resetRateLimit(email: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private async getClientIP(): Promise<string> {
    // Client IP detection logic
    return '192.168.1.1';
  }
}
```

### React Native
```typescript
class RateLimitAPI {
  private baseURL = 'http://192.168.1.100:3002/api/v1/rate-limit';

  async checkRateLimit(email: string): Promise<RateLimitResult> {
    try {
      const response = await fetch(`${this.baseURL}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userAgent: 'Expo/1017699 CFNetwork/3826.500.131 Darwin/24.5.0',
          ip: await this.getClientIP(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fallback to local storage
      return this.getLocalRateLimit(email);
    }
  }

  private async getClientIP(): Promise<string> {
    // React Native IP detection logic
    return '192.168.1.1';
  }

  private async getLocalRateLimit(email: string): Promise<RateLimitResult> {
    // Local storage fallback implementation
    return {
      allowed: true,
      timeRemaining: 0,
      attempts: 0,
    };
  }
}
```

## 📊 Monitoring

### Log Format
```json
{
  "timestamp": "2025-08-03T10:30:00.000Z",
  "level": "info",
  "service": "rate-limit",
  "action": "check",
  "email": "user@example.com",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "result": {
    "allowed": false,
    "error": "TOO_MANY_ATTEMPTS",
    "attempts": 5,
    "timeRemaining": 900
  }
}
```

### Metrics
- `rate_limit_checks_total` - Toplam kontrol sayısı
- `rate_limit_blocks_total` - Toplam blok sayısı
- `rate_limit_attempts_avg` - Ortalama deneme sayısı
- `rate_limit_response_time_avg` - Ortalama response süresi

## 🔒 Güvenlik

### Rate Limiting
- **5 deneme/5 dakika** - Geçici blok
- **10 deneme/1 saat** - Hesap kilitleme
- **Cross-platform** - Web + Mobile toplam

### IP Tracking
- Client IP adresi kaydedilir
- User-Agent bilgisi saklanır
- Geographic location (opsiyonel)

### Data Privacy
- Email hash'lenerek saklanır
- GDPR uyumlu veri saklama
- 30 gün sonra otomatik temizlik

---

**API Version:** v1.0.0  
**Last Updated:** 2025-08-03  
**Status:** Production Ready ✅ 