# 🚀 PM2 Deployment Guide - Benalsam Standalone Projects

## 📋 **Genel Bakış**

Bu rehber, Benalsam standalone projelerini VPS'de PM2 ile deploy etme adımlarını açıklar.

---

## 🎯 **VPS Deployment Stratejisi**

### **Infrastructure (Değişmeyecek):**
- ✅ **Redis** - Docker ile çalışıyor (`209.227.228.96:6379`)
- ✅ **Elasticsearch** - Docker ile çalışıyor (`209.227.228.96:9200`)

### **Applications (PM2 ile):**
- 🔧 **Admin Backend** - Port 3002
- 🔧 **Admin UI** - Port 3003  
- 🔧 **Web App** - Port 5173

---

## 📦 **PM2 Configuration Files**

### **1. Admin Backend (`benalsam-admin-backend/pm2.config.js`)**
```javascript
module.exports = {
  name: 'benalsam-admin-backend',
  script: 'dist/index.js',
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    PORT: 3002,
    API_VERSION: 'v1'
  },
  // Logging, restart policy, monitoring...
};
```

### **2. Admin UI (`benalsam-admin-ui/pm2.config.js`)**
```javascript
module.exports = {
  name: 'benalsam-admin-ui',
  script: 'dist/index.js',
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    PORT: 3003,
    HOST: '0.0.0.0'
  },
  // Logging, restart policy, monitoring...
};
```

### **3. Web App (`benalsam-web/pm2.config.js`)**
```javascript
module.exports = {
  name: 'benalsam-web',
  script: 'dist/index.js',
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    PORT: 5173,
    HOST: '0.0.0.0'
  },
  // Logging, restart policy, monitoring...
};
```

---

## 🚀 **VPS Deployment Adımları**

### **1. VPS'e Bağlan**
```bash
ssh root@209.227.228.96
```

### **2. Projeyi Clone Et**
```bash
cd /root
git clone https://github.com/angache/benalsam-standalone.git
cd benalsam-standalone
```

### **3. PM2 Yükle**
```bash
npm install -g pm2
```

### **4. Deployment Script Çalıştır**
```bash
./scripts/deploy-vps-pm2.sh
```

### **5. PM2 Konfigürasyonu Kaydet**
```bash
pm2 save
pm2 startup
```

---

## 🔧 **PM2 Management**

### **Deployment Script:**
```bash
# Tüm uygulamaları deploy et
./scripts/deploy-vps-pm2.sh
```

### **Management Script:**
```bash
# Status kontrol
./scripts/pm2-management.sh status

# Tüm uygulamaları restart et
./scripts/pm2-management.sh restart

# Sadece backend'i restart et
./scripts/pm2-management.sh backend restart

# Logları göster
./scripts/pm2-management.sh logs

# Monitor
./scripts/pm2-management.sh monitor
```

### **Manuel PM2 Komutları:**
```bash
# Status
pm2 status

# Logs
pm2 logs

# Restart specific app
pm2 restart benalsam-admin-backend

# Stop specific app
pm2 stop benalsam-admin-backend

# Delete app
pm2 delete benalsam-admin-backend

# Monitor
pm2 monit
```

---

## 📊 **Monitoring ve Logging**

### **PM2 Status:**
```bash
pm2 status
```

**Çıktı:**
```
┌─────┬─────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name                │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼─────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ benalsam-admin-backend │ default     │ 1.0.0   │ fork    │ 12345    │ 2D     │ 0    │ online    │ 0%       │ 45.0mb   │ root     │ disabled │
│ 1   │ benalsam-admin-ui   │ default     │ 1.0.0   │ fork    │ 12346    │ 2D     │ 0    │ online    │ 0%       │ 35.0mb   │ root     │ disabled │
│ 2   │ benalsam-web        │ default     │ 1.0.0   │ fork    │ 12347    │ 2D     │ 0    │ online    │ 0%       │ 40.0mb   │ root     │ disabled │
└─────┴─────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

### **Log Dosyaları:**
```
benalsam-admin-backend/logs/
├── combined.log
├── out.log
└── error.log

benalsam-admin-ui/logs/
├── combined.log
├── out.log
└── error.log

benalsam-web/logs/
├── combined.log
├── out.log
└── error.log
```

---

## 🔍 **Troubleshooting**

### **Uygulama Başlamıyor:**
```bash
# Logları kontrol et
pm2 logs benalsam-admin-backend

# Manuel başlat
cd benalsam-admin-backend
npm run build
pm2 start pm2.config.js
```

### **Port Çakışması:**
```bash
# Port kullanımını kontrol et
netstat -tulpn | grep :3002
netstat -tulpn | grep :3003
netstat -tulpn | grep :5173

# Gerekirse process'i kill et
kill -9 <PID>
```

### **Memory Sorunu:**
```bash
# Memory kullanımını kontrol et
pm2 monit

# Memory limit ayarla
pm2 restart benalsam-admin-backend --max-memory-restart 1G
```

---

## 📈 **Performance Optimization**

### **PM2 Cluster Mode:**
```javascript
// pm2.config.js
module.exports = {
  instances: 'max', // CPU core sayısı kadar
  exec_mode: 'cluster'
};
```

### **Memory Limits:**
```javascript
// pm2.config.js
module.exports = {
  max_memory_restart: '1G',
  node_args: '--max-old-space-size=1024'
};
```

### **Auto Restart:**
```javascript
// pm2.config.js
module.exports = {
  autorestart: true,
  max_restarts: 10,
  min_uptime: '10s'
};
```

---

## 🔒 **Security**

### **Environment Variables:**
```bash
# .env dosyasını güvenli tut
chmod 600 benalsam-admin-backend/.env
chmod 600 benalsam-admin-ui/.env
chmod 600 benalsam-web/.env
```

### **Firewall:**
```bash
# Sadece gerekli portları aç
ufw allow 3002  # Admin Backend
ufw allow 3003  # Admin UI
ufw allow 5173  # Web App
ufw allow 6379  # Redis
ufw allow 9200  # Elasticsearch
```

---

## 📝 **Deployment Checklist**

### **Pre-Deployment:**
- [ ] VPS'e bağlan
- [ ] Git repository clone et
- [ ] PM2 yükle
- [ ] Environment dosyalarını hazırla

### **Deployment:**
- [ ] Deployment script çalıştır
- [ ] PM2 status kontrol et
- [ ] Logları kontrol et
- [ ] PM2 konfigürasyonu kaydet

### **Post-Deployment:**
- [ ] Uygulamaları test et
- [ ] Monitoring kur
- [ ] Backup stratejisi
- [ ] SSL certificate

---

**Son Güncelleme:** 2025-08-11  
**Versiyon:** 1.0  
**Durum:** Production Ready
