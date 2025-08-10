# SHARED-TYPES ENTEGRASYONU DOKÜMANI

## 📋 Genel Bakış

Bu doküman, Benalsam monorepo projesinde `@benalsam/shared-types` paketinin tüm projelere (mobile, web, admin-backend, admin-ui) başarıyla entegre edilme sürecini detaylandırır.

## 🎯 Hedefler

- Tüm projelerde tip güvenliği sağlamak
- Kod tekrarını önlemek
- Merkezi tip yönetimi oluşturmak
- Admin-specific tipleri eklemek
- Dual build (CommonJS + ESM) desteği sağlamak

## 🏗️ Monorepo Yapısı

```
benalsam-monorepo/
├── package.json (Lerna konfigürasyonu)
├── lerna.json
└── packages/
    ├── shared-types/     # Merkezi tip paketi
    ├── mobile/          # React Native/Expo uygulaması
    ├── web/             # React/Vite web uygulaması
    ├── admin-backend/   # Node.js/Express API
    └── admin-ui/        # React/Vite admin paneli
```

## 🔧 Yapılan İşlemler

### 1. Monorepo Kurulumu

```bash
# Monorepo kökünde package.json oluşturuldu
{
  "name": "benalsam-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "clean": "lerna clean",
    "bootstrap": "lerna bootstrap",
    "build": "lerna run build",
    "dev": "lerna run dev --parallel"
  },
  "devDependencies": {
    "lerna": "^8.2.3"
  }
}

# Lerna initialize edildi
npx lerna init

# Paketler temizlendi ve yeniden kuruldu
npx lerna clean
npm install
```

### 2. Shared-Types Paketi Geliştirme

#### Package.json Konfigürasyonu
```json
{
  "name": "@benalsam/shared-types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./esm": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "npm run build:cjs && npm run build:esm",
    "build:cjs": "tsc -p tsconfig.json",
    "build:esm": "tsc -p tsconfig.esm.json"
  }
}
```

#### TypeScript Konfigürasyonu
- `tsconfig.json`: CommonJS build için
- `tsconfig.esm.json`: ESM build için

#### Eklenen Tipler

**Admin Tipleri:**
```typescript
export interface AdminPermission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: AdminRole;
  permissions: any[];
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT',
  CATEGORY_MANAGER = 'CATEGORY_MANAGER',
  ANALYTICS_MANAGER = 'ANALYTICS_MANAGER',
  USER_MANAGER = 'USER_MANAGER',
  CONTENT_MANAGER = 'CONTENT_MANAGER'
}
```

**Utility Fonksiyonlar:**
```typescript
export const formatPrice = (price: number): string
export const formatDate = (date: string | Date): string
export const formatRelativeTime = (date: string | Date): string
export const validateEmail = (email: string): boolean
export const getInitials = (name: string): string
export const truncateText = (text: string, maxLength: number): string
export const getAvatarUrl = (avatarUrl?: string, userId?: string): string
export const isPremiumUser = (user?: any): boolean
export const getTrustLevel = (trustScore: number): string
export const formatPhoneNumber = (phone: string): string
```

### 3. Proje Entegrasyonları

#### Mobile Projesi
```bash
# Package.json'a dependency eklendi
npm install @benalsam/shared-types

# Import örnekleri
import { formatDate, formatPrice, User, Listing } from '@benalsam/shared-types';
```

#### Web Projesi
```bash
# Package.json'a dependency eklendi
npm install @benalsam/shared-types

# Import örnekleri (ESM için)
import { formatDate } from '@benalsam/shared-types/esm';
import { User, Listing } from '@benalsam/shared-types';
```

#### Admin-Backend Projesi
```bash
# Package.json'a dependency eklendi
npm install @benalsam/shared-types

# Types dosyasında re-export
import type {
  AdminUser,
  AdminPermission,
  AdminApiResponse,
  // ... diğer tipler
} from '@benalsam/shared-types';

export {
  AdminUser,
  AdminPermission,
  AdminApiResponse,
  // ... diğer tipler
};
```

