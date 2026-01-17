#!/bin/bash

# ==============================================================================
# VPS CORS Code Update Script (VPS'de çalıştırılacak)
# ==============================================================================
# Bu script VPS'deki servislerin kodlarını günceller (CORS düzeltmeleri için)
# VPS'de çalıştırın: ./vps-update-cors-code-vps.sh
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Services directory
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
    local SERVICE_DIR="$SERVICES_DIR/$SERVICE_NAME"
    local PROJECT_SERVICE_DIR="$PROJECT_ROOT/$SERVICE_NAME"
    
    echo -e "${BLUE}📦 Updating: $SERVICE_NAME${NC}"
    
    # Check if service directory exists
    if [ ! -d "$SERVICE_DIR" ]; then
        echo -e "${RED}❌ $SERVICE_DIR bulunamadı${NC}"
        return 1
    fi
    
    # Check if project root has the service
    if [ -d "$PROJECT_SERVICE_DIR" ] && [ -f "$PROJECT_SERVICE_DIR/package.json" ]; then
        echo "   Proje root'tan kopyalanıyor: $PROJECT_SERVICE_DIR -> $SERVICE_DIR"
        
        # Copy only source files (not node_modules, dist, etc.)
        rsync -avz --delete \
            --exclude 'node_modules' \
            --exclude 'dist' \
            --exclude '.git' \
            --exclude 'logs' \
            --exclude '*.log' \
            --exclude '.env' \
            "$PROJECT_SERVICE_DIR/" "$SERVICE_DIR/"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $SERVICE_NAME: Kod güncellendi${NC}"
        else
            echo -e "${RED}❌ $SERVICE_NAME: Kopyalama hatası${NC}"
            return 1
        fi
    elif [ -d "$SERVICE_DIR/.git" ]; then
        echo "   Git repository mevcut, pull yapılıyor..."
        cd "$SERVICE_DIR"
        git pull
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $SERVICE_NAME: Git pull tamamlandı${NC}"
        else
            echo -e "${YELLOW}⚠️  $SERVICE_NAME: Git pull hatası (devam ediliyor)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  $SERVICE_NAME: Proje root'ta bulunamadı ve git repository yok${NC}"
        echo "   Manuel güncelleme gerekebilir"
    fi
    
    # Install dependencies and build
    echo "   Bağımlılıklar kuruluyor ve build yapılıyor..."
    cd "$SERVICE_DIR"
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ $SERVICE_NAME: package.json bulunamadı${NC}"
        return 1
    fi
    
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $SERVICE_NAME: Bağımlılıklar kuruldu${NC}"
    else
        echo -e "${RED}❌ $SERVICE_NAME: npm install hatası${NC}"
        return 1
    fi
    
    # Build if build script exists
    if grep -q "\"build\"" package.json; then
        npm run build
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $SERVICE_NAME: Build tamamlandı${NC}"
        else
            echo -e "${RED}❌ $SERVICE_NAME: Build hatası${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  $SERVICE_NAME: Build script bulunamadı, atlanıyor${NC}"
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
echo "   pm2 restart all"
echo ""
echo "Veya tek tek:"
for SERVICE in "${SERVICES[@]}"; do
    echo "   pm2 restart ${SERVICE}"
done
echo ""

