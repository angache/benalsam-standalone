# Admin Panel Deployment & Development Guide

## 📋 Proje Özeti

Bu dokümantasyon, Benalsam Admin Panel'inin teknik altyapısını, VPS deployment sürecini ve local development setup'ını detaylandırır. Sistem, rol tabanlı erişim kontrolü, kategori yönetimi ve modern UI/UX ile production-ready bir admin paneli sunar.

## 🏗️ Teknik Altyapı

### Standalone Project Structure
```
benalsam-standalone/
├── benalsam-admin-backend/     # Node.js + Express + TypeScript
├── benalsam-admin-ui/         # React + Vite + TypeScript + Material-UI
├── benalsam-mobile/           # React Native + Expo
├── benalsam-web/              # React + Vite
├── benalsam-shared-types/     # NPM Package
└── benalsam-infrastructure/   # Docker Services
```

### Backend Teknolojileri
- **Runtime**: Node.js 20 (Alpine Linux)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + Supabase Auth
- **Caching**: Redis
- **Search**: Elasticsearch (opsiyonel)
- **File Upload**: Supabase Storage
- **Validation**: Express Validator
- **Logging**: Winston + Morgan
- **Security**: Helmet, CORS, Rate Limiting

### Frontend Teknolojileri
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Zustand + React Query
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Charts**: Recharts + MUI X Charts
- **Icons**: Lucide React

### Veritabanı Şeması
- **Categories**: Kategori hiyerarşisi ve özellikleri
- **Category Attributes**: Kategori özellikleri (select, string, number, boolean)
- **Admin Profiles**: Admin kullanıcı profilleri
- **Admin Roles**: Rol tabanlı erişim kontrolü
- **Admin Permissions**: İzin sistemi

## 🚀 VPS Deployment

### VPS Özellikleri
- **Provider**: DigitalOcean
- **IP**: 209.227.228.96
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 4GB
- **Storage**: 80GB SSD
- **CPU**: 2 vCPUs

### VPS'de Çalışan Servisler
- **Docker**: Container orchestration
- **Nginx**: Reverse proxy ve static file serving
- **Redis**: Caching ve session storage
- **Elasticsearch**: Arama motoru (opsiyonel)

### Deployment Dosyaları

