# 🚀 Admin Backend VPS Deployment - Adım Adım Rehber

## 📋 Ön Kontrol Listesi

- [x] Infrastructure servisleri kurulu (RabbitMQ, Prometheus, Grafana)
- [x] Node.js ve PM2 kurulu
- [ ] Kod VPS'e kopyalandı
- [ ] Environment variables hazır
- [ ] Firewall portları açık

## 🎯 Deployment Adımları

### 1. Kodu VPS'e Kopyalama

#### Seçenek A: rsync (Local'den - Önerilen)

**Local'den (Mac/Linux):**
```bash
# Proje root dizininden
rsync -avz --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude 'logs' \
  --exclude '*.log' \
  ./benalsam-admin-backend/ \
  root@46.62.212.96:/opt/benalsam/services/benalsam-admin-backend/
```

#### Seçenek B: Git Clone

**VPS'te:**
```bash
cd /opt/benalsam/services
git clone <your-repo-url> benalsam-admin-backend
cd benalsam-admin-backend
git checkout main  # veya ilgili branch
```

### 2. Deployment Script'i Çalıştırma

**VPS'te:**
```bash
cd /path/to/benalsam-standalone
sudo ./scripts/vps-deploy-microservice.sh benalsam-admin-backend 3002
```

### 3. Environment Variables Düzenleme

**VPS'te:**
```bash
cd /opt/benalsam/services/benalsam-admin-backend
nano .env
```

**Gerekli değişkenler:**
```env
# Server
NODE_ENV=production
PORT=3002

# Database (Supabase)
SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-strong-jwt-secret-here-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Redis (VPS IP)
REDIS_HOST=209.227.228.96
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://209.227.228.96:6379

# Elasticsearch (VPS IP)
ELASTICSEARCH_URL=http://209.227.228.96:9200
ELASTICSEARCH_INDEX=benalsam_listings

# RabbitMQ (Local - Infrastructure'da)
RABBITMQ_URL=amqp://benalsam:your-password@localhost:5672

# Sentry (Production)
DISABLE_SENTRY=false
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_ORG_SLUG=benalsam
SENTRY_PROJECT_SLUG=benalsam
SENTRY_AUTH_TOKEN=your-auth-token

# CORS
CORS_ORIGIN=https://admin.benalsam.com,https://benalsam.com

# Admin Default
ADMIN_DEFAULT_EMAIL=admin@benalsam.com
ADMIN_DEFAULT_PASSWORD=your-strong-password-here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Build ve Başlatma

**VPS'te:**
```bash
cd /opt/benalsam/services/benalsam-admin-backend

# Build
npm run build

# PM2 ile başlat (script zaten yapmış olabilir)
pm2 restart benalsam-admin-backend
# veya
pm2 start ecosystem.config.js
```

### 5. Firewall Açma

```bash
sudo ufw allow 3002/tcp
sudo ufw reload
```

### 6. Health Check

```bash
# PM2 durumu
pm2 list
pm2 logs benalsam-admin-backend

# Health endpoint
curl http://localhost:3002/api/v1/health
curl http://46.62.212.96:3002/api/v1/health
```

## 🔍 Troubleshooting

### Servis başlamıyor
```bash
# Logları kontrol et
pm2 logs benalsam-admin-backend --lines 100

# Manuel başlat (hata görmek için)
cd /opt/benalsam/services/benalsam-admin-backend
npm run start
```

### Port zaten kullanılıyor
```bash
sudo lsof -i :3002
kill -9 <PID>
```

### Environment variables eksik
```bash
# .env dosyasını kontrol et
cat /opt/benalsam/services/benalsam-admin-backend/.env

# Eksik değişkenleri ekle
nano /opt/benalsam/services/benalsam-admin-backend/.env
```

## ✅ Başarı Kriterleri

- [ ] PM2'de servis `online` durumda
- [ ] Health endpoint çalışıyor: `http://localhost:3002/api/v1/health`
- [ ] Log'larda hata yok
- [ ] Redis bağlantısı başarılı
- [ ] Elasticsearch bağlantısı başarılı
- [ ] Supabase bağlantısı başarılı

## 📚 Sonraki Adımlar

1. ✅ Admin Backend deploy edildi
2. ⏭️ Diğer servisleri deploy et
3. ⏭️ Nginx reverse proxy kur
4. ⏭️ SSL sertifikası kur

