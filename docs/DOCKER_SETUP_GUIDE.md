# 🐳 Docker Setup Guide - Benalsam Standalone Projects

## 📋 **Genel Bakış**

Bu rehber, Benalsam standalone projelerini (Admin Backend, Admin UI, Web) Docker ile kurulum ve çalıştırma adımlarını açıklar.

**⚠️ Önemli Değişiklik:** Monorepo yapısından standalone projelere geçiş yapıldı. Her proje artık bağımsız Docker container'ları kullanır.

---

## 🔧 **Gereksinimler**

### **Sistem Gereksinimleri**
- **Docker**: 20.10+ versiyonu
- **Docker Compose**: 2.0+ versiyonu
- **RAM**: Minimum 4GB (8GB önerilen)
- **Disk**: Minimum 10GB boş alan
- **OS**: Linux, macOS, Windows

### **Kurulum Kontrolü**
```bash
# Docker versiyonu kontrolü
docker --version

# Docker Compose versiyonu kontrolü
docker-compose --version

# Docker daemon durumu
docker info
```

---

## 🚀 **Hızlı Başlangıç**

### **1. Repository Clone**
```bash
# Her proje için ayrı repository
git clone https://github.com/your-username/benalsam-admin-backend.git
git clone https://github.com/your-username/benalsam-admin-ui.git
git clone https://github.com/your-username/benalsam-web.git
git clone https://github.com/your-username/benalsam-shared-types.git
```

### **2. Environment Setup**
```bash
# Her proje için ayrı environment dosyası
cd benalsam-admin-backend
cp .env.example .env
nano .env

cd ../benalsam-admin-ui
cp .env.example .env
nano .env

cd ../benalsam-web
cp .env.example .env
nano .env
```

### **3. Development Environment Başlatma**
```bash
# Her proje için ayrı başlatma
cd benalsam-admin-backend
npm run dev

cd ../benalsam-admin-ui
npm run dev

cd ../benalsam-web
npm run dev

# Veya Docker ile (her proje kendi Dockerfile'ı ile)
cd benalsam-admin-backend
docker-compose up -d

cd ../benalsam-admin-ui
docker-compose up -d

cd ../benalsam-web
docker-compose up -d
```

### **4. Production Environment Başlatma**
```bash
# Her proje için ayrı production deployment
cd benalsam-admin-backend
docker-compose -f docker-compose.production.yml up -d

cd ../benalsam-admin-ui
docker-compose -f docker-compose.production.yml up -d

cd ../benalsam-web
docker-compose -f docker-compose.production.yml up -d

# Veya VPS'de sadece infrastructure çalıştırma
cd benalsam-infrastructure
docker-compose up -d  # Redis ve Elasticsearch
```

---

## 🔧 **Environment Configuration**

### **Gerekli Environment Variables**

#### **Admin Backend (.env)**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Redis Configuration (VPS IP'si)
REDIS_HOST=209.227.228.96
REDIS_PORT=6379
REDIS_URL=redis://209.227.228.96:6379

# Elasticsearch Configuration (VPS IP'si)
ELASTICSEARCH_URL=http://209.227.228.96:9200
ELASTICSEARCH_INDEX=benalsam_listings
```

#### **Admin UI (.env)**
```bash
# API Configuration
VITE_API_URL=http://localhost:3002/api/v1
VITE_ELASTICSEARCH_URL=http://209.227.228.96:9200
```

#### **Web (.env)**
```bash
# API Configuration
VITE_API_URL=http://localhost:3002/api/v1
VITE_ELASTICSEARCH_URL=http://209.227.228.96:9200
```

### **Development Environment Variables**

#### **Local Development (Her Proje İçin)**
```bash
# Development settings
NODE_ENV=development
CORS_ORIGIN=http://localhost:3003,http://localhost:5173

# API URLs (Local)
VITE_API_URL=http://localhost:3002/api/v1
VITE_ELASTICSEARCH_URL=http://209.227.228.96:9200
```

#### **Package Manager Değişikliği**
```bash
# Artık npm kullanıyoruz (pnpm yerine)
npm install
npm run dev
npm run build
npm start
```

### **Production Environment Variables**
```bash
# Production settings
NODE_ENV=production
CORS_ORIGIN=https://admin.benalsam.com,https://benalsam.com

# API URLs
VITE_API_URL=https://api.benalsam.com/api/v1
VITE_ELASTICSEARCH_URL=https://elasticsearch.benalsam.com
```

---

## 🏗️ **Docker Compose Yapıları**

### **Development Compose**
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    
  elasticsearch:
    image: elasticsearch:8.11.0
    ports: ["9200:9200"]
    
  admin-backend:
    build:
      context: .
      dockerfile: ./packages/admin-backend/Dockerfile
      target: development
    ports: ["3002:3002"]
    
  admin-ui:
    build:
      context: .
      dockerfile: ./packages/admin-ui/Dockerfile
      target: development
    ports: ["3003:3003"]
    
  web:
    build:
      context: .
      dockerfile: ./packages/web/Dockerfile
      target: development
    ports: ["5173:5173"]
```

