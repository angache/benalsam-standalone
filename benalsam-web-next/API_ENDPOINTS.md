# 📚 Benalsam Web Next.js API Documentation

**Son Güncelleme:** 2025-01-XX  
**Versiyon:** 1.0.0  
**Base URL:** `/api`  
**Toplam Endpoint Sayısı:** 24

---

## 📋 **GENEL BİLGİLER**

### **Base URL**
```
Production: https://benalsam.com/api
Development: http://localhost:3000/api
```

### **Authentication**
Çoğu endpoint JWT token authentication gerektirir. Token, Supabase session'dan otomatik olarak alınır.

```typescript
// Server-side authentication
const user = await getServerUser()
if (!user?.id) {
  return apiErrors.unauthorized('Oturum açmanız gerekiyor')
}
```

### **Rate Limiting**
- **Standard:** 100 requests/minute
- **Strict:** 10 requests/minute (2FA, listing creation)
- **Messaging:** 60 requests/minute

### **Error Format**
Tüm hatalar standart formatta döner:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Hata mesajı",
    "details": {},
    "path": "/api/endpoint"
  }
}
```

### **Success Format**
```json
{
  "success": true,
  "data": { ... }
}
```

---

## 🔐 **AUTHENTICATION & SECURITY**

### **POST /api/auth/register**
Kullanıcı kaydı oluşturur.

**Auth:** Gereksiz (public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

**Status Codes:**
- `200`: Kayıt başarılı
- `400`: Validation hatası
- `409`: Email zaten kullanılıyor

---

## 🔒 **TWO-FACTOR AUTHENTICATION (2FA)**

### **POST /api/2fa/setup**
2FA setup için QR code ve secret oluşturur.

**Auth:** Gerekli

**Rate Limiting:** Strict (10 req/min)

**Request Body:** Yok

**Response:**
```json
{
  "success": true,
  "data": {
    "secret": "base32_secret",
    "qrCode": "data:image/png;base64,...",
    "backupCodes": ["code1", "code2", ...]
  }
}
```

---

### **POST /api/2fa/verify**
2FA kodunu doğrular (login veya setup sırasında).

**Auth:** Opsiyonel (login flow'da userId gerekli)

**Rate Limiting:** Strict (10 req/min)

**Request Body:**
```json
{
  "code": "123456",
  "userId": "uuid" // Opsiyonel, login flow için
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Kod doğrulandı",
    "verified": true
  }
}
```

**Status Codes:**
- `200`: Kod doğrulandı
- `400`: Geçersiz kod formatı
- `401`: Kod yanlış veya kullanıcı bulunamadı
- `429`: Rate limit aşıldı

---

### **POST /api/2fa/enable**
2FA'yı aktifleştirir.

**Auth:** Gerekli

**Rate Limiting:** Strict (10 req/min)

**Request Body:** Yok

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "2FA başarıyla aktifleştirildi"
  }
}
```

---

### **POST /api/2fa/disable**
2FA'yı devre dışı bırakır.

**Auth:** Gerekli

**Rate Limiting:** Standard (100 req/min)

**Request Body:**
```json
{
  "password": "user_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "2FA başarıyla devre dışı bırakıldı"
  }
}
```

---

## 📋 **LISTINGS**

### **GET /api/listings**
İlanları listeler (filtreleme ve sayfalama ile).

