#!/bin/bash

# ==============================================================================
# LOCAL SERVICES START SCRIPT
# ==============================================================================
# Bu script local'deki tüm mikroservisleri başlatır
# VPS'den local'e geri dönmek istediğinizde kullanın
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Local Servisleri Başlatma${NC}"
echo "=================================="
echo ""

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Services to start
SERVICES=(
    "benalsam-admin-backend:3002"
    "benalsam-elasticsearch-service:3006"
    "benalsam-upload-service:3007"
    "benalsam-listing-service:3008"
    "benalsam-backup-service:3013"
    "benalsam-cache-service:3014"
    "benalsam-categories-service:3015"
    "benalsam-search-service:3016"
    "benalsam-realtime-service:3019"
)

STARTED=0
ALREADY_RUNNING=0
FAILED=0

for service in "${SERVICES[@]}"; do
    SERVICE_NAME=$(echo $service | cut -d: -f1)
    SERVICE_PORT=$(echo $service | cut -d: -f2)
    SERVICE_DIR="$PROJECT_ROOT/$SERVICE_NAME"
    
    # Check if already running
    if lsof -ti:$SERVICE_PORT > /dev/null 2>&1; then
        echo -e "${BLUE}ℹ️${NC}   $SERVICE_NAME zaten çalışıyor (port $SERVICE_PORT)"
        ALREADY_RUNNING=$((ALREADY_RUNNING + 1))
        continue
    fi
    
    # Check if service directory exists
    if [ ! -d "$SERVICE_DIR" ]; then
        echo -e "${YELLOW}⚠️${NC}   $SERVICE_NAME dizini bulunamadı: $SERVICE_DIR"
        FAILED=$((FAILED + 1))
        continue
    fi
    
    # Check if package.json exists
    if [ ! -f "$SERVICE_DIR/package.json" ]; then
        echo -e "${YELLOW}⚠️${NC}   $SERVICE_NAME package.json bulunamadı"
        FAILED=$((FAILED + 1))
        continue
    fi
    
    echo -e "${YELLOW}🚀${NC}  $SERVICE_NAME başlatılıyor..."
    
    # Start service in background
    cd "$SERVICE_DIR"
    
    # Check if .env exists
    if [ ! -f ".env" ] && [ -f "env.example" ]; then
        echo -e "${YELLOW}   ⚠️${NC}  .env dosyası yok, env.example'dan kopyalanıyor..."
        cp env.example .env
    fi
    
    # Start service (npm run dev in background)
    nohup npm run dev > /tmp/${SERVICE_NAME}.log 2>&1 &
    
    # Wait a bit for service to start
    sleep 3
    
    # Check if service started
    if lsof -ti:$SERVICE_PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}  $SERVICE_NAME başlatıldı (port $SERVICE_PORT)"
        STARTED=$((STARTED + 1))
    else
        echo -e "${RED}❌${NC}  $SERVICE_NAME başlatılamadı"
        echo -e "${YELLOW}   Log:${NC} tail -f /tmp/${SERVICE_NAME}.log"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "=================================="
echo -e "${GREEN}✅ Tamamlandı!${NC}"
echo "   Başlatılan: $STARTED"
echo "   Zaten çalışan: $ALREADY_RUNNING"
echo "   Başarısız: $FAILED"
echo ""
echo -e "${BLUE}💡 Not:${NC} Local servisleri kullanmak için:"
echo "   export USE_VPS_SERVICES=false"
echo "   veya .env dosyasını kaldırın"

