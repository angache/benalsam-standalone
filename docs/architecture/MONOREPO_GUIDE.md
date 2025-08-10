# 🏗️ Benalsam Monorepo Rehberi

## 🎯 Genel Bakış

Benalsam monorepo'su, web ve mobile uygulamalarını tek bir repository'de yönetmek için tasarlanmıştır. Bu yapı sayesinde kod paylaşımı, tutarlılık ve geliştirme verimliliği artırılmıştır.

## 📁 Proje Yapısı

```
benalsam-monorepo/
├── packages/
│   ├── shared-types/     # Paylaşılan TypeScript tipleri ve servisler
│   ├── web/             # React/Vite web uygulaması
│   └── mobile/          # React Native/Expo mobile uygulaması
├── docs/                # Dokümantasyon
├── package.json         # Root package.json (workspaces)
└── README.md
```

## 🚀 Kurulum

### 1. Bağımlılıkları Yükleme

```bash
# Root dizinde
npm install
```

Bu komut tüm workspace'lerdeki bağımlılıkları otomatik olarak yükler.

### 2. Geliştirme Ortamını Başlatma

```bash
# Terminal 1: Shared-types (watch mode)
cd packages/shared-types
npm run dev

# Terminal 2: Web projesi
cd packages/web
npm run dev

# Terminal 3: Mobile projesi
cd packages/mobile
npx expo start
```

## 📦 Workspace'ler

### 🔧 Shared-Types (`packages/shared-types/`)

Paylaşılan TypeScript tipleri, utility fonksiyonları ve Supabase servisleri.

**Özellikler:**
- TypeScript tip tanımları
- Utility fonksiyonları (formatDate, formatPrice, vb.)
- Supabase client ve servisler
- Watch mode ile otomatik build

**Kullanım:**
```typescript
import { supabase, formatDate, formatPrice } from '@benalsam/shared-types';
```

### 🌐 Web (`packages/web/`)

React/Vite tabanlı web uygulaması.

**Özellikler:**
- React 18 + Vite
- TypeScript desteği
- Tailwind CSS
- Radix UI bileşenleri
- Supabase entegrasyonu

**Başlatma:**
```bash
cd packages/web
npm run dev
```

**Build:**
```bash
npm run build
```

### 📱 Mobile (`packages/mobile/`)

React Native/Expo tabanlı mobile uygulaması.

**Özellikler:**
- React Native + Expo
- TypeScript desteği
- React Query (TanStack Query)
- Supabase entegrasyonu
- Metro bundler

**Başlatma:**
```bash
cd packages/mobile
npx expo start
```

**Build:**
```bash
npx expo build
```

## 🔄 Geliştirme Süreci

### 1. Yeni Özellik Geliştirme

```bash
# 1. Shared-types'ta gerekli tipleri/servisleri ekle
cd packages/shared-types
# Dosyaları düzenle...

# 2. Web projesinde kullan
cd packages/web
# Import ve kullan...

# 3. Mobile projesinde kullan
cd packages/mobile
# Import ve kullan...
```

### 2. Değişiklik Yapma

```bash
# Shared-types değişiklikleri otomatik olarak build edilir
# Web ve mobile projeleri otomatik olarak yeni değişiklikleri alır
```

### 3. Test Etme

```bash
# Web projesi testleri
cd packages/web
npm test

# Mobile projesi testleri
cd packages/mobile
npm test
```

## 📋 Script'ler

### Root Level Script'ler

```bash
# Tüm workspace'lerde npm install
npm install

# Tüm workspace'lerde build
npm run build

# Tüm workspace'lerde test
npm test
```

### Shared-Types Script'leri

```bash
cd packages/shared-types

npm run dev      # Watch mode
npm run build    # Production build
npm run clean    # Dist klasörünü temizle
```

### Web Script'leri

```bash
cd packages/web

npm run dev      # Development server
npm run build    # Production build
npm run preview  # Build preview
npm run test     # Test çalıştır
```

### Mobile Script'leri

```bash
cd packages/mobile

npx expo start   # Development server
npx expo build   # Production build
npm test         # Test çalıştır
```

## 🔧 Konfigürasyon

