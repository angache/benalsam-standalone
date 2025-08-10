# 🚀 VPS PNPM Setup Guide

## 📋 İçindekiler
1. [PNPM Kurulumu](#pnpm-kurulumu)
2. [VPS Deployment](#vps-deployment)
3. [PNPM Komutları](#pnpm-komutları)
4. [Troubleshooting](#troubleshooting)

---

## 📦 PNPM Kurulumu

### **VPS'de PNPM Kurulumu:**
```bash
# Node.js kurulu olduğundan emin ol
node --version
npm --version

# PNPM kur
npm install -g pnpm

# Versiyon kontrolü
pnpm --version
```

### **PNPM Konfigürasyonu:**
```bash
# Global store ayarla (opsiyonel)
pnpm config set store-dir /var/www/.pnpm-store

# Auto-install peers
pnpm config set auto-install-peers true

# Strict peer dependencies
pnpm config set strict-peer-dependencies false
```

---

## 🚀 VPS Deployment

### **1. Hızlı Deployment:**
```bash
# VPS'e bağlan
ssh root@209.227.228.96

# Repository'yi clone et
cd /var/www
git clone https://github.com/angache/Benalsam-Monorepo.git benalsam
cd benalsam

# Otomatik deployment
./scripts/deploy-vps.sh
```

### **2. Manuel Deployment:**
```bash
# Dependencies kur
pnpm install

# Production build
pnpm run build

# Environment setup
cp scripts/env.production.template .env
nano .env  # Gerekli değerleri düzenle

# PM2 ile başlat
pnpm run pm2:start:prod
```

### **3. Tek Komutla Setup:**
```bash
# Tüm işlemleri tek seferde yap
pnpm run vps:setup
```

---

## 🎮 PNPM Komutları

### **Temel Komutlar:**
```bash
# Dependencies kur
pnpm install

# Production build
pnpm run build

# Development
pnpm run dev

# Test
pnpm run test

# Lint
pnpm run lint
```

### **Monorepo Komutları:**
```bash
# Tüm paketlerde build
pnpm run build --recursive

# Belirli pakette build
pnpm --filter admin-backend run build

# Belirli pakette dev
pnpm --filter admin-ui run dev

# Belirli pakette test
pnpm --filter web run test
```

### **PM2 ile PNPM:**
```bash
# Production başlat
pnpm run pm2:start:prod

# Status kontrol
pnpm run pm2:status:prod

# Logları görüntüle
pnpm run pm2:logs:prod

# Restart
pnpm run pm2:restart:prod

# Stop
pnpm run pm2:stop:prod
```

---

## 🔧 PNPM Özellikleri

### **Avantajlar:**
- ✅ **Hızlı**: npm'den 2-3x daha hızlı
- ✅ **Disk Tasarrufu**: Symlink kullanımı
- ✅ **Güvenli**: Strict dependency resolution
- ✅ **Monorepo Desteği**: Built-in workspace
- ✅ **Deterministic**: Lockfile garantisi

### **VPS'de PNPM Kullanımı:**
```bash
# Workspace kurulumu
pnpm install --frozen-lockfile

# Production build
pnpm run build --prod

# Cache temizleme
pnpm store prune

# Global paketler
pnpm add -g pm2
```

---

## 🚨 Troubleshooting

### **PNPM Kurulum Sorunları:**
```bash
# PNPM cache temizle
pnpm store prune

# Lockfile yeniden oluştur
rm pnpm-lock.yaml
pnpm install

# Node modules temizle
rm -rf node_modules
pnpm install
```

### **Permission Sorunları:**
```bash
# Global store için permission
sudo chown -R $USER:$USER /var/www/.pnpm-store

# PNPM global kurulum
sudo npm install -g pnpm

# User-specific kurulum
npm install -g pnpm --prefix ~/.npm-global
```

### **Memory Sorunları:**
```bash
# Node memory limit artır
export NODE_OPTIONS="--max-old-space-size=4096"

# PNPM ile build
pnpm run build --max-old-space-size=4096
```

### **Network Sorunları:**
```bash
# Registry değiştir
pnpm config set registry https://registry.npmjs.org/

# Proxy ayarla (gerekirse)
pnpm config set proxy http://proxy-server:port
pnpm config set https-proxy http://proxy-server:port
```

---

## 📊 Performance Monitoring

### **PNPM Performance:**
```bash
# Install süresi
time pnpm install

# Build süresi
time pnpm run build

# Disk kullanımı
du -sh node_modules
du -sh ~/.pnpm-store
```

### **PM2 ile Monitoring:**
```bash
# Real-time monitoring
pm2 monit

# Performance metrics
pm2 show admin-backend
pm2 show admin-ui
pm2 show web

# Log analysis
pm2 logs --lines 100
```

---

## 🔄 CI/CD Integration

### **GitHub Actions (PNPM):**
```yaml
name: Deploy to VPS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Setup PNPM
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build
        run: pnpm run build
        
      - name: Deploy to VPS
        run: |
          ssh root@209.227.228.96 "cd /var/www/benalsam && git pull && pnpm install && pnpm run build && pm2 reload ecosystem.production.config.js"
```

---

## 🎯 Best Practices

### **VPS'de PNPM Kullanımı:**
1. ✅ **Frozen Lockfile**: `pnpm install --frozen-lockfile`
2. ✅ **Production Build**: `pnpm run build --prod`
3. ✅ **Cache Management**: Düzenli `pnpm store prune`
4. ✅ **Workspace**: Monorepo avantajlarından yararlan
5. ✅ **Security**: `pnpm audit` ile güvenlik kontrolü

### **Performance Tips:**
```bash
# Parallel install
pnpm install --parallel

# Selective install
pnpm install --filter admin-backend

# Cache optimization
pnpm config set store-dir /var/www/.pnpm-store
pnpm config set cache-dir /var/www/.pnpm-cache
```

---

## 🎉 Sonuç

**VPS'de PNPM ile deployment çok daha hızlı ve verimli:**

- ✅ **Hızlı kurulum** (npm'den 2-3x daha hızlı)
- ✅ **Disk tasarrufu** (symlink kullanımı)
- ✅ **Monorepo desteği** (built-in workspace)
- ✅ **Güvenli dependency resolution**
- ✅ **Deterministic builds**

**PNPM ile VPS deployment hazır!** 🚀✨

---

*Bu rehber, VPS'de PNPM kullanarak optimal deployment için hazırlanmıştır.* 