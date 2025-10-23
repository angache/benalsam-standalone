# 🔐 Login & 2FA System TODO

> **Oluşturulma Tarihi:** 2025-01-22  
> **Durum:** 🔴 Başlanmadı  
> **Öncelik:** Yüksek  
> **Tahmini Süre:** 8 gün  
> **Kaynak:** `benalsam-web-next/`

---

## 🎯 **Genel Bakış**

NextAuth.js + Supabase hybrid yaklaşımı ile modern login ve 2FA sistemi implementasyonu.

### **Teknoloji Stack:**
- **Frontend:** NextAuth.js (session management)
- **Backend:** Supabase (user data) + Admin Backend (2FA)
- **2FA:** TOTP (Google Authenticator, Authy)
- **Security:** CSRF protection, rate limiting, RLS

---

## 📋 **Faz 1: Temel Altyapı (2 gün)**

### **1.1 NextAuth.js Kurulumu**
- [ ] `next-auth` paketini yükle
- [ ] `@next-auth/supabase-adapter` paketini yükle
- [ ] NextAuth.js konfigürasyonu oluştur
- [ ] Session provider'ı app layout'a ekle
- [ ] TypeScript type'ları tanımla

### **1.2 Environment Setup**
- [ ] `.env.local` dosyasına Supabase URL ve key ekle
- [ ] Admin backend URL'ini environment'a ekle
- [ ] NextAuth.js secret key oluştur
- [ ] Environment validation ekle

### **1.3 Database Schema**
- [ ] Mevcut Supabase tablolarını kontrol et
- [ ] `users` tablosunda `is_2fa_enabled` field'ını kontrol et
- [ ] Gerekli index'leri ekle
- [ ] RLS policy'lerini kontrol et

**Görevler:**
- [ ] `npm install next-auth @next-auth/supabase-adapter`
- [ ] `app/api/auth/[...nextauth]/route.ts` oluştur
- [ ] `app/layout.tsx`'e SessionProvider ekle
- [ ] `types/auth.ts` oluştur
- [ ] Environment variables setup

---

## 📋 **Faz 2: API Routes (2 gün)**

### **2.1 NextAuth.js API**
- [ ] `/api/auth/[...nextauth]/route.ts` oluştur
- [ ] Credentials provider konfigürasyonu
- [ ] JWT callback'leri yaz
- [ ] Session callback'leri yaz
- [ ] Error handling ekle

### **2.2 Custom API Routes**
- [ ] `/api/auth/supabase/route.ts` oluştur
- [ ] `/api/2fa/verify/route.ts` oluştur
- [ ] `/api/2fa/setup/route.ts` oluştur
- [ ] `/api/2fa/enable/route.ts` oluştur
- [ ] `/api/2fa/disable/route.ts` oluştur

### **2.3 API Integration**
- [ ] Supabase client konfigürasyonu
- [ ] Admin backend API calls
- [ ] Error handling ve logging
- [ ] Rate limiting ekle

**Görevler:**
- [ ] NextAuth.js config dosyası
- [ ] Supabase API route'ları
- [ ] 2FA API route'ları
- [ ] Error handling middleware
- [ ] Rate limiting middleware

---

## 📋 **Faz 3: UI Components (3 gün)**

### **3.1 Login Page**
- [ ] `/app/auth/login/page.tsx` oluştur
- [ ] Email/password form
- [ ] "Beni Hatırla" checkbox
- [ ] "Şifremi Unuttum" link
- [ ] "Hesabınız Yok mu?" register link
- [ ] Loading states ve error handling

### **3.2 Register Page**
- [ ] `/app/auth/register/page.tsx` oluştur
- [ ] Name, email, password form
- [ ] Password confirmation
- [ ] Terms & conditions checkbox
- [ ] Email verification flow

### **3.3 2FA Pages**
- [ ] `/app/auth/2fa/verify/page.tsx` oluştur
- [ ] 6-digit code input
- [ ] Resend code functionality
- [ ] Timer countdown
- [ ] Error handling

- [ ] `/app/auth/2fa/setup/page.tsx` oluştur
- [ ] QR code display
- [ ] Manual secret key
- [ ] Backup codes display
- [ ] Verification step

### **3.4 UI Components**
- [ ] `AuthForm` component
- [ ] `TwoFactorInput` component
- [ ] `QRCodeDisplay` component
- [ ] `BackupCodes` component
- [ ] Loading spinners
- [ ] Error messages

