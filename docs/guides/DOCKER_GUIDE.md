# Docker Setup Guide

## 🐳 Development Setup

### Quick Start
```bash
# Development environment'ı başlat
docker-compose -f docker-compose.dev.yml up

# Arka planda çalıştır
docker-compose -f docker-compose.dev.yml up -d

# Logları görüntüle
docker-compose -f docker-compose.dev.yml logs -f admin-backend
```

### Hot Reload
- Kod değişiklikleri otomatik olarak container'a yansır
- Nodemon sayesinde server otomatik restart olur
- Volume mount ile source code real-time sync

### Services
- **Admin Backend**: http://localhost:3002
- **Redis**: localhost:6379
- **Elasticsearch**: http://localhost:9200

## 🚀 Production Setup

### Build & Deploy
```bash
# Production build
docker-compose -f docker-compose.prod.yml build

# Production'da çalıştır
docker-compose -f docker-compose.prod.yml up -d

# Production logları
docker-compose -f docker-compose.prod.yml logs -f admin-backend
```

### Environment Variables
```bash
# Production env dosyası oluştur
cp packages/admin-backend/env.example packages/admin-backend/.env.production

# Gerekli değerleri doldur
# - SUPABASE_URL
# - ELASTICSEARCH_URL
# - REDIS_URL
# - JWT_SECRET
# - vs.
```

## 🔧 Useful Commands

### Development
```bash
# Container'ları durdur
docker-compose -f docker-compose.dev.yml down

# Container'ları yeniden başlat
docker-compose -f docker-compose.dev.yml restart

# Sadece admin-backend'i yeniden başlat
docker-compose -f docker-compose.dev.yml restart admin-backend

# Container içine gir
docker exec -it benalsam-admin-backend-dev sh
```

### Production
```bash
# Production container'ları durdur
docker-compose -f docker-compose.prod.yml down

# Production container'ları yeniden başlat
docker-compose -f docker-compose.prod.yml restart

# Production logları
docker-compose -f docker-compose.prod.yml logs -f
```

### General
```bash
# Tüm container'ları listele
docker ps

# Container logları
docker logs benalsam-admin-backend-dev

# Container resource kullanımı
docker stats

# Docker system temizliği
docker system prune
```

## 📁 File Structure
```
benalsam-monorepo/
├── docker-compose.dev.yml      # Development environment
├── docker-compose.prod.yml     # Production environment
├── packages/
│   └── admin-backend/
│       ├── Dockerfile          # Development Dockerfile
│       ├── Dockerfile.prod     # Production Dockerfile
│       └── .dockerignore       # Docker ignore rules
└── DOCKER_GUIDE.md            # This file
```

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Port'u kullanan process'i bul
lsof -i :3002

# Process'i durdur
kill -9 <PID>
```

### Container Won't Start
```bash
# Container loglarını kontrol et
docker logs benalsam-admin-backend-dev

# Container'ı yeniden build et
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Volume Issues
```bash
# Volume'ları temizle
docker-compose -f docker-compose.dev.yml down -v

# Yeniden başlat
docker-compose -f docker-compose.dev.yml up
```

## 🎯 Next Steps

1. **Environment Setup**: `.env.production` dosyasını oluştur
2. **VPS Deploy**: Production compose'u VPS'e deploy et
3. **Frontend Integration**: Frontend'i yeni API endpoint'lerine yönlendir
4. **Monitoring**: Health check ve logging ekle 