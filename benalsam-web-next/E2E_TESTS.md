# 🧪 E2E Tests - Çalıştırma Rehberi

## Kurulum

### 1. Playwright'ı yükle
```bash
cd benalsam-web-next
npm install --save-dev @playwright/test
npx playwright install
```

### 2. Environment Variables (Opsiyonel)
```bash
# Base URL'i override etmek için
export PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

## Testleri Çalıştırma

### ⚠️ ÖNEMLİ: Dev Server Durumu

E2E testler iki şekilde çalışabilir:

#### Seçenek 1: Mevcut Dev Server'ı Kullan (Önerilen)
Eğer zaten `npm run dev` çalışıyorsa:
```bash
# Dev server'ın çalıştığından emin olun
# Playwright otomatik olarak mevcut server'ı kullanır
npm run test:e2e
```

#### Seçenek 2: Playwright Server'ı Başlatsın
Eğer dev server çalışmıyorsa:
```bash
# Playwright otomatik olarak server'ı başlatır
npm run test:e2e
```

**Sorun:** Eğer "Unable to acquire lock" hatası alırsanız:
```bash
# 1. Tüm dev server'ları kapat
# 2. Lock dosyasını sil
rm -rf .next/dev/lock

# 3. Tekrar çalıştır
npm run test:e2e
```

### Tüm E2E Testlerini Çalıştır
```bash
npm run test:e2e
```

### UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Headed Mode (Browser görünür)
```bash
npm run test:e2e:headed
```

### Belirli Bir Test Dosyasını Çalıştır
```bash
# Authentication tests
npx playwright test e2e/auth.spec.ts

# Listing creation tests
npx playwright test e2e/listing-creation.spec.ts

# Favorites tests
npx playwright test e2e/favorites.spec.ts

# Search tests
npx playwright test e2e/search.spec.ts
```

### Belirli Browser'da Çalıştır
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Yapısı

```
e2e/
├── auth.spec.ts              # Authentication flow tests
├── listing-creation.spec.ts  # Listing creation flow tests
├── favorites.spec.ts         # Favorite toggle flow tests
├── search.spec.ts            # Search and filter flow tests
├── SELECTOR_GUIDE.md         # Selector bulma rehberi
└── README.md                 # Detaylı dokümantasyon
```

## Test Coverage

### ✅ Authentication Flow (5 tests)
- User registration
- User login
- Invalid credentials handling
- Session persistence
- Logout

### ✅ Listing Creation Flow (3 tests)
- Create new listing
- Validation error handling
- Image upload

### ✅ Favorite Toggle Flow (3 tests)
- Add to favorites
- Remove from favorites
- Favorites count display

### ✅ Search and Filter Flow (4 tests)
- Search listings
- Filter by category
- Filter by price range
- Clear filters

**Toplam: 15 E2E test**

## Selector'ları Güncelleme

### ⚠️ ÖNEMLİ: Test Yazmadan Önce Codegen Kullanın!

Testlerdeki selector'lar placeholder'dır. Gerçek UI'ya göre güncellenmelidir.

### Adım Adım:

1. **Dev server'ı başlat:**
```bash
npm run dev
```

2. **Codegen'i çalıştır (YENİ TERMİNAL):**
```bash
npx playwright codegen http://localhost:3000
```

3. **Browser'da gezin:**
   - Sayfada gezin
   - Element'lere tıklayın
   - Codegen penceresinde selector'ları görün

4. **Selector'ları kopyala ve test dosyalarına yapıştır**

5. **Testleri çalıştır:**
```bash
npm run test:e2e
```

### Best Practices:

1. **data-testid kullanın:**
```tsx
<button data-testid="submit-button">Submit</button>
```

2. **Codegen sonrası selector'ları sadeleştirin:**
```typescript
// ❌ Codegen'den çıkan (çok detaylı)
await page.locator('div').filter({ hasText: 'Giriş Yap' }).nth(1).click();

// ✅ Sadeleştirilmiş
await page.click('[data-testid="login-button"]');
```

3. **Selector'ları test edin:**
```bash
npx playwright test --debug
```

Detaylı rehber için: `e2e/SELECTOR_GUIDE.md`

## Sorun Giderme

### ❌ Tests are flaky
**Çözüm:**
- Timeout'u artırın: `test.setTimeout(60000)`
- `waitFor` kullanın, `waitForTimeout` değil
- Race condition'ları kontrol edin

### ❌ Selectors not found
**Çözüm:**
- Playwright codegen kullanın
- Element'in visible olduğunu kontrol edin
- `data-testid` attribute'ları kullanın

### ❌ Server not starting / Lock file error
**Çözüm:**
```bash
# 1. Tüm dev server process'lerini kapat
# 2. Lock dosyasını sil
rm -rf .next/dev/lock

# 3. Port'u kontrol et
lsof -ti:3000 | xargs kill -9  # Port 3000'i temizle (dikkatli kullanın)

# 4. Tekrar çalıştır
npm run test:e2e
```

### ❌ Port 3000 is in use
**Çözüm:**
```bash
# Mevcut server'ı kullan (önerilen)
# Playwright otomatik olarak mevcut server'ı kullanır

# Veya port'u değiştir
PORT=3001 npm run dev
# Ve playwright.config.ts'de baseURL'i güncelle
```

## Best Practices

1. **Isolation**: Her test bağımsız olmalı
2. **Cleanup**: `beforeEach`/`afterEach` kullanın
3. **Wait**: Element'ler için her zaman wait yapın
4. **Selectors**: `data-testid` kullanın
5. **Page Objects**: Kompleks flow'lar için Page Object Model kullanın

## Gelecek İyileştirmeler

- [ ] Page Object Model implementasyonu
- [ ] Visual regression tests
- [ ] Performance tests
- [ ] Mobile viewport tests
- [ ] Accessibility tests
