# 🔧 VPS Geçişi için .env.local Ayarları

## ⚠️ Sorun

Frontend hala `localhost:3015` adresine bağlanmaya çalışıyor. Bu yüzden Categories Service'e erişemiyor.

**Hata:**
```
baseURL: 'http://localhost:3015'
AggregateError: Error (network connection failed)
```

---

## ✅ Çözüm

`benalsam-web-next/.env.local` dosyasına şu satırları ekleyin:

```env
# VPS Services Configuration
USE_VPS_SERVICES=true
NEXT_PUBLIC_USE_VPS_SERVICES=true
```

---

## 📝 Adımlar

1. **`.env.local` dosyasını açın:**
   ```bash
   cd benalsam-web-next
   nano .env.local
   # veya
   code .env.local
   ```

2. **Dosyanın sonuna şu satırları ekleyin:**
   ```env
   # VPS Services Configuration
   USE_VPS_SERVICES=true
   NEXT_PUBLIC_USE_VPS_SERVICES=true
   ```

3. **Frontend'i yeniden başlatın:**
   ```bash
   # Ctrl+C ile durdurun
   npm run dev
   ```

---

## 🔍 Kontrol

Frontend yeniden başladıktan sonra log'larda şunu görmelisiniz:

**Önceki (Yanlış):**
```
baseURL: 'http://localhost:3015'
```

**Sonrası (Doğru):**
```
baseURL: 'https://api.benalsam.com/api/v1/categories'
```

---

## 📋 Tam .env.local Örneği

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Admin Backend (VPS)
NEXT_PUBLIC_ADMIN_BACKEND_URL=https://api.benalsam.com/api/v1/admin
NEXT_PUBLIC_ADMIN_BACKEND_WS_URL=wss://api.benalsam.com

# VPS Services Configuration
USE_VPS_SERVICES=true
NEXT_PUBLIC_USE_VPS_SERVICES=true

# Environment
NODE_ENV=development
```

---

## ⚠️ Önemli Notlar

1. **`.env.local` dosyası git'e commit edilmez** (`.gitignore`'da)
2. **Her geliştirici kendi `.env.local` dosyasını oluşturmalı**
3. **Production'da Vercel environment variables kullanılır**

---

## 🚀 Sonraki Adımlar

`.env.local` dosyasını güncelledikten sonra:

1. Frontend'i yeniden başlatın
2. Browser console'da `baseURL` kontrolü yapın
3. Network tab'de VPS isteklerini kontrol edin

