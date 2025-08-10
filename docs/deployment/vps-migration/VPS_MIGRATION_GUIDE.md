# VPS Migration Guide - Benalsam Admin Panel

## 📋 Ön Hazırlık (Mevcut VPS'den)

### 1. Veri Yedekleme
```bash
# PostgreSQL veritabanı yedekleme
pg_dump -h localhost -U postgres benalsam_admin > benalsam_admin_backup.sql

# Redis veri yedekleme
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb redis_backup.rdb

# Upload dosyaları yedekleme
tar -czf uploads_backup.tar.gz /path/to/uploads

# Environment dosyaları
cp .env.production .env.production.backup
```

### 2. Mevcut Konfigürasyonları Kaydetme
```bash
# Docker container durumları
docker ps -a > container_status.txt

# Nginx konfigürasyonu
cp /etc/nginx/sites-available/benalsam benalsam_nginx.conf

# SSL sertifikaları
cp -r /etc/letsencrypt/live/your-domain.com /ssl_backup/
```

## 🚀 Yeni VPS Kurulumu

### 1. Sistem Gereksinimleri
```bash
# Ubuntu 22.04 LTS önerilen
sudo apt update && sudo apt upgrade -y

# Temel paketler
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### 2. Docker Kurulumu
```bash
# Docker kurulumu
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker $USER
```

### 3. Nginx Kurulumu
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4. SSL Sertifikası (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

## 📁 Proje Kurulumu

### 1. Repository Clone
```bash
cd /opt
sudo git clone https://github.com/angache/BenalsamMobil-2025.git benalsam
sudo chown -R $USER:$USER benalsam
cd benalsam/benalsam-monorepo/packages
```

### 2. Environment Dosyaları Hazırlama

#### Backend Environment (.env.production)
```bash
cd admin-backend
cp env.example .env.production
nano .env.production
```

**Gerekli değişiklikler:**
```env
# Yeni VPS IP'si veya domain
DATABASE_URL="postgresql://username:password@localhost:5432/benalsam_admin"
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_URL=http://localhost:9200

# Yeni domain için CORS
CORS_ORIGIN=https://your-new-domain.com,http://localhost:3000

# Yeni JWT secret (güvenlik için değiştirin)
JWT_SECRET=your-new-super-secret-jwt-key-here
```

#### Frontend Environment
```bash
cd ../admin-ui
nano .env.production
```

```env
VITE_API_URL=https://your-new-domain.com/api
VITE_APP_ENV=production
```

### 3. Nginx Konfigürasyonu Güncelleme
```bash
sudo nano /etc/nginx/sites-available/benalsam
```

```nginx
server {
    listen 80;
    server_name your-new-domain.com;
    
    # HTTP'den HTTPS'e yönlendirme
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-new-domain.com;
    
    # SSL sertifikaları (Let's Encrypt sonrası)
    ssl_certificate /etc/letsencrypt/live/your-new-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-new-domain.com/privkey.pem;
    
    # SSL güvenlik ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Frontend (React)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Nginx site'ını aktifleştir
sudo ln -s /etc/nginx/sites-available/benalsam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🗄️ Veritabanı Kurulumu

### 1. PostgreSQL Kurulumu
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Veritabanı oluştur
sudo -u postgres psql
CREATE DATABASE benalsam_admin;
CREATE USER benalsam_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE benalsam_admin TO benalsam_user;
\q
```

### 2. Veri Restore
```bash
# Eski VPS'den aldığınız backup'ı yeni VPS'e kopyalayın
psql -h localhost -U benalsam_user -d benalsam_admin < benalsam_admin_backup.sql
```

### 3. Redis Kurulumu
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Redis backup restore (eğer varsa)
sudo cp redis_backup.rdb /var/lib/redis/dump.rdb
sudo systemctl restart redis-server
```

## 🐳 Docker Deployment

### 1. Docker Compose ile Başlatma
```bash
cd /opt/benalsam/benalsam-monorepo/packages/admin-ui
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Container Durumlarını Kontrol Etme
```bash
docker ps
docker logs benalsam-admin-backend-prod
docker logs benalsam-admin-ui-prod
```

### 3. SSL Sertifikası Alma
```bash
sudo certbot --nginx -d your-new-domain.com
```

## 🔧 Post-Deployment Kontroller

### 1. Servis Kontrolleri
```bash
# Backend API test
curl -X GET https://your-new-domain.com/api/health

# Frontend test
curl -I https://your-new-domain.com

# Database bağlantı test
docker exec -it benalsam-admin-backend-prod npm run test:db
```

### 2. Log Kontrolleri
```bash
# Backend logları
docker logs -f benalsam-admin-backend-prod

# Frontend logları
docker logs -f benalsam-admin-ui-prod

# Nginx logları
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. Güvenlik Kontrolleri
```bash
# Port taraması
sudo netstat -tlnp

# Firewall ayarları
sudo ufw status
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🔄 DNS ve Domain Ayarları

### 1. DNS Kayıtları
```
A Record: your-new-domain.com -> Yeni VPS IP
CNAME: www.your-new-domain.com -> your-new-domain.com
```

### 2. Domain Doğrulama
```bash
# DNS propagation kontrol
nslookup your-new-domain.com
dig your-new-domain.com
```

## 📊 Monitoring ve Maintenance

### 1. Log Rotation
```bash
sudo nano /etc/logrotate.d/benalsam
```

```
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 640 nginx adm
    postrotate
        systemctl reload nginx
    endscript
}
```

### 2. Backup Script
```bash
sudo nano /opt/backup-benalsam.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"

# Database backup
pg_dump -h localhost -U benalsam_user benalsam_admin > $BACKUP_DIR/db_backup_$DATE.sql

# Upload files backup
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /opt/benalsam/uploads

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
chmod +x /opt/backup-benalsam.sh
# Crontab'a ekle: 0 2 * * * /opt/backup-benalsam.sh
```

## 🚨 Troubleshooting

### Yaygın Sorunlar ve Çözümleri

#### 1. CORS Hatası
```bash
# Backend .env'de CORS_ORIGIN'i kontrol et
# Frontend'de API URL'ini kontrol et
```

#### 2. Database Bağlantı Hatası
```bash
# PostgreSQL servisini kontrol et
sudo systemctl status postgresql

# Bağlantı test et
psql -h localhost -U benalsam_user -d benalsam_admin
```

#### 3. SSL Sertifikası Sorunu
```bash
# Sertifika yenileme
sudo certbot renew --dry-run

# Nginx konfigürasyonu kontrol
sudo nginx -t
```

#### 4. Docker Container Çökmesi
```bash
# Container loglarını kontrol et
docker logs benalsam-admin-backend-prod

# Container'ı yeniden başlat
docker-compose -f docker-compose.prod.yml restart
```

## 📞 Destek ve İletişim

### Acil Durumlar
- **Backend Down**: `docker restart benalsam-admin-backend-prod`
- **Frontend Down**: `docker restart benalsam-admin-ui-prod`
- **Database Down**: `sudo systemctl restart postgresql`
- **Redis Down**: `sudo systemctl restart redis-server`

### Monitoring Komutları
```bash
# Sistem kaynakları
htop
df -h
free -h

# Docker kaynakları
docker stats

# Network bağlantıları
netstat -tlnp
```

Bu rehber ile yeni VPS'inizde Benalsam admin panelini sorunsuz bir şekilde çalıştırabilirsiniz. Herhangi bir sorun yaşarsanız, logları kontrol ederek hata kaynağını tespit edebilirsiniz. 