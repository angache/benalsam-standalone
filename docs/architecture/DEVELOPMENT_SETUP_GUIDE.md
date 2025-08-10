# 🛠️ Development Setup Guide - Benalsam

## 📋 Genel Bakış
Bu döküman, Benalsam projesinin local development ortamında kurulum ve çalıştırma adımlarını detaylandırır.

## 🎯 Gereksinimler

### Sistem Gereksinimleri:
- **Node.js:** 18.x veya üzeri
- **pnpm:** 8.x veya üzeri
- **Git:** 2.x veya üzeri
- **Docker:** 20.x veya üzeri (opsiyonel)
- **Docker Compose:** 2.x veya üzeri (opsiyonel)

### Önerilen IDE:
- **VS Code** (önerilen)
- **WebStorm**
- **Sublime Text**

## 🚀 Kurulum Adımları

### 1. Repository Clone
```bash
# Repository'yi clone et
git clone https://github.com/angache/BenalsamMobil-2025.git
cd BenalsamMobil-2025

# Veya mevcut projeyi güncelle
git pull origin main
```

### 2. Node.js Kurulumu
```bash
# macOS (Homebrew ile)
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows
# https://nodejs.org/en/download/ adresinden indir
```

### 3. pnpm Kurulumu
```bash
# Global pnpm kurulumu
npm install -g pnpm

# Versiyon kontrolü
pnpm --version
```

### 4. Dependencies Kurulumu
```bash
# Monorepo root'ta
cd benalsam-monorepo

# Tüm workspace dependencies'leri yükle
pnpm install

# Veya sadece belirli package'ları
pnpm install --filter admin-backend
pnpm install --filter admin-ui
pnpm install --filter web
```

## 🔧 Environment Setup

### 1. Environment Variables
```bash
# Root dizinde .env dosyası oluştur
cp .env.example .env

# Gerekli değişkenleri doldur
nano .env
```

### 2. Temel Environment Variables:
```bash
# Server Configuration
SERVER_IP=localhost

# API URLs
VITE_API_URL=http://localhost:3002/api/v1
VITE_ELASTICSEARCH_URL=http://localhost:9200

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# CORS Configuration
CORS_ORIGIN=http://localhost:3003,http://localhost:5173

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/benalsam

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
```

### 3. Supabase Setup
```bash
# Supabase CLI kurulumu
npm install -g supabase

# Supabase login
supabase login

# Local Supabase başlat (opsiyonel)
supabase start
```

## 🏗️ Monorepo Yapısı

```
benalsam-monorepo/
├── packages/
│   ├── admin-backend/     # Admin API Backend
│   ├── admin-ui/         # Admin Dashboard UI
│   ├── web/              # Public Web Frontend
│   └── shared-types/     # Shared TypeScript Types
├── docs/                 # Documentation
├── nginx/               # Nginx Configuration
├── docker-compose.yml   # Docker Compose
├── package.json         # Root package.json
└── pnpm-workspace.yaml  # Workspace Configuration
```

## 🚀 Development Server Başlatma

### 1. Tüm Servisleri Başlat (Docker ile)
```bash
# Docker Compose ile tüm servisleri başlat
docker-compose up --build

# Arka planda çalıştır
docker-compose up --build -d

# Sadece belirli servisleri
docker-compose up admin-backend admin-ui
```

### 2. Manuel Başlatma (Docker olmadan)
```bash
# Terminal 1: Admin Backend
cd packages/admin-backend
pnpm run dev

# Terminal 2: Admin UI
cd packages/admin-ui
pnpm run dev

# Terminal 3: Web Frontend
cd packages/web
pnpm run dev
```

### 3. Development Portları:
- **Admin Backend:** http://localhost:3002
- **Admin UI:** http://localhost:3003
- **Web Frontend:** http://localhost:5173
- **Supabase Studio:** http://localhost:54323 (local)

## 🔍 Development Tools

### 1. VS Code Extensions (Önerilen)
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-docker"
  ]
}
```

### 2. Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 3. ESLint Configuration
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "root": true
}
```

## 🧪 Testing