#### Backend Dockerfile
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
WORKDIR /app
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
RUN mkdir -p logs && chown -R nodejs:nodejs logs
USER nodejs
EXPOSE 3002
CMD ["node", "dist/index.js"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose (Production)
```yaml
version: '3.8'
services:
  admin-backend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: benalsam-admin-backend-prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    ports:
      - "3002:3002"
    networks:
      - benalsam-network

  admin-ui:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: benalsam-admin-ui-prod
    restart: unless-stopped
    ports:
      - "3000:80"
    networks:
      - benalsam-network

  nginx:
    image: nginx:alpine
    container_name: benalsam-nginx-prod
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    networks:
      - benalsam-network

networks:
  benalsam-network:
    driver: bridge
```

### Environment Variables

#### Backend (.env.production)
```env
NODE_ENV=production
PORT=3002
API_VERSION=v1
SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=http://209.227.228.96:3000
```

#### Frontend (vite.config.ts)
```typescript
export default defineConfig({
  server: {
    port: 3003,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
  },
  define: {
    'process.env': {},
    'import.meta.env.VITE_API_URL': JSON.stringify('http://209.227.228.96:3002/api/v1'),
  },
})
```

## 🔧 VPS Başlatma Süreci

### 1. VPS'e Bağlanma
```bash
ssh -p 22 root@209.227.228.96
```

### 2. Proje Dosyalarını Kopyalama
```bash
# Local'den VPS'e dosya kopyalama
scp -P 22 -r benalsam-standalone/benalsam-admin-backend root@209.227.228.96:/root/
scp -P 22 -r benalsam-standalone/benalsam-admin-ui root@209.227.228.96:/root/
```

### 3. Environment Dosyalarını Hazırlama
```bash
# Backend environment
cd /root/admin-backend
cp env.example .env.production
# .env.production dosyasını düzenle

# Frontend environment
cd /root/admin-ui
# vite.config.ts'de API URL'i güncelle
```

### 4. Docker Container'larını Başlatma
```bash
# Backend
cd /root/admin-backend
docker-compose -f docker-compose.prod.yml up --build -d

# Frontend
cd /root/admin-ui
docker-compose -f docker-compose.prod.yml up --build -d
```

### 5. Nginx Konfigürasyonu
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server admin-backend:3002;
    }

    server {
        listen 80;
        server_name 209.227.228.96;

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://admin-ui:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 💻 Local Development Setup

### Gereksinimler
- Node.js 20+
- npm veya yarn
- Git

### Backend Başlatma
```bash
cd /Users/alituna/Documents/projects/Benalsam/benalsam-standalone/benalsam-admin-backend

# Dependencies yükleme
npm install

# Environment dosyası kontrol et
cat .env

# Development server başlatma
npm run dev
```

### Frontend Başlatma
```bash
cd /Users/alituna/Documents/projects/Benalsam/benalsam-standalone/benalsam-admin-ui

# Dependencies yükleme
npm install

# Development server başlatma
npm run dev
```

### Port Yapılandırması
- **Backend**: http://localhost:3002
- **Frontend**: http://localhost:3003
- **Health Check**: http://localhost:3002/health

### Local Environment Variables
```env
# Backend (.env)
NODE_ENV=development
PORT=3001
SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CORS_ORIGIN=http://localhost:3000,http://localhost:3002,http://localhost:3003
```

## 🔐 Güvenlik Yapılandırması

### Authentication & Authorization
- **JWT Token**: 24 saat geçerli
- **Refresh Token**: 7 gün geçerli
- **Role-based Access Control**: Super Admin, Admin, Moderator
- **Permission System**: Granular permissions

### CORS Yapılandırması
```typescript
app.use(cors({
  origin: securityConfig.corsOrigin.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Rate Limiting
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına maksimum istek
  message: {
    success: false,
    message: 'Too many requests from this IP',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});
```

## 📊 Veritabanı Yönetimi

### Supabase Migration
```sql
-- Categories tablosu
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    color VARCHAR(7),
    path VARCHAR(500) UNIQUE NOT NULL,
    parent_id BIGINT REFERENCES categories(id),
    level INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Category attributes tablosu
CREATE TABLE category_attributes (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('string', 'number', 'boolean', 'select', 'multiselect', 'date')),
    required BOOLEAN DEFAULT false,
    options JSONB,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Data Import Script
```javascript
// categories-import.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function importCategories() {
    const categoriesData = JSON.parse(fs.readFileSync('new-categories-no-input.json', 'utf8'));
    
    for (const category of categoriesData) {
        // Category oluştur
        const { data: categoryRecord } = await supabase
            .from('categories')
            .insert({
                name: category.name,
                icon: category.icon,
                color: category.color,
                path: category.path,
                parent_id: category.parent_id,
                level: category.level,
                sort_order: category.sort_order,
                is_active: true
            })
            .select()
            .single();

        // Attributes oluştur
        if (category.attributes) {
            for (const attr of category.attributes) {
                await supabase
                    .from('category_attributes')
                    .insert({
                        category_id: categoryRecord.id,
                        key: attr.key,
                        label: attr.label,
                        type: attr.type,
                        required: attr.required,
                        options: attr.options ? JSON.stringify(attr.options) : null,
                        sort_order: attr.sort_order
                    });
            }
        }
    }
}
```

## 🐛 Sorun Giderme

### Yaygın Sorunlar

#### 1. Port Çakışması
```bash
# Port kullanımını kontrol et
lsof -i :3002

# Process'i kill et
lsof -ti:3002 | xargs kill -9
```

#### 2. CORS Hatası
```bash
# Backend CORS ayarlarını kontrol et
# .env dosyasında CORS_ORIGIN doğru mu?
# Frontend API URL'i doğru mu?
```

#### 3. Docker Build Hatası
```bash
# Cache temizle
docker system prune -a

