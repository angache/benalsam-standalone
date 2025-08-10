# 🚀 VPS Deployment Complete Guide - Benalsam

## 📋 Genel Bakış
Bu döküman, Benalsam monorepo uygulamasının VPS'e deployment sürecini detaylandırır. Docker, Nginx, SSL ve domain yapılandırması dahil tüm adımlar.

## 🎯 Tamamlanan İşlemler

### ✅ Docker Containerization
- Monorepo Docker yapılandırması
- Multi-service docker-compose.yml
- Environment variables yönetimi
- pnpm workspace entegrasyonu

### ✅ VPS Deployment
- Ubuntu 22.04 LTS kurulumu
- Docker & Docker Compose kurulumu
- Nginx reverse proxy yapılandırması
- SSL sertifikası (Let's Encrypt)

### ✅ Domain & DNS
- benalsam.com domain yönetimi
- DNS kayıtları (A record)
- SSL sertifikası otomatik yenileme

### ✅ Email Setup
- ProtonMail Business hesabı
- admin@benalsam.com email adresi

## 🏗️ Sistem Mimarisi

```
Internet → Cloudflare → VPS (209.227.228.96) → Nginx → Docker Containers
                                                      ├── admin-backend (3002)
                                                      ├── admin-ui (3003)
                                                      └── web (5173)
```

## 📁 Dosya Yapısı

### VPS'deki Konumlar:
```
/home/angache/benalsam-docker/
├── docker-compose.yml
├── .env
├── nginx/
│   └── nginx.conf
└── ssl/
    └── (Let's Encrypt certificates)
```

### Nginx Konfigürasyonu:
```
/etc/nginx/sites-available/benalsam.com
/etc/nginx/sites-enabled/benalsam.com
```

## 🔧 Teknik Detaylar

### Docker Compose Services:
```yaml
services:
  admin-backend:
    build: 
      context: .
      dockerfile: ./packages/admin-backend/Dockerfile
    ports:
      - "3002:3002"
    environment:
      - CORS_ORIGIN=http://${SERVER_IP}:3003,http://${SERVER_IP}:5173
    env_file: - .env

  admin-ui:
    build:
      context: .
      dockerfile: ./packages/admin-ui/Dockerfile
    ports:
      - "3003:3003"
    environment:
      - CORS_ORIGIN=http://${SERVER_IP}:3003,http://${SERVER_IP}:5173
    env_file: - .env

  web:
    build:
      context: .
      dockerfile: ./packages/web/Dockerfile
    ports:
      - "5173:5173"
    environment:
      - CORS_ORIGIN=http://${SERVER_IP}:3003,http://${SERVER_IP}:5173
    env_file: - .env
```

### Environment Variables (.env):
```bash
SERVER_IP=209.227.228.96
VITE_API_URL=http://209.227.228.96:3002/api/v1
VITE_ELASTICSEARCH_URL=http://209.227.228.96:9200
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
CORS_ORIGIN=http://209.227.228.96:3003,http://209.227.228.96:5173
```

### Nginx Configuration:
```nginx
server {
    listen 80;
    server_name benalsam.com www.benalsam.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name benalsam.com www.benalsam.com;

    ssl_certificate /etc/letsencrypt/live/benalsam.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/benalsam.com/privkey.pem;

    # Admin UI
    location /admin/ {
        proxy_pass http://localhost:3003/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Web Frontend
    location / {
        proxy_pass http://localhost:5173/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🚀 Deployment Komutları

### İlk Kurulum:
```bash
# VPS'e bağlan
ssh angache@209.227.228.96

# Docker kurulumu
sudo apt update
sudo apt install -y docker.io docker-compose

# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker angache
newgrp docker

# Proje dizini oluştur
mkdir ~/benalsam-docker
cd ~/benalsam-docker

# Dosyaları kopyala (local'den)
scp -r benalsam-monorepo/* angache@209.227.228.96:~/benalsam-docker/

# Docker build ve başlat
docker-compose up --build -d
```

### SSL Sertifikası:
```bash
# Certbot kurulumu
sudo apt install -y certbot python3-certbot-nginx

# SSL sertifikası al
sudo certbot --nginx -d benalsam.com -d www.benalsam.com

# Otomatik yenileme test et
sudo certbot renew --dry-run
```

### Nginx Yönetimi:
```bash
# Konfigürasyon test et
sudo nginx -t

# Nginx yeniden başlat
sudo systemctl reload nginx

# Logları kontrol et
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## 🔍 Troubleshooting

### Docker Sorunları:
```bash
# Container logları
docker-compose logs admin-backend
docker-compose logs admin-ui
docker-compose logs web

# Container durumu
docker-compose ps

# Yeniden başlat
docker-compose restart
```

### Network Sorunları:
```bash
# Port kontrolü
sudo netstat -tlnp | grep :3002
sudo netstat -tlnp | grep :3003
sudo netstat -tlnp | grep :5173

# Firewall kontrolü
sudo ufw status
```

### DNS Kontrolü:
```bash
# DNS çözümleme
nslookup benalsam.com
dig benalsam.com

# Ping test
ping benalsam.com
```

## 📊 Monitoring & Maintenance

### Log Monitoring:
```bash
# Docker logları
docker-compose logs -f

# Nginx logları
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logları
sudo journalctl -u docker
sudo journalctl -u nginx
```

### Backup Strategy:
```bash
# Docker volumes backup
docker run --rm -v benalsam-docker_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz -C /data .

# Environment backup
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Nginx config backup
sudo cp /etc/nginx/sites-available/benalsam.com /etc/nginx/sites-available/benalsam.com.backup
```

### Update Process:
```bash
# Code güncelleme
git pull origin main

# Docker rebuild
docker-compose down
docker-compose up --build -d

# SSL yenileme kontrolü
sudo certbot renew
```

## 🔐 Güvenlik

### Firewall Ayarları:
```bash
# UFW kurulumu
sudo apt install ufw

# Temel kurallar
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### SSL Security Headers:
```nginx
# Nginx güvenlik başlıkları
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
```

## 📈 Performance Optimization

### Nginx Caching:
```nginx
# Static dosya cache
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Docker Resource Limits:
```yaml
services:
  admin-backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## 🎯 Sonraki Adımlar

### Öncelikli Görevler:
1. ✅ **Logo tasarımı** (Canva ile)
2. 🔄 **Sosyal medya hesapları** açma
3. 📝 **Web sitesi içerikleri** hazırlama
4. 🔍 **SEO optimizasyonu**
5. 📊 **Analytics kurulumu** (Google Analytics)
6. 🔔 **Monitoring sistemi** (UptimeRobot)

### Uzun Vadeli Planlar:
- CDN entegrasyonu (Cloudflare)
- Database backup automation
- CI/CD pipeline kurulumu
- Load balancing (birden fazla VPS)
- Microservices architecture

## 📞 İletişim Bilgileri

- **Domain:** benalsam.com
- **Email:** admin@benalsam.com
- **VPS IP:** 209.227.228.96
- **SSL Provider:** Let's Encrypt
- **Email Provider:** ProtonMail Business

## 📚 Faydalı Linkler

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [ProtonMail Business](https://proton.me/business)

---

**Son Güncelleme:** 22 Temmuz 2025  
**Versiyon:** 1.0  
**Durum:** Production Ready ✅ 