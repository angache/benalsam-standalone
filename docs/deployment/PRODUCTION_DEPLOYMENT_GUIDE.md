# 🚀 Production Deployment Guide

## 📋 **GENEL BAKIŞ**

Bu doküman, Benalsam Admin Panel'in production environment'ına nasıl deploy edileceğini açıklar.

## 🎯 **HEDEFLER**

- ✅ Zero-downtime deployment
- ✅ Automated rollback capability
- ✅ Health check monitoring
- ✅ SSL certificate management
- ✅ Security hardening

## 🏗️ **PRODUCTION MİMARİSİ**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (80/443)│    │  Admin UI (3003)│    │ Admin Backend   │
│   (Reverse Proxy)│   │   (React + Nginx)│   │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   Redis (6379)  │    │ Elasticsearch   │
                    │   (Cache/Queue) │    │    (9200)       │
                    └─────────────────┘    └─────────────────┘
```

## 📦 **GEREKSİNİMLER**

### **VPS Gereksinimleri**
- **OS:** Ubuntu 20.04+ veya CentOS 8+
- **RAM:** Minimum 4GB (8GB önerilen)
- **CPU:** 2+ cores
- **Disk:** 50GB+ SSD
- **Network:** Stable internet connection

### **Software Gereksinimleri**
- Docker & Docker Compose
- Git
- Nginx (opsiyonel, container içinde de çalışır)
- Certbot (SSL için)

## 🚀 **DEPLOYMENT ADIMLARI**

### **1. VPS Hazırlığı**

```bash
# System update
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install -y git

# Install Certbot (SSL için)
sudo apt install -y certbot python3-certbot-nginx
```

### **2. Domain Ayarları**

```bash
# DNS ayarları (domain provider'da yapılacak)
# A Record: admin.benalsam.com -> VPS_IP
# A Record: *.admin.benalsam.com -> VPS_IP
```

### **3. Project Setup**

```bash
# Project dizini oluştur
sudo mkdir -p /opt/benalsam-admin
cd /opt/benalsam-admin

# Repository'yi clone et
sudo git clone https://github.com/angache/Benalsam-Monorepo.git benalsam-monorepo
cd benalsam-monorepo

# Environment dosyası oluştur
sudo cp packages/admin-backend/.env.example packages/admin-backend/.env.production
sudo nano packages/admin-backend/.env.production
```

### **4. Environment Variables**

```bash
# .env.production dosyasını düzenle
NODE_ENV=production
PORT=3002
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DATABASE_URL=postgresql://username:password@localhost:5432/benalsam_admin
ELASTICSEARCH_URL=http://elasticsearch:9200
REDIS_HOST=redis
REDIS_PASSWORD=your-redis-password
CORS_ORIGIN=https://admin.benalsam.com,http://209.227.228.96:3003
```

### **5. SSL Certificate**

```bash
# SSL certificate oluştur
sudo certbot certonly --standalone -d admin.benalsam.com --non-interactive --agree-tos --email admin@benalsam.com

# Certificate'ları kopyala
sudo mkdir -p /etc/nginx/ssl
sudo cp /etc/letsencrypt/live/admin.benalsam.com/fullchain.pem /etc/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/admin.benalsam.com/privkey.pem /etc/nginx/ssl/key.pem
```

### **6. Automated Deployment**

```bash
# Deployment script'ini çalıştır
sudo chmod +x scripts/deploy-admin.sh
sudo ./scripts/deploy-admin.sh
```

## 🔧 **MANUAL DEPLOYMENT**

### **Build ve Deploy**

```bash
# Production build
docker-compose -f docker-compose.prod.yml build --no-cache

# Services'leri başlat
docker-compose -f docker-compose.prod.yml up -d

# Health check
docker-compose -f docker-compose.prod.yml ps
```

### **Health Checks**

```bash
# Admin Backend
curl http://localhost:3002/health

# Admin UI
curl http://localhost:3003/health

