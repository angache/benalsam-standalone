# 🚀 Production Deployment Guide - Benalsam Standalone Projects

## 📋 **Genel Bakış**

Bu rehber, Benalsam standalone projelerini (Admin Backend, Admin UI, Web) production ortamına deploy etme adımlarını açıklar.

**⚠️ Önemli Değişiklik:** Monorepo yapısından standalone projelere geçiş yapıldı. Her proje artık bağımsız olarak deploy edilir.

---

## 🎯 **Production Requirements**

### **Sistem Gereksinimleri**
- **CPU**: Minimum 4 cores (8 cores önerilen)
- **RAM**: Minimum 8GB (16GB önerilen)
- **Disk**: Minimum 50GB SSD
- **Network**: Stable internet connection
- **OS**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+

### **Software Gereksinimleri**
- **Docker**: 20.10+ versiyonu
- **Docker Compose**: 2.0+ versiyonu
- **Nginx**: 1.18+ versiyonu
- **SSL Certificate**: Valid SSL certificate
- **Domain**: Configured domain name
- **Node.js**: 18+ versiyonu (local development için)
- **npm**: 9+ versiyonu (package manager)

---

## 🔧 **Pre-Deployment Checklist**

### **Security Checklist**
- [ ] Security scan completed
- [ ] Dependencies updated
- [ ] Environment variables secured
- [ ] SSL certificates valid
- [ ] Health checks passing
- [ ] Resource limits set
- [ ] Non-root user configured

### **Performance Checklist**
- [ ] Build time optimized
- [ ] Image sizes within limits
- [ ] Cache hit rates > 80%
- [ ] Resource usage optimized
- [ ] Network latency acceptable

### **Infrastructure Checklist**
- [ ] Server provisioned
- [ ] Domain configured
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Backup strategy ready

---

## 🚀 **Deployment Steps**

### **1. Server Preparation**

#### **Docker Installation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

#### **Nginx Installation**
```bash
# Install Nginx
sudo apt install nginx -y

# Configure Nginx
sudo nano /etc/nginx/sites-available/benalsam

# Enable site
sudo ln -s /etc/nginx/sites-available/benalsam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### **SSL Certificate Setup**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d benalsam.com -d www.benalsam.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **2. Application Deployment**

#### **Repository Setup**
```bash
# Clone repository
git clone https://github.com/angache/benalsam-standalone.git
cd benalsam-standalone

# Create production branch
git checkout -b production
```

#### **Environment Configuration**
```bash
# Create production environment file
cp env.example .env.production

# Configure production variables
nano .env.production

# Required production variables:
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-secure-jwt-secret
CORS_ORIGIN=https://admin.benalsam.com,https://benalsam.com
```

#### **Production Build**
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Verify builds
docker images | grep benalsam
```

#### **Production Deployment**
```bash
# Deploy production services
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
docker-compose -f docker-compose.prod.yml ps

# Check health
curl https://benalsam.com/health
```

### **3. Monitoring Setup**

#### **Health Monitoring**
```bash
# Create monitoring script
nano /opt/benalsam/monitor.sh

#!/bin/bash
# Health check script
curl -f https://benalsam.com/health || exit 1
curl -f https://admin.benalsam.com/health || exit 1

# Make executable
chmod +x /opt/benalsam/monitor.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /opt/benalsam/monitor.sh
```

#### **Log Monitoring**
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/benalsam

/var/log/benalsam/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

#### **Resource Monitoring**
```bash
# Install monitoring tools
sudo apt install htop iotop -y

# Setup resource alerts
nano /opt/benalsam/resource-monitor.sh

#!/bin/bash
# Resource monitoring script
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "High memory usage: ${MEMORY_USAGE}%" | mail -s "Alert" admin@benalsam.com
fi

if [ "$DISK_USAGE" -gt 80 ]; then
    echo "High disk usage: ${DISK_USAGE}%" | mail -s "Alert" admin@benalsam.com
fi
```

---

## 🔒 **Security Configuration**

