# 2FA (İki Aşamalı Doğrulama) Implementasyonu TODO

## 📋 **Genel Bakış**
Mobil ve web uygulamalarında 2FA (TOTP) implementasyonu yapılacak.

## 🎯 **Hedefler**
- [ ] Web'de 2FA setup sayfası
- [ ] Mobile'da 2FA setup sayfası  
- [ ] QR kod oluşturma ve gösterimi
- [ ] TOTP doğrulama sistemi
- [ ] Backup codes sistemi
- [ ] 2FA enable/disable yönetimi

## 📦 **Gerekli Kütüphaneler**

### Web için:
```bash
npm install qrcode react-qr-code otplib
```

### Mobile için:
```bash
npm install react-native-qrcode-svg otplib
```

## 🗄️ **Veritabanı Durumu**
- ✅ `profiles` tablosunda `is_2fa_enabled` alanı mevcut
- ❌ `totp_secret` alanı eklenmeli
- ❌ `backup_codes` alanı eklenmeli

## 🔧 **Implementasyon Adımları**

### **Faz 1: Temel 2FA Setup**
1. **QR Kod Oluşturma**
   - TOTP secret generate etme
   - QR kod oluşturma (otplib + qrcode)
   - QR kod gösterimi (react-qr-code)

2. **TOTP Verification**
   - 6 haneli kod input
   - TOTP doğrulama (otplib)
   - Rate limiting

3. **Enable/Disable**
   - 2FA açma/kapama
   - Veritabanı güncelleme

### **Faz 2: Gelişmiş Özellikler**
1. **Backup Codes**
   - 8 haneli yedek kodlar oluşturma
   - Backup codes ile giriş
   - Backup codes yönetimi

2. **Recovery Process**
   - 2FA kaybı durumunda kurtarma
   - Email ile recovery
   - Admin recovery

3. **Session Management**
   - 2FA aktif oturumları
   - Device tracking
   - Session termination

### **Faz 3: Güvenlik**
1. **Rate Limiting**
   - Brute force koruması
   - IP-based limiting
   - Account lockout

2. **Audit Logging**
   - 2FA aktiviteleri
   - Login attempts
   - Security events

3. **Device Tracking**
   - Hangi cihazdan aktif
   - Device fingerprinting
   - Suspicious activity detection

## 📱 **UI/UX Tasarımı**

### **Web Sayfaları:**
- `/ayarlar2/guvenlik/2fa-setup` - 2FA kurulum
- `/ayarlar2/guvenlik/2fa-verify` - 2FA doğrulama
- `/ayarlar2/guvenlik/2fa-backup` - Backup codes
- `/ayarlar2/guvenlik/2fa-recovery` - Kurtarma

### **Mobile Sayfaları:**
- `SecurityScreen` - 2FA bölümü
- `TwoFactorSetupScreen` - Kurulum
- `TwoFactorVerifyScreen` - Doğrulama
- `BackupCodesScreen` - Yedek kodlar

## 🔐 **Güvenlik Önlemleri**
- [ ] TOTP secret encryption
- [ ] Backup codes encryption
- [ ] Rate limiting
- [ ] Session management
- [ ] Audit logging
- [ ] Device tracking

## 📊 **Test Senaryoları**
- [ ] 2FA setup flow
- [ ] TOTP verification
- [ ] Backup codes usage
- [ ] Recovery process
- [ ] Rate limiting
- [ ] Error handling

## 🚀 **Öncelik Sırası**
1. **Web 2FA Setup** (SecurityPage içinde)
2. **Mobile 2FA Setup** (SecurityScreen içinde)
3. **Backup Codes**
4. **Recovery Process**
5. **Advanced Security**

## 📝 **Notlar**
- Supabase Auth MFA desteği kontrol edilmeli
- TOTP standardına uygun implementasyon
- Cross-platform uyumluluk
- Accessibility considerations
- Internationalization support

---
**Oluşturulma:** 2025-01-01
**Öncelik:** Orta
**Durum:** Beklemede 