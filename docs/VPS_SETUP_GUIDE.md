# 🚀 VPS Setup Guide - Benalsam

Bu rehber, Benalsam projesini VPS'de production ortamında çalıştırmak için gerekli adımları açıklar.

---

## 📋 **VPS Gereksinimleri**

### **Minimum Sistem Gereksinimleri**
- **CPU**: 4 cores
- **RAM**: 8GB
- **Disk**: 50GB SSD
- **OS**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **Network**: Stable internet connection

### **Önerilen Sistem Gereksinimleri**
- **CPU**: 8 cores
- **RAM**: 16GB
- **Disk**: 100GB SSD
- **OS**: Ubuntu 22.04 LTS

---

## 🔧 **VPS Kurulum Adımları**

### **1. VPS Sunucusu Hazırlama**

#### **Sistem Güncellemesi**
```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Gerekli paketlerin kurulumu
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

#### **Docker Kurulumu**
```bash
# Docker repository ekleme
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker kurulumu
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Kullanıcıyı docker grubuna ekleme
sudo usermod -aG docker $USER

# Docker servisini başlatma
sudo systemctl start docker
sudo systemctl enable docker

# Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### **Nginx Kurulumu**
```bash
# Nginx kurulumu
sudo apt install -y nginx

# Nginx servisini başlatma
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### **SSL Sertifikası Kurulumu**
```bash
# Certbot kurulumu
sudo apt install -y certbot python3-certbot-nginx

# Domain için SSL sertifikası alma
sudo certbot --nginx -d benalsam.com -d www.benalsam.com
sudo certbot --nginx -d admin.benalsam.com

# Otomatik yenileme için cron job
sudo crontab -e
# Ekleyin: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **2. Proje Kurulumu**

#### **Repository Klonlama**
```bash
# Projeyi klonlama
git clone https://github.com/angache/benalsam-standalone.git
cd benalsam-standalone

# Production branch oluşturma
git checkout -b production
```

#### **Environment Dosyası Hazırlama**
```bash
# Environment dosyasını kopyalama
cp env.production.example .env.production

# Environment dosyasını düzenleme
nano .env.production
```

**Gerekli Environment Değişkenleri:**
```bash
# Application Settings
NODE_ENV=production
PORT=3002

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-key-here

# CORS Settings
CORS_ORIGIN=https://admin.benalsam.com,https://benalsam.com

# Database Configuration
DATABASE_URL=your-database-url

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379

# Elasticsearch Configuration
ELASTICSEARCH_URL=http://elasticsearch:9200
ELASTICSEARCH_INDEX=benalsam_listings
```

### **3. Production Deployment**

#### **Production Build ve Deployment**
```bash
# Production build
docker-compose -f docker-compose.prod.yml build --no-cache

# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Servislerin durumunu kontrol etme
docker-compose -f docker-compose.prod.yml ps
```

#### **Health Check Kontrolü**
```bash
# Health check script'ini çalıştırma
./scripts/deploy-vps.sh
```

### **4. Nginx Konfigürasyonu**

#### **Nginx Konfigürasyon Dosyası**
```bash
# Nginx konfigürasyonunu kopyalama
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf

# Nginx syntax kontrolü
sudo nginx -t

# Nginx'i yeniden başlatma
sudo systemctl restart nginx
```

#### **Firewall Konfigürasyonu**
```bash
# UFW firewall kurulumu
sudo ufw enable

# Gerekli portları açma
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22

# Firewall durumunu kontrol etme
sudo ufw status
```

---

## 🔒 **Güvenlik Konfigürasyonu**

### **Docker Güvenlik Ayarları**
```bash
# Docker daemon güvenlik ayarları
sudo nano /etc/docker/daemon.json

{
  "userns-remap": "default",
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true
}

# Docker'ı yeniden başlatma
sudo systemctl restart docker
```