**Auth:** Gereksiz (public)

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `category` (string/number, optional)
- `minPrice` (number, optional)
- `maxPrice` (number, optional)
- `city` (string, optional)
- `sortBy` (string: 'newest' | 'price_low' | 'price_high' | 'popular', optional)
- `search` (string, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "uuid",
        "title": "İlan Başlığı",
        "description": "Açıklama",
        "price": 1000,
        "category": "Kategori",
        "location": "İstanbul",
        "images": ["url1", "url2"],
        "user": {
          "id": "uuid",
          "name": "User Name",
          "avatar_url": "url"
        },
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

### **GET /api/listings/[listingId]**
Tek ilan detayını getirir.

**Auth:** Gereksiz (public)

**Path Parameters:**
- `listingId` (string, UUID)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "İlan Başlığı",
    "description": "Detaylı açıklama",
    "price": 1000,
    "category": "Kategori",
    "location": "İstanbul",
    "images": ["url1", "url2"],
    "user": {
      "id": "uuid",
      "name": "User Name",
      "avatar_url": "url",
      "rating": 4.5,
      "total_ratings": 10
    },
    "is_favorited": false,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### **POST /api/listings/create**
Yeni ilan oluşturur.

**Auth:** Gerekli

**Rate Limiting:** Strict (10 req/min)

**Request Body:**
```json
{
  "title": "İlan Başlığı",
  "description": "Açıklama (min 10, max 5000 karakter)",
  "category": "category_id_or_name",
  "budget": 1000,
  "location": "İstanbul",
  "urgency": "normal", // "very_urgent" | "urgent" | "normal" | "not_urgent"
  "condition": ["İkinci El"],
  "attributes": {},
  "images": [
    { "uri": "https://..." },
    { "url": "https://..." },
    "https://..."
  ],
  "mainImageIndex": 0,
  "premiumFeatures": {
    "is_featured": false,
    "is_urgent_premium": false,
    "is_showcase": false,
    "has_bold_border": false
  },
  "geolocation": {
    "lat": 41.0082,
    "lng": 28.9784
  },
  "contactPreference": "site_message", // "site_message" | "phone" | "email"
  "autoRepublish": false,
  "acceptTerms": true // Zorunlu
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "İlan Başlığı",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Status Codes:**
- `200`: İlan oluşturuldu
- `400`: Validation hatası
- `401`: Authentication gerekli
- `429`: Rate limit aşıldı

---

### **GET /api/listings/my-listings**
Kullanıcının kendi ilanlarını listeler.

**Auth:** Gerekli

**Query Parameters:** Yok

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "İlan Başlığı",
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

## ⭐ **FAVORITES**

### **POST /api/favorites**
Favorilere ekler.

**Auth:** Gerekli

**Rate Limiting:** Standard (100 req/min)

**Request Body:**
```json
{
  "listingId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "favorite_uuid",
    "user_id": "uuid",
    "listing_id": "uuid",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Status Codes:**
- `200`: Favori eklendi
- `400`: Validation hatası veya zaten favorilerde
- `401`: Authentication gerekli
- `404`: İlan bulunamadı

---

### **DELETE /api/favorites**
Favorilerden çıkarır.

**Auth:** Gerekli

**Rate Limiting:** Standard (100 req/min)

**Request Body:**
```json
{
  "listingId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Favori başarıyla silindi"
  }
}
```

---

### **GET /api/favorites/list**
Kullanıcının favorilerini listeler.

**Auth:** Gerekli

**Query Parameters:** Yok

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "İlan Başlığı",
      "price": 1000,
      "images": ["url1"],
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### **POST /api/favorites/check**
İlanın favorilerde olup olmadığını kontrol eder.

**Auth:** Gerekli

**Rate Limiting:** Standard (100 req/min)

**Request Body:**
```json
{
  "listingId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isFavorite": true
  }
}
```

---

## 💬 **MESSAGING**

### **GET /api/messages**
Kullanıcının mesajlarını getirir.

**Auth:** Gerekli

**Rate Limiting:** Messaging (60 req/min)

**Query Parameters:**
- `userId` (string, UUID) - Authenticated user'ın ID'si ile eşleşmeli

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender_id": "uuid",
      "content": "Mesaj içeriği",
      "is_read": false,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Mesajlar getirildi
- `400`: Validation hatası
- `401`: Authentication gerekli
- `403`: Sadece kendi mesajlarınızı görüntüleyebilirsiniz
- `429`: Rate limit aşıldı

---

### **POST /api/messages**
Yeni mesaj gönderir.

**Auth:** Gerekli

**Rate Limiting:** Messaging (60 req/min)

**Request Body:**
```json
{
  "conversationId": "uuid",
  "content": "Mesaj içeriği",
  "listingId": "uuid" // Opsiyonel
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender_id": "uuid",
    "content": "Mesaj içeriği",
    "is_read": false,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Status Codes:**
- `200`: Mesaj gönderildi
- `400`: Validation hatası
- `401`: Authentication gerekli
- `403`: Bu konuşmaya katılamazsınız
- `429`: Rate limit aşıldı

---

### **POST /api/messages/mark-read**
Mesajları okundu olarak işaretler.

**Auth:** Gerekli

**Rate Limiting:** Standard (100 req/min)

**Request Body:**
```json
{
  "messageIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Mesajlar okundu olarak işaretlendi"
  }
}
```

---

### **GET /api/messages/unread-count**
Okunmamış mesaj sayısını getirir.

**Auth:** Gerekli

**Query Parameters:** Yok

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

## 👥 **CONVERSATIONS**

### **GET /api/conversations/[conversationId]**
Konuşma detayını getirir.

**Auth:** Gerekli

**Path Parameters:**
- `conversationId` (string, UUID)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "listing_id": "uuid",
    "participants": [
      {
        "id": "uuid",
        "name": "User Name",
        "avatar_url": "url"
      }
    ],
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### **GET /api/conversations/[conversationId]/messages**
Konuşma mesajlarını getirir.

**Auth:** Gerekli

**Path Parameters:**
- `conversationId` (string, UUID)

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sender_id": "uuid",
      "content": "Mesaj içeriği",
      "is_read": false,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

## 👤 **PROFILES**

### **GET /api/profiles/[userId]**
Kullanıcı profilini getirir.

**Auth:** Gereksiz (public)

**Path Parameters:**
- `userId` (string, UUID)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "User Name",
    "avatar_url": "url",
    "rating": 4.5,
    "total_ratings": 10,
    "total_listings": 25,
    "member_since": "2024-01-01T00:00:00Z"
  }
}
```

---

### **POST /api/profiles/[userId]/follow**
Kullanıcıyı takip eder/takipten çıkarır.

**Auth:** Gerekli

**Path Parameters:**
- `userId` (string, UUID)

**Request Body:** Yok

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Kullanıcı takip edildi",
    "isFollowing": true
  }
}
```

---

## 🏷️ **CATEGORIES**

### **GET /api/categories/popular**
Popüler kategorileri getirir.

**Auth:** Gereksiz (public)

**Query Parameters:**
- `limit` (number, default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Kategori Adı",
      "icon": "icon_name",
      "listing_count": 100
    }
  ]
}
```

