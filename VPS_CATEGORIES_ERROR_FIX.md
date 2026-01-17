# 🔧 VPS Categories Service Hatası - Çözüm

## 🐛 Hata

```
❌ [ERROR] [CategoryCache] Error fetching from API {}
```

Bu hata, Categories Service'e VPS üzerinden bağlanırken oluşuyor.

---

## 🔍 Olası Nedenler

1. **VPS'deki Categories Service çalışmıyor**
2. **CORS hatası** - VPS'deki servis localhost'tan gelen istekleri kabul etmiyor
3. **SSL sertifikası sorunu**
4. **Nginx routing sorunu**

---

## ✅ Çözüm Adımları

### 1. VPS'deki Categories Service'i Kontrol Et

```bash
# VPS'e SSH ile bağlan
ssh root@46.62.212.96

# PM2'de Categories Service'i kontrol et
pm2 list | grep categories

# Health endpoint'ini test et
curl https://api.benalsam.com/api/v1/categories/health

# Veya direkt servis endpoint'ini test et
curl https://api.benalsam.com/api/v1/categories/api/v1/categories
```

**Beklenen:** `200 OK` ve JSON response

---

### 2. CORS Kontrolü

VPS'deki Categories Service'in CORS ayarlarını kontrol et:

```bash
# Categories Service .env dosyasını kontrol et
cat /opt/benalsam/services/benalsam-categories-service/.env | grep CORS

# CORS_ORIGIN ekle (gerekirse)
echo 'CORS_ORIGIN=http://localhost:3000,https://benalsam.vercel.app' >> /opt/benalsam/services/benalsam-categories-service/.env

# Servisi yeniden başlat
pm2 restart benalsam-categories-service
```

---

### 3. Nginx Routing Kontrolü

Nginx config'ini kontrol et:

```bash
# Nginx config'i kontrol et
cat /etc/nginx/sites-available/benalsam | grep categories

# Beklenen:
# location /api/v1/categories/ {
#     rewrite ^/api/v1/categories/(.*)$ /api/v1/$1 break;
#     proxy_pass http://categories_service;
# }
```

---

### 4. Browser Console'da Detaylı Hata

Frontend yeniden başladıktan sonra browser console'da daha detaylı hata göreceksiniz:

```javascript
// Error object artık daha detaylı loglanacak
// Console'da şunu göreceksiniz:
{
  message: "...",
  stack: "...",
  name: "...",
  baseURL: "https://api.benalsam.com/api/v1/categories"
}
```

---

### 5. Manuel Test

Browser console'da manuel test:

```javascript
// VPS endpoint'ini test et
fetch('https://api.benalsam.com/api/v1/categories/api/v1/categories')
  .then(r => r.json())
  .then(d => console.log('✅ VPS çalışıyor:', d))
  .catch(e => console.log('❌ VPS hatası:', e))
```

---

## 🎯 Hızlı Çözüm

Eğer VPS'deki Categories Service çalışmıyorsa:

```bash
# VPS'de
pm2 restart benalsam-categories-service
pm2 logs benalsam-categories-service --lines 50
```

Eğer CORS hatası varsa:

```bash
# VPS'de Categories Service .env dosyasına ekle
echo 'CORS_ORIGIN=http://localhost:3000,https://benalsam.vercel.app' >> /opt/benalsam/services/benalsam-categories-service/.env
pm2 restart benalsam-categories-service
```

---

## 📊 Kontrol Checklist

- [ ] VPS'deki Categories Service çalışıyor (`pm2 list`)
- [ ] Health endpoint çalışıyor (`curl https://api.benalsam.com/api/v1/categories/health`)
- [ ] CORS ayarları doğru
- [ ] Nginx routing doğru
- [ ] Browser console'da detaylı hata mesajı var

---

## 🔍 Debug

Frontend yeniden başladıktan sonra browser console'da daha detaylı hata göreceksiniz. Bu hata mesajını paylaşın, birlikte çözelim.

