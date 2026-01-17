#!/bin/bash

# ==============================================================================
# LOCAL SERVICES STOP SCRIPT
# ==============================================================================
# Bu script local'deki tüm mikroservisleri durdurur
# VPS kullanmak için local servisleri kapatmak istediğinizde kullanın
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Local Servisleri Durdurma${NC}"
echo "=================================="
echo ""

# Services to stop
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

STOPPED=0
NOT_RUNNING=0

for service in "${SERVICES[@]}"; do
    SERVICE_NAME=$(echo $service | cut -d: -f1)
    SERVICE_PORT=$(echo $service | cut -d: -f2)
    
    # Check if process is running on the port
    if lsof -ti:$SERVICE_PORT > /dev/null 2>&1; then
        PID=$(lsof -ti:$SERVICE_PORT)
        echo -e "${YELLOW}⏹️${NC}  $SERVICE_NAME (port $SERVICE_PORT, PID: $PID) durduruluyor..."
        
        # Try graceful shutdown first
        kill $PID 2>/dev/null || true
        
        # Wait a bit
        sleep 2
        
        # Force kill if still running
        if lsof -ti:$SERVICE_PORT > /dev/null 2>&1; then
            kill -9 $PID 2>/dev/null || true
            sleep 1
        fi
        
        if ! lsof -ti:$SERVICE_PORT > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC}  $SERVICE_NAME durduruldu"
            STOPPED=$((STOPPED + 1))
        else
            echo -e "${RED}❌${NC}  $SERVICE_NAME durdurulamadı"
        fi
    else
        echo -e "${BLUE}ℹ️${NC}   $SERVICE_NAME zaten çalışmıyor"
        NOT_RUNNING=$((NOT_RUNNING + 1))
    fi
done

echo ""
echo "=================================="
echo -e "${GREEN}✅ Tamamlandı!${NC}"
echo "   Durdurulan: $STOPPED"
echo "   Zaten durmuş: $NOT_RUNNING"
echo ""
echo -e "${BLUE}💡 Not:${NC} VPS servislerini kullanmak için:"
echo "   export USE_VPS_SERVICES=true"
echo "   veya .env dosyasında: USE_VPS_SERVICES=true"