# Yeniden build et
docker-compose -f docker-compose.prod.yml up --build -d
```

#### 4. Supabase Bağlantı Hatası
```bash
# Environment variables kontrol et
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Network bağlantısını test et
curl -s https://dnwreckpeenhbdtapmxr.supabase.co/rest/v1/
```

### Log Kontrolü
```bash
# Backend logs
docker logs benalsam-admin-backend-prod

# Frontend logs
docker logs benalsam-admin-ui-prod

# Nginx logs
docker logs benalsam-nginx-prod
```

## 📈 Monitoring & Logging

### Winston Logger Yapılandırması
```typescript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### Health Check Endpoint
```typescript
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin Backend API is running',
    timestamp: new Date().toISOString(),
    environment: serverConfig.nodeEnv,
    version: serverConfig.apiVersion,
  });
});
```

## 🔄 Deployment Workflow

### Development → Production Pipeline

1. **Local Development**
   ```bash
   # Local'de geliştirme
   npm run dev
   # Test et
   # Commit yap
   ```

2. **Code Review**
   ```bash
   # Pull request oluştur
   # Code review
   # Merge to main
   ```

3. **VPS Deployment**
   ```bash
   # VPS'e dosyaları kopyala
   scp -P 22 -r benalsam-admin-backend root@209.227.228.96:/root/
   scp -P 22 -r benalsam-admin-ui root@209.227.228.96:/root/
   
   # Container'ları yeniden build et
   ssh -p 22 root@209.227.228.96 "cd /root/admin-backend && docker-compose -f docker-compose.prod.yml up --build -d"
   ssh -p 22 root@209.227.228.96 "cd /root/admin-ui && docker-compose -f docker-compose.prod.yml up --build -d"
   ```

4. **Verification**
   ```bash
   # Health check
   curl http://209.227.228.96:3002/health
   
   # Frontend test
   curl http://209.227.228.96:3000
   ```

## 📝 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Kullanıcı girişi
- `POST /api/v1/auth/logout` - Kullanıcı çıkışı
- `GET /api/v1/auth/me` - Mevcut kullanıcı bilgisi

### Categories
- `GET /api/v1/categories` - Tüm kategorileri getir
- `GET /api/v1/categories/:id` - Kategori detayı
- `GET /api/v1/categories/path/:path` - Path ile kategori getir
- `POST /api/v1/categories` - Yeni kategori oluştur
- `PUT /api/v1/categories/:id` - Kategori güncelle
- `DELETE /api/v1/categories/:id` - Kategori sil

### Admin Management
- `GET /api/v1/admin-management/users` - Admin kullanıcıları
- `POST /api/v1/admin-management/users` - Yeni admin ekle
- `PUT /api/v1/admin-management/users/:id` - Admin güncelle
- `DELETE /api/v1/admin-management/users/:id` - Admin sil

## 🎯 Sonraki Adımlar

### Kısa Vadeli (1-2 Hafta)
- [ ] Elasticsearch entegrasyonu tamamlama
- [ ] Real-time notifications sistemi
- [ ] Advanced search ve filtreleme
- [ ] Bulk operations (toplu işlemler)

### Orta Vadeli (1-2 Ay)
- [ ] Analytics dashboard
- [ ] Report generation
- [ ] Email notifications
- [ ] Mobile responsive optimizasyon

### Uzun Vadeli (3-6 Ay)
- [ ] Multi-tenant architecture
- [ ] API rate limiting ve monetization
- [ ] Advanced security features
- [ ] Performance optimization

## 📞 İletişim & Destek

- **Technical Lead**: Ali Tuna
- **Repository**: github.com:angache/benalsam-standalone.git
- **VPS Access**: root@209.227.228.96
- **Admin Panel**: http://209.227.228.96:3000

---

**Son Güncelleme**: 18 Temmuz 2025, 01:45 UTC
**Versiyon**: v1.0.0
**Durum**: Production Ready ✅ 