### **Firewall Setup**
```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw status
```

### **SSL Configuration**
```bash
# Nginx SSL configuration
sudo nano /etc/nginx/sites-available/benalsam

server {
    listen 443 ssl http2;
    server_name benalsam.com www.benalsam.com;
    
    ssl_certificate /etc/letsencrypt/live/benalsam.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/benalsam.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Docker Security**
```bash
# Docker daemon security
sudo nano /etc/docker/daemon.json

{
  "userns-remap": "default",
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true
}

# Restart Docker
sudo systemctl restart docker
```

---

## 📊 **Performance Optimization**

### **Resource Limits**
```yaml
# docker-compose.prod.yml resource limits
services:
  admin-backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
          
  admin-ui:
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'
        reservations:
          memory: 128M
          cpus: '0.1'
```

### **Caching Strategy**
```bash
# Redis configuration
docker-compose -f docker-compose.prod.yml exec redis redis-cli CONFIG SET maxmemory 256mb
docker-compose -f docker-compose.prod.yml exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Elasticsearch optimization
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "indices.memory.index_buffer_size": "30%"
  }
}'
```

### **Nginx Optimization**
```nginx
# Nginx performance settings
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

---

## 🔄 **Deployment Automation**

### **CI/CD Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd /opt/benalsam
            git pull origin main
            docker-compose -f docker-compose.prod.yml build
            docker-compose -f docker-compose.prod.yml up -d
            curl -f https://benalsam.com/health
```

### **Rollback Strategy**
```bash
# Rollback script
nano /opt/benalsam/rollback.sh

#!/bin/bash
# Rollback to previous version
cd /opt/benalsam
git checkout HEAD~1
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
curl -f https://benalsam.com/health

chmod +x /opt/benalsam/rollback.sh
```

---

## 📈 **Monitoring ve Alerting**

### **Application Monitoring**
```bash
# Setup application monitoring
docker-compose -f docker-compose.prod.yml exec admin-backend npm install -g pm2
docker-compose -f docker-compose.prod.yml exec admin-backend pm2 start ecosystem.config.js

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

### **System Monitoring**
```bash
# Install monitoring tools
sudo apt install prometheus node-exporter grafana -y

# Configure Prometheus
sudo nano /etc/prometheus/prometheus.yml

global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'benalsam'
    static_configs:
      - targets: ['localhost:3002', 'localhost:3003', 'localhost:5173']
```

### **Alerting Setup**
```bash
# Setup email alerts
sudo apt install mailutils -y

# Configure email
sudo nano /etc/postfix/main.cf

# Test email
echo "Test alert" | mail -s "Test" admin@benalsam.com
```

---

## 🔧 **Maintenance**

### **Regular Maintenance Tasks**
```bash
# Daily tasks
docker system prune -f
docker image prune -f

# Weekly tasks
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml build --no-cache

# Monthly tasks
sudo apt update && sudo apt upgrade -y
sudo certbot renew
```

### **Backup Strategy**
```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec redis redis-cli BGSAVE
docker cp benalsam-infrastructure_redis_1:/data/dump.rdb /backup/redis-$(date +%Y%m%d).rdb

# Application backup
tar -czf /backup/app-$(date +%Y%m%d).tar.gz /opt/benalsam

# Configuration backup
cp /opt/benalsam/.env.production /backup/env-$(date +%Y%m%d).backup
```

---

## 📞 **Support ve Troubleshooting**

### **Emergency Contacts**
- **CTO**: +90 XXX XXX XX XX
- **DevOps**: devops@benalsam.com
- **Support**: support@benalsam.com

### **Emergency Procedures**
```bash
# Emergency shutdown
docker-compose -f docker-compose.prod.yml down

# Emergency restart
docker-compose -f docker-compose.prod.yml up -d

# Emergency rollback
/opt/benalsam/rollback.sh
```

---

**Son Güncelleme:** 2025-01-09  
**Versiyon:** 1.0.0  
**Güncelleyen:** AI Assistant  
**Onaylayan:** DevOps Team 