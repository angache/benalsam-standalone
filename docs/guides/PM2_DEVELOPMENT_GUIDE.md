# 🚀 PM2 Development Rehberi

## 📋 İçindekiler
1. [PM2 Nedir?](#pm2-nedir)
2. [Kurulum](#kurulum)
3. [Temel Komutlar](#temel-komutlar)
4. [Servis Yönetimi](#servis-yönetimi)
5. [Log Yönetimi](#log-yönetimi)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 PM2 Nedir?

**PM2 (Process Manager 2)**, Node.js uygulamalarını yönetmek için kullanılan güçlü bir process manager'dır.

### **✅ Avantajları:**
- **Tek komutla** tüm servisleri yönet
- **Auto-restart** özelliği
- **Merkezi log** yönetimi
- **Process monitoring** (CPU, Memory)
- **Load balancing** desteği
- **Zero-downtime** deployment

---

## 🛠️ Kurulum

### **Global Kurulum:**
```bash
npm install -g pm2
```

### **Versiyon Kontrolü:**
```bash
pm2 --version
```

---

## ⚡ Temel Komutlar

### **1. Tüm Servisleri Başlat:**
```bash
# Ecosystem config ile başlat
npm run pm2:start

# Veya direkt PM2 ile
pm2 start ecosystem.config.js
```

### **2. Servisleri Durdur:**
```bash
# Tüm servisleri durdur
npm run pm2:stop

# Veya direkt PM2 ile
pm2 stop ecosystem.config.js
```

### **3. Servisleri Yeniden Başlat:**
```bash
# Restart (durdur ve başlat)
npm run pm2:restart

# Reload (zero-downtime restart)
npm run pm2:reload
```

### **4. Servisleri Sil:**
```bash
npm run pm2:delete
```

---

## 🎮 Servis Yönetimi

### **Servis Listesi:**
```bash
# Tüm servisleri listele
npm run pm2:status

# Veya direkt PM2 ile
pm2 list
pm2 status
```

### **Tekil Servis Yönetimi:**
```bash
# Belirli servisi başlat
pm2 start admin-backend
pm2 start admin-ui
pm2 start web
pm2 start mobile-dev-server

# Belirli servisi durdur
pm2 stop admin-backend
pm2 stop admin-ui

# Belirli servisi restart et
pm2 restart admin-backend
pm2 reload admin-ui

# Belirli servisi sil
pm2 delete admin-backend
```

### **Servis Bilgileri:**
```bash
# Detaylı servis bilgisi
pm2 show admin-backend
pm2 show admin-ui
pm2 show web
pm2 show mobile-dev-server

# Servis konfigürasyonu
pm2 show admin-backend --json
```

---

## 📝 Log Yönetimi

### **Tüm Logları Görüntüle:**
```bash
# Real-time log streaming
npm run pm2:logs

# Veya direkt PM2 ile
pm2 logs
```

### **Belirli Servisin Logları:**
```bash
# Admin backend logları
pm2 logs admin-backend

# Admin UI logları
pm2 logs admin-ui

# Web logları
pm2 logs web

# Mobile dev server logları
pm2 logs mobile-dev-server
```

### **Log Filtreleme:**
```bash
# Son 100 satır
pm2 logs --lines 100

# Sadece error logları
pm2 logs --err

# Sadece out logları
pm2 logs --out

# Belirli servisin error logları
pm2 logs admin-backend --err
```

### **Log Temizleme:**
```bash
# Tüm logları temizle
npm run pm2:flush

# Veya direkt PM2 ile
pm2 flush
```

---

## 📊 Monitoring

### **Real-time Monitoring:**
```bash
# Terminal-based monitoring dashboard
npm run pm2:monit

# Veya direkt PM2 ile
pm2 monit
```

### **Web Dashboard:**
```bash
# PM2 Plus web dashboard
pm2 plus
```

### **Performance Metrics:**
```bash
# CPU ve Memory kullanımı
pm2 show admin-backend

# Detaylı metrics
pm2 show admin-backend --json
```

---

## 🔧 Gelişmiş Komutlar

### **Environment Variables:**
```bash
# Development environment
pm2 start ecosystem.config.js --env development

# Production environment
pm2 start ecosystem.config.js --env production
```

### **Watch Mode:**
```bash
# File değişikliklerini izle (otomatik restart)
pm2 start ecosystem.config.js --watch
```

### **Cluster Mode:**
```bash
# Multiple instances çalıştır
pm2 start ecosystem.config.js -i max
pm2 start ecosystem.config.js -i 4
```

### **Save ve Startup:**
```bash
# Mevcut process listesini kaydet
pm2 save

# Startup script oluştur
pm2 startup

# Sistem başlangıcında otomatik başlat
pm2 resurrect
```

---

## 🚀 Development Workflow

### **1. Geliştirme Başlangıcı:**
```bash
# Tüm servisleri başlat
npm run pm2:start

# Logları takip et
npm run pm2:logs
```

### **2. Kod Değişikliği:**
```bash
# Kod değiştir (otomatik restart)
# Logları takip et
pm2 logs admin-backend
```

### **3. Servis Yenileme:**
```bash
# Belirli servisi yenile
pm2 reload admin-backend

# Tüm servisleri yenile
npm run pm2:reload
```

### **4. Geliştirme Sonu:**
```bash
# Tüm servisleri durdur
npm run pm2:stop

# Veya sadece logları temizle
npm run pm2:flush
```

---

## 🔍 Troubleshooting

### **Yaygın Sorunlar:**

#### **1. Port Çakışması:**
```bash
# Hangi portların kullanıldığını kontrol et
lsof -i :3002
lsof -i :3003
lsof -i :5173
lsof -i :8081

# Servisi durdur ve yeniden başlat
pm2 restart admin-backend
```

#### **2. Memory Sorunları:**
```bash
# Memory kullanımını kontrol et
pm2 monit

# Servisi restart et
pm2 restart admin-backend
```

#### **3. Log Dosyası Sorunları:**
```bash
# Log dosyalarını temizle
pm2 flush

# Log dizinini kontrol et
ls -la packages/admin-backend/logs/
```

#### **4. Environment Variables:**
```bash
# Environment variables'ları kontrol et
pm2 show admin-backend

# .env dosyasını kontrol et
cat packages/admin-backend/.env
```

### **Debug Komutları:**
```bash
# Detaylı debug bilgisi
pm2 logs admin-backend --lines 200

# Process bilgileri
pm2 show admin-backend --json

# System resources
pm2 monit
```

---

## 📋 Servis Konfigürasyonu

### **Admin Backend (Port 3002):**
- **Name**: `admin-backend`
- **Script**: `npm run dev`
- **Environment**: Development
- **Watch**: `src/` dizini
- **Auto-restart**: Enabled
- **Memory limit**: 1GB

### **Admin UI (Port 3003):**
- **Name**: `admin-ui`
- **Script**: `npm run dev`
- **Environment**: Development
- **Watch**: `src/` dizini
- **Auto-restart**: Enabled
- **Memory limit**: 1GB

### **Web (Port 5173):**
- **Name**: `web`
- **Script**: `npm run dev`
- **Environment**: Development
- **Watch**: `src/` dizini
- **Auto-restart**: Enabled
- **Memory limit**: 1GB

### **Mobile Dev Server (Port 8081):**
- **Name**: `mobile-dev-server`
- **Script**: `npx expo start --dev-client`
- **Environment**: Development
- **Watch**: `src/` dizini
- **Auto-restart**: Enabled
- **Memory limit**: 1GB

---

## 🎯 Best Practices

### **✅ Öneriler:**
1. **Her zaman logları takip et**: `pm2 logs`
2. **Monitoring kullan**: `pm2 monit`
3. **Regular restart**: Haftada bir restart
4. **Log rotation**: Log dosyalarını düzenli temizle
5. **Environment separation**: Dev/Prod ayrımı

### **❌ Kaçınılması Gerekenler:**
1. **Force kill**: `pm2 kill` kullanma
2. **Manual process management**: PM2 dışında process yönetme
3. **Log accumulation**: Log dosyalarını büyütme
4. **Memory leaks**: Memory limitlerini aşma

---

## 🎉 Sonuç

PM2 ile development süreci çok daha düzenli ve verimli hale gelir:

- ✅ **Tek komutla** tüm servisleri yönet
- ✅ **Merkezi log** yönetimi
- ✅ **Real-time monitoring**
- ✅ **Auto-restart** özelliği
- ✅ **Zero-downtime** development

**Happy coding!** 🚀✨

---

*Bu rehber, Benalsam projesi için PM2 kullanımını açıklar. Güncellemeler için lütfen dokümanı takip edin.* 