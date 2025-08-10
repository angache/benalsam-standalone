# Benalsam Monorepo - PM2 Setup Guide

Bu kılavuz, Benalsam monorepo projesini PM2 ile nasıl çalıştıracağınızı açıklar.

## 📋 Gereksinimler

- Node.js (v18+)
- pnpm
- PM2 (`npm install -g pm2`)

## 🚀 Hızlı Başlangıç

### Lokal Geliştirme

```bash
# Lokal geliştirme için tüm servisleri başlat
./start-local.sh
```

### VPS Production

```bash
# VPS'de production için tüm servisleri başlat
./start-vps.sh
```

## 📁 Config Dosyaları

- `ecosystem.local.js` - Lokal geliştirme için
- `ecosystem.vps.js` - VPS production için
- `ecosystem.config.js` - Ana config (artık kullanılmıyor)

## 🌐 Servisler

### Lokal Geliştirme
- **Admin Backend**: http://localhost:3002
- **Admin UI**: http://localhost:3003/admin/
- **Web**: http://localhost:5173
- **Mobile Dev Server**: http://localhost:8081

### VPS Production
- **Admin Backend**: http://209.227.228.96:3002
- **Admin UI**: http://209.227.228.96:3003/admin/
- **Web**: http://209.227.228.96:5173

## 🛠️ PM2 Komutları

```bash
# Tüm servisleri başlat
pm2 start ecosystem.local.js    # Lokal için
pm2 start ecosystem.vps.js      # VPS için

# Servisleri durdur
pm2 stop all

# Servisleri yeniden başlat
pm2 restart all

# Logları görüntüle
pm2 logs

# Belirli servisin loglarını görüntüle
pm2 logs admin-backend

# Durumu kontrol et
pm2 status

# Servisleri sil
pm2 delete all
```

## 🔧 Environment Variables

### Lokal Geliştirme
- Redis: `localhost:6379`
- Elasticsearch: `http://localhost:9200`
- API URL: `http://localhost:3002`

### VPS Production
- Redis: `209.227.228.96:6379`
- Elasticsearch: `http://209.227.228.96:9200`
- API URL: `http://209.227.228.96:3002`

## 🚨 Sorun Giderme

### Servis Başlamıyor
```bash
# Logları kontrol et
pm2 logs

# Environment variable'ları güncelle
pm2 restart all --update-env
```

### Port Çakışması
```bash
# Hangi portların kullanıldığını kontrol et
lsof -i :3002
lsof -i :3003
lsof -i :5173
```

### Cache Sorunları
```bash
# PM2 cache'ini temizle
pm2 kill
pm2 start ecosystem.local.js
```

## 📝 Notlar

- Lokal geliştirmede Redis ve Elasticsearch gerekli değil
- VPS'de tüm servisler çalışır
- Admin UI `/admin/` base path kullanır
- Mobile dev server sadece lokal geliştirmede çalışır 