# Docker Setup How-To Guide

## 🐳 Overview

Bu dokümantasyon Benalsam projesinin Docker ile nasıl kurulacağını ve yönetileceğini açıklar. Development ve production ortamları için ayrı compose dosyaları kullanılmaktadır.

## 📋 Prerequisites

- Docker Desktop (Mac/Windows) veya Docker Engine (Linux)
- Docker Compose
- Git

## 🚀 Quick Start

### Development Environment

```bash
# 1. Repository'yi clone et
git clone <repository-url>
cd benalsam-monorepo

# 2. Development environment'ı başlat
docker-compose -f docker-compose.dev.yml up -d

# 3. Servisleri kontrol et
docker ps

# 4. API'yi test et
curl http://localhost:3002/health
```

### Production Environment

```bash
# 1. Production environment'ı başlat
docker-compose -f docker-compose.prod.yml up -d

# 2. Production logları
docker-compose -f docker-compose.prod.yml logs -f
```

## 🏗️ Architecture

### Development Stack
```
┌─────────────────┐    ┌─────────────┐    ┌─────────────────┐
│   Admin Backend │    │    Redis    │    │  Elasticsearch  │
│   (Port 3002)   │◄──►│  (Port 6379)│    │   (Port 9200)   │
│   Hot Reload    │    │   Cache     │    │   Search Index  │
└─────────────────┘    └─────────────┘    └─────────────────┘
```

### Production Stack
```
┌─────────────────┐    ┌─────────────┐    ┌─────────────────┐
│     Nginx       │    │ Admin Backend│    │    Redis        │
│   (Port 80/443) │◄──►│  (Port 3002)│◄──►│  (Port 6379)    │
│   Reverse Proxy │    │   Optimized │    │   Cache         │
└─────────────────┘    └─────────────┘    └─────────────────┘
```

## 📁 File Structure

```
benalsam-monorepo/
├── docker-compose.dev.yml          # Development environment
├── docker-compose.prod.yml         # Production environment
├── packages/
│   └── admin-backend/
│       ├── Dockerfile              # Development Dockerfile
│       ├── Dockerfile.prod         # Production Dockerfile
│       ├── .dockerignore           # Docker ignore rules
│       └── .env.example            # Environment template
└── docs/
    └── DOCKER_SETUP_HOWTO.md       # This file
```

## 🔧 Configuration

### Environment Variables

#### Development (.env)
```bash
# Server Configuration
NODE_ENV=development
PORT=3002
API_VERSION=v1

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/benalsam_admin

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=benalsam_listings

# Search Configuration
SEARCH_CACHE_TTL=300
SEARCH_RATE_LIMIT=100
```

#### Production (.env.production)
```bash
# Server Configuration
NODE_ENV=production
PORT=3002
API_VERSION=v1

# Database Configuration
DATABASE_URL=postgresql://username:password@your-vps:5432/benalsam_admin

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis Configuration
REDIS_URL=redis://your-vps:6379

# Elasticsearch Configuration
ELASTICSEARCH_URL=http://your-vps:9200
ELASTICSEARCH_INDEX=benalsam_listings

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🛠️ Commands Reference

### Development Commands

```bash
# Development environment'ı başlat
docker-compose -f docker-compose.dev.yml up -d

# Development environment'ı durdur
docker-compose -f docker-compose.dev.yml down

# Development logları
docker-compose -f docker-compose.dev.yml logs -f admin-backend

# Sadece admin-backend'i yeniden başlat
docker-compose -f docker-compose.dev.yml restart admin-backend

# Container içine gir
docker exec -it benalsam-admin-backend-dev sh

# Development environment'ı yeniden build et
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Production Commands

```bash
# Production build
docker-compose -f docker-compose.prod.yml build

# Production environment'ı başlat
docker-compose -f docker-compose.prod.yml up -d

# Production environment'ı durdur
docker-compose -f docker-compose.prod.yml down

# Production logları
docker-compose -f docker-compose.prod.yml logs -f

# Production container'ları yeniden başlat
docker-compose -f docker-compose.prod.yml restart
```

### General Docker Commands

```bash
# Tüm container'ları listele
docker ps

# Container logları
docker logs benalsam-admin-backend-dev

# Container resource kullanımı
docker stats

# Docker system temizliği
docker system prune

# Image'ları listele
docker images

# Volume'ları listele
docker volume ls
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Port'u kullanan process'i bul
lsof -i :3002

# Process'i durdur
kill -9 <PID>

# Veya container'ı durdur
docker stop benalsam-admin-backend-dev
```