### 1. Test Çalıştırma
```bash
# Tüm testleri çalıştır
pnpm test

# Belirli package'ın testleri
pnpm --filter admin-backend test
pnpm --filter admin-ui test

# Watch mode
pnpm test --watch

# Coverage ile
pnpm test --coverage
```

### 2. E2E Testing
```bash
# Playwright kurulumu
pnpm install -D @playwright/test

# E2E testleri çalıştır
pnpm run test:e2e

# UI mode
pnpm run test:e2e:ui
```

## 🔧 Debugging

### 1. VS Code Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Admin Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/packages/admin-backend/src/index.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug Admin UI",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3003",
      "webRoot": "${workspaceFolder}/packages/admin-ui/src"
    }
  ]
}
```

### 2. Logging
```typescript
// Debug logları için
console.log('🔧 Debug:', data);
console.error('❌ Error:', error);
console.warn('⚠️ Warning:', warning);
```

## 📦 Package Management

### 1. Yeni Dependency Ekleme
```bash
# Root level dependency
pnpm add -w package-name

# Belirli package'a dependency
pnpm add package-name --filter admin-backend

# Dev dependency
pnpm add -D package-name --filter admin-ui
```

### 2. Workspace Scripts
```bash
# Tüm workspace'lerde script çalıştır
pnpm run build --recursive

# Belirli workspace'te script
pnpm run dev --filter admin-ui

# Parallel execution
pnpm run dev --parallel
```

## 🔄 Git Workflow

### 1. Branch Strategy
```bash
# Feature branch oluştur
git checkout -b feature/new-feature

# Development branch
git checkout -b develop

# Hotfix branch
git checkout -b hotfix/critical-fix
```

### 2. Commit Convention
```bash
# Commit mesaj formatı
feat: add new user authentication
fix: resolve login issue
docs: update API documentation
style: format code with prettier
refactor: restructure user service
test: add unit tests for auth
chore: update dependencies
```

### 3. Pre-commit Hooks
```bash
# Husky kurulumu
pnpm add -D husky lint-staged

# Pre-commit hook
npx husky add .husky/pre-commit "pnpm lint-staged"
```

## 🚀 Production Build

### 1. Build Process
```bash
# Tüm package'ları build et
pnpm run build --recursive

# Belirli package'ı build et
pnpm run build --filter admin-ui

# Production build
NODE_ENV=production pnpm run build
```

### 2. Docker Build
```bash
# Production Docker image
docker build -t benalsam/admin-ui:latest ./packages/admin-ui

# Multi-stage build
docker build --target production -t benalsam/admin-ui:prod ./packages/admin-ui
```

## 🔍 Troubleshooting

### 1. Common Issues
```bash
# Port already in use
lsof -ti:3002 | xargs kill -9

# Node modules issues
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Docker issues
docker system prune -a
docker volume prune
```

### 2. Performance Issues
```bash
# Memory usage kontrolü
node --max-old-space-size=4096 packages/admin-backend/src/index.ts

# CPU profiling
node --prof packages/admin-backend/src/index.ts
```

## 📚 Faydalı Komutlar

### 1. Development
```bash
# Hot reload ile çalıştır
pnpm run dev

# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Format code
pnpm run format
```

### 2. Database
```bash
# Migration çalıştır
pnpm run db:migrate

# Seed data
pnpm run db:seed

# Reset database
pnpm run db:reset
```

### 3. Monitoring
```bash
# Process monitoring
htop
iotop

# Network monitoring
netstat -tlnp
ss -tlnp
```

## 🎯 Best Practices

### 1. Code Quality
- TypeScript strict mode kullan
- ESLint ve Prettier kurallarına uy
- Unit test coverage %80+ olmalı
- Commit mesajları conventional format'ta olmalı

### 2. Performance
- Bundle size'ı optimize et
- Lazy loading kullan
- Image optimization yap
- Caching stratejileri uygula

### 3. Security
- Environment variables'ları .env'de sakla
- Dependencies'leri güncel tut
- Security audit çalıştır
- Input validation yap

---

**Son Güncelleme:** 22 Temmuz 2025  
**Versiyon:** 1.0  
**Durum:** Development Ready ✅ 