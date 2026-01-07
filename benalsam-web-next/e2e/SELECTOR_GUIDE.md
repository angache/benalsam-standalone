# Playwright Selector Rehberi

## Codegen Ne Zaman Kullanılır?

### ✅ Test Yazmadan Önce (Önerilen)
Selector'ları bulmak ve test yazmak için:
```bash
# 1. Dev server'ı başlat
npm run dev

# 2. Başka bir terminal'de codegen'i çalıştır
npx playwright codegen http://localhost:3000

# 3. Browser açılır, sayfada gezin ve selector'ları gör
# 4. Codegen'den çıkan selector'ları test dosyalarına kopyala
```

### ✅ Mevcut Testleri Güncellerken
Testlerdeki selector'lar çalışmıyorsa:
```bash
# 1. Dev server çalışıyor olmalı
npm run dev

# 2. Codegen ile doğru selector'ları bul
npx playwright codegen http://localhost:3000

# 3. Test dosyalarındaki selector'ları güncelle
```

### ❌ Test Çalıştırmadan Önce (Gerekli Değil)
Testleri çalıştırmak için codegen gerekmez. Sadece selector'ları bulmak/güncellemek için kullanılır.

## Adım Adım Kullanım

### Senaryo 1: Yeni Test Yazarken

1. **Dev server'ı başlat:**
```bash
npm run dev
```

2. **Codegen'i çalıştır:**
```bash
npx playwright codegen http://localhost:3000
```

3. **Browser'da gezin:**
   - Login sayfasına git
   - Form alanlarını tıkla
   - Button'ları tıkla
   - Codegen penceresinde selector'ları gör

4. **Selector'ları kopyala:**
   - Codegen penceresindeki kodu kopyala
   - Test dosyasına yapıştır ve düzenle

### Senaryo 2: Mevcut Testleri Güncellerken

1. **Test çalıştır ve hata al:**
```bash
npm run test:e2e
# Error: locator.click: Target closed
```

2. **Codegen ile doğru selector'ı bul:**
```bash
npx playwright codegen http://localhost:3000
```

3. **Test dosyasını güncelle:**
```typescript
// ❌ Eski (çalışmıyor)
await page.click('text=Giriş Yap');

// ✅ Yeni (codegen'den bulunan)
await page.click('button[data-testid="login-button"]');
```

## Best Practices

### 1. data-testid Kullanın
Component'lerinize `data-testid` ekleyin:
```tsx
<button data-testid="login-button">Giriş Yap</button>
```

Test'te kullanın:
```typescript
await page.click('[data-testid="login-button"]');
```

### 2. Codegen Sonrası Temizleme
Codegen'den çıkan kod genelde çok detaylıdır. Sadeleştirin:
```typescript
// ❌ Codegen'den çıkan (çok detaylı)
await page.locator('div').filter({ hasText: 'Giriş Yap' }).nth(1).click();

// ✅ Sadeleştirilmiş
await page.click('[data-testid="login-button"]');
```

### 3. Selector'ları Test Et
Codegen'den sonra selector'ları test edin:
```bash
# Debug mode'da test çalıştır
npx playwright test e2e/auth.spec.ts --debug
```

## Örnek Workflow

### Yeni Bir Test Yazarken:

```bash
# 1. Dev server başlat
npm run dev

# 2. Yeni terminal - Codegen başlat
npx playwright codegen http://localhost:3000

# 3. Browser'da:
#    - Login sayfasına git (/giris)
#    - Email input'una tıkla
#    - Password input'una tıkla
#    - Submit button'una tıkla
#    - Codegen penceresinde kod görünür

# 4. Codegen'den selector'ları kopyala ve test dosyasına yaz
# 5. Test dosyasını kaydet
# 6. Testi çalıştır: npm run test:e2e
```

## Mevcut Test Dosyalarını Güncelleme

Mevcut test dosyalarındaki selector'lar placeholder'dır. Gerçek UI'ya göre güncellenmelidir:

### `e2e/auth.spec.ts`
- `text=Kayıt Ol` → Gerçek button selector'ı
- `input[name="email"]` → Gerçek input selector'ı
- `text=Giriş Yap` → Gerçek button selector'ı

### `e2e/listing-creation.spec.ts`
- `input[name="title"]` → Gerçek input selector'ı
- `select[name="category"]` → Gerçek select selector'ı

### `e2e/favorites.spec.ts`
- `button[aria-label*="favori"]` → Gerçek button selector'ı

### `e2e/search.spec.ts`
- `input[placeholder*="ara"]` → Gerçek search input selector'ı

## Hızlı Başlangıç

1. **Dev server başlat:**
```bash
npm run dev
```

2. **Codegen çalıştır:**
```bash
npx playwright codegen http://localhost:3000
```

3. **Sayfada gezin ve selector'ları gör**

4. **Test dosyalarını güncelle**

5. **Testleri çalıştır:**
```bash
npm run test:e2e
```

## Sorun Giderme

### Codegen çalışmıyor
- Dev server'ın çalıştığından emin olun: `npm run dev`
- Port 3000'in açık olduğunu kontrol edin

### Selector'lar çalışmıyor
- Codegen ile tekrar bulun
- `data-testid` kullanın
- Debug mode'da test edin: `--debug`

### Testler flaky
- `waitFor` kullanın
- `data-testid` kullanın
- Timeout'u artırın