---

## 🤖 **AI SUGGESTIONS**

### **GET /api/ai-suggestions**
AI önerilerini getirir.

**Auth:** Gereksiz (public)

**Query Parameters:**
- `query` (string, required)
- `limit` (number, default: 5)

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "text": "Öneri metni",
        "type": "category" | "listing" | "search"
      }
    ]
  }
}
```

---

## 📊 **STATS**

### **GET /api/stats**
Genel istatistikleri getirir.

**Auth:** Gereksiz (public)

**Query Parameters:** Yok

**Response:**
```json
{
  "success": true,
  "data": {
    "totalListings": 2500,
    "totalCategories": 50,
    "totalUsers": 1000,
    "activeListings": 2000
  }
}
```

---

## 🔍 **SEARCH TRACKING**

### **POST /api/track-search**
Arama sorgusunu kaydeder (analytics için).

**Auth:** Gereksiz (public)

**Rate Limiting:** Standard (100 req/min)

**Request Body:**
```json
{
  "query": "arama sorgusu",
  "filters": {
    "category": "category_id",
    "minPrice": 100,
    "maxPrice": 1000
  },
  "resultsCount": 25
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Arama kaydedildi"
  }
}
```

---

## 📈 **PERFORMANCE METRICS**

### **POST /api/performance/metrics**
Performance metriklerini kaydeder (Web Vitals).

**Auth:** Opsiyonel (anonymous tracking desteklenir)

**Request Body:**
```json
{
  "route": "/ilan/123",
  "timestamp": "2025-01-01T00:00:00Z",
  "metrics": {
    "lcp": 2500,
    "fid": 200,
    "cls": 0.1,
    "ttfb": 800,
    "fcp": 1800
  },
  "score": 85,
  "userAgent": "Mozilla/5.0...",
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Performance metrics recorded",
    "alerts": [] // Threshold violations varsa
  }
}
```

---

### **GET /api/performance/metrics**
Performance metriklerini getirir (admin only).

**Auth:** Gerekli (admin/moderator)

**Query Parameters:**
- `route` (string, optional)
- `limit` (number, default: 100)
- `offset` (number, default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "id": "uuid",
        "route": "/ilan/123",
        "lcp": 2500,
        "cls": 0.1,
        "score": 85,
        "timestamp": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 1000,
    "limit": 100,
    "offset": 0
  }
}
```

---

## 🔄 **CHANGELOG**

### **2025-01-XX**
- ✅ Performance metrics endpoint eklendi
- ✅ API response time tracking eklendi
- ✅ Rate limiting tüm kritik endpoint'lere eklendi
- ✅ Validation tüm endpoint'lere eklendi
- ✅ Standart error format uygulandı

---

## 📝 **NOTLAR**

1. **Rate Limiting:** Rate limit aşıldığında `429 Too Many Requests` döner.
2. **Validation:** Tüm request body ve query parametreleri Zod schema ile validate edilir.
3. **Error Handling:** Tüm hatalar `apiErrors` helper fonksiyonları ile standart formatta döner.
4. **Authentication:** `getServerUser()` fonksiyonu Supabase session'dan kullanıcı bilgisini alır.
5. **Database:** Tüm database işlemleri `supabaseAdmin` client'ı ile yapılır (server-side only).

---

## 🚨 **ENDPOINT DOKÜMANTASYON KURALLARI**

**Bu kurallar proje kalitesi için kritik öneme sahiptir:**

1. **Yeni endpoint eklendiğinde:**
   - Bu dosyayı güncelle
   - Endpoint'i doğru kategoriye ekle
   - Auth gereksinimlerini belirt
   - Rate limiting bilgisini ekle
   - Request/response örnekleri ekle
   - Changelog'a ekle

2. **Endpoint değiştirildiğinde:**
   - Bu dosyayı güncelle
   - Breaking change'leri belirt
   - Changelog'a ekle

3. **Endpoint kaldırıldığında:**
   - Bu dosyadan kaldır
   - Changelog'a ekle
   - Deprecated olarak işaretle

**Bu kurallar her geliştirici için zorunludur! 🎯**