**Görevler:**
- [ ] Login sayfası ve form
- [ ] Register sayfası ve form
- [ ] 2FA verification sayfası
- [ ] 2FA setup sayfası
- [ ] Reusable UI components
- [ ] Form validation

---

## 📋 **Faz 4: Route Protection (1 gün)**

### **4.1 Middleware**
- [ ] `middleware.ts` oluştur
- [ ] Route protection logic
- [ ] 2FA requirement check
- [ ] Role-based access
- [ ] Redirect logic

### **4.2 Protected Components**
- [ ] `ProtectedRoute` component
- [ ] `RequireAuth` HOC
- [ ] `Require2FA` component
- [ ] Session checking utilities

### **4.3 Route Configuration**
- [ ] Public routes tanımla
- [ ] Protected routes tanımla
- [ ] 2FA required routes tanımla
- [ ] Admin routes tanımla

**Görevler:**
- [ ] Next.js middleware setup
- [ ] Route protection logic
- [ ] Protected components
- [ ] Session utilities
- [ ] Redirect logic

---

## 📋 **Faz 5: Advanced Features (2 gün)**

### **5.1 Password Reset**
- [ ] `/app/auth/forgot-password/page.tsx`
- [ ] `/app/auth/reset-password/page.tsx`
- [ ] Email sending logic
- [ ] Token validation
- [ ] Password strength checker

### **5.2 Email Verification**
- [ ] `/app/auth/verify-email/page.tsx`
- [ ] Email verification logic
- [ ] Resend verification
- [ ] Success/error states

### **5.3 Profile Management**
- [ ] `/app/profile/page.tsx`
- [ ] `/app/profile/security/page.tsx`
- [ ] 2FA enable/disable
- [ ] Password change
- [ ] Account settings

**Görevler:**
- [ ] Password reset flow
- [ ] Email verification flow
- [ ] Profile management
- [ ] Security settings
- [ ] Account settings

---

## 📋 **Faz 6: Testing & Polish (1 gün)**

### **6.1 Testing**
- [ ] Unit testleri yaz
- [ ] Integration testleri yaz
- [ ] E2E testleri yaz
- [ ] Error scenario testleri

### **6.2 Polish**
- [ ] Loading states optimize et
- [ ] Error messages iyileştir
- [ ] UX improvements
- [ ] Performance optimization

### **6.3 Documentation**
- [ ] API documentation
- [ ] Component documentation
- [ ] Setup guide
- [ ] Troubleshooting guide

**Görevler:**
- [ ] Test suite setup
- [ ] Test cases yaz
- [ ] Performance optimization
- [ ] Documentation
- [ ] Final polish

---

## 🚀 **Quick Start Commands**

```bash
# 1. Paketleri yükle
npm install next-auth @next-auth/supabase-adapter
npm install @supabase/supabase-js
npm install qrcode speakeasy

# 2. Environment setup
cp .env.example .env.local
# .env.local dosyasını düzenle

# 3. NextAuth.js config
# app/api/auth/[...nextauth]/route.ts oluştur

# 4. UI pages
# app/auth/login/page.tsx oluştur
# app/auth/2fa/verify/page.tsx oluştur
```

---

## 📊 **Timeline**

- **Gün 1-2:** Temel altyapı + API routes
- **Gün 3-5:** UI components + Route protection  
- **Gün 6-7:** Advanced features + Testing
- **Gün 8:** Polish + Documentation

**Toplam: 8 gün** ile tam functional login & 2FA sistemi! 🎉

---

## 🎯 **Success Metrics**

### **KPI'lar:**
- Login success rate: %95+
- 2FA completion rate: %90+
- Session security: CSRF protection
- Performance: <2s login time
- User experience: Intuitive flow

### **Security Features:**
- CSRF protection
- Rate limiting
- Session management
- 2FA enforcement
- Password strength
- Account lockout

---

## 🔗 **İlgili Dosyalar**

- `benalsam-web-next/app/api/auth/[...nextauth]/route.ts`
- `benalsam-web-next/app/auth/login/page.tsx`
- `benalsam-web-next/app/auth/2fa/verify/page.tsx`
- `benalsam-web-next/middleware.ts`
- `benalsam-web-next/types/auth.ts`

---

## 📝 **Notlar**

- Bu sistem authentication system'den sonra implement edilmeli
- 2FA için admin backend API'leri gerekli
- Supabase RLS policy'leri kontrol edilmeli
- Environment variables güvenli saklanmalı
- Test coverage %80+ olmalı

---

**Son Güncelleme:** 2025-01-22  
**Güncelleyen:** AI Assistant
