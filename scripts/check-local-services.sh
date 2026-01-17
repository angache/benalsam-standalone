#!/bin/bash

# ==============================================================================
# Local Servisleri Kontrol Et Script
# ==============================================================================
# Bu script local'deki tüm servislerin durumunu kontrol eder
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Local Servis Durumu${NC}"
echo "=========================================="
echo ""

# Services to check
declare -A SERVICES=(
    ["Admin Backend"]="3002"
    ["Elasticsearch Service"]="3006"
    ["Upload Service"]="3007"
    ["Listing Service"]="3008"
    ["Backup Service"]="3013"
    ["Cache Service"]="3014"
    ["Categories Service"]="3015"
    ["Search Service"]="3016"
    ["Realtime Service"]="3019"
)

RUNNING=0
STOPPED=0

for SERVICE_NAME in "${!SERVICES[@]}"; do
    PORT="${SERVICES[$SERVICE_NAME]}"
    
    if lsof -ti:$PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $SERVICE_NAME (port $PORT) - ${GREEN}ÇALIŞIYOR${NC}"
        RUNNING=$((RUNNING + 1))
        
        # Health check
        HEALTH_URL="http://localhost:$PORT/api/v1/health"
        if [ "$SERVICE_NAME" = "Elasticsearch Service" ]; then
            HEALTH_URL="http://localhost:$PORT/health"
        fi
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$HEALTH_URL" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "   ${GREEN}✓${NC} Health check: OK"
        elif [ "$HTTP_CODE" = "000" ]; then
            echo -e "   ${YELLOW}⚠${NC} Health check: Timeout/Connection failed"
        else
            echo -e "   ${YELLOW}⚠${NC} Health check: HTTP $HTTP_CODE"
        fi
    else
        echo -e "${RED}❌${NC} $SERVICE_NAME (port $PORT) - ${RED}ÇALIŞMIYOR${NC}"
        STOPPED=$((STOPPED + 1))
    fi
    echo ""
done

echo "=========================================="
echo -e "${GREEN}Çalışan: $RUNNING${NC} | ${RED}Durdurulmuş: $STOPPED${NC}"
echo ""

if [ $STOPPED -gt 0 ]; then
    echo -e "${YELLOW}💡 Durdurulmuş servisleri başlatmak için:${NC}"
    echo "   ./scripts/local-services-start.sh"
    echo ""
    echo "Veya tek tek:"
    for SERVICE_NAME in "${!SERVICES[@]}"; do
        PORT="${SERVICES[$SERVICE_NAME]}"
        if ! lsof -ti:$PORT > /dev/null 2>&1; then
            SERVICE_DIR=$(echo "$SERVICE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
            echo "   cd benalsam-${SERVICE_DIR} && npm run dev"
        fi
    done
fi

