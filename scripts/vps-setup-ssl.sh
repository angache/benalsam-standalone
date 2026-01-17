#!/bin/bash

# ==============================================================================
# VPS SSL CERTIFICATE SETUP SCRIPT (Let's Encrypt)
# ==============================================================================
# Bu script Let's Encrypt SSL sertifikası kurulumunu yapar
# Kullanım: sudo ./scripts/vps-setup-ssl.sh <domain>
# Örnek: sudo ./scripts/vps-setup-ssl.sh api.benalsam.com
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}❌ Domain belirtilmedi${NC}"
    echo "Kullanım: sudo $0 <domain>"
    echo "Örnek: sudo $0 api.benalsam.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@${DOMAIN}"}

echo -e "${BLUE}🔒 SSL Certificate Setup (Let's Encrypt)${NC}"
echo "=========================================="
echo ""
echo "📋 Konfigürasyon:"
echo "   Domain: $DOMAIN"
echo "   Email: $EMAIL"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Bu script root olarak çalıştırılmalı${NC}"
    echo "Kullanım: sudo $0 <domain> [email]"
    exit 1
fi

# Step 1: Install Certbot
echo -e "${BLUE}Step 1: Certbot kurulumu kontrol ediliyor...${NC}"
if command -v certbot &> /dev/null; then
    echo -e "${GREEN}✅ Certbot zaten kurulu${NC}"
    certbot --version
else
    echo "   Certbot kuruluyor..."
    apt update
    apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✅ Certbot kuruldu${NC}"
fi
echo ""

# Step 2: Check Nginx configuration
echo -e "${BLUE}Step 2: Nginx config kontrol ediliyor...${NC}"
if [ ! -f "/etc/nginx/sites-available/benalsam" ]; then
    echo -e "${RED}❌ Nginx config dosyası bulunamadı${NC}"
    echo "   Önce Nginx reverse proxy kurulumunu yapın:"
    echo "   sudo ./scripts/vps-setup-nginx.sh"
    exit 1
fi

# Update server_name in Nginx config
echo "   Nginx config'te domain güncelleniyor..."
sed -i "s/server_name _;/server_name $DOMAIN;/" /etc/nginx/sites-available/benalsam
echo -e "${GREEN}✅ Domain güncellendi${NC}"

# Test Nginx config
if nginx -t; then
    echo -e "${GREEN}✅ Nginx config geçerli${NC}"
    systemctl reload nginx
else
    echo -e "${RED}❌ Nginx config hatası!${NC}"
    exit 1
fi
echo ""

# Step 3: Check DNS
echo -e "${BLUE}Step 3: DNS kontrol ediliyor...${NC}"

# Get IPv4 addresses
DOMAIN_IP=$(dig +short $DOMAIN @8.8.8.8 A | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -n1)
SERVER_IP=$(curl -s -4 ifconfig.me 2>/dev/null || curl -s -4 ipinfo.io/ip 2>/dev/null || curl -s -4 icanhazip.com 2>/dev/null)

# If still empty, try alternative methods
if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(hostname -I | awk '{print $1}' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -n1)
fi

echo "   Domain IP (A record): $DOMAIN_IP"
echo "   Server IP (IPv4): $SERVER_IP"

if [ -z "$DOMAIN_IP" ]; then
    echo -e "${YELLOW}⚠️  Domain için A record bulunamadı!${NC}"
    echo "   Domain'in A record'u bu VPS'in IPv4 adresine ($SERVER_IP) işaret etmeli"
    echo "   Devam etmek istiyor musunuz? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