#### Admin-UI Projesi
```bash
# Package.json'a dependency eklendi
npm install @benalsam/shared-types

# Import örnekleri
import { AdminUser, AdminPermission } from '@benalsam/shared-types';
```

### 4. Çözülen Sorunlar

#### Tip Uyumsuzlukları
- `createdAt` → `created_at` düzeltildi
- `permissionId` → `permission_id` düzeltildi
- `ApiResponse` → `AdminApiResponse` düzeltildi

#### Import Sorunları
- CommonJS/ESM uyumluluğu sağlandı
- Dual build konfigürasyonu yapıldı
- Export path'leri düzeltildi

#### Build Sorunları
- Shared-types yeniden build edildi
- Package.json exports düzeltildi
- TypeScript konfigürasyonu optimize edildi

## 🚀 Çalışan Servisler

| Proje | URL | Durum |
|-------|-----|-------|
| **Admin-Backend** | http://localhost:3002/health | ✅ Çalışıyor |
| **Web** | http://localhost:5173 | ✅ Çalışıyor |
| **Admin-UI** | http://localhost:3003 | ✅ Çalışıyor |
| **Mobile** | Expo Dev Server | ✅ Çalışıyor |

## 📦 Paket İçeriği

### Tipler
- **User Tipleri**: User, UserProfile, UserFeedback
- **Listing Tipleri**: Listing, ListingWithUser, ListingStatus
- **Admin Tipleri**: AdminUser, AdminPermission, AdminRole
- **Message Tipleri**: Message, Conversation
- **Offer Tipleri**: Offer, OfferAttachment
- **Utility Tipleri**: ApiResponse, AdminApiResponse, Pagination

### Fonksiyonlar
- **Format Fonksiyonları**: formatPrice, formatDate, formatRelativeTime
- **Validation Fonksiyonları**: validateEmail
- **Utility Fonksiyonları**: getInitials, truncateText, getAvatarUrl
- **Business Logic**: isPremiumUser, getTrustLevel, formatPhoneNumber

## 💻 Kullanım Örnekleri

### Mobile/Web
```typescript
import { formatDate, formatPrice, User, Listing } from '@benalsam/shared-types';

const user: User = {
  id: '123',
  email: 'user@example.com',
  username: 'testuser'
};

const formattedDate = formatDate('2025-07-18');
const formattedPrice = formatPrice(1500);
```

### Admin-Backend
```typescript
import { AdminUser, AdminPermission, AdminApiResponse } from '../types';

const admin: AdminUser = {
  id: 'admin-123',
  email: 'admin@benalsam.com',
  password: 'hashed-password',
  first_name: 'Admin',
  last_name: 'User',
  role: AdminRole.ADMIN,
  permissions: [],
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const response: AdminApiResponse<AdminUser[]> = {
  success: true,
  data: [admin],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1
  }
};
```

## 🛠️ Geliştirme Komutları

```bash
# Shared-types build
cd packages/shared-types
npm run build

# Tüm projeleri çalıştır
cd benalsam-monorepo
npm run dev

# Tek proje çalıştır
cd packages/web && npm run dev
cd packages/admin-backend && npm run dev
cd packages/admin-ui && npm run dev
cd packages/mobile && npm start
```

## 📝 Notlar

1. **Dual Build**: Shared-types hem CommonJS hem ESM formatında build ediliyor
2. **Type Safety**: Tüm projelerde tip güvenliği sağlandı
3. **Backward Compatibility**: Eski import'lar korundu
4. **Admin Integration**: Admin-specific tipler eklendi
5. **Performance**: Build optimizasyonları yapıldı

## 🎉 Sonuç

Shared-types entegrasyonu başarıyla tamamlandı. Artık tüm projeler merkezi tip sistemini kullanıyor ve kod tekrarı önlendi. Tip güvenliği sağlandı ve geliştirme süreci daha verimli hale geldi.

---

**Oluşturulma Tarihi**: 18 Temmuz 2025  
**Güncelleyen**: AI Assistant  
**Versiyon**: 1.0.0 