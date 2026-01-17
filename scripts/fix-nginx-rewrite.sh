#!/bin/bash
# ==============================================================================
# NGINX REWRITE FIX SCRIPT
# ==============================================================================
# Bu script VPS'teki Nginx config'inden gereksiz rewrite kurallarını kaldırır.
# Frontend endpoint'leri düzeltildikten sonra rewrite'a gerek kalmadı.
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

NGINX_CONFIG="/etc/nginx/sites-enabled/benalsam"
BACKUP_FILE="/etc/nginx/sites-enabled/benalsam.backup.$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}NGINX REWRITE FIX SCRIPT${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Bu script root olarak çalıştırılmalı${NC}"
    echo "Kullanım: sudo ./fix-nginx-rewrite.sh"
    exit 1
fi

# Check if nginx config exists
if [ ! -f "$NGINX_CONFIG" ]; then
    echo -e "${RED}❌ Nginx config bulunamadı: $NGINX_CONFIG${NC}"
    exit 1
fi

# Create backup
echo -e "${YELLOW}📦 Backup oluşturuluyor...${NC}"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup: $BACKUP_FILE${NC}"
echo ""

# Remove rewrite lines
echo -e "${YELLOW}🔧 Rewrite kuralları kaldırılıyor...${NC}"
sed -i '/rewrite \^\/api\/v1\/admin/d' "$NGINX_CONFIG"
sed -i '/rewrite \^\/api\/v1\/elasticsearch/d' "$NGINX_CONFIG"
sed -i '/rewrite \^\/api\/v1\/upload/d' "$NGINX_CONFIG"
sed -i '/rewrite \^\/api\/v1\/listings/d' "$NGINX_CONFIG"
sed -i '/rewrite \^\/api\/v1\/backup/d' "$NGINX_CONFIG"
sed -i '/rewrite \^\/api\/v1\/cache/d' "$NGINX_CONFIG"
sed -i '/rewrite \^\/api\/v1\/categories/d' "$NGINX_CONFIG"
sed -i '/rewrite \^\/api\/v1\/search/d' "$NGINX_CONFIG"
sed -i '/rewrite \^\/api\/v1\/realtime/d' "$NGINX_CONFIG"

echo -e "${GREEN}✅ Rewrite kuralları kaldırıldı${NC}"
echo ""

# Test nginx config
echo -e "${YELLOW}🔍 Nginx config test ediliyor...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx config geçerli${NC}"
    echo ""
    
    # Reload nginx
    echo -e "${YELLOW}🔄 Nginx yeniden yükleniyor...${NC}"
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx yeniden yüklendi${NC}"
else
    echo -e "${RED}❌ Nginx config hatası! Backup'tan geri yükleniyor...${NC}"
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    echo -e "${YELLOW}⚠️  Backup geri yüklendi. Lütfen config'i manuel kontrol edin.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}✅ NGINX DÜZELTME TAMAMLANDI${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${BLUE}Test etmek için:${NC}"
echo "curl -s https://api.benalsam.com/api/v1/categories/ | head -100"
echo "curl -s https://api.benalsam.com/api/v1/search/listings -X POST -H 'Content-Type: application/json' -d '{}'"
echo ""
