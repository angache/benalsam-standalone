# Server Code Quality Improvements - Test Rehberi

Bu rehber, yapılan iyileştirmelerin nasıl test edileceğini açıklar.

## 🧪 Test Adımları

### 1. TypeScript Build Test

```bash
cd benalsam-web-next
npm run build
```

**Beklenen Sonuç:**
- ✅ Build başarılı olmalı (0 TypeScript hatası)
- ❌ Eğer hata varsa, `ignoreBuildErrors: false` nedeniyle build başarısız olur

### 2. API Route Validation Testleri

#### Test 1: Listing Creation (Validation)
```bash
# Geçersiz veri ile test
curl -X POST http://localhost:3000/api/listings/create \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "ab",
    "description": "short"
  }'
```

**Beklenen Sonuç:**
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Validation failed",
    "errors": [
      {
        "field": "title",
        "message": "Başlık en az 3 karakter olmalıdır",
        "code": "too_small"
      },
      {
        "field": "description",
        "message": "Açıklama en az 10 karakter olmalıdır",
        "code": "too_small"
      }
    ],
    "timestamp": "2025-01-XX...",
    "path": "/api/listings/create"
  }
}
```

#### Test 2: Geçersiz UUID
```bash
curl -X GET http://localhost:3000/api/listings/invalid-uuid
```

**Beklenen Sonuç:**
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Invalid route parameters",
    "errors": [
      {
        "field": "params.listingId",
        "message": "Invalid UUID format",
        "code": "invalid_string"
      }
    ]
  }
}
```

### 3. Error Handling Standardization Testleri

#### Test 3: Unauthorized Request
```bash
# Auth olmadan listing oluşturma
curl -X POST http://localhost:3000/api/listings/create \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "description": "Test description"}'
```

**Beklenen Sonuç:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Oturum açmanız gerekiyor",
    "timestamp": "2025-01-XX...",
    "path": "/api/listings/create"
  }
}
```

#### Test 4: Not Found
```bash
curl -X GET http://localhost:3000/api/listings/00000000-0000-0000-0000-000000000000
```

**Beklenen Sonuç:**
```json
{
  "success": false,
  "error": {
    "code": "RES_001",
    "message": "İlan not found",
    "timestamp": "2025-01-XX...",
    "path": "/api/listings/..."
  }
}
```

#### Test 5: Database Error (Sanitized)
```bash
# Geçersiz veri ile database hatası tetikleme
# (Örnek: çok uzun string, constraint violation)
```

**Beklenen Sonuç:**
- Kullanıcıya: Generic mesaj ("Veritabanı işlemi sırasında bir hata oluştu")
- Log'da: Detaylı error bilgisi (code, message, details, hint)

### 4. Logger Testleri

#### Test 6: Production Logging
```bash
# Development mode
NODE_ENV=development npm run dev

# Production mode
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

**Beklenen Sonuç:**
- Development: Tüm loglar görünür (debug, info, warn, error)
- Production: Sadece error logları görünür

### 5. Success Response Format Testi

#### Test 7: Başarılı Response
```bash
# Geçerli listing oluşturma
curl -X POST http://localhost:3000/api/listings/create \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Test İlan",
    "description": "Bu bir test ilanıdır",
    "category": 1,
    "location": "İstanbul",
    "acceptTerms": true
  }'
```

**Beklenen Sonuç:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Test İlan",
    "status": "pending_approval",
    "message": "İlanınız başarıyla oluşturuldu!..."
  }
}
```

### 6. Integration Testleri

#### Test 8: Favorites API
```bash
# Add favorite (validation test)
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"listingId": "invalid-uuid"}'

# Remove favorite (query param validation)
curl -X DELETE "http://localhost:3000/api/favorites?listingId=invalid-uuid" \
  -H "Cookie: your-auth-cookie"
```

#### Test 9: Auth Register (Password Validation)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "short",
    "passwordConfirm": "short",
    "acceptTerms": true
  }'
```

**Beklenen Sonuç:**
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Validation failed",
    "errors": [
      {
        "field": "password",
        "message": "Password must be at least 8 characters",
        "code": "too_small"
      }
    ]
  }
}
```

### 7. Error Message Sanitization Testi

#### Test 10: Database Error Sanitization
```bash
# Bir database constraint violation tetikle
# (Örnek: duplicate email, foreign key violation)
```

**Kontrol:**
1. API response'da generic mesaj olmalı
2. Server loglarında detaylı error bilgisi olmalı
3. Hassas bilgiler (SQL queries, stack traces) response'da olmamalı

### 8. Manual Browser Testing

1. **Listing Creation Form:**
   - Geçersiz veri gir → Validation error görmeli
   - Network tab'da error response formatını kontrol et

2. **Error Pages:**
   - 404 sayfası → Standart error format
   - 500 error → Generic mesaj (detaylı error log'da)

3. **Console Logs:**
   - Development: Tüm loglar görünür
   - Production build: Sadece error logları

## 🔍 Test Checklist

- [ ] TypeScript build başarılı (0 error)
- [ ] Validation errors doğru format
- [ ] Error codes doğru kategorilerde
- [ ] Success responses standart format
- [ ] Error messages sanitized (generic)
- [ ] Detaylı errors sadece log'da
- [ ] Logger production'da sadece error gösteriyor
- [ ] Tüm API routes standart error handling kullanıyor

## 🐛 Debugging

### Validation Error Debugging
```typescript
// api-validation.ts'de logger.debug ekleyerek
// validation sürecini izleyebilirsiniz
```

### Error Response Debugging
```typescript
// api-errors.ts'de logContext kullanarak
// ek debug bilgisi ekleyebilirsiniz
```

## 📊 Test Coverage

Şu anki test coverage:
- ✅ TypeScript type checking
- ✅ API validation
- ✅ Error handling
- ⚠️ Unit tests (henüz yok - gelecekte eklenebilir)
- ⚠️ Integration tests (henüz yok - gelecekte eklenebilir)

## 🚀 Production Deployment Öncesi

1. ✅ Build test geçti
2. ✅ Tüm API routes test edildi
3. ✅ Error messages sanitized
4. ✅ Logger production mode'da test edildi
5. ✅ TypeScript strict mode aktif