### **Sistem Güvenlik Ayarları**
```bash
# SSH güvenlik ayarları
sudo nano /etc/ssh/sshd_config

# Önemli ayarlar:
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes
# Port 22 (değiştirilebilir)

# SSH'ı yeniden başlatma
sudo systemctl restart ssh
```

---

## 📊 **Monitoring ve Backup**

### **Monitoring Kurulumu**
```bash
# Monitoring script'i oluşturma
sudo nano /opt/benalsam/monitor.sh

#!/bin/bash
# Health check script
curl -f https://benalsam.com/health || exit 1
curl -f https://admin.benalsam.com/health || exit 1

# Script'i executable yapma
sudo chmod +x /opt/benalsam/monitor.sh

# Cron job ekleme
sudo crontab -e
# Ekleyin: */5 * * * * /opt/benalsam/monitor.sh
```

### **Backup Stratejisi**
```bash
# Backup script'i oluşturma
sudo nano /opt/benalsam/backup.sh

#!/bin/bash
# Backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup"

# Redis backup
docker-compose -f /opt/benalsam/docker-compose.prod.yml exec redis redis-cli BGSAVE
docker cp benalsam-infrastructure_redis_1:/data/dump.rdb $BACKUP_DIR/redis-$DATE.rdb

# Application backup
tar -czf $BACKUP_DIR/app-$DATE.tar.gz /opt/benalsam

# Configuration backup
cp /opt/benalsam/.env.production $BACKUP_DIR/env-$DATE.backup

# Script'i executable yapma
sudo chmod +x /opt/benalsam/backup.sh

# Cron job ekleme (günlük backup)
sudo crontab -e
# Ekleyin: 0 2 * * * /opt/benalsam/backup.sh
```

---

## 🚀 **Deployment Sonrası Kontroller**

### **Servis Kontrolleri**
```bash
# Tüm servislerin durumunu kontrol etme
docker-compose -f docker-compose.prod.yml ps

# Log kontrolü
docker-compose -f docker-compose.prod.yml logs -f

# Resource kullanımı
docker stats --no-stream
```

### **Performance Kontrolleri**
```bash
# Memory kullanımı
free -h

# Disk kullanımı
df -h

# CPU kullanımı
htop

# Network bağlantıları
netstat -tulpn
```

### **SSL Sertifika Kontrolü**
```bash
# SSL sertifika durumu
sudo certbot certificates

# SSL sertifika yenileme testi
sudo certbot renew --dry-run
```

---

## 🔧 **Troubleshooting**

### **Yaygın Sorunlar ve Çözümleri**

#### **1. Docker Permission Sorunu**
```bash
# Docker grubuna kullanıcı ekleme
sudo usermod -aG docker $USER

# Yeni oturum açma
newgrp docker
```

#### **2. Port Çakışması**
```bash
# Kullanılan portları kontrol etme
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Çakışan servisleri durdurma
sudo systemctl stop apache2  # Eğer varsa
```

#### **3. Memory Sorunu**
```bash
# Memory kullanımını kontrol etme
free -h

# Swap alanı ekleme (gerekirse)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### **4. Disk Alanı Sorunu**
```bash
# Disk kullanımını kontrol etme
df -h

# Docker cleanup
docker system prune -a -f
docker volume prune -f
```

---

## 📞 **Destek**

### **Emergency Kontaklar**
- **CTO**: +90 XXX XXX XX XX
- **DevOps**: devops@benalsam.com
- **Support**: support@benalsam.com

### **Emergency Prosedürleri**
```bash
# Emergency shutdown
docker-compose -f docker-compose.prod.yml down

# Emergency restart
docker-compose -f docker-compose.prod.yml up -d

# Emergency rollback
git checkout HEAD~1
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

**Son Güncelleme:** 2025-08-04  
**Versiyon:** 1.0.0  
**Güncelleyen:** AI Assistant  
**Onaylayan:** DevOps Team 