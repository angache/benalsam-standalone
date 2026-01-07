# E2E Test Sorun Giderme Rehberi

## ❌ "Unable to acquire lock" Hatası

### Sorun
```
⨯ Unable to acquire lock at .next/dev/lock, is another instance of next dev running?
```

### Çözüm 1: Mevcut Dev Server'ı Kullan (Önerilen)

Eğer zaten `npm run dev` çalışıyorsa, Playwright otomatik olarak mevcut server'ı kullanır:

```bash
# 1. Dev server'ın çalıştığından emin olun
# (Zaten çalışıyorsa bir şey yapmanıza gerek yok)

# 2. Testleri çalıştırın
npm run test:e2e
```

Playwright config'de `reuseExistingServer: true` olduğu için mevcut server'ı kullanır.

### Çözüm 2: Lock Dosyasını Temizle

Eğer dev server çalışmıyorsa ama lock dosyası kalmışsa:

```bash
# Lock dosyasını sil
rm -rf .next/dev/lock

# Tekrar çalıştır
npm run test:e2e
```

### Çözüm 3: Tüm Dev Server Process'lerini Kapat

```bash
# Port 3000'i kullanan process'i bul ve kapat
lsof -ti:3000 | xargs kill -9

# Lock dosyasını sil
rm -rf .next/dev/lock

# Tekrar çalıştır
npm run test:e2e
```

## ❌ "Port 3000 is in use" Hatası

### Sorun
```
⚠ Port 3000 is in use by process 17534, using available port 3001 instead.
```

### Çözüm

Bu bir uyarıdır, hata değil. Playwright otomatik olarak port 3001'i kullanır. Ama baseURL hala 3000'i gösteriyor olabilir.

**Seçenek 1:** Mevcut server'ı kullan (önerilen)
```bash
# Dev server zaten çalışıyorsa, Playwright onu kullanır
npm run test:e2e
```

**Seçenek 2:** Port'u değiştir
```bash
# Dev server'ı farklı port'ta başlat
PORT=3001 npm run dev

# Playwright config'de baseURL'i güncelle
# veya environment variable kullan
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3001 npm run test:e2e
```

## ❌ "Module not found: web-vitals" Hatası

### Çözüm
```bash
npm install web-vitals
```

## ❌ Testler Çalışmıyor / Selector Bulunamıyor

### Çözüm

1. **Codegen ile selector'ları bul:**
```bash
# Dev server çalışıyor olmalı
npm run dev

# Yeni terminal
npx playwright codegen http://localhost:3000
```

2. **Test dosyalarındaki selector'ları güncelle**

3. **Debug mode'da test et:**
```bash
npx playwright test e2e/auth.spec.ts --debug
```

## ✅ Önerilen Workflow

### İlk Kurulum
```bash
# 1. Paketleri yükle
npm install
npx playwright install

# 2. web-vitals yükle (eğer eksikse)
npm install web-vitals
```

### Test Çalıştırma
```bash
# Seçenek 1: Dev server zaten çalışıyorsa
npm run test:e2e

# Seçenek 2: Playwright server'ı başlatsın
# (Dev server çalışmıyorsa)
npm run test:e2e
```

### Selector Güncelleme
```bash
# 1. Dev server başlat
npm run dev

# 2. Codegen çalıştır (yeni terminal)
npx playwright codegen http://localhost:3000

# 3. Selector'ları bul ve test dosyalarına kopyala
```

## Hızlı Çözümler

### Lock dosyası sorunu
```bash
rm -rf .next/dev/lock && npm run test:e2e
```

### Port sorunu
```bash
# Mevcut server'ı kullan (önerilen)
# Veya port'u değiştir
PORT=3001 npm run dev
```

### Tüm sorunları temizle
```bash
# 1. Tüm dev server'ları kapat
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 2. Lock dosyasını sil
rm -rf .next/dev/lock

# 3. Node modules'ı temizle (gerekirse)
rm -rf node_modules/.cache

# 4. Tekrar çalıştır
npm run test:e2e
```

