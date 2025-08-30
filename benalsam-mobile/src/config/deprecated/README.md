# DEPRECATED - Statik Kategori Sistemi

Bu klasördeki dosyalar artık kullanılmıyor ve deprecated olarak işaretlendi.

## Neden Deprecated?

- **Dinamik Kategori Sistemi:** Artık backend'den real-time kategori verileri çekiliyor
- **Version-based Cache:** Kategori değişikliklerinde otomatik güncelleme
- **Backend Sync:** Kategori ve attribute'lar backend'de merkezi olarak yönetiliyor

## Eski Dosyalar

- `categories-with-attributes.ts` - Statik kategori attribute'ları
- `categories-enhanced.ts` - Gelişmiş statik kategori yapısı
- `new-categories-no-input.json` - JSON formatında statik kategoriler (925KB)
- `categoryFeatures.ts` - Kategori özellikleri
- `categories.-old-2.txt` - Eski kategori formatı

## Yeni Sistem

- **categoryService.ts** - Backend API entegrasyonu
- **useCategories.ts** - React Query hooks
- **Backend API** - `/api/v1/categories` ve `/api/v1/categories/attributes`

## Tarih

**Deprecated:** 30 Ağustos 2025
**Sebep:** Dinamik kategori sistemine geçiş

## Toplam Boyut

**Deprecated dosyalar:** ~975KB
**Yeni sistem:** ~50KB (sadece gerekli kod)
