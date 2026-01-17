# 🔍 Browser'da Hızlı VPS Kontrolü

## ✅ Yöntem 1: Network Tab (En Kolay - Frontend Yeniden Başlatmaya Gerek Yok)

1. **Developer Tools** açın (F12)
2. **Network** tab'ine gidin
3. Sayfayı yenileyin (F5)
4. API isteklerini filtreleyin (XHR veya Fetch)

**VPS kullanıyorsanız:**
- Request URL: `https://api.benalsam.com/api/v1/admin/...`
- Domain: `api.benalsam.com`

**Local kullanıyorsanız:**
- Request URL: `http://localhost:3002/api/v1/...`
- Domain: `localhost`

---

## ✅ Yöntem 2: Console Log (Sayfa Yüklendiğinde Otomatik)

Sayfa yüklendiğinde console'da otomatik olarak şunu görmelisiniz:

```
🔧 Environment Config: {
  adminApiUrl: 'https://api.benalsam.com/api/v1/admin',  // VPS URL
  useVpsServices: '✅ VPS',
  ...
}
🌐 API Source: VPS (api.benalsam.com)
```

Eğer local kullanıyorsanız:
```
adminApiUrl: 'http://localhost:3002/api/v1',
useVpsServices: '❌ Local',
🌐 API Source: Local (localhost)
```

---

## ✅ Yöntem 3: checkApiSource() Fonksiyonu

**ÖNEMLİ:** Frontend'i yeniden başlatmanız gerekiyor!

```bash
# Frontend'i durdurun (Ctrl+C)
# Sonra yeniden başlatın
cd benalsam-web-next
npm run dev
```

Sonra browser console'da:

```javascript
checkApiSource()
```

---

## ✅ Yöntem 4: Manuel Kontrol (Frontend Yeniden Başlatmaya Gerek Yok)

Browser console'da şunu yazın:

```javascript
// Network tab'den bir API isteğini seçin ve şunu yazın:
fetch('https://api.benalsam.com/api/v1/admin/health')
  .then(r => r.json())
  .then(d => console.log('✅ VPS çalışıyor:', d))
  .catch(e => console.log('❌ VPS erişilemiyor:', e))

// Local'i test etmek için:
fetch('http://localhost:3002/api/v1/health')
  .then(r => r.json())
  .then(d => console.log('✅ Local çalışıyor:', d))
  .catch(e => console.log('❌ Local çalışmıyor (normal - VPS kullanıyorsunuz):', e))
```

---

## 🎯 En Hızlı Kontrol (Önerilen)

**Network Tab kullanın - Frontend yeniden başlatmaya gerek yok!**

1. F12 → Network tab
2. Sayfayı yenileyin (F5)
3. API isteklerine bakın
4. URL'ler `api.benalsam.com` ise → ✅ VPS kullanıyorsunuz
5. URL'ler `localhost` ise → ❌ Local kullanıyorsunuz

---

## 📊 Kontrol Checklist

- [ ] Network tab'de API istekleri `api.benalsam.com` adresine gidiyor
- [ ] Console'da otomatik log'da "✅ VPS" mesajı var
- [ ] Local endpoint'ler çalışmıyor (normal)
- [ ] VPS endpoint'leri çalışıyor (200 OK)