elif [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo -e "${YELLOW}⚠️  DNS IP eşleşmiyor!${NC}"
    echo "   Domain IP: $DOMAIN_IP"
    echo "   Server IP: $SERVER_IP"
    echo "   Domain'in A record'u bu VPS'in IPv4 adresine ($SERVER_IP) işaret etmeli"
    echo "   Devam etmek istiyor musunuz? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ DNS doğru yapılandırılmış${NC}"
fi
echo ""

# Step 4: Firewall check
echo -e "${BLUE}Step 4: Firewall kontrol ediliyor...${NC}"
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "80/tcp.*ALLOW"; then
        echo -e "${GREEN}✅ Port 80 açık${NC}"
    else
        echo "   Port 80 açılıyor..."
        ufw allow 80/tcp
    fi
    
    if ufw status | grep -q "443/tcp.*ALLOW"; then
        echo -e "${GREEN}✅ Port 443 açık${NC}"
    else
        echo "   Port 443 açılıyor..."
        ufw allow 443/tcp
    fi
else
    echo -e "${YELLOW}⚠️  UFW bulunamadı, firewall manuel kontrol edilmeli${NC}"
fi
echo ""

# Step 5: Obtain SSL Certificate
echo -e "${BLUE}Step 5: SSL sertifikası alınıyor...${NC}"
echo -e "${YELLOW}⚠️  Bu işlem birkaç dakika sürebilir${NC}"
echo ""

# Certbot ile sertifika al
if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect; then
    echo -e "${GREEN}✅ SSL sertifikası başarıyla alındı${NC}"
else
    echo -e "${RED}❌ SSL sertifikası alınamadı${NC}"
    echo ""
    echo "Olası sorunlar:"
    echo "  1. DNS A record doğru yapılandırılmamış"
    echo "  2. Port 80 kapalı"
    echo "  3. Domain zaten başka bir sertifikaya sahip"
    echo ""
    echo "Manuel kurulum için:"
    echo "  certbot --nginx -d $DOMAIN"
    exit 1
fi
echo ""

# Step 6: Verify certificate
echo -e "${BLUE}Step 6: SSL sertifikası doğrulanıyor...${NC}"
if certbot certificates | grep -q "$DOMAIN"; then
    echo -e "${GREEN}✅ Sertifika doğrulandı${NC}"
    certbot certificates | grep -A 5 "$DOMAIN"
else
    echo -e "${YELLOW}⚠️  Sertifika bulunamadı${NC}"
fi
echo ""

# Step 7: Test auto-renewal
echo -e "${BLUE}Step 7: Otomatik yenileme test ediliyor...${NC}"
if certbot renew --dry-run; then
    echo -e "${GREEN}✅ Otomatik yenileme çalışıyor${NC}"
else
    echo -e "${YELLOW}⚠️  Otomatik yenileme testi başarısız${NC}"
fi
echo ""

# Step 8: Setup auto-renewal cron job (if not exists)
echo -e "${BLUE}Step 8: Otomatik yenileme cron job kontrol ediliyor...${NC}"
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    echo "   Cron job ekleniyor..."
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
    echo -e "${GREEN}✅ Cron job eklendi${NC}"
else
    echo -e "${GREEN}✅ Cron job zaten mevcut${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}✅ SSL Certificate kurulumu tamamlandı!${NC}"
echo ""
echo "📋 Özet:"
echo "   Domain: $DOMAIN"
echo "   Certificate: /etc/letsencrypt/live/$DOMAIN/"
echo "   Auto-renewal: ✅ Aktif (her gün 03:00'da kontrol)"
echo ""
echo "🌐 Test:"
echo "   https://$DOMAIN/health"
echo "   https://$DOMAIN/api/v1/admin/health"
echo ""
echo "💡 Yararlı Komutlar:"
echo "   sudo certbot certificates              # Sertifikaları listele"
echo "   sudo certbot renew                     # Sertifikayı yenile"
echo "   sudo certbot renew --dry-run           # Yenileme testi"
echo "   sudo certbot delete -d $DOMAIN        # Sertifikayı sil"
echo "   sudo nginx -t                          # Nginx config test"
echo "   sudo systemctl reload nginx            # Nginx reload"
echo ""
echo "⚠️  ÖNEMLİ:"
echo "   - Sertifika 90 günde bir otomatik yenilenecek"
echo "   - Cron job her gün 03:00'da kontrol edecek"
echo "   - Sertifika yenileme başarısız olursa email alacaksınız: $EMAIL"
echo ""

