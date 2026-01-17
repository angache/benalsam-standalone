#!/bin/bash

# ==============================================================================
# VPS CORS Fix Script
# ==============================================================================
# Bu script tüm servislerin .env dosyalarına CORS_ORIGIN ekler
# Kullanım: ./scripts/vps-fix-cors.sh
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# CORS origins
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,https://benalsam.vercel.app"

# Services directory
SERVICES_DIR="/opt/benalsam/services"

echo -e "${BLUE}🔧 VPS CORS Fix Script${NC}"
echo "=========================================="
echo ""
echo "📋 CORS Origins: $CORS_ORIGINS"
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

# List of services
SERVICES=(
    "benalsam-search-service"
    "benalsam-categories-service"
    "benalsam-upload-service"
    "benalsam-listing-service"
    "benalsam-admin-backend"
    "benalsam-backup-service"
    "benalsam-cache-service"
    "benalsam-realtime-service"
)

# Function to add CORS_ORIGIN to .env file
add_cors_origin() {
    local SERVICE_NAME=$1
    local ENV_FILE="$SERVICES_DIR/$SERVICE_NAME/.env"
    
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}⚠️  $ENV_FILE bulunamadı, atlanıyor${NC}"
        return
    fi
    
    # Check if CORS_ORIGIN already exists
    if grep -q "^CORS_ORIGIN=" "$ENV_FILE"; then
        echo -e "${YELLOW}⚠️  $SERVICE_NAME: CORS_ORIGIN zaten mevcut${NC}"
        read -p "   Üzerine yazmak istiyor musunuz? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Remove existing CORS_ORIGIN line
            sed -i '/^CORS_ORIGIN=/d' "$ENV_FILE"
            echo "   CORS_ORIGIN=$CORS_ORIGINS" >> "$ENV_FILE"
            echo -e "${GREEN}✅ $SERVICE_NAME: CORS_ORIGIN güncellendi${NC}"
        fi
    else
        # Add CORS_ORIGIN to end of file
        echo "" >> "$ENV_FILE"
        echo "# CORS Configuration" >> "$ENV_FILE"
        echo "CORS_ORIGIN=$CORS_ORIGINS" >> "$ENV_FILE"
        echo -e "${GREEN}✅ $SERVICE_NAME: CORS_ORIGIN eklendi${NC}"
    fi
}

# Process each service
for SERVICE in "${SERVICES[@]}"; do
    echo -e "${BLUE}📦 Processing: $SERVICE${NC}"
    add_cors_origin "$SERVICE"
    echo ""
done

# Summary
echo -e "${GREEN}✅ CORS fix tamamlandı!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Servisleri yeniden başlatın:${NC}"
echo "   pm2 restart all"
echo ""
echo "Veya tek tek:"
for SERVICE in "${SERVICES[@]}"; do
    echo "   pm2 restart ${SERVICE}"
done