# Nginx
curl http://localhost/health
```

## 📊 **MONITORING**

### **Logs**

```bash
# Tüm servislerin logları
docker-compose -f docker-compose.prod.yml logs -f

# Sadece admin-backend logları
docker-compose -f docker-compose.prod.yml logs -f admin-backend

# Nginx logları
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### **System Monitoring**

```bash
# Container durumları
docker ps

# Resource kullanımı
docker stats

# Disk kullanımı
df -h

# Memory kullanımı
free -h
```

## 🔄 **ROLLBACK**

### **Otomatik Rollback**

Deployment script'i otomatik olarak rollback yapar.

### **Manual Rollback**

```bash
# Services'leri durdur
docker-compose -f docker-compose.prod.yml down

# Önceki versiyona geç
git reset --hard HEAD~1

# Yeniden deploy et
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 **SECURITY**

### **Firewall**

```bash
# UFW kurulumu
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

### **SSL Renewal**

```bash
# SSL certificate'ı yenile
sudo certbot renew

# Certificate'ları kopyala
sudo cp /etc/letsencrypt/live/admin.benalsam.com/fullchain.pem /etc/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/admin.benalsam.com/privkey.pem /etc/nginx/ssl/key.pem

# Nginx'i yeniden başlat
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **1. Port Already in Use**
```bash
# Port'u kullanan process'i bul
sudo lsof -i :3002
sudo lsof -i :3003

# Process'i durdur
sudo kill -9 <PID>
```

#### **2. SSL Certificate Issues**
```bash
# Certificate durumunu kontrol et
sudo certbot certificates

# Certificate'ı yenile
sudo certbot renew --force-renewal
```

#### **3. Docker Issues**
```bash
# Docker system temizliği
docker system prune -a

# Container'ları yeniden başlat
docker-compose -f docker-compose.prod.yml restart
```

#### **4. Database Connection Issues**
```bash
# Database bağlantısını test et
docker exec -it benalsam-admin-backend-prod node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  console.log(err || res.rows[0]);
  pool.end();
});"
```

## 📝 **MAINTENANCE**

### **Regular Tasks**

#### **Daily**
- [ ] Health check monitoring
- [ ] Log review
- [ ] Backup verification

#### **Weekly**
- [ ] SSL certificate renewal check
- [ ] System updates
- [ ] Performance monitoring

#### **Monthly**
- [ ] Security updates
- [ ] Backup testing
- [ ] Performance optimization

### **Backup Strategy**

```bash
# Database backup
docker exec benalsam-postgres-prod pg_dump -U username benalsam_admin > backup_$(date +%Y%m%d).sql

# Configuration backup
sudo tar -czf config_backup_$(date +%Y%m%d).tar.gz /etc/nginx/ssl /opt/benalsam-admin
```

## 🎯 **PERFORMANCE OPTIMIZATION**

### **Nginx Optimization**

```nginx
# nginx.conf optimizations
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_comp_level 6;
```

### **Docker Optimization**

```yaml
# docker-compose.prod.yml optimizations
services:
  admin-backend:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## 📞 **SUPPORT**

### **Emergency Contacts**
- **Technical Lead:** [Contact Info]
- **DevOps:** [Contact Info]
- **System Admin:** [Contact Info]

### **Useful Commands**

```bash
# Quick status check
docker-compose -f docker-compose.prod.yml ps

# Quick restart
docker-compose -f docker-compose.prod.yml restart

# Quick logs
docker-compose -f docker-compose.prod.yml logs --tail=50
```

---

## ✅ **DEPLOYMENT CHECKLIST**

- [ ] VPS hazırlığı tamamlandı
- [ ] Domain ayarları yapıldı
- [ ] SSL certificate oluşturuldu
- [ ] Environment variables ayarlandı
- [ ] Docker images build edildi
- [ ] Services başlatıldı
- [ ] Health checks geçti
- [ ] SSL certificate çalışıyor
- [ ] Firewall ayarlandı
- [ ] Monitoring aktif
- [ ] Backup strategy hazır
- [ ] Documentation güncellendi

**🎉 Production deployment hazır!** 