### **Production Compose**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    
  elasticsearch:
    image: elasticsearch:8.11.0
    restart: unless-stopped
    
  admin-backend:
    build:
      context: .
      dockerfile: ./packages/admin-backend/Dockerfile
      target: production
    restart: unless-stopped
    
  admin-ui:
    build:
      context: .
      dockerfile: ./packages/admin-ui/Dockerfile
      target: production
    ports: ["3003:80"]
    
  web:
    build:
      context: .
      dockerfile: ./packages/web/Dockerfile
      target: production
    ports: ["5173:80"]
    
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
```

---

## 🔨 **Build Komutları**

### **Development Builds**
```bash
# Admin Backend development build
docker build -f packages/admin-backend/Dockerfile --target development .

# Admin UI development build
docker build -f packages/admin-ui/Dockerfile --target development .

# Web development build
docker build -f packages/web/Dockerfile --target development .
```

### **Production Builds**
```bash
# Admin Backend production build
docker build -f packages/admin-backend/Dockerfile --target production .

# Admin UI production build
docker build -f packages/admin-ui/Dockerfile --target production .

# Web production build
docker build -f packages/web/Dockerfile --target production .
```

### **Multi-Stage Builds**
```bash
# All stages build
docker build -f packages/admin-backend/Dockerfile --target builder .
docker build -f packages/admin-backend/Dockerfile --target production .
```

---

## 🧪 **Testing**

### **Test Komutları**
```bash
# Tüm testleri çalıştır
./scripts/run-all-tests.sh

# Docker build testleri
./scripts/docker-build-test.sh

# Docker Compose testleri
./scripts/docker-compose-test.sh

# Security scanning
./scripts/security-scan.sh

# Cache performance
./scripts/cache-performance.sh

# Integration testleri
./scripts/integration-test.sh
```

### **Test Sonuçları**
```bash
# Test durumu kontrolü
docker-compose -f docker-compose.dev.yml ps

# Health check
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:5173/health

# Log kontrolü
docker-compose -f docker-compose.dev.yml logs -f
```

---

## 📊 **Monitoring ve Logging**

### **Service Monitoring**
```bash
# Container durumu
docker ps

# Resource kullanımı
docker stats

# Service logları
docker-compose -f docker-compose.dev.yml logs -f [service-name]

# Health check
docker-compose -f docker-compose.dev.yml exec admin-backend curl localhost:3002/health
```

### **Performance Monitoring**
```bash
# Build time measurement
time docker build -f packages/admin-backend/Dockerfile --target production .

# Image size analysis
docker images

# Cache hit rate
docker build --cache-from benalsam/admin-backend:latest .
```

---

## 🔧 **Troubleshooting**

### **Yaygın Sorunlar**

#### **1. Port Çakışması**
```bash
# Port kullanımını kontrol et
netstat -tulpn | grep :3002
netstat -tulpn | grep :3003
netstat -tulpn | grep :5173

# Servisleri durdur
docker-compose -f docker-compose.dev.yml down
```

#### **2. Memory Sorunları**
```bash
# Docker memory limitini artır
# Docker Desktop > Settings > Resources > Memory: 8GB

# Elasticsearch memory ayarı
ES_JAVA_OPTS="-Xms512m -Xmx512m"
```

#### **3. Build Sorunları**
```bash
# Build cache'ini temizle
docker builder prune -f

# Image'ları temizle
docker system prune -a

# Yeniden build et
docker-compose -f docker-compose.dev.yml build --no-cache
```

#### **4. Network Sorunları**
```bash
# Network'leri kontrol et
docker network ls

# Network'ü temizle
docker network prune -f

# Yeniden başlat
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

---

## 📚 **Useful Commands**

### **Development Commands**
```bash
# Development environment başlat
./scripts/docker-dev.sh

# Hot reload için volume mount
docker-compose -f docker-compose.dev.yml up -d

# Logları takip et
docker-compose -f docker-compose.dev.yml logs -f

# Servisleri yeniden başlat
docker-compose -f docker-compose.dev.yml restart

# Servisleri durdur
docker-compose -f docker-compose.dev.yml down
```

### **Production Commands**
```bash
# Production environment başlat
./scripts/docker-prod.sh

# Production build
docker-compose -f docker-compose.prod.yml build

# Production deploy
docker-compose -f docker-compose.prod.yml up -d

# Production logları
docker-compose -f docker-compose.prod.yml logs -f

# Production durdur
docker-compose -f docker-compose.prod.yml down
```

### **Maintenance Commands**
```bash
# Tüm container'ları durdur
docker stop $(docker ps -aq)

# Tüm image'ları temizle
docker system prune -a

# Volume'ları temizle
docker volume prune

# Network'leri temizle
docker network prune

# Build cache'ini temizle
docker builder prune
```

---

## 📞 **Support**

### **İletişim**
- **Technical Issues**: GitHub Issues
- **Documentation**: Project Wiki
- **Emergency**: CTO Direct Line

### **Resources**
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project README](../README.md)
- [Security Best Practices](./SECURITY_BEST_PRACTICES.md)

---

**Son Güncelleme:** 2025-01-09  
**Versiyon:** 1.0.0  
**Güncelleyen:** AI Assistant  
**Onaylayan:** Development Team 