# Admin Panel Quick Start Guide

## 🚀 Hızlı Başlangıç

### VPS'de Admin Panel Başlatma

```bash
# 1. VPS'e bağlan
ssh -p 22 root@209.227.228.96

# 2. Backend'i başlat
cd /root/benalsam-standalone/benalsam-admin-backend
docker-compose -f docker-compose.prod.yml up --build -d

# 3. Frontend'i başlat
cd /root/benalsam-standalone/benalsam-admin-ui
docker-compose -f docker-compose.prod.yml up --build -d

# 4. Test et
curl http://localhost:3002/health
curl http://localhost:3000
```

### Local Development

```bash
# Backend
cd /Users/alituna/Documents/projects/Benalsam/benalsam-standalone/benalsam-admin-backend
npm install
npm run dev

# Frontend (yeni terminal)
cd /Users/alituna/Documents/projects/Benalsam/benalsam-standalone/benalsam-admin-ui
npm install
npm run dev
```

## 📍 URL'ler

- **Production Admin Panel**: http://209.227.228.96:3000
- **Local Backend**: http://localhost:3002
- **Local Frontend**: http://localhost:3003
- **Health Check**: http://localhost:3002/health

## 🔑 Login Bilgileri

- **Email**: admin@benalsam.com
- **Password**: admin123456

## 🛠️ Yaygın Komutlar

```bash
# Port kontrolü
lsof -i :3002

# Process kill
lsof -ti:3002 | xargs kill -9

# Docker logs
docker logs benalsam-admin-backend-prod
docker logs benalsam-admin-ui-prod

# Dosya kopyalama (local → VPS)
scp -P 22 -r benalsam-standalone/benalsam-admin-backend root@209.227.228.96:/root/benalsam-standalone/
```

## 📞 Acil Durum

- **VPS Access**: root@209.227.228.96
- **Repository**: github.com:angache/benalsam-standalone.git
- **Detaylı Dokümantasyon**: `docs/ADMIN_PANEL_DEPLOYMENT_GUIDE.md` 