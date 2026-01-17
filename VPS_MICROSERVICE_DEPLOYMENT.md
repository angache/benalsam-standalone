# 🚀 VPS Microservice Deployment Rehberi

Bu rehber, Benalsam microservislerini VPS'e deploy etmek için adım adım talimatlar içerir.

## 📋 Ön Gereksinimler

✅ Infrastructure servisleri kurulmuş olmalı:
- RabbitMQ (Port 5672, 15672)
- Prometheus (Port 9090)
- Grafana (Port 3000)
- Redis (Zaten çalışıyor: 209.227.228.96:6379)
- Elasticsearch (Zaten çalışıyor: 209.227.228.96:9200)

✅ Node.js ve PM2 kurulmuş olmalı:
```bash
sudo ./scripts/vps-setup-nodejs.sh
```

## 🎯 Deploy Edilecek Servisler

| Servis | Port | Açıklama |
|--------|------|----------|
| `benalsam-admin-backend` | 3002 | Admin API |
| `benalsam-elasticsearch-service` | 3006 | Elasticsearch sync |
| `benalsam-upload-service` | 3007 | Image upload |
| `benalsam-listing-service` | 3008 | Listing management |
| `benalsam-backup-service` | 3013 | Backup operations |
| `benalsam-cache-service` | 3014 | Cache management |
| `benalsam-categories-service` | 3015 | Categories |
| `benalsam-search-service` | 3016 | Search operations |
| `benalsam-realtime-service` | 3019 | Realtime queue |

## 📝 Deployment Adımları

### 1. Kodu VPS'e Kopyalama

#### Seçenek A: Git Clone (Önerilen)
```bash
# VPS'te
cd /opt/benalsam/services
git clone <your-repo-url> benalsam-admin-backend
cd benalsam-admin-backend
git checkout main  # veya ilgili branch
```

#### Seçenek B: rsync (Local'den)
```bash
# Local'den (Mac/Linux)
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./benalsam-admin-backend/ \
  root@46.62.212.96:/opt/benalsam/services/benalsam-admin-backend/
```

### 2. Deployment Script'i Çalıştırma

```bash
# VPS'te
sudo ./scripts/vps-deploy-microservice.sh benalsam-admin-backend 3002
```

Script şunları yapacak:
1. ✅ Dizin oluşturma
2. ✅ Kod kontrolü (git pull veya manuel kopyalama)
3. ✅ npm install
4. ✅ .env dosyası oluşturma (VPS IP'leri ile)
5. ✅ Build (varsa)
6. ✅ PM2 ile başlatma

### 3. Environment Variables Düzenleme

Script otomatik olarak `.env` dosyası oluşturur, ancak **manuel düzenleme gerekir**:

```bash
cd /opt/benalsam/services/benalsam-admin-backend
nano .env
```

**Önemli değişkenler:**
```env
# Server
NODE_ENV=production
PORT=3002

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-strong-jwt-secret-here

# Redis (VPS IP)
REDIS_HOST=209.227.228.96
REDIS_PORT=6379
REDIS_URL=redis://209.227.228.96:6379

# Elasticsearch (VPS IP)
ELASTICSEARCH_URL=http://209.227.228.96:9200

# RabbitMQ (Local)
RABBITMQ_URL=amqp://benalsam:your-password@localhost:5672

# Sentry (Production)
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG_SLUG=benalsam
SENTRY_PROJECT_SLUG=benalsam
SENTRY_AUTH_TOKEN=your-auth-token

# CORS
CORS_ORIGIN=https://admin.benalsam.com,https://benalsam.com
```

### 4. Servisi Yeniden Başlatma

```bash
pm2 restart benalsam-admin-backend
```

## 🔍 Servis Kontrolü

### PM2 Durumu
```bash
pm2 list
pm2 logs benalsam-admin-backend
pm2 monit
```

### Health Check
```bash
curl http://localhost:3002/api/v1/health
```

### Firewall
```bash
# Port açma
sudo ufw allow 3002/tcp
sudo ufw reload
```

## 📊 Tüm Servisleri Deploy Etme

Her servis için aynı adımları tekrarlayın:

```bash
# 1. Admin Backend
sudo ./scripts/vps-deploy-microservice.sh benalsam-admin-backend 3002

# 2. Elasticsearch Service
sudo ./scripts/vps-deploy-microservice.sh benalsam-elasticsearch-service 3006

# 3. Upload Service
sudo ./scripts/vps-deploy-microservice.sh benalsam-upload-service 3007

# 4. Listing Service
sudo ./scripts/vps-deploy-microservice.sh benalsam-listing-service 3008

# 5. Backup Service
sudo ./scripts/vps-deploy-microservice.sh benalsam-backup-service 3013

# 6. Cache Service
sudo ./scripts/vps-deploy-microservice.sh benalsam-cache-service 3014

# 7. Categories Service
sudo ./scripts/vps-deploy-microservice.sh benalsam-categories-service 3015

# 8. Search Service
sudo ./scripts/vps-deploy-microservice.sh benalsam-search-service 3016

# 9. Realtime Service
sudo ./scripts/vps-deploy-microservice.sh benalsam-realtime-service 3019
```

## 🔄 Güncelleme

### Kod Güncelleme
```bash
cd /opt/benalsam/services/benalsam-admin-backend
git pull
npm install
npm run build  # varsa
pm2 restart benalsam-admin-backend
```

### PM2 Startup
```bash
# PM2'yi sistem başlangıcında çalıştır
pm2 startup
pm2 save
```

## 🐛 Troubleshooting

### Servis başlamıyor
```bash
# Logları kontrol et
pm2 logs benalsam-admin-backend

# Manuel başlat
cd /opt/benalsam/services/benalsam-admin-backend
npm run start
```

### Port zaten kullanılıyor
```bash
# Port'u kullanan process'i bul
sudo lsof -i :3002

# Process'i durdur
kill -9 <PID>
```

### Environment variables eksik
```bash
# .env dosyasını kontrol et
cat /opt/benalsam/services/benalsam-admin-backend/.env

# Eksik değişkenleri ekle
nano /opt/benalsam/services/benalsam-admin-backend/.env
```

## 📚 Sonraki Adımlar

1. ✅ Tüm servisleri deploy et
2. ✅ Nginx reverse proxy kur
3. ✅ SSL sertifikası kur (Let's Encrypt)
4. ✅ Domain yapılandırması
5. ✅ Monitoring ve alerting

---

**Not:** Her servis için `.env` dosyasını mutlaka kontrol edin ve eksik değişkenleri ekleyin!

