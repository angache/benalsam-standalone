#!/bin/bash

# ==============================================================================
# VPS CORS Code Update Script
# ==============================================================================
# Bu script VPS'deki servislerin kodlarını günceller (CORS düzeltmeleri için)
# Kullanım: ./scripts/vps-update-cors-code.sh
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# VPS Configuration
VPS_IP="46.62.212.96"
VPS_USER="root"
SERVICES_DIR="/opt/benalsam/services"
PROJECT_ROOT="/opt/benalsam/benalsam-standalone"

# Services to update
SERVICES=(
    "benalsam-listing-service"
    "benalsam-upload-service"
    "benalsam-realtime-service"
)

echo -e "${BLUE}🚀 VPS CORS Code Update Script${NC}"
echo "=========================================="
echo ""
echo "📋 Güncellenecek Servisler:"
for SERVICE in "${SERVICES[@]}"; do
    echo "   - $SERVICE"
done
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Root olarak çalıştırılması önerilir${NC}"
    echo "Kullanım: sudo $0"
    read -p "Devam etmek istiyor musunuz? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Function to update service code
update_service() {
    local SERVICE_NAME=$1
    local LOCAL_SERVICE_DIR="./$SERVICE_NAME"
    local VPS_SERVICE_DIR="$SERVICES_DIR/$SERVICE_NAME"
    
    echo -e "${BLUE}📦 Updating: $SERVICE_NAME${NC}"
    
    # Check if local service exists
    if [ ! -d "$LOCAL_SERVICE_DIR" ]; then
        echo -e "${RED}❌ $LOCAL_SERVICE_DIR bulunamadı${NC}"
        return 1
    fi
    
    # Copy updated files to VPS
    echo "   Kopyalanıyor: $LOCAL_SERVICE_DIR -> $VPS_USER@$VPS_IP:$VPS_SERVICE_DIR"
    
    # Copy only source files (not node_modules, dist, etc.)
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude 'dist' \
        --exclude '.git' \
        --exclude 'logs' \
        --exclude '*.log' \
        --exclude '.env' \
        "$LOCAL_SERVICE_DIR/" "$VPS_USER@$VPS_IP:$VPS_SERVICE_DIR/"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $SERVICE_NAME: Kod güncellendi${NC}"
        
        # Install dependencies and build on VPS
        echo "   Bağımlılıklar kuruluyor ve build yapılıyor..."
        ssh "$VPS_USER@$VPS_IP" "cd $VPS_SERVICE_DIR && npm install && npm run build"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $SERVICE_NAME: Build tamamlandı${NC}"
        else
            echo -e "${RED}❌ $SERVICE_NAME: Build hatası${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ $SERVICE_NAME: Kopyalama hatası${NC}"
        return 1
    fi
    
    echo ""
}

# Process each service
for SERVICE in "${SERVICES[@]}"; do
    update_service "$SERVICE"
done

# Summary
echo -e "${GREEN}✅ Tüm servisler güncellendi!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Servisleri yeniden başlatın:${NC}"
echo "   ssh $VPS_USER@$VPS_IP 'pm2 restart all'"
echo ""
echo "Veya tek tek:"
for SERVICE in "${SERVICES[@]}"; do
    echo "   ssh $VPS_USER@$VPS_IP 'pm2 restart ${SERVICE}'"
done
echo ""

