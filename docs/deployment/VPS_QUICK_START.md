# 🚀 VPS Quick Start Guide

## 📋 İçindekiler
1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Manuel Kurulum](#manuel-kurulum)
3. [Otomatik Deployment](#otomatik-deployment)
4. [Yönetim Komutları](#yönetim-komutları)
5. [Monitoring](#monitoring)

---

## ⚡ Hızlı Başlangıç

### **VPS'e Bağlan:**
```bash
ssh root@209.227.228.96
```

### **Otomatik Deployment (Önerilen):**
```bash
# Repository'yi clone et
cd /var/www
git clone https://github.com/angache/Benalsam-Monorepo.git benalsam
cd benalsam

# Deployment script'ini çalıştır
./scripts/deploy-vps.sh
```

### **Manuel Kurulum:**
```bash
# 1. Dependencies kur
pnpm install

# 2. Production build
pnpm run build

# 3. PM2 ile başlat
pnpm run pm2:start:prod

# 4. Status kontrol et
pnpm run pm2:status:prod
```

---

## 🛠️ Manuel Kurulum

### **1. Repository Setup:**
```bash
cd /var/www
git clone https://github.com/angache/Benalsam-Monorepo.git benalsam
cd benalsam
```

### **2. Environment Setup:**
```bash
# .env dosyası oluştur
cat > .env << EOF
NODE_ENV=production
PORT=3002

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=benalsam_listings

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Supabase
SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin Backend
ADMIN_JWT_SECRET=your_jwt_secret
ADMIN_PORT=3002
EOF
```

### **3. Dependencies ve Build:**
```bash
# Dependencies kur
pnpm install

# Production build
pnpm run build
```

### **4. PM2 Setup:**
```bash
# Mevcut servisleri durdur
pm2 delete all 2>/dev/null || true

# Production servisleri başlat
pm2 start ecosystem.production.config.js

# Startup script oluştur
pm2 startup
pm2 save
```

### **5. Firewall Setup:**
```bash
# Gerekli portları aç
ufw allow 3002/tcp  # Admin Backend
ufw allow 3003/tcp  # Admin UI
ufw allow 5173/tcp  # Web
```

---

## 🤖 Otomatik Deployment

### **Deployment Script Kullanımı:**
```bash
# Script'i çalıştırılabilir yap
chmod +x scripts/deploy-vps.sh

# Deployment'ı başlat
./scripts/deploy-vps.sh
```

### **Script Ne Yapar:**
1. ✅ **Sistem güncellemeleri**
2. ✅ **Node.js ve PM2 kontrolü**
3. ✅ **Repository clone/update**
4. ✅ **Dependencies kurulumu**
5. ✅ **Production build**
6. ✅ **Environment setup**
7. ✅ **PM2 servisleri başlatma**
8. ✅ **Firewall konfigürasyonu**
9. ✅ **Health check**
10. ✅ **Status raporu**

---

## 🎮 Yönetim Komutları

### **PM2 Komutları:**
```bash
# Servis durumu
pm2 status
pnpm run pm2:status:prod

# Logları görüntüle
pm2 logs
pnpm run pm2:logs:prod

# Servisleri restart et
pm2 restart all
pnpm run pm2:restart:prod

# Servisleri durdur
pm2 stop all
pnpm run pm2:stop:prod

# Servisleri başlat
pm2 start all
pnpm run pm2:start:prod

# Servisleri sil
pm2 delete all
pnpm run pm2:delete:prod
```

### **Tekil Servis Yönetimi:**
```bash
# Admin Backend
pm2 restart admin-backend
pm2 logs admin-backend

# Admin UI
pm2 restart admin-ui
pm2 logs admin-ui

# Web
pm2 restart web
pm2 logs web
```

---

## 📊 Monitoring

### **PM2 Monitoring:**
```bash
# Real-time monitoring
pm2 monit
pnpm run pm2:monit:prod

# Web dashboard
pm2 plus

# Performance metrics
pm2 show admin-backend
pm2 show admin-ui
pm2 show web
```

### **System Monitoring:**
```bash
# CPU ve Memory
htop
top

# Disk kullanımı
df -h

# Network connections
netstat -tulpn

# Process listesi
ps aux | grep node
```

### **Log Monitoring:**
```bash
# Tüm loglar
pm2 logs --lines 100

# Error logları
pm2 logs --err

# Belirli servisin logları
pm2 logs admin-backend --lines 50
```

---

## 🌐 Servis URL'leri

### **Production URLs:**
- **🌐 Admin Backend**: `http://209.227.228.96:3002`
- **🎛️ Admin UI**: `http://209.227.228.96:3003`
- **🌍 Web**: `http://209.227.228.96:5173`

### **API Endpoints:**
- **Health Check**: `http://209.227.228.96:3002/api/v1/health`
- **Elasticsearch**: `http://209.227.228.96:3002/api/v1/elasticsearch`
- **Admin API**: `http://209.227.228.96:3002/api/v1/admin`

---

## 🔧 Troubleshooting

### **Yaygın Sorunlar:**

#### **1. Port Çakışması:**
```bash
# Hangi portların kullanıldığını kontrol et
lsof -i :3002
lsof -i :3003
lsof -i :5173

# Servisi restart et
pm2 restart admin-backend
```

#### **2. Memory Sorunları:**
```bash
# Memory kullanımını kontrol et
pm2 monit

# Servisi restart et
pm2 restart admin-backend
```

#### **3. Build Sorunları:**
```bash
# Node modules'ı temizle
rm -rf node_modules
npm install

# Yeniden build et
npm run build
```

#### **4. Environment Sorunları:**
```bash
# .env dosyasını kontrol et
cat .env

# Environment variables'ları kontrol et
pm2 show admin-backend
```

---

## 🚀 Production Best Practices

### **✅ Öneriler:**
1. **Regular backups**: Düzenli yedekleme
2. **Log rotation**: Log dosyalarını düzenli temizle
3. **Monitoring**: Sürekli izleme
4. **Updates**: Düzenli güncelleme
5. **Security**: Güvenlik kontrolleri

### **❌ Kaçınılması Gerekenler:**
1. **Direct file editing**: Dosyaları doğrudan düzenleme
2. **Manual process management**: Manuel process yönetimi
3. **Root user**: Root kullanıcı ile çalışma
4. **Unsecured ports**: Güvensiz portlar

---

## 🎉 Sonuç

VPS'de PM2 ile production deployment çok kolay:

- ✅ **Otomatik deployment** script'i
- ✅ **Production-ready** konfigürasyon
- ✅ **Monitoring** ve logging
- ✅ **Auto-restart** özelliği
- ✅ **Load balancing** desteği

**Production deployment hazır!** 🚀✨

---

*Bu rehber, VPS'de hızlı başlangıç için hazırlanmıştır.* 