#### 2. Container Won't Start
```bash
# Container loglarını kontrol et
docker logs benalsam-admin-backend-dev

# Container'ı yeniden build et
docker-compose -f docker-compose.dev.yml build --no-cache

# Environment variables'ı kontrol et
docker exec -it benalsam-admin-backend-dev env
```

#### 3. Volume Issues
```bash
# Volume'ları temizle
docker-compose -f docker-compose.dev.yml down -v

# Yeniden başlat
docker-compose -f docker-compose.dev.yml up -d
```

#### 4. Memory Issues
```bash
# Elasticsearch memory ayarı
# docker-compose.dev.yml'de ES_JAVA_OPTS'ı düşür
ES_JAVA_OPTS="-Xms256m -Xmx256m"

# Redis memory limit
# docker-compose.prod.yml'de maxmemory ayarı
command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
```

#### 5. Network Issues
```bash
# Network'leri listele
docker network ls

# Network'ü temizle
docker network prune

# Container'ları yeniden başlat
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

## 📊 Monitoring

### Health Checks
```bash
# API health check
curl http://localhost:3002/health

# Search health check
curl http://localhost:3002/api/v1/search/health

# Redis health check
docker exec -it benalsam-redis-dev redis-cli ping

# Elasticsearch health check
curl http://localhost:9200/_cluster/health
```

### Logs
```bash
# Real-time logs
docker-compose -f docker-compose.dev.yml logs -f

# Specific service logs
docker-compose -f docker-compose.dev.yml logs -f admin-backend

# Error logs only
docker-compose -f docker-compose.dev.yml logs --tail=100 | grep ERROR
```

## 🚀 Deployment

### VPS Deployment

#### 1. VPS'e Dosyaları Kopyala
```bash
# Local'den VPS'e kopyala
scp -r benalsam-monorepo user@your-vps:/home/user/

# VPS'e bağlan
ssh user@your-vps
```

#### 2. Environment Setup
```bash
# Production env dosyası oluştur
cp packages/admin-backend/env.example packages/admin-backend/.env.production

# Gerekli değerleri doldur
nano packages/admin-backend/.env.production
```

#### 3. Production Deploy
```bash
# Production build
docker-compose -f docker-compose.prod.yml build

# Production'da çalıştır
docker-compose -f docker-compose.prod.yml up -d

# Logları kontrol et
docker-compose -f docker-compose.prod.yml logs -f
```

### CI/CD Integration

#### GitHub Actions Example
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
      
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/user/benalsam-monorepo
            git pull origin main
            docker-compose -f docker-compose.prod.yml build
            docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security

### Production Security Checklist

- [ ] JWT_SECRET güçlü ve unique
- [ ] Database credentials güvenli
- [ ] API rate limiting aktif
- [ ] CORS ayarları doğru
- [ ] SSL/TLS sertifikası
- [ ] Firewall ayarları
- [ ] Regular security updates

### Environment Security
```bash
# Production env dosyası permissions
chmod 600 packages/admin-backend/.env.production

# Docker secrets kullan (production'da)
echo "your-secret" | docker secret create jwt_secret -
```

## 📈 Performance

### Optimization Tips

#### 1. Resource Limits
```yaml
# docker-compose.prod.yml
services:
  admin-backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

#### 2. Caching
```bash
# Redis cache hit rate monitoring
docker exec -it benalsam-redis-dev redis-cli info memory

# Elasticsearch cache
curl http://localhost:9200/_cat/indices?v
```

#### 3. Logging
```yaml
# Structured logging
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🎯 Next Steps

1. **Frontend Integration**: Frontend'i yeni API endpoint'lerine yönlendir
2. **Monitoring Setup**: Prometheus/Grafana ekle
3. **Backup Strategy**: Database ve volume backup'ları
4. **Auto-scaling**: Load balancer ve multiple instances
5. **Security Audit**: Regular security assessments

## 📞 Support

Sorun yaşarsanız:
1. Logları kontrol edin
2. Troubleshooting bölümünü inceleyin
3. Docker documentation'ına bakın
4. Team ile iletişime geçin

---

**Son Güncelleme:** 2025-07-17  
**Versiyon:** 1.0.0  
**Dokümantasyon Sahibi:** Benalsam Team 