### TypeScript

Her workspace'in kendi `tsconfig.json` dosyası vardır:

- `packages/shared-types/tsconfig.json` - Shared types konfigürasyonu
- `packages/web/tsconfig.json` - Web projesi konfigürasyonu
- `packages/mobile/tsconfig.json` - Mobile projesi konfigürasyonu

### Metro (Mobile)

Mobile projesi için Metro konfigürasyonu shared-types paketini destekler:

```javascript
// packages/mobile/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Shared-types paketini alias'la
config.resolver.alias = {
  '@benalsam/shared-types': path.resolve(__dirname, '../shared-types/dist'),
};

module.exports = config;
```

### Vite (Web)

Web projesi için Vite konfigürasyonu:

```javascript
// packages/web/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@benalsam/shared-types': path.resolve(__dirname, '../shared-types/dist'),
    },
  },
});
```

## 🚨 Sorun Giderme

### Bağımlılık Sorunları

```bash
# Root dizinde temizlik
rm -rf node_modules
rm -rf packages/*/node_modules
npm install
```

### Build Sorunları

```bash
# Shared-types'ı yeniden build et
cd packages/shared-types
npm run clean
npm run build

# Web projesini yeniden başlat
cd packages/web
npm run dev

# Mobile projesini yeniden başlat
cd packages/mobile
npx expo start --clear
```

### Import Sorunları

```bash
# TypeScript cache'ini temizle
cd packages/web
rm -rf node_modules/.cache
npm run dev

cd packages/mobile
npx expo start --clear
```

## 📚 Best Practices

### ✅ Doğru Kullanım

1. **Shared Types Kullanımı:**
   - Tüm ortak tipleri `shared-types` paketinde tanımlayın
   - Utility fonksiyonları `shared-types` paketinde tutun
   - Supabase client'ı `shared-types` paketinden import edin

2. **Geliştirme Süreci:**
   - Watch mode'u geliştirme sırasında kullanın
   - Değişiklikleri küçük parçalar halinde yapın
   - Her değişiklikten sonra test edin

3. **Kod Organizasyonu:**
   - Her workspace'in kendi sorumluluğu olsun
   - Ortak kodları `shared-types` paketinde tutun
   - Proje-spesifik kodları ilgili workspace'te tutun

### ❌ Yanlış Kullanım

1. **Kod Tekrarı:**
   - Aynı tipleri birden fazla yerde tanımlamayın
   - Utility fonksiyonları kopyalamayın
   - Supabase client'ı her projede ayrı ayrı oluşturmayın

2. **Geliştirme Süreci:**
   - Production'da watch mode kullanmayın
   - Büyük değişiklikleri tek seferde yapmayın
   - Test etmeden commit yapmayın

## 🔄 Git Workflow

### Branch Stratejisi

```
main                    # Production branch
├── develop            # Development branch
├── feature/shared-*   # Shared-types özellikleri
├── feature/web-*      # Web özellikleri
└── feature/mobile-*   # Mobile özellikleri
```

### Commit Mesajları

```
feat(shared-types): add formatPhoneNumber utility
fix(web): resolve import issue with shared-types
docs: update monorepo guide
```

### Pull Request Süreci

1. Feature branch oluştur
2. Değişiklikleri yap
3. Test et
4. Pull request aç
5. Code review
6. Merge

## 📊 Monitoring ve Analytics

### Build Durumu

```bash
# Tüm projelerin build durumunu kontrol et
npm run build

# Test durumunu kontrol et
npm test
```

### Bundle Analizi

```bash
# Web bundle analizi
cd packages/web
npm run build
npx vite-bundle-analyzer dist

# Mobile bundle analizi
cd packages/mobile
npx expo build --platform ios --clear
```

## 🚀 Deployment

### Web Deployment

```bash
cd packages/web
npm run build
# dist/ klasörünü deploy et
```

### Mobile Deployment

```bash
cd packages/mobile
npx expo build --platform all
# Build dosyalarını app store'lara yükle
```

---

**Not:** Bu rehber sürekli güncellenmektedir. Yeni özellikler ve best practice'ler eklendikçe bu dokümantasyon da güncellenecektir. 