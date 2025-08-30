# Mobile App Configuration

Bu klasör mobile uygulamasının konfigürasyon dosyalarını içerir.

## Aktif Konfigürasyonlar

- **environment.ts** - Environment variables ve API endpoints
- **firebase.ts** - Firebase konfigürasyonu
- **firebaseRules.json** - Firebase security rules
- **locations.ts** - Şehir ve ilçe verileri
- **dopingOptions.js** - İlan doping seçenekleri

## Deprecated Konfigürasyonlar

- **deprecated/** - Eski statik kategori sistemi dosyaları
  - Artık kullanılmıyor
  - Dinamik kategori sistemi ile değiştirildi

## Yeni Kategori Sistemi

Kategoriler artık backend'den dinamik olarak yükleniyor:

- **categoryService.ts** - Backend API entegrasyonu
- **useCategories.ts** - React Query hooks
- **Backend API** - `/api/v1/categories` ve `/api/v1/categories/attributes`

## Kullanım

```typescript
// ❌ ESKİ (Deprecated)
import { categoriesConfig } from '../config/categories-with-attributes';

// ✅ YENİ (Dinamik)
import { useCategories } from '../hooks/queries/useCategories';
```
