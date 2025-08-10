# 📋 Benalsam Projesi - Proje Standartları ve Kurallar

## 🎯 **Genel Bakış**

Bu doküman, Benalsam projesinin standalone yapıya geçiş sonrası proje standartlarını ve kurallarını tanımlar.

---

## 🏗️ **Proje Yapısı**

### **Standalone Repository Yapısı**
```
Benalsam/
├── benalsam-admin-backend/      # Admin Backend API (Standalone)
├── benalsam-admin-ui/          # Admin Dashboard UI (Standalone)
├── benalsam-web/               # Web Uygulaması (Standalone)
├── benalsam-shared-types/      # Ortak TypeScript Tipleri (NPM Package)
└── benalsam-infrastructure/    # VPS Infrastructure (Redis + Elasticsearch)
```

### **Her Proje İçin Standart Yapı**
```
project-name/
├── src/                        # Kaynak kodlar
├── dist/                       # Build çıktıları
├── node_modules/               # Dependencies
├── .env                        # Environment variables
├── .env.example               # Environment template
├── package.json               # NPM configuration
├── tsconfig.json              # TypeScript configuration
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose
└── README.md                  # Proje dokümantasyonu
```

---

## 📦 **Package Manager Standartları**

### **NPM Kullanımı (pnpm yerine)**
```bash
# Doğru kullanım
npm install
npm run dev
npm run build
npm start
npm test

# Yanlış kullanım (artık kullanılmıyor)
pnpm install
pnpm run dev
pnpm run build
```

### **Dependency Yönetimi**
- **Production dependencies**: `dependencies` bölümünde
- **Development dependencies**: `devDependencies` bölümünde
- **Shared types**: `benalsam-shared-types` NPM package olarak

---

## 🔧 **Environment Yönetimi**

### **Her Proje Kendi .env Dosyası**
```bash
# Admin Backend (.env)
REDIS_HOST=209.227.228.96
REDIS_URL=redis://209.227.228.96:6379
ELASTICSEARCH_URL=http://209.227.228.96:9200

# Admin UI (.env)
VITE_API_URL=http://localhost:3002/api/v1
VITE_ELASTICSEARCH_URL=http://209.227.228.96:9200

# Web (.env)
VITE_API_URL=http://localhost:3002/api/v1
VITE_ELASTICSEARCH_URL=http://209.227.228.96:9200
```

### **Environment Template**
- Her proje `.env.example` dosyası içermeli
- Hassas bilgiler `.env` dosyasında (git'e commit edilmez)
- VPS IP adresleri environment'da tanımlı

---

## 🐳 **Docker Standartları**

### **Her Proje Kendi Dockerfile'ı**
```dockerfile
# Standart Dockerfile yapısı
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3002
CMD ["npm", "start"]
```

### **Docker Compose Yapısı**
```yaml
# Her proje için docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs
```

### **Infrastructure Docker Compose**
```yaml
# benalsam-infrastructure/docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  elasticsearch:
    image: elasticsearch:8.11.0
    ports:
      - "9200:9200"
```

---

## 🔗 **Shared Types Kullanımı**

### **NPM Package Olarak Import**
```typescript
// Doğru kullanım
import { User, Listing } from 'benalsam-shared-types';

// Yanlış kullanım (artık kullanılmıyor)
import { User, Listing } from '@benalsam/shared-types';
```

### **Package.json Dependency**
```json
{
  "dependencies": {
    "benalsam-shared-types": "^1.0.0"
  }
}
```

---

## 🚀 **Development Workflow**

### **Local Development**
```bash
# 1. Her projeyi ayrı ayrı başlat
cd benalsam-admin-backend
npm run dev

cd ../benalsam-admin-ui
npm run dev

cd ../benalsam-web
npm run dev

# 2. VPS'de infrastructure çalıştır
cd benalsam-infrastructure
docker-compose up -d
```

### **Build ve Test**
```bash
# Her proje için
npm run build
npm test
npm run type-check
```

---

## 📝 **Kod Standartları**

### **TypeScript Kullanımı**
- Tüm yeni kod TypeScript ile yazılmalı
- Strict mode aktif olmalı
- Shared types kullanılmalı

### **Import/Export Standartları**
```typescript
// Doğru import sırası
import { config } from 'dotenv';  // 1. External packages
import express from 'express';     // 2. Third-party packages
import { User } from 'benalsam-shared-types';  // 3. Internal packages
import { authService } from './services';      // 4. Local imports
```

### **Error Handling**
```typescript
// Standart error handling
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  logger.error('Operation failed:', error);
  throw new Error('Operation failed');
}
```

---

## 🔒 **Güvenlik Standartları**

### **Environment Variables**
- Hassas bilgiler `.env` dosyasında
- `.env` dosyası git'e commit edilmez
- Production'da environment variables kullanılır

### **Authentication**
- JWT token kullanımı
- Token expiration kontrolü
- Secure cookie settings

---

## 📊 **Monitoring ve Logging**

### **Logging Standartları**
```typescript
import logger from './config/logger';

logger.info('Operation started');
logger.error('Operation failed:', error);
logger.warn('Warning message');
```

### **Health Checks**
- Her servis `/health` endpoint'i sağlamalı
- Database, Redis, Elasticsearch bağlantı kontrolü
- Response time monitoring

---

## 🧪 **Testing Standartları**

### **Test Yapısı**
```
src/
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── components/
└── services/
```

### **Test Komutları**
```bash
npm test              # Unit tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## 📚 **Dokümantasyon Standartları**

### **README.md Gereksinimleri**
Her proje README.md dosyası şunları içermeli:
- Proje açıklaması
- Kurulum adımları
- Environment variables
- Development commands
- Deployment instructions

### **API Dokümantasyonu**
- OpenAPI/Swagger formatında
- Endpoint açıklamaları
- Request/Response örnekleri
- Error codes

---

## 🔄 **Deployment Standartları**

### **VPS Deployment**
- Infrastructure (Redis + Elasticsearch) VPS'de
- Application services local'de çalışır
- Environment variables VPS IP'sine göre ayarlanır

### **Production Checklist**
- [ ] Security scan completed
- [ ] Dependencies updated
- [ ] Environment variables secured
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy ready

---

## 📋 **Code Review Standartları**

### **Review Checklist**
- [ ] TypeScript types doğru
- [ ] Error handling mevcut
- [ ] Logging eklenmiş
- [ ] Tests yazılmış
- [ ] Documentation güncellenmiş
- [ ] Security considerations

---

## 🚨 **Breaking Changes**

### **Monorepo'dan Standalone'a Geçiş**
- **pnpm → npm**: Package manager değişikliği
- **Workspace → NPM Package**: Shared types artık NPM package
- **Monorepo → Standalone**: Her proje bağımsız repository
- **Docker**: Her proje kendi Dockerfile'ı

### **Migration Gereksinimleri**
- Environment variables güncellenmeli
- Import statements değiştirilmeli
- Docker commands güncellenmeli
- Deployment scripts değiştirilmeli

---

**Son Güncelleme:** 2025-08-10  
**Versiyon:** 2.0 (Standalone Yapı)  
**Geçerli:** Monorepo'dan standalone yapıya geçiş sonrası
