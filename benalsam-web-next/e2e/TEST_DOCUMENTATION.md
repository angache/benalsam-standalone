# 🧪 E2E Test Dokümantasyonu - Kapsamlı Rehber

**Son Güncelleme:** 2025-01-XX  
**Test Framework:** Playwright  
**Test Sayısı:** 15 E2E test  
**Test Durumu:** ✅ Tüm testler geçiyor

---

## 📑 İçindekiler

1. [Test Stratejisi](#test-stratejisi)
2. [Test Yazma Rehberi](#test-yazma-rehberi)
3. [Test Bakımı ve Güncelleme](#test-bakımı-ve-güncelleme)
4. [CI/CD Entegrasyonu](#cicd-entegrasyonu)
5. [Best Practices](#best-practices)
6. [Selector Stratejileri](#selector-stratejileri)
7. [Test Data Management](#test-data-management)
8. [Troubleshooting](#troubleshooting)
9. [Yeni Özellik Ekleme Workflow](#yeni-özellik-ekleme-workflow)
10. [UI Değişikliklerinde Test Güncelleme](#ui-değişikliklerinde-test-güncelleme)

---

## 🎯 Test Stratejisi

### Test Piramidi

```
        /\
       /E2E\        ← End-to-End Tests (15 test)
      /------\
     /Integration\  ← Integration Tests (13 test)
    /------------\
   /   Unit Tests  \ ← Unit Tests (328 test)
  /----------------\
```

### Test Kapsamı

#### ✅ E2E Testler (15 test)
- **Authentication Flow** (5 test)
  - User registration
  - User login
  - Invalid credentials handling
  - Session persistence
  - Logout

- **Listing Creation Flow** (3 test)
  - Create new listing
  - Validation error handling
  - Image upload

- **Favorite Toggle Flow** (3 test)
  - Add to favorites
  - Remove from favorites
  - Favorites count display

- **Search and Filter Flow** (4 test)
  - Search listings
  - Filter by category
  - Filter by price range
  - Clear filters

### Test Prensipleri

1. **Test Isolation**: Her test bağımsız çalışmalı
2. **Deterministic**: Aynı koşullarda her zaman aynı sonucu vermeli
3. **Fast**: Mümkün olduğunca hızlı çalışmalı
4. **Maintainable**: Kolay güncellenebilir olmalı
5. **Readable**: Test kodu kendini açıklamalı

---

## 📝 Test Yazma Rehberi

### Adım 1: Test Senaryosunu Planla

Yeni bir test yazmadan önce:

1. **Kullanıcı hikayesini yaz:**
   ```
   Kullanıcı olarak, login sayfasına gidip
   email ve password ile giriş yapabilmeliyim
   ```

2. **Test adımlarını belirle:**
   - Navigate to login page
   - Fill email field
   - Fill password field
   - Click submit button
   - Verify redirect to home page

3. **Beklenen sonuçları tanımla:**
   - URL `/` olmalı
   - User avatar görünmeli
   - Session cookie set edilmeli

### Adım 2: Selector'ları Bul (Codegen)

```bash
# 1. Dev server'ı başlat
npm run dev

# 2. Yeni terminal - Codegen çalıştır
npx playwright codegen http://localhost:3000

# 3. Browser'da gezin ve selector'ları gör
# 4. Codegen penceresindeki selector'ları kopyala
```

### Adım 3: Test Dosyası Oluştur

```typescript
// e2e/new-feature.spec.ts
import { test, expect } from '@playwright/test'
import { performLogin } from './helpers/login'
import { setupPageForTests } from './setup'

test.describe('New Feature Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupPageForTests(page)
    await performLogin(page)
  })

  test('should perform new feature action', async ({ page }) => {
    // Navigate
    await page.goto('/new-feature')
    
    // Wait for page load
    await page.waitForLoadState('domcontentloaded')
    
    // Interact
    await page.click('[data-testid="action-button"]')
    
    // Verify
    await expect(page.locator('[data-testid="result"]')).toBeVisible()
  })
})
```

### Adım 4: Testi Çalıştır ve Debug Et

```bash
# Testi çalıştır
npm run test:e2e e2e/new-feature.spec.ts

# Debug mode (step-by-step)
npx playwright test e2e/new-feature.spec.ts --debug

# UI mode (interactive)
npm run test:e2e:ui
```

### Adım 5: Testi İyileştir

- ✅ `data-testid` kullan
- ✅ `waitFor` kullan (timeout değil)
- ✅ Helper fonksiyonlar kullan
- ✅ Assertion'ları net yap

---

## 🔧 Test Bakımı ve Güncelleme

### Testler Ne Zaman Güncellenmeli?

#### ✅ UI Değişikliklerinde

**Senaryo:** Button text'i değişti
```typescript
// ❌ Eski (çalışmıyor)
await page.click('text=Giriş Yap')

// ✅ Yeni (güncellenmiş)
await page.click('[data-testid="login-button"]')
```

**Action Plan:**
1. Testleri çalıştır → Hata al
2. Codegen ile yeni selector'ı bul
3. Test dosyasını güncelle
4. Testleri tekrar çalıştır → Geçmeli

#### ✅ Yeni Özellik Eklendiğinde

**Senaryo:** Yeni bir form field eklendi
```typescript
// Yeni field için test ekle
test('should validate new field', async ({ page }) => {
  await page.fill('[data-testid="new-field"]', '')
  await page.click('[data-testid="submit"]')
  await expect(page.locator('[data-testid="error"]')).toBeVisible()
})
```

#### ✅ Breaking Change'lerde

**Senaryo:** API endpoint değişti
```typescript
// Eski endpoint testini kaldır
// Yeni endpoint için test ekle
test('should work with new API', async ({ page }) => {
  // Yeni API'ye göre test yaz
})
```

### Test Güncelleme Checklist

- [ ] Testleri çalıştır → Hangi testler başarısız?
- [ ] Başarısız testlerin nedenini bul
- [ ] Selector'ları güncelle (codegen kullan)
- [ ] Test logic'ini güncelle
- [ ] Testleri tekrar çalıştır → Geçmeli
- [ ] Yeni özellik için yeni test ekle
- [ ] CI/CD'de testlerin geçtiğini doğrula

---

## 🚀 CI/CD Entegrasyonu

### GitHub Actions Örneği

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd benalsam-web-next
          npm ci
          npx playwright install --with-deps
      
      - name: Run E2E tests
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
          E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
        run: |
          cd benalsam-web-next
          npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: benalsam-web-next/playwright-report/
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
cd benalsam-web-next
npm run test:e2e -- --grep-invert="should allow user to register"
```

**Not:** Tüm testleri pre-commit'te çalıştırmak yavaş olabilir. Sadece kritik testleri çalıştırın.

---

## ✨ Best Practices

### 1. Selector Stratejisi (Öncelik Sırası)

```typescript
// 1. ✅ EN İYİ: data-testid (en güvenilir)
await page.click('[data-testid="login-button"]')

// 2. ✅ İYİ: ID attribute
await page.click('#login-button')

// 3. ⚠️ ORTA: Name attribute
await page.click('[name="login"]')

// 4. ⚠️ DİKKAT: Text content (değişebilir)
await page.click('text=Giriş Yap')

// 5. ❌ KÖTÜ: CSS class (styling değişebilir)
await page.click('.login-button')
```

### 2. Wait Stratejileri

```typescript
// ✅ DOĞRU: waitFor kullan
await page.locator('[data-testid="button"]').waitFor({ state: 'visible' })
await page.waitForURL('/dashboard')
await page.waitForLoadState('domcontentloaded')

// ❌ YANLIŞ: waitForTimeout kullanma (flaky)
await page.waitForTimeout(3000) // Kullanma!
```

### 3. Test Isolation

```typescript
// ✅ DOĞRU: Her test bağımsız
test.beforeEach(async ({ page }) => {
  await performLogin(page) // Her test için fresh login
})

test('test 1', async ({ page }) => {
  // Test 1
})

test('test 2', async ({ page }) => {
  // Test 2 (test 1'den bağımsız)
})

// ❌ YANLIŞ: Testler arası bağımlılık
let sharedState = null

test('test 1', async ({ page }) => {
  sharedState = 'value' // Diğer testlere bağımlı
})

test('test 2', async ({ page }) => {
  expect(sharedState).toBe('value') // test 1'e bağımlı
})
```

### 4. Helper Fonksiyonlar

```typescript
// ✅ DOĞRU: Helper fonksiyonlar kullan
// e2e/helpers/login.ts
export async function performLogin(page: Page) {
  await page.goto('/auth/login')
  await page.fill('input#email', TEST_USER.email)
  await page.fill('input#password', TEST_USER.password)
  await page.click('button[type="submit"]', { force: true })
  await page.waitForURL('/', { timeout: 25000 })
}

// Test dosyasında
import { performLogin } from './helpers/login'

test('should do something', async ({ page }) => {
  await performLogin(page)
  // Test devam eder
})
```

### 5. Assertion'lar

```typescript
// ✅ DOĞRU: Net assertion'lar
await expect(page.locator('[data-testid="success"]')).toBeVisible()
await expect(page).toHaveURL('/dashboard')
await expect(page.locator('text=Welcome')).toContainText('John')

// ❌ YANLIŞ: Belirsiz assertion'lar
expect(await page.locator('div').count()).toBeGreaterThan(0) // Hangi div?
```

### 6. Error Handling

```typescript
// ✅ DOĞRU: Hata durumlarını test et
test('should show error for invalid login', async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('input#email', 'invalid@email.com')
  await page.fill('input#password', 'wrongpassword')
  await page.click('button[type="submit"]', { force: true })
  
  // Error mesajını bekle
  await expect(page.locator('[data-testid="error"]')).toBeVisible({ timeout: 5000 })
})
```

---

## 🎨 Selector Stratejileri

### Selector Öncelik Sırası

1. **`data-testid`** (En güvenilir)
   ```tsx
   <button data-testid="login-button">Giriş Yap</button>
   ```
   ```typescript
   await page.click('[data-testid="login-button"]')
   ```

2. **`id` attribute**
   ```tsx
   <input id="email" type="email" />
   ```
   ```typescript
   await page.fill('#email', 'test@example.com')
   ```

3. **`name` attribute**
   ```tsx
   <input name="email" type="email" />
   ```
   ```typescript
   await page.fill('[name="email"]', 'test@example.com')
   ```

4. **`aria-label`**
   ```tsx
   <button aria-label="Giriş yap">Giriş</button>
   ```
   ```typescript
   await page.click('[aria-label="Giriş yap"]')
   ```

5. **Text content** (Son çare)
   ```typescript
   await page.click('text=Giriş Yap')
   ```

6. **CSS class** (Kullanmaktan kaçın)
   ```typescript
   // ❌ Kullanma - styling değişebilir
   await page.click('.login-button')
   ```

### Component'lere data-testid Ekleme

```tsx
// ✅ DOĞRU: data-testid ekle
<button 
  data-testid="login-button"
  onClick={handleLogin}
>
  Giriş Yap
</button>

// Test'te kullan
await page.click('[data-testid="login-button"]')
```

### Selector Bulma Workflow

1. **Codegen kullan:**
   ```bash
   npm run dev
   npx playwright codegen http://localhost:3000
   ```

2. **Codegen'den çıkan kodu sadeleştir:**
   ```typescript
   // ❌ Codegen'den çıkan (çok detaylı)
   await page.locator('div').filter({ hasText: 'Giriş Yap' }).nth(1).click()
   
   // ✅ Sadeleştirilmiş
   await page.click('[data-testid="login-button"]')
   ```

3. **Selector'ı test et:**
   ```bash
   npx playwright test --debug e2e/auth.spec.ts
   ```

---

## 📊 Test Data Management

### Test Kullanıcısı Yönetimi

#### Otomatik Oluşturma (Önerilen)

Test kullanıcısı `global-setup.ts` tarafından otomatik oluşturulur:

```typescript
// e2e/global-setup.ts
import { createTestUser, disable2FAForTestUser } from './helpers/auth'

export default async function globalSetup() {
  await createTestUser()
  await disable2FAForTestUser() // 2FA'yı devre dışı bırak
}
```

#### Environment Variables ile Kullanım

`.env.local` dosyasında mevcut kullanıcı belirtilebilir:

```env
E2E_TEST_USER_EMAIL=angache@gmail.com
E2E_TEST_USER_PASSWORD=YeniSifre123!
E2E_TEST_USER_NAME=Test User
E2E_TEST_USER_USERNAME=testuser
```

#### Test Kullanıcısı Helper'ları

```typescript
// e2e/helpers/auth.ts

// Test kullanıcısı oluştur
export async function createTestUser(): Promise<string>

// Test kullanıcısını sil
export async function deleteTestUser(): Promise<void>

// Test kullanıcısı şifresini sıfırla
export async function resetTestUserPassword(): Promise<void>

// 2FA'yı devre dışı bırak
export async function disable2FAForTestUser(): Promise<void>
```

### Test Fixtures

```typescript
// e2e/fixtures/test-data.ts
export const testUsers = {
  valid: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User'
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'WrongPassword'
  }
}

export const testListings = {
  valid: {
    title: 'Test Listing',
    description: 'This is a test listing',
    price: '1000',
    category: 'electronics'
  }
}
```

---

## 🔍 Troubleshooting

### Testler Flaky (Bazen Geçiyor, Bazen Geçmiyor)

**Nedenler:**
- Race conditions
- Timeout'lar çok kısa
- `waitForTimeout` kullanımı
- Network latency

**Çözümler:**
```typescript
// ❌ YANLIŞ
await page.waitForTimeout(3000)

// ✅ DOĞRU
await page.locator('[data-testid="element"]').waitFor({ state: 'visible' })
await page.waitForURL('/dashboard')
```

### Selector'lar Bulunamıyor

**Nedenler:**
- UI değişti
- Element henüz render edilmedi
- Selector yanlış

**Çözümler:**
1. Codegen ile yeni selector'ı bul
2. `waitFor` kullan
3. `data-testid` ekle

```typescript
// ✅ DOĞRU: Element görünür olana kadar bekle
await page.locator('[data-testid="button"]').waitFor({ state: 'visible' })
await page.click('[data-testid="button"]')
```

### Login Başarısız

**Nedenler:**
- Test kullanıcısı yok
- Şifre yanlış
- 2FA aktif
- Email confirm edilmemiş

**Çözümler:**
1. `global-setup.ts` loglarına bak
2. Test kullanıcısının oluşturulduğunu doğrula
3. 2FA'nın devre dışı olduğunu kontrol et
4. Email'in confirm edildiğini kontrol et

### Timeout Hataları

**Nedenler:**
- Sayfa yüklenmesi yavaş
- Network request'leri uzun sürüyor
- Element render edilmesi gecikiyor

**Çözümler:**
```typescript
// Timeout'u artır
test.setTimeout(60000) // 60 saniye

// waitFor kullan
await page.locator('[data-testid="element"]').waitFor({ 
  state: 'visible', 
  timeout: 10000 
})
```

### Dev Server Başlamıyor

**Nedenler:**
- Port 3000 kullanımda
- Lock file var
- Process çakışması

**Çözümler:**
```bash
# Port'u temizle
lsof -ti:3000 | xargs kill -9

# Lock file'ı sil
rm -rf .next/dev/lock

# Tekrar çalıştır
npm run dev
```

---

## 🆕 Yeni Özellik Ekleme Workflow

### Adım 1: Test Yaz (TDD)

```typescript
// e2e/new-feature.spec.ts
test('should perform new feature', async ({ page }) => {
  await performLogin(page)
  await page.goto('/new-feature')
  
  // Test yaz (henüz özellik yok)
  await page.click('[data-testid="new-button"]')
  await expect(page.locator('[data-testid="result"]')).toBeVisible()
})
```

### Adım 2: Testi Çalıştır (Başarısız Olmalı)

```bash
npm run test:e2e e2e/new-feature.spec.ts
# ❌ Test başarısız (özellik henüz yok)
```

### Adım 3: Özelliği Geliştir

```tsx
// Component'i geliştir
<button data-testid="new-button" onClick={handleClick}>
  New Feature
</button>
```

### Adım 4: Testi Tekrar Çalıştır (Geçmeli)

```bash
npm run test:e2e e2e/new-feature.spec.ts
# ✅ Test geçmeli
```

### Adım 5: Refactor

Özellik çalışıyor, test geçiyor → Şimdi refactor edebilirsiniz.

---

## 🎨 UI Değişikliklerinde Test Güncelleme

### Senaryo 1: Button Text Değişti

**Önce:**
```tsx
<button>Giriş Yap</button>
```

**Sonra:**
```tsx
<button>Oturum Aç</button>
```

**Test Güncelleme:**
```typescript
// ❌ Eski (çalışmıyor)
await page.click('text=Giriş Yap')

// ✅ Yeni (data-testid kullan - text'e bağımlı değil)
await page.click('[data-testid="login-button"]')
```

### Senaryo 2: CSS Class Değişti

**Önce:**
```tsx
<button className="btn-primary">Submit</button>
```

**Sonra:**
```tsx
<button className="button-primary">Submit</button>
```

**Test Güncelleme:**
```typescript
// ❌ Eski (CSS class'a bağımlı - kırılgan)
await page.click('.btn-primary')

// ✅ Yeni (data-testid kullan - CSS'e bağımlı değil)
await page.click('[data-testid="submit-button"]')
```

### Senaryo 3: Component Yapısı Değişti

**Önce:**
```tsx
<div>
  <input name="email" />
</div>
```

**Sonra:**
```tsx
<Form>
  <Input name="email" />
</Form>
```

**Test Güncelleme:**
```typescript
// ✅ data-testid kullanıyorsanız değişiklik gerekmez
await page.fill('[data-testid="email-input"]', 'test@example.com')

// ❌ name attribute kullanıyorsanız güncelleme gerekebilir
await page.fill('[name="email"]', 'test@example.com') // Hala çalışabilir
```

### UI Değişikliği Checklist

- [ ] Testleri çalıştır → Hangi testler başarısız?
- [ ] Codegen ile yeni selector'ları bul
- [ ] Test dosyalarını güncelle
- [ ] `data-testid` ekle (gelecek için)
- [ ] Testleri tekrar çalıştır → Geçmeli
- [ ] CI/CD'de testlerin geçtiğini doğrula

---

## 📁 Test Organizasyonu

### Dosya Yapısı

```
e2e/
├── auth.spec.ts              # Authentication tests
├── listing-creation.spec.ts  # Listing creation tests
├── favorites.spec.ts        # Favorite toggle tests
├── search.spec.ts            # Search and filter tests
├── helpers/
│   ├── auth.ts              # Auth helper functions
│   └── login.ts             # Login helper functions
├── fixtures/
│   └── test-data.ts         # Test data constants
├── pages/                    # Page Object Model (gelecek)
│   ├── LoginPage.ts
│   └── DashboardPage.ts
├── global-setup.ts          # Test setup (user creation)
├── global-teardown.ts       # Test cleanup
├── setup.ts                 # Page setup (dev overlay removal)
└── README.md                # Test dokümantasyonu
```

### Test Dosyası İsimlendirme

```typescript
// ✅ DOĞRU: feature.spec.ts
auth.spec.ts
listing-creation.spec.ts
favorites.spec.ts

// ❌ YANLIŞ
test-auth.ts
auth.test.ts
auth.e2e.ts
```

### Test İçi Organizasyon

```typescript
test.describe('Feature Name', () => {
  // Setup
  test.beforeEach(async ({ page }) => {
    await setupPageForTests(page)
    await performLogin(page)
  })

  // Tests
  test('should do something', async ({ page }) => {
    // Test code
  })

  test('should handle error case', async ({ page }) => {
    // Test code
  })

  // Cleanup (if needed)
  test.afterEach(async ({ page }) => {
    // Cleanup code
  })
})
```

---

## 🚦 Test Çalıştırma Komutları

### Temel Komutlar

```bash
# Tüm E2E testlerini çalıştır
npm run test:e2e

# UI mode (interactive)
npm run test:e2e:ui

# Headed mode (browser görünür)
npm run test:e2e:headed

# Belirli bir test dosyası
npx playwright test e2e/auth.spec.ts

# Belirli bir test
npx playwright test e2e/auth.spec.ts -g "should allow user to login"

# Debug mode (step-by-step)
npx playwright test e2e/auth.spec.ts --debug

# Belirli browser
npx playwright test --project=chromium
```

### Gelişmiş Komutlar

```bash
# Sadece başarısız testleri tekrar çalıştır
npx playwright test --last-failed

# Retry başarısız testler
npx playwright test --retries=3

# Paralel çalıştırma (worker sayısı)
npx playwright test --workers=4

# Timeout ayarla
npx playwright test --timeout=60000

# Trace kaydet (debug için)
npx playwright test --trace on
```

---

## 📈 Test Metrikleri

### Test Coverage

- **E2E Tests:** 15 test
- **Integration Tests:** 13 test
- **Unit Tests:** 328 test
- **Toplam:** 356 test

### Test Durumu

- ✅ **15/15 E2E test geçiyor**
- ✅ **13/13 Integration test geçiyor**
- ✅ **328/328 Unit test geçiyor**

### Test Süreleri

- **E2E Tests:** ~1.5 dakika (15 test)
- **Integration Tests:** ~30 saniye (13 test)
- **Unit Tests:** ~10 saniye (328 test)

---

## 🔐 Güvenlik Notları

### Test Kullanıcısı

- ✅ Test kullanıcısı sadece test ortamında kullanılmalı
- ❌ Production'da asla test kullanıcısı oluşturmayın
- ✅ Test kullanıcısı şifresi basit tutulmuştur (sadece test için)

### Environment Variables

```env
# ✅ DOĞRU: .env.local (gitignore'da)
SUPABASE_SERVICE_ROLE_KEY=your_key_here
E2E_TEST_USER_EMAIL=test@example.com
E2E_TEST_USER_PASSWORD=TestPassword123!

# ❌ YANLIŞ: .env (commit edilmemeli)
# SUPABASE_SERVICE_ROLE_KEY asla commit edilmemeli!
```

### CI/CD Secrets

GitHub Actions'da secrets kullanın:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_TEST_USER_EMAIL`
- `E2E_TEST_USER_PASSWORD`

---

## 🎓 Öğrenme Kaynakları

### Playwright Dokümantasyonu

- [Playwright Docs](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Selectors](https://playwright.dev/docs/selectors)

### Proje Dokümantasyonu

- `e2e/README.md` - Test kullanıcısı yönetimi
- `e2e/SELECTOR_GUIDE.md` - Selector bulma rehberi
- `e2e/TROUBLESHOOTING.md` - Sorun giderme
- `E2E_TESTS.md` - Test çalıştırma rehberi

---

## 📞 Destek

### Sorun mu yaşıyorsunuz?

1. **Troubleshooting bölümüne bakın**
2. **Test loglarına bakın** (`test-results/`)
3. **Screenshot'lara bakın** (test başarısız olduğunda)
4. **Debug mode kullanın:** `npx playwright test --debug`

### Yeni Test Yazarken Yardım

1. **Codegen kullanın:** `npx playwright codegen http://localhost:3000`
2. **Mevcut testlere bakın:** `e2e/*.spec.ts`
3. **Helper fonksiyonları kullanın:** `e2e/helpers/*.ts`

---

## ✅ Checklist: Yeni Özellik Ekleme

- [ ] Test senaryosunu planla
- [ ] Test yaz (TDD)
- [ ] Testi çalıştır (başarısız olmalı)
- [ ] Özelliği geliştir
- [ ] Testi tekrar çalıştır (geçmeli)
- [ ] `data-testid` ekle
- [ ] Helper fonksiyonlar oluştur (gerekirse)
- [ ] Testi CI/CD'ye ekle
- [ ] Dokümantasyonu güncelle

---

## ✅ Checklist: UI Değişikliği

- [ ] Testleri çalıştır → Hangi testler başarısız?
- [ ] Codegen ile yeni selector'ları bul
- [ ] Test dosyalarını güncelle
- [ ] `data-testid` ekle (gelecek için)
- [ ] Testleri tekrar çalıştır → Geçmeli
- [ ] CI/CD'de testlerin geçtiğini doğrula

---

**Son Güncelleme:** 2025-01-XX  
**Dokümantasyon Versiyonu:** 1.0.0

