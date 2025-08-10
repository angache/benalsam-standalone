# 🚀 Production Deployment Guide

## 📋 **GENEL BAKIŞ**

Bu dokümantasyon, Benalsam Admin Panel'in production environment'da deployment sürecini detaylandırır. Zero-downtime deployment, automated backup ve comprehensive monitoring ile production-ready bir sistem kurulumu sağlar.

### 🎯 **Hedefler**
- Zero-downtime deployment
- Automated CI/CD pipeline
- Comprehensive monitoring ve logging
- Automated backup ve restore
- Security hardening
- Performance optimization

---

## 🏗️ **SİSTEM GEREKSİNİMLERİ**

### **Minimum Sistem Gereksinimleri**
- **CPU**: 2 vCPU
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 20.04 LTS veya üzeri
- **Network**: 100 Mbps

### **Önerilen Sistem Gereksinimleri**
- **CPU**: 4 vCPU
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Network**: 1 Gbps

### **Software Gereksinimleri**
- Docker 24.0+
- Docker Compose 2.0+
- Git 2.30+
- Nginx 1.18+
- Certbot (Let's Encrypt)
- UFW (Firewall)

---

## 🔧 **VPS KURULUMU**

### **1. Sistem Güncellemesi**
```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Gerekli paketlerin kurulumu
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### **2. Docker Kurulumu**
```bash
# Docker GPG key ekleme
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Docker repository ekleme
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker kurulumu
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Docker servisini başlatma
sudo systemctl start docker
sudo systemctl enable docker

# Kullanıcıyı docker grubuna ekleme
sudo usermod -aG docker $USER
```

### **3. Nginx Kurulumu**
```bash
# Nginx kurulumu
sudo apt install -y nginx

# Nginx servisini başlatma
sudo systemctl start nginx
sudo systemctl enable nginx

# Firewall ayarları
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### **4. SSL Certificate (Let's Encrypt)**
```bash
# Certbot kurulumu
sudo apt install -y certbot python3-certbot-nginx

# SSL certificate alma
sudo certbot --nginx -d admin.benalsam.com

# Auto-renewal test
sudo certbot renew --dry-run
```

---

## 📁 **PROJECT KURULUMU**

### **1. Project Directory Oluşturma**
```bash
# Project directory oluşturma
sudo mkdir -p /opt/benalsam-admin
sudo chown $USER:$USER /opt/benalsam-admin
cd /opt/benalsam-admin
```

### **2. Repository Clone**
```bash
# Repository'yi clone etme
git clone https://github.com/your-username/benalsam-monorepo.git .

# Environment dosyasını oluşturma
cp .env.example .env
```

### **3. Environment Variables Konfigürasyonu**
```bash
# .env dosyasını düzenleme
nano .env
```

**Örnek .env içeriği:**
```bash
# Application
NODE_ENV=production
PORT=3002

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Elasticsearch
ELASTICSEARCH_URL=http://elasticsearch:9200
ELASTICSEARCH_INDEX=benalsam_listings
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://admin.benalsam.com,https://benalsam.com

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Monitoring
ENABLE_MONITORING=true
ENABLE_HEALTH_CHECKS=true

# Backup
BACKUP_RETENTION_DAYS=7
BACKUP_DIR=/opt/benalsam-backups
```

---

## 🐳 **DOCKER DEPLOYMENT**

### **1. Production Docker Compose**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  admin-backend:
    build:
      context: .
      dockerfile: packages/admin-backend/Dockerfile
    container_name: benalsam-admin-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    ports:
      - "3002:3002"
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    depends_on:
      - elasticsearch
      - redis
    networks:
      - benalsam-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  admin-ui:
    build:
      context: .
      dockerfile: packages/admin-ui/Dockerfile
    container_name: benalsam-admin-ui
    restart: unless-stopped
    ports:
      - "3001:80"
    depends_on:
      - admin-backend
    networks:
      - benalsam-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: benalsam-elasticsearch
    restart: unless-stopped
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - benalsam-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: benalsam-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - benalsam-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  elasticsearch_data:
    driver: local
  redis_data:
    driver: local

networks:
  benalsam-network:
    driver: bridge
```

### **2. Docker Build ve Deployment**
```bash
# Docker images build etme
docker-compose -f docker-compose.prod.yml build

# Services başlatma
docker-compose -f docker-compose.prod.yml up -d

# Logs kontrol etme
docker-compose -f docker-compose.prod.yml logs -f

# Health check
curl -f http://localhost:3002/api/v1/health
```

---

## 🌐 **NGINX KONFIGÜRASYONU**

### **1. Nginx Site Konfigürasyonu**
```nginx
# /etc/nginx/sites-available/benalsam-admin
server {
    listen 80;
    server_name admin.benalsam.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.benalsam.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/admin.benalsam.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.benalsam.com/privkey.pem;
    
    # SSL Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Client Max Body Size
    client_max_body_size 10M;
    
    # Admin UI
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Admin Backend API
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        add_header Access-Control-Expose-Headers "Content-Length,Content-Range" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $http_origin;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint (public)
    location /health {
        proxy_pass http://localhost:3002/api/v1/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache health check for 30 seconds
        proxy_cache_valid 200 30s;
        add_header X-Cache-Status $upstream_cache_status;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security: Hide server info
    server_tokens off;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=health:10m rate=30r/s;
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        # ... existing proxy configuration
    }
    
    location /health {
        limit_req zone=health burst=50 nodelay;
        # ... existing proxy configuration
    }
}
```

### **2. Nginx Konfigürasyonu Aktifleştirme**
```bash
# Site konfigürasyonunu aktifleştirme
sudo ln -s /etc/nginx/sites-available/benalsam-admin /etc/nginx/sites-enabled/

# Nginx konfigürasyonunu test etme
sudo nginx -t

# Nginx'i yeniden başlatma
sudo systemctl reload nginx
```

---

## 🔄 **CI/CD PIPELINE**

### **1. GitHub Secrets Konfigürasyonu**
GitHub repository'de aşağıdaki secrets'ları ayarlayın:

```bash
# VPS Connection
VPS_HOST=your-vps-ip-or-domain
VPS_USER=your-vps-username
VPS_SSH_KEY=your-private-ssh-key

# Docker Hub
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password

# Notifications
SLACK_WEBHOOK_URL=your-slack-webhook-url
```

### **2. Automated Deployment**
```bash
# GitHub Actions workflow otomatik olarak çalışır
# Main branch'e push yapıldığında:
# 1. Tests çalıştırılır
# 2. Docker images build edilir
# 3. VPS'e deploy edilir
# 4. Health check yapılır
# 5. Notification gönderilir
```

### **3. Manual Deployment**
```bash
# VPS'de manual deployment
cd /opt/benalsam-admin

# Latest code'u çekme
git pull origin main

# Environment variables güncelleme
cp .env.example .env
# .env dosyasını düzenleme

# Docker images rebuild
docker-compose -f docker-compose.prod.yml build

# Services restart
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# Health check
sleep 30
curl -f http://localhost:3002/api/v1/health
```

---

## 🗄️ **BACKUP STRATEGY**

### **1. Automated Backup Setup**
```bash
# Backup script'ini çalıştırılabilir yapma
chmod +x scripts/backup.sh
chmod +x scripts/restore.sh
chmod +x scripts/setup-backup-cron.sh

# Automated backup kurulumu
sudo ./scripts/setup-backup-cron.sh
```

### **2. Backup Cron Jobs**
```bash
# Cron jobs kontrol etme
crontab -l

# Beklenen cron jobs:
# 0 2 * * * /opt/benalsam-admin/scripts/backup.sh >> /var/log/benalsam-backup.log 2>&1
# 0 */6 * * * /opt/benalsam-admin/scripts/check-backup.sh >> /var/log/benalsam-backup-check.log 2>&1
# 0 3 * * 0 /opt/benalsam-admin/scripts/cleanup-backups.sh >> /var/log/benalsam-backup-cleanup.log 2>&1
```

### **3. Manual Backup**
```bash
# Manual backup alma
./scripts/backup.sh

# Backup durumunu kontrol etme
./scripts/backup-status.sh

# Backup listesini görme
./scripts/restore.sh list

# Backup'tan restore etme
./scripts/restore.sh restore <backup_id>
```

---

## 📊 **MONITORING SETUP**

### **1. Health Check Monitoring**
```bash
# Health check endpoint'leri
curl http://admin.benalsam.com/health
curl http://admin.benalsam.com/api/v1/health
curl http://admin.benalsam.com/api/v1/health/detailed

# Monitoring endpoint'leri
curl http://admin.benalsam.com/api/v1/monitoring/metrics
curl http://admin.benalsam.com/api/v1/monitoring/status
```

### **2. Log Monitoring**
```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f admin-backend

# Backup logs
tail -f /var/log/benalsam-backup.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -u docker.service -f
journalctl -u nginx.service -f
```

### **3. System Monitoring**
```bash
# System resources
htop
df -h
free -h

# Docker resources
docker stats

# Network connections
netstat -tulpn | grep :3002
netstat -tulpn | grep :3001
```

---

## 🔒 **SECURITY HARDENING**

### **1. Firewall Configuration**
```bash
# UFW firewall ayarları
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3002/tcp  # Admin backend
sudo ufw enable

# Firewall durumunu kontrol etme
sudo ufw status verbose
```

### **2. SSH Security**
```bash
# SSH konfigürasyonu
sudo nano /etc/ssh/sshd_config

# Önerilen ayarlar:
# Port 22 (veya custom port)
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes
# MaxAuthTries 3
# ClientAliveInterval 300
# ClientAliveCountMax 2

# SSH servisini yeniden başlatma
sudo systemctl restart sshd
```

### **3. Docker Security**
```bash
# Docker daemon security
sudo nano /etc/docker/daemon.json

{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false
}

# Docker servisini yeniden başlatma
sudo systemctl restart docker
```

### **4. File Permissions**
```bash
# Sensitive dosyaların permissions'ını ayarlama
chmod 600 /opt/benalsam-admin/.env
chmod 600 /opt/benalsam-admin/scripts/*.sh
chmod 644 /opt/benalsam-admin/docker-compose.prod.yml

# Backup directory permissions
sudo chown -R $USER:$USER /opt/benalsam-backups
chmod 700 /opt/benalsam-backups
```

---

## 🚨 **TROUBLESHOOTING**

### **1. Common Issues**

#### **Service Won't Start**
```bash
# Docker logs kontrol etme
docker-compose -f docker-compose.prod.yml logs admin-backend
docker-compose -f docker-compose.prod.yml logs admin-ui

# Container status kontrol etme
docker-compose -f docker-compose.prod.yml ps

# Health check
curl -f http://localhost:3002/api/v1/health
```

#### **Database Connection Issues**
```bash
# Supabase connection test
curl -X GET "https://your-project.supabase.co/rest/v1/" \
  -H "apikey: your_supabase_anon_key"

# Environment variables kontrol etme
docker-compose -f docker-compose.prod.yml exec admin-backend env | grep SUPABASE
```

#### **Elasticsearch Issues**
```bash
# Elasticsearch health check
curl -X GET "localhost:9200/_cluster/health?pretty"

# Elasticsearch logs
docker-compose -f docker-compose.prod.yml logs elasticsearch

# Index status
curl -X GET "localhost:9200/_cat/indices?v"
```

#### **Nginx Issues**
```bash
# Nginx konfigürasyon test
sudo nginx -t

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Nginx status
sudo systemctl status nginx
```

### **2. Performance Issues**

#### **High CPU Usage**
```bash
# Process monitoring
htop
docker stats

# Container resource usage
docker-compose -f docker-compose.prod.yml exec admin-backend top
```

#### **High Memory Usage**
```bash
# Memory usage
free -h
docker system df

# Container memory limits
docker-compose -f docker-compose.prod.yml exec admin-backend cat /proc/meminfo
```

#### **Slow Response Times**
```bash
# API response time test
curl -w "@curl-format.txt" -o /dev/null -s "http://admin.benalsam.com/api/v1/health"

# Database query performance
docker-compose -f docker-compose.prod.yml exec admin-backend npm run db:analyze
```

### **3. Backup Issues**

#### **Backup Failed**
```bash
# Backup logs kontrol etme
tail -f /var/log/benalsam-backup.log

# Manual backup test
./scripts/backup.sh

# Disk space kontrol etme
df -h /opt/benalsam-backups
```

#### **Restore Failed**
```bash
# Backup validation
./scripts/restore.sh validate <backup_id>

# Backup integrity check
ls -la /opt/benalsam-backups/

# Manual restore test
./scripts/restore.sh restore <backup_id>
```

---

## 📈 **PERFORMANCE OPTIMIZATION**

### **1. Docker Optimization**
```yaml
# docker-compose.prod.yml optimizations
services:
  admin-backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
    ulimits:
      nofile:
        soft: 65536
        hard: 65536

  elasticsearch:
    environment:
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
```

### **2. Nginx Optimization**
```nginx
# nginx.conf optimizations
worker_processes auto;
worker_rlimit_nofile 65536;

events {
    worker_connections 65536;
    use epoll;
    multi_accept on;
}

http {
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Cache settings
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=10g inactive=60m use_temp_path=off;
    
    # Buffer settings
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
}
```

### **3. Application Optimization**
```typescript
// Database connection pooling
const pool = new Pool({
  connectionString: process.env.SUPABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis connection pooling
const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 10000,
    lazyConnect: true,
  },
});

// Elasticsearch connection pooling
const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
  maxRetries: 3,
  requestTimeout: 10000,
  sniffOnStart: false,
});
```

---

## 🔄 **MAINTENANCE PROCEDURES**

### **1. Regular Maintenance**
```bash
# Weekly maintenance script
#!/bin/bash
# /opt/benalsam-admin/scripts/maintenance.sh

# System update
sudo apt update && sudo apt upgrade -y

# Docker cleanup
docker system prune -f
docker volume prune -f

# Log rotation
sudo logrotate -f /etc/logrotate.conf

# SSL certificate renewal check
sudo certbot renew --dry-run

# Backup verification
./scripts/check-backup.sh

# Health check
curl -f http://localhost:3002/api/v1/health
```

### **2. Emergency Procedures**

#### **Service Down**
```bash
# Emergency restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### **Database Issues**
```bash
# Database connection test
docker-compose -f docker-compose.prod.yml exec admin-backend npm run db:test

# Restore from backup
./scripts/restore.sh restore <latest_backup_id>
```

#### **Security Breach**
```bash
# Emergency lockdown
sudo ufw deny all
sudo ufw allow ssh
sudo ufw allow from your-ip

# Check logs for suspicious activity
sudo tail -f /var/log/auth.log
sudo tail -f /var/log/nginx/access.log
```

---

## 📞 **SUPPORT VE İLETİŞİM**

### **Emergency Contacts**
- **Technical Lead**: [Your Name] - [Phone] - [Email]
- **DevOps**: [DevOps Contact] - [Phone] - [Email]
- **Infrastructure**: [Infrastructure Contact] - [Phone] - [Email]

### **Escalation Process**
1. **Level 1**: On-call engineer (24/7)
2. **Level 2**: Senior engineer (business hours)
3. **Level 3**: Technical lead (critical issues)

### **Documentation**
- **API Documentation**: https://docs.benalsam.com/api
- **Status Page**: https://status.benalsam.com
- **GitHub Repository**: https://github.com/your-username/benalsam-monorepo

---

## 📋 **CHECKLIST**

### **Pre-Deployment**
- [ ] VPS kurulumu tamamlandı
- [ ] Docker ve Nginx kuruldu
- [ ] SSL certificate alındı
- [ ] Environment variables ayarlandı
- [ ] Firewall konfigürasyonu yapıldı

### **Deployment**
- [ ] Repository clone edildi
- [ ] Docker images build edildi
- [ ] Services başlatıldı
- [ ] Health check başarılı
- [ ] Nginx konfigürasyonu aktif

### **Post-Deployment**
- [ ] Backup system kuruldu
- [ ] Monitoring aktif
- [ ] Security hardening tamamlandı
- [ ] Performance optimization yapıldı
- [ ] Documentation güncellendi

### **Ongoing Maintenance**
- [ ] Weekly maintenance script kuruldu
- [ ] Backup verification otomatik
- [ ] SSL certificate auto-renewal aktif
- [ ] Log rotation konfigüre edildi
- [ ] Emergency procedures dokümante edildi

---

*Bu dokümantasyon sürekli güncellenmektedir. Son güncelleme: 2025-07-19* 