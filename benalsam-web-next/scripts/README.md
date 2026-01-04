# Test Scripts

## test-api-improvements.sh

Bu script, server code quality iyileştirmelerini test eder.

### Kullanım

```bash
# Server çalışırken test et
npm run dev  # Terminal 1
npm run test:api  # Terminal 2
```

### Test Edilenler

1. **API Validation Tests**
   - Invalid UUID format
   - Auth-protected endpoints (401 expected)

2. **Error Handling Tests**
   - Unauthorized requests (401)
   - Not found errors (404)
   - Error response format validation

### Notlar

- **Auth-protected endpoints**: Validation'dan önce auth kontrolü yapıldığı için 401 döner. Bu doğru güvenlik davranışıdır.
- **Build test**: Sandbox kısıtlamaları nedeniyle skip edilir. Manuel olarak `npm run build` ile test edin.

### Beklenen Sonuçlar

- ✅ Invalid UUID → 400 (validation error)
- ✅ Unauthorized requests → 401 (auth error)
- ✅ Not found → 404 (resource error)
- ✅ Error responses standart format

### Manuel Testler

Browser'da şunları test edin:
- Listing creation form (geçersiz veri)
- Network tab'da error response formatı
- Console'da logger çıktısı

