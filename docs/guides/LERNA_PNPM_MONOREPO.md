# 🏗️ Lerna + PNPM Monorepo Guide

## 📋 İçindekiler
1. [Monorepo Yapısı](#monorepo-yapısı)
2. [Lerna + PNPM Entegrasyonu](#lerna--pnpm-entegrasyonu)
3. [Monorepo Komutları](#monorepo-komutları)
4. [VPS Deployment](#vps-deployment)
5. [Best Practices](#best-practices)

---

## 🏢 Monorepo Yapısı

### **Proje Yapısı:**
```
benalsam-monorepo/
├── packages/
│   ├── admin-backend/     # Node.js API
│   ├── admin-ui/         # React Admin Panel
│   ├── web/              # React Web App
│   ├── mobile/           # React Native App
│   └── shared-types/     # TypeScript Types
├── lerna.json            # Lerna konfigürasyonu
├── pnpm-workspace.yaml   # PNPM workspace
├── package.json          # Root package.json
└── ecosystem.config.js   # PM2 konfigürasyonu
```

### **Paket Bağımlılıkları:**
```json
{
  "packages": {
    "admin-backend": "packages/admin-backend",
    "admin-ui": "packages/admin-ui", 
    "web": "packages/web",
    "mobile": "packages/mobile",
    "shared-types": "packages/shared-types"
  }
}
```

---

## 🔗 Lerna + PNPM Entegrasyonu

### **Konfigürasyon Dosyaları:**

#### **1. lerna.json:**
```json
{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "0.0.0",
  "npmClient": "pnpm",
  "command": {
    "publish": {
      "conventionalCommits": true,
      "message": "chore(release): publish"
    }
  },
  "packages": ["packages/*"]
}
```

#### **2. pnpm-workspace.yaml:**
```yaml
packages:
  - 'packages/*'
```

#### **3. package.json (Root):**
```json
{
  "name": "benalsam-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "lerna run build --stream",
    "dev": "lerna run dev --parallel --stream",
    "test": "lerna run test --stream",
    "lint": "lerna run lint --stream"
  }
}
```

---

## 🎮 Monorepo Komutları

### **Temel Lerna Komutları:**
```bash
# Tüm paketlerde build
pnpm run monorepo:build:all
lerna run build --stream

# Tüm paketlerde development
pnpm run monorepo:dev:all
lerna run dev --parallel --stream

# Tüm paketlerde test
pnpm run monorepo:test:all
lerna run test --stream

# Tüm paketlerde lint
pnpm run monorepo:lint:all
lerna run lint --stream
```

### **Paket Yönetimi:**
```bash
# Değişen paketleri listele
pnpm run monorepo:changed
lerna changed

# Paket farklarını görüntüle
pnpm run monorepo:diff
lerna diff

# Versiyon yönetimi
pnpm run monorepo:version
lerna version

# Paket yayınlama
pnpm run monorepo:publish
lerna publish
```

### **Temizlik ve Bootstrap:**
```bash
# Monorepo temizle
pnpm run monorepo:clean
lerna clean && pnpm store prune

# Bootstrap (gerekirse)
pnpm run monorepo:bootstrap
lerna bootstrap
```

### **Tekil Paket Komutları:**
```bash
# Belirli pakette build
lerna run build --scope=admin-backend
pnpm --filter admin-backend run build

# Belirli pakette dev
lerna run dev --scope=admin-ui
pnpm --filter admin-ui run dev

# Belirli pakette test
lerna run test --scope=web
pnpm --filter web run test
```

---

## 🚀 VPS Deployment

### **Monorepo ile VPS Deployment:**
```bash
# VPS'e bağlan
ssh root@209.227.228.96

# Repository'yi clone et
cd /var/www
git clone https://github.com/angache/Benalsam-Monorepo.git benalsam
cd benalsam

# PNPM kur (eğer yoksa)
npm install -g pnpm

# Monorepo dependencies kur
pnpm install

# Tüm paketlerde build
pnpm run monorepo:build:all

# Environment setup
cp scripts/env.production.template .env
nano .env

# PM2 ile başlat
pnpm run pm2:start:prod
```

### **Selektif Build (VPS için):**
```bash
# Sadece production paketlerini build et
pnpm --filter admin-backend run build
pnpm --filter admin-ui run build
pnpm --filter web run build

# Veya Lerna ile
lerna run build --scope=admin-backend --scope=admin-ui --scope=web
```

---

## 🔧 PM2 ile Monorepo

### **Ecosystem Konfigürasyonu:**
```javascript
// ecosystem.production.config.js
module.exports = {
  apps: [
    {
      name: 'admin-backend',
      cwd: './packages/admin-backend',
      script: 'pnpm',
      args: 'start',
      // ... diğer ayarlar
    },
    {
      name: 'admin-ui',
      cwd: './packages/admin-ui',
      script: 'pnpm',
      args: 'start',
      // ... diğer ayarlar
    },
    {
      name: 'web',
      cwd: './packages/web',
      script: 'pnpm',
      args: 'start',
      // ... diğer ayarlar
    }
  ]
};
```

### **PM2 Monorepo Komutları:**
```bash
# Tüm servisleri başlat
pnpm run pm2:start:prod

# Belirli servisi restart et
pm2 restart admin-backend

# Tüm logları görüntüle
pm2 logs

# Monorepo status
pm2 status
```

---

## 📊 Monorepo Avantajları

### **Lerna + PNPM Kombinasyonu:**
- ✅ **Hızlı**: PNPM'in hızı + Lerna'nın yönetimi
- ✅ **Disk Tasarrufu**: PNPM symlink sistemi
- ✅ **Dependency Yönetimi**: Lerna'nın güçlü yönetimi
- ✅ **Workspace**: PNPM workspace desteği
- ✅ **Versioning**: Lerna'nın otomatik versioning'i
- ✅ **Publishing**: Lerna'nın publishing sistemi

### **Monorepo Faydaları:**
- 🔄 **Code Sharing**: Shared types ve utilities
- 🎯 **Consistency**: Tek bir toolchain
- 🚀 **Deployment**: Tek seferde tüm servisler
- 🔍 **Visibility**: Tüm kod tek yerde
- 🧪 **Testing**: Cross-package testing

---

## 🎯 Best Practices

### **Monorepo Yönetimi:**
1. ✅ **Workspace Kullanımı**: PNPM workspace aktif
2. ✅ **Shared Dependencies**: Ortak dependencies root'ta
3. ✅ **Version Management**: Lerna ile otomatik versioning
4. ✅ **Selective Commands**: Belirli paketlerde komut çalıştırma
5. ✅ **Cross-Package Testing**: Paketler arası test

### **Development Workflow:**
```bash
# 1. Development
pnpm run monorepo:dev:all

# 2. Testing
pnpm run monorepo:test:all

# 3. Linting
pnpm run monorepo:lint:all

# 4. Build
pnpm run monorepo:build:all

# 5. Deploy
pnpm run vps:deploy
```

### **VPS Production:**
```bash
# 1. Install
pnpm install --frozen-lockfile

# 2. Build production
pnpm run monorepo:build:all

# 3. PM2 start
pnpm run pm2:start:prod

# 4. Monitor
pm2 monit
```

---

## 🔄 CI/CD Integration

### **GitHub Actions (Monorepo):**
```yaml
name: Monorepo CI/CD
on:
  push:
    branches: [main]

jobs:
  build:
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
        
      - name: Build all packages
        run: pnpm run monorepo:build:all
        
      - name: Test all packages
        run: pnpm run monorepo:test:all
        
      - name: Deploy to VPS
        run: |
          ssh root@209.227.228.96 "cd /var/www/benalsam && git pull && pnpm install && pnpm run monorepo:build:all && pm2 reload ecosystem.production.config.js"
```

---

## 🎉 Sonuç

**Lerna + PNPM monorepo yapısı ile:**

- ✅ **Güçlü monorepo yönetimi** (Lerna)
- ✅ **Hızlı dependency management** (PNPM)
- ✅ **Workspace desteği** (PNPM)
- ✅ **Otomatik versioning** (Lerna)
- ✅ **Selective commands** (Lerna)
- ✅ **Production deployment** (PM2)

**Monorepo yapısı korundu ve PNPM ile optimize edildi!** 🚀✨

---

*Bu rehber, Lerna + PNPM monorepo yapısını optimize etmek için hazırlanmıştır.* 