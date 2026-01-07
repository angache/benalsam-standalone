# Sorun Giderme Rehberi

## 🔧 Turbopack Cache Corruption

### Sorun
```
Failed to restore task data (corrupted database or bug)
Unable to open static sorted file 00011284.sst
No such file or directory (os error 2)
```

### Çözüm
Turbopack cache'i bozulmuş. Temizleyin:

```bash
# Cache'i temizle
rm -rf .next .turbo

# Dev server'ı yeniden başlat
npm run dev
```

### Kalıcı Çözüm
Eğer sık sık oluyorsa, `.gitignore`'a ekleyin:
```
.turbo/
```

## 🔧 import.meta.env Hatası

### Sorun
```
TypeError: Cannot read properties of undefined (reading 'DEV')
```

### Çözüm
Next.js'te `import.meta.env` çalışmaz. `process.env.NODE_ENV` kullanın:

```typescript
// ❌ Yanlış (Vite için)
import.meta.env.DEV

// ✅ Doğru (Next.js için)
process.env.NODE_ENV === 'development'
```

## 🔧 Port 3000 Kullanımda

### Sorun
```
Port 3000 is in use by process 17534
```

### Çözüm
```bash
# Process'i kapat
lsof -ti:3000 | xargs kill -9

# Veya farklı port kullan
PORT=3001 npm run dev
```

## 🔧 Lock Dosyası Hatası

### Sorun
```
Unable to acquire lock at .next/dev/lock
```

### Çözüm
```bash
# Lock dosyasını sil
rm -rf .next/dev/lock

# Dev server'ı yeniden başlat
npm run dev
```

## 🔧 web-vitals Eksik

### Sorun
```
Module not found: Can't resolve 'web-vitals'
```

### Çözüm
```bash
npm install web-vitals
```

## 🔧 Multiple Lockfiles Uyarısı

### Sorun
```
We detected multiple lockfiles
```

### Çözüm
Gereksiz lockfile'ı silin veya `next.config.js`'e ekleyin:
```javascript
experimental: {
  turbopack: {
    root: __dirname
  }
}
```

## Hızlı Temizlik Komutu

Tüm cache'leri temizlemek için:
```bash
rm -rf .next .turbo node_modules/.cache && npm run dev
```

