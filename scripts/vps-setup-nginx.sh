#!/bin/bash

# ==============================================================================
# VPS NGINX REVERSE PROXY SETUP SCRIPT
# ==============================================================================
# Bu script Nginx reverse proxy kurulumunu yapar
# Tüm mikroservisler için upstream ve location tanımları oluşturur
# Kullanım: sudo ./scripts/vps-setup-nginx.sh [domain]
# Örnek: sudo ./scripts/vps-setup-nginx.sh api.benalsam.com
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Domain (opsiyonel)
DOMAIN=${1:-"localhost"}

echo -e "${BLUE}🚀 Nginx Reverse Proxy Setup${NC}"
echo "=========================================="
echo ""
echo "📋 Konfigürasyon:"
echo "   Domain: $DOMAIN"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Bu script root olarak çalıştırılmalı${NC}"
    echo "Kullanım: sudo $0 [domain]"
    exit 1
fi

# Step 1: Install Nginx
echo -e "${BLUE}Step 1: Nginx kurulumu kontrol ediliyor...${NC}"
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✅ Nginx zaten kurulu${NC}"
    nginx -v
else
    echo "   Nginx kuruluyor..."
    apt update
    apt install -y nginx
    echo -e "${GREEN}✅ Nginx kuruldu${NC}"
fi
echo ""

# Step 2: Backup existing config
echo -e "${BLUE}Step 2: Mevcut Nginx config yedekleniyor...${NC}"
if [ -f "/etc/nginx/sites-available/benalsam" ]; then
    BACKUP_FILE="/etc/nginx/sites-available/benalsam.backup.$(date +%Y%m%d_%H%M%S)"
    cp /etc/nginx/sites-available/benalsam "$BACKUP_FILE"
    echo -e "${GREEN}✅ Yedek oluşturuldu: $BACKUP_FILE${NC}"
else
    echo "   Mevcut config yok, yeni oluşturulacak"
fi
echo ""

# Step 3: Create Nginx configuration
echo -e "${BLUE}Step 3: Nginx config dosyası oluşturuluyor...${NC}"
cat > /etc/nginx/sites-available/benalsam << 'EOF'
# ==============================================================================
# BENALSAM NGINX REVERSE PROXY CONFIGURATION
# ==============================================================================
# Tüm mikroservisler için reverse proxy yapılandırması
# ==============================================================================

# Upstream definitions for all microservices
upstream admin_backend {
    server 127.0.0.1:3002;
    keepalive 32;
}

upstream elasticsearch_service {
    server 127.0.0.1:3006;
    keepalive 32;
}

upstream upload_service {
    server 127.0.0.1:3007;
    keepalive 32;
}

upstream listing_service {
    server 127.0.0.1:3008;
    keepalive 32;
}

upstream backup_service {
    server 127.0.0.1:3013;
    keepalive 32;
}

upstream cache_service {
    server 127.0.0.1:3014;
    keepalive 32;
}

upstream categories_service {
    server 127.0.0.1:3015;
    keepalive 32;
}

upstream search_service {
    server 127.0.0.1:3016;
    keepalive 32;
}

upstream realtime_service {
    server 127.0.0.1:3019;
    keepalive 32;
}

