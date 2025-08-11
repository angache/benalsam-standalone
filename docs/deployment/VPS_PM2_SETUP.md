# 🖥️ VPS PM2 Kurulum Rehberi

## 📋 İçindekiler
1. [VPS Durumu](#vps-durumu)
2. [PM2 Kurulumu](#pm2-kurulumu)
3. [Port Yapılandırması](#port-yapılandırması)
4. [Environment Setup](#environment-setup)
5. [Production Konfigürasyonu](#production-konfigürasyonu)
6. [Monitoring](#monitoring)

---

## 🎯 VPS Durumu

### **✅ Mevcut Servisler:**
- **Elasticsearch**: `http://209.227.228.96:9200` ✅
- **Redis**: `209.227.228.96:6379` ✅
- **Node.js**: nvm ile yönetiliyor ✅
- **Git**: Repository mevcut ✅

### **⚠️ Gerekli Kurulumlar:**
- **PM2**: Global kurulum
- **Port forwarding**: 3002, 3003, 5173
- **Environment variables**: Production config
- **SSL certificates**: HTTPS için

---

## 🛠️ PM2 Kurulumu

### **1. Node.js Kontrolü:**
```bash
# Node.js versiyonunu kontrol et
node --version
npm --version

# nvm kullanıyorsan
nvm use stable
```

### **2. PM2 Global Kurulumu:**
```bash
# PM2'yi global olarak kur
npm install -g pm2

# Versiyon kontrolü
pm2 --version
```

### **3. PM2 Startup Script:**
```bash
# Startup script oluştur
pm2 startup

# Mevcut process listesini kaydet
pm2 save
```

---

## 🌐 Port Yapılandırması

### **1. UFW Firewall Ayarları:**
```bash
# Gerekli portları aç
sudo ufw allow 3002/tcp  # Admin Backend
sudo ufw allow 3003/tcp  # Admin UI
sudo ufw allow 5173/tcp  # Web
sudo ufw allow 8081/tcp  # Mobile Dev Server

# Firewall durumunu kontrol et
sudo ufw status
```

### **2. Nginx Reverse Proxy (Opsiyonel):**
```nginx
# /etc/nginx/sites-available/benalsam
server {
    listen 80;
    server_name your-domain.com;

    # Admin Backend
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Admin UI
    location /admin/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Web
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ⚙️ Environment Setup

### **1. Production Environment Variables:**
```bash
# /var/www/benalsam/.env
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

# Admin UI
VITE_API_URL=http://your-domain.com/api/v1
VITE_ELASTICSEARCH_URL=http://your-domain.com/api/v1/elasticsearch

# Web
VITE_API_URL=http://your-domain.com/api/v1
VITE_SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
```

### **2. Production Ecosystem Config:**
```javascript
// ecosystem.config.js (Production)
module.exports = {
  apps: [
    {
      name: 'admin-backend',
      cwd: '/var/www/benalsam/benalsam-admin-backend',
      script: 'npm',
      args: 'start', // production build
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        ELASTICSEARCH_URL: 'http://localhost:9200',
        ELASTICSEARCH_INDEX: 'benalsam_listings'
      },
      instances: 'max', // CPU core sayısı kadar
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    },
    {
      name: 'admin-ui',
      cwd: '/var/www/benalsam/benalsam-admin-ui',
      script: 'npm',
      args: 'start', // production build
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        VITE_API_URL: 'http://your-domain.com/api/v1'
      },
      instances: 1,
      max_memory_restart: '1G',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    },
    {
      name: 'web',
      cwd: '/var/www/benalsam/benalsam-web',
      script: 'npm',
      args: 'start', // production build
      env: {
        NODE_ENV: 'production',
        PORT: 5173,
        VITE_API_URL: 'http://your-domain.com/api/v1'
      },
      instances: 1,
      max_memory_restart: '1G',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: '209.227.228.96',
      ref: 'origin/main',
      repo: 'git@github.com:angache/benalsam-standalone.git',
      path: '/var/www/benalsam',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
```

---

## 🚀 Production Konfigürasyonu

### **1. Build Scripts:**
```json
// package.json (Production)
{
  "scripts": {
    "build": "lerna run build --stream",
    "start": "lerna run start --stream",
    "pm2:start": "pm2 start ecosystem.config.js --env production",
    "pm2:stop": "pm2 stop ecosystem.config.js",
    "pm2:restart": "pm2 restart ecosystem.config.js",
    "pm2:reload": "pm2 reload ecosystem.config.js",
    "pm2:delete": "pm2 delete ecosystem.config.js",
    "pm2:logs": "pm2 logs",
    "pm2:status": "pm2 status",
    "pm2:monit": "pm2 monit",
    "deploy": "pm2 deploy production"
  }
}
```

### **2. Production Build:**
```bash
# Tüm paketleri build et
npm run build

# PM2 ile başlat
npm run pm2:start

# Status kontrol et
npm run pm2:status
```

---

## 📊 Monitoring

### **1. PM2 Monitoring:**
```bash
# Real-time monitoring
pm2 monit

# Web dashboard
pm2 plus

# Log monitoring
pm2 logs --lines 100
```

### **2. System Monitoring:**
```bash
# CPU ve Memory kullanımı
htop
top

# Disk kullanımı
df -h

# Network connections
netstat -tulpn
```

### **3. Log Rotation:**
```bash
# PM2 log rotation
pm2 install pm2-logrotate

# Konfigürasyon
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## 🔧 VPS Kurulum Adımları

### **1. Repository Clone:**
```bash
cd /var/www
git clone https://github.com/angache/benalsam-standalone.git benalsam
cd benalsam
```

### **2. Dependencies Kurulumu:**
```bash
# Node.js versiyonunu ayarla
nvm use stable

# Dependencies kur
npm install

# Global PM2 kur
npm install -g pm2
```

### **3. Environment Setup:**
```bash
# Environment dosyasını oluştur
cp .env.example .env
nano .env  # Gerekli değerleri gir
```

### **4. Build ve Start:**
```bash
# Production build
npm run build

# PM2 ile başlat
npm run pm2:start

# Startup script
pm2 startup
pm2 save
```

---

## 🎯 Avantajlar

### **✅ Production Ready:**
- **Cluster mode**: Yüksek performans
- **Auto-restart**: Hata durumunda otomatik restart
- **Load balancing**: CPU core'ları arasında dağıtım
- **Memory management**: Otomatik memory limiti
- **Log management**: Merkezi log yönetimi

### **✅ Monitoring:**
- **Real-time monitoring**: CPU, Memory, Network
- **Log streaming**: Canlı log takibi
- **Performance metrics**: Detaylı performans verileri
- **Alert system**: Hata durumunda uyarı

### **✅ Deployment:**
- **Zero-downtime**: Kesintisiz deployment
- **Rollback**: Hızlı geri alma
- **Blue-green**: A/B testing desteği
- **Automated**: Otomatik deployment

---

## 🎉 Sonuç

VPS'de PM2 kullanımı production ortamında çok daha güçlü ve güvenilir:

- ✅ **High availability**: Yüksek erişilebilirlik
- ✅ **Scalability**: Ölçeklenebilirlik
- ✅ **Monitoring**: Kapsamlı izleme
- ✅ **Automation**: Otomasyon
- ✅ **Reliability**: Güvenilirlik

**Production-ready PM2 sistemi!** 🚀✨

---

*Bu rehber, VPS'de PM2 kurulumu ve yapılandırmasını açıklar.* 