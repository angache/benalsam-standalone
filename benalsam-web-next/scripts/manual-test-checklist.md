# Manual Test Checklist

Bu checklist, yapılan iyileştirmeleri manuel olarak test etmek için kullanılır.

## ✅ Test Checklist

### 1. TypeScript Build Test
- [ ] `cd benalsam-web-next && npm run build`
- [ ] Build başarılı olmalı (0 TypeScript hatası)
- [ ] `ignoreBuildErrors: false` aktif olduğunu doğrula

### 2. API Validation Tests

#### Listing Creation Validation
- [ ] Geçersiz title (2 karakter) → Validation error
- [ ] Geçersiz description (5 karakter) → Validation error
- [ ] Missing required fields → Validation error
- [ ] Invalid UUID format → Validation error
- [ ] Network tab'da error response formatını kontrol et

#### Favorites API Validation
- [ ] Invalid listingId (non-UUID) → Validation error
- [ ] Missing listingId → Validation error

#### Auth Register Validation
- [ ] Short password (< 8 chars) → Validation error
- [ ] Password mismatch → Validation error
- [ ] Invalid email → Validation error
- [ ] Missing acceptTerms → Validation error

### 3. Error Handling Standardization

#### Error Response Format
- [ ] Tüm error responses'da `success: false` var mı?
- [ ] Error object'te `code`, `message`, `timestamp`, `path` var mı?
- [ ] Error codes doğru kategorilerde mi? (AUTH_001, VAL_001, RES_001, etc.)

#### Success Response Format
- [ ] Tüm success responses'da `success: true` var mı?
- [ ] Data `data` field'ında mı?
- [ ] Meta bilgileri (pagination) doğru mu?

### 4. Error Message Sanitization

#### Database Errors
- [ ] Kullanıcıya generic mesaj gösteriliyor mu?
- [ ] Detaylı error bilgisi sadece log'da mı?
- [ ] SQL queries response'da görünmüyor mu?

#### Internal Errors
- [ ] Stack traces response'da görünmüyor mu?
- [ ] Generic "Bir hata oluştu" mesajı gösteriliyor mu?

### 5. Logger Tests

#### Development Mode
- [ ] `npm run dev` → Tüm loglar görünüyor mu?
- [ ] Debug, info, warn, error logları çalışıyor mu?

#### Production Mode
- [ ] `npm run build && NODE_ENV=production npm start`
- [ ] Sadece error logları görünüyor mu?
- [ ] Debug/info logları gizleniyor mu?

### 6. Browser Console Tests

#### Network Tab
- [ ] API responses standart format mı?
- [ ] Error responses doğru HTTP status code'ları mı?
- [ ] Validation errors detaylı field errors içeriyor mu?

#### Console Logs
- [ ] Development: Tüm loglar görünüyor
- [ ] Production build: Sadece error logları

### 7. Specific API Route Tests

#### POST /api/listings/create
- [ ] ✅ Valid data → Success response
- [ ] ❌ Invalid data → Validation error
- [ ] ❌ Unauthorized → AUTH_001 error
- [ ] ❌ Database error → Sanitized error message

#### GET /api/listings
- [ ] ✅ Valid query params → Success with pagination
- [ ] ❌ Invalid query params → Validation error

#### GET /api/listings/[listingId]
- [ ] ✅ Valid UUID → Success
- [ ] ❌ Invalid UUID → Validation error
- [ ] ❌ Not found → RES_001 error

#### POST /api/favorites
- [ ] ✅ Valid listingId → Success
- [ ] ❌ Invalid listingId → Validation error
- [ ] ❌ Unauthorized → AUTH_001 error

#### POST /api/auth/register
- [ ] ✅ Valid data → Success
- [ ] ❌ Invalid email → Validation error
- [ ] ❌ Short password → Validation error
- [ ] ❌ Password mismatch → Validation error
- [ ] ❌ Duplicate email → DUPLICATE_ENTRY error

### 8. Error Code Categories

- [ ] AUTH_* codes → 401/403 status
- [ ] VAL_* codes → 400 status
- [ ] RES_* codes → 404/409 status
- [ ] SRV_* codes → 500/429 status
- [ ] BIZ_* codes → 400 status

## 🐛 Debugging Tips

### Validation Errors
```typescript
// Browser console'da network tab'ı aç
// Failed request'e tıkla → Response tab'ına bak
// Error formatını kontrol et
```

### Logger Debugging
```bash
# Development mode'da tüm logları görmek için
NODE_ENV=development npm run dev

# Production mode'da sadece error logları
NODE_ENV=production npm run build && npm start
```

### Error Response Debugging
```typescript
// api-errors.ts'de logContext kullanarak
// ek debug bilgisi ekleyebilirsiniz
apiErrors.internalError('Message', { debug: 'info' }, path)
```

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

TypeScript Build: [ ] Pass [ ] Fail
API Validation: [ ] Pass [ ] Fail
Error Handling: [ ] Pass [ ] Fail
Error Sanitization: [ ] Pass [ ] Fail
Logger: [ ] Pass [ ] Fail

Notes:
_______________________________________
_______________________________________
```

