# 📦 Shared-Types Paketi Kullanım Rehberi

## 🎯 Genel Bakış

`@benalsam/shared-types` paketi, Benalsam web ve mobile uygulamaları arasında paylaşılan TypeScript tipleri, utility fonksiyonları ve Supabase servislerini içerir. Bu paket sayesinde kod tekrarını önler ve tutarlılık sağlarız.

## 📁 Paket Yapısı

```
packages/shared-types/
├── src/
│   ├── types/           # TypeScript tip tanımları
│   ├── services/        # Supabase client ve servisler
│   ├── utils/           # Utility fonksiyonları
│   └── index.ts         # Ana export dosyası
├── dist/                # Build edilmiş dosyalar
├── package.json
└── tsconfig.json
```

## 🚀 Kurulum ve Geliştirme

### 1. Geliştirme Modu (Watch Mode)

Shared-types paketinde değişiklik yaparken watch mode'u kullanın:

```bash
cd packages/shared-types
npm run dev
```

Bu komut TypeScript'i watch mode'da çalıştırır ve dosya değişikliklerinde otomatik olarak `dist/` klasörünü günceller.

### 2. Production Build

```bash
cd packages/shared-types
npm run build
```

### 3. Temizlik

```bash
cd packages/shared-types
npm run clean
```

## 📦 Mevcut Export'lar

### 🔧 Utility Fonksiyonları

```typescript
import { 
  formatPrice,           // Fiyat formatlama (₺)
  formatDate,            // Tarih formatlama (Türkçe)
  formatRelativeTime,    // Göreceli zaman (2 saat önce)
  formatPhoneNumber,     // Telefon numarası formatlama
  validateEmail,         // Email doğrulama
  getInitials,           // İsim baş harfleri
  truncateText,          // Metin kısaltma
  getAvatarUrl,          // Avatar URL oluşturma
  isPremiumUser,         // Premium kullanıcı kontrolü
  getTrustLevel,         // Güven seviyesi hesaplama
  getTrustLevelColor     // Güven seviyesi rengi
} from '@benalsam/shared-types';
```

### 🗄️ Supabase Servisleri

```typescript
import { supabase, db } from '@benalsam/shared-types';
```

### 📋 TypeScript Tipleri

```typescript
import type { 
  User,           // Kullanıcı tipi
  Listing,        // İlan tipi
  Offer,          // Teklif tipi
  Conversation,   // Sohbet tipi
  Message,        // Mesaj tipi
  Category,       // Kategori tipi
  // ... ve diğer tipler
} from '@benalsam/shared-types';
```

## 💡 Kullanım Örnekleri

### Web Projesinde Kullanım

```javascript
// pages/AuthPage.jsx
import { supabase, formatDate, validateEmail } from '@benalsam/shared-types';

const AuthPage = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Email doğrulama
    if (!validateEmail(formData.email)) {
      toast({ title: "Geçersiz Email", description: "Lütfen geçerli bir email girin." });
      return;
    }
    
    // Supabase ile giriş
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
  };
};
```

### Mobile Projesinde Kullanım

```typescript
// screens/ListingDetailScreen.tsx
import { formatPrice, formatDate, getTrustLevel } from '@benalsam/shared-types';

const ListingDetailScreen = ({ listing }) => {
  return (
    <View>
      <Text>Fiyat: {formatPrice(listing.budget)}</Text>
      <Text>Tarih: {formatDate(listing.created_at)}</Text>
      <Text>Güven: {getTrustLevel(listing.user.trust_score)}</Text>
    </View>
  );
};
```

### Yeni Utility Fonksiyonu Ekleme

1. **Fonksiyonu Ekle:**
```typescript
// packages/shared-types/src/index.ts

/**
 * Metni büyük harfe çevir
 */
export const toUpperCase = (text: string): string => {
  return text.toUpperCase();
};
```

2. **Otomatik Build:**
Watch mode aktifse otomatik olarak build edilir, değilse:
```bash
npm run build
```

3. **Kullan:**
```typescript
import { toUpperCase } from '@benalsam/shared-types';

const result = toUpperCase('merhaba'); // "MERHABA"
```

## 🔄 Değişiklik Yapma Süreci

### 1. Geliştirme
```bash
# Terminal 1: Shared-types watch mode
cd packages/shared-types
npm run dev

# Terminal 2: Web projesi
cd packages/web
npm run dev

# Terminal 3: Mobile projesi
cd packages/mobile
npx expo start
```

### 2. Değişiklik Yapma
- `packages/shared-types/src/` altındaki dosyaları düzenle
- Otomatik olarak `dist/` klasörüne build edilir
- Web ve mobile projeleri otomatik olarak yeni değişiklikleri alır

### 3. Test Etme
Browser console'da:
```javascript
import('@benalsam/shared-types').then(module => {
  console.log('Available functions:', Object.keys(module));
  console.log('Test function:', module.formatPhoneNumber('905551234567'));
});
```

## 🛠️ Yeni Tip Ekleme

### 1. Tip Tanımı
```typescript
// packages/shared-types/src/types/index.ts

export interface Notification {
  id: string;
  user_id: string;
  type: 'offer' | 'message' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
```

### 2. Export
```typescript
// packages/shared-types/src/index.ts
export * from './types/index';
```

### 3. Kullanım
```typescript
import type { Notification } from '@benalsam/shared-types';

const notification: Notification = {
  id: '1',
  user_id: 'user123',
  type: 'offer',
  title: 'Yeni Teklif',
  message: 'İlanınıza yeni bir teklif geldi',
  is_read: false,
  created_at: new Date().toISOString()
};
```

## 🔧 Yeni Supabase Servisi Ekleme

### 1. Servis Oluşturma
```typescript
// packages/shared-types/src/services/notificationService.ts
import { supabase } from './supabaseClient';

export const getNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  return { data, error };
};
```

### 2. Export
```typescript
// packages/shared-types/src/index.ts
export { getNotifications } from './services/notificationService';
```

### 3. Kullanım
```typescript
import { getNotifications } from '@benalsam/shared-types';

const { data: notifications, error } = await getNotifications(userId);
```

## 📋 Best Practices

### ✅ Doğru Kullanım
- Tüm ortak tipleri shared-types'ta tanımlayın
- Utility fonksiyonları shared-types'ta tutun
- Supabase client'ı shared-types'tan import edin
- Watch mode'u geliştirme sırasında kullanın

### ❌ Yanlış Kullanım
- Her projede ayrı tip tanımları yapmayın
- Utility fonksiyonları kopyalamayın
- Farklı Supabase client'ları kullanmayın
- Production'da watch mode kullanmayın

## 🚨 Sorun Giderme

### Build Hatası
```bash
cd packages/shared-types
npm run clean
npm run build
```

### Import Hatası
```bash
# Web projesinde
cd packages/web
npm install

# Mobile projesinde
cd packages/mobile
npm install
```

### TypeScript Hatası
```bash
# Shared-types'ı yeniden build et
cd packages/shared-types
npm run build

# Projeleri yeniden başlat
cd packages/web && npm run dev
cd packages/mobile && npx expo start
```

## 📚 Ek Kaynaklar

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Monorepo Best Practices](https://monorepo.tools/)

---

**Not:** Bu dokümantasyon sürekli güncellenmektedir. Yeni özellikler eklendikçe bu rehber de güncellenecektir. 