# HTTP Server (Port 80)
server {
    listen 80;
    server_name _;  # Tüm domain'ler için (domain belirtilmediyse)
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Logging
    access_log /var/log/nginx/benalsam-access.log;
    error_log /var/log/nginx/benalsam-error.log;
    
    # Client body size (for file uploads)
    client_max_body_size 10M;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Common proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";
    proxy_http_version 1.1;
    
    # Admin Backend - Path rewriting: /api/v1/admin/* -> /api/v1/*
    location /api/v1/admin/ {
        rewrite ^/api/v1/admin/(.*)$ /api/v1/$1 break;
        proxy_pass http://admin_backend;
    }
    
    # Elasticsearch Service - Path rewriting: /api/v1/elasticsearch/* -> /api/v1/*
    location /api/v1/elasticsearch/ {
        rewrite ^/api/v1/elasticsearch/(.*)$ /api/v1/$1 break;
        proxy_pass http://elasticsearch_service;
    }
    
    # Upload Service - Path rewriting: /api/v1/upload/* -> /api/v1/*
    location /api/v1/upload/ {
        rewrite ^/api/v1/upload/(.*)$ /api/v1/$1 break;
        proxy_pass http://upload_service;
        client_max_body_size 10M;  # File upload limit
    }
    
    # Listing Service - Path rewriting: /api/v1/listings/* -> /api/v1/*
    location /api/v1/listings/ {
        rewrite ^/api/v1/listings/(.*)$ /api/v1/$1 break;
        proxy_pass http://listing_service;
    }
    
    # Backup Service - Path rewriting: /api/v1/backup/* -> /api/v1/*
    location /api/v1/backup/ {
        rewrite ^/api/v1/backup/(.*)$ /api/v1/$1 break;
        proxy_pass http://backup_service;
    }
    
    # Cache Service - Path rewriting: /api/v1/cache/* -> /api/v1/*
    location /api/v1/cache/ {
        rewrite ^/api/v1/cache/(.*)$ /api/v1/$1 break;
        proxy_pass http://cache_service;
    }
    
    # Categories Service - Path rewriting: /api/v1/categories/* -> /api/v1/*
    location /api/v1/categories/ {
        rewrite ^/api/v1/categories/(.*)$ /api/v1/$1 break;
        proxy_pass http://categories_service;
    }
    
    # Search Service - Path rewriting: /api/v1/search/* -> /api/v1/*
    location /api/v1/search/ {
        rewrite ^/api/v1/search/(.*)$ /api/v1/$1 break;
        proxy_pass http://search_service;
    }
    
    # Realtime Service - Path rewriting: /api/v1/realtime/* -> /api/v1/*
    location /api/v1/realtime/ {
        rewrite ^/api/v1/realtime/(.*)$ /api/v1/$1 break;
        proxy_pass http://realtime_service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Health check endpoint (aggregated)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Root location
    location / {
        return 200 "Benalsam API - All services are running\n";
        add_header Content-Type text/plain;
    }
}
EOF

echo -e "${GREEN}✅ Nginx config dosyası oluşturuldu${NC}"
echo ""

# Step 4: Enable site
echo -e "${BLUE}Step 4: Nginx site aktifleştiriliyor...${NC}"
ln -sf /etc/nginx/sites-available/benalsam /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
echo -e "${GREEN}✅ Site aktifleştirildi${NC}"
echo ""

# Step 5: Test Nginx configuration
echo -e "${BLUE}Step 5: Nginx config test ediliyor...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx config geçerli${NC}"
else
    echo -e "${RED}❌ Nginx config hatası!${NC}"
    exit 1
fi
echo ""

# Step 6: Reload Nginx
echo -e "${BLUE}Step 6: Nginx yeniden yükleniyor...${NC}"
systemctl reload nginx
echo -e "${GREEN}✅ Nginx yeniden yüklendi${NC}"
echo ""

# Step 7: Enable Nginx on boot
echo -e "${BLUE}Step 7: Nginx boot'ta başlatılacak şekilde ayarlanıyor...${NC}"
systemctl enable nginx
echo -e "${GREEN}✅ Nginx boot'ta başlatılacak${NC}"
echo ""

# Step 8: Firewall configuration
echo -e "${BLUE}Step 8: Firewall ayarları kontrol ediliyor...${NC}"
if command -v ufw &> /dev/null; then
    echo "   Port 80 (HTTP) açılıyor..."
    ufw allow 80/tcp
    echo "   Port 443 (HTTPS) açılıyor..."
    ufw allow 443/tcp
    echo -e "${GREEN}✅ Firewall ayarları tamamlandı${NC}"
else
    echo -e "${YELLOW}⚠️  UFW bulunamadı, firewall ayarları manuel yapılmalı${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}✅ Nginx Reverse Proxy kurulumu tamamlandı!${NC}"
echo ""
echo "📋 Özet:"
echo "   Config: /etc/nginx/sites-available/benalsam"
echo "   Enabled: /etc/nginx/sites-enabled/benalsam"
echo "   Logs: /var/log/nginx/benalsam-*.log"
echo ""
echo "🌐 Test Endpoints:"
echo "   http://localhost/health"
echo "   http://localhost/api/v1/admin/health"
echo "   http://localhost/api/v1/cache/health"
echo ""
echo "💡 Yararlı Komutlar:"
echo "   sudo nginx -t                    # Config test"
echo "   sudo systemctl reload nginx      # Nginx reload"
echo "   sudo systemctl status nginx      # Nginx durumu"
echo "   sudo tail -f /var/log/nginx/benalsam-access.log  # Access log"
echo ""
echo "⚠️  ÖNEMLİ:"
echo "   1. Domain kullanıyorsanız, /etc/nginx/sites-available/benalsam dosyasında"
echo "      'server_name _;' satırını 'server_name your-domain.com;' olarak değiştirin"
echo "   2. SSL sertifikası için Let's Encrypt kullanabilirsiniz:"
echo "      sudo apt install certbot python3-certbot-nginx"
echo "      sudo certbot --nginx -d your-domain.com"
echo ""

