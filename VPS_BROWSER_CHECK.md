# 🔍 Browser Console'da VPS Kontrolü

Browser console'da `process.env` kullanılamaz. Bunun yerine şu yöntemleri kullanın:

---

## ✅ Doğru Yöntem 1: checkApiSource() Fonksiyonu

Browser console'da şunu yazın:

```javascript
checkApiSource()
```

**Beklenen Çıktı (VPS kullanıyorsa):**
```
🔍 API Source Check:
===================
📍 Admin API URL: https://api.benalsam.com/api/v1/admin
📍 WebSocket URL: wss://api.benalsam.com
🌐 Source: ✅ VPS (api.benalsam.com)
🔧 Environment: Development
===================
```

**Beklenen Çıktı (Local kullanıyorsa):**
```
🔍 API Source Check:
===================
📍 Admin API URL: http://localhost:3002/api/v1
📍 WebSocket URL: ws://localhost:3002
🌐 Source: ❌ Local (localhost)
🔧 Environment: Development
===================
```

---

## ✅ Doğru Yöntem 2: getApiConfig() Fonksiyonu

Browser console'da şunu yazın:

```javascript
getApiConfig()
```

Bu tüm environment config'i döndürür.

---

## ✅ Doğru Yöntem 3: Network Tab

1. **Developer Tools** açın (F12)
2. **Network** tab'ine gidin
3. Sayfayı yenileyin (F5)
4. API isteklerini filtreleyin

**VPS kullanıyorsanız:**
- Request URL: `https://api.benalsam.com/api/v1/admin/...`
- Status: `200 OK`

**Local kullanıyorsanız:**
- Request URL: `http://localhost:3002/api/v1/...`
- Status: `200 OK`

---

## ✅ Doğru Yöntem 4: Otomatik Console Log

Sayfa yüklendiğinde otomatik olarak console'da şunu görmelisiniz:

```
🔧 Environment Config: {
  environment: 'development',
  adminApiUrl: 'https://api.benalsam.com/api/v1/admin',  // VPS URL
  adminWsUrl: 'wss://api.benalsam.com',
  useVpsServices: '✅ VPS',
  ...
}
🌐 API Source: VPS (api.benalsam.com)
```

---

## ❌ Yanlış Yöntem (Çalışmaz)

```javascript
// ❌ Bu çalışmaz - process.env browser'da erişilebilir değil
console.log(process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL)
```

**Hata:**
```
Uncaught ReferenceError: process is not defined
```

---

## 🎯 Hızlı Kontrol

Browser console'da sadece şunu yazın:

```javascript
checkApiSource()
```

Bu size tüm bilgileri verecek!

---

## 📊 Kontrol Checklist

- [ ] Browser console'da `checkApiSource()` çalıştırıldı
- [ ] `adminApiUrl` VPS URL'i gösteriyor (`https://api.benalsam.com`)
- [ ] `Source: ✅ VPS` mesajı görünüyor
- [ ] Network tab'de istekler `api.benalsam.com` adresine gidiyor
- [ ] Otomatik console log'da "✅ VPS" mesajı var

