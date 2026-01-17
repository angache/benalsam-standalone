#!/bin/bash

# ==============================================================================
# VPS Servislerini Test Et Script
# ==============================================================================
# Bu script VPS'deki servislerin health endpoint'lerini test eder
# Local'de çalıştırın: ./scripts/test-vps-services.sh
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# VPS API URL
VPS_API="https://api.benalsam.com"

echo -e "${BLUE}🔍 VPS Servislerini Test Ediyor...${NC}"
echo "=========================================="
echo ""

# Services to test
declare -A SERVICES=(
    ["Admin Backend"]="/api/v1/admin/health"
    ["Search Service"]="/api/v1/search/health"
    ["Categories Service"]="/api/v1/categories/health"
    ["Listing Service"]="/api/v1/listings/health"
    ["Upload Service"]="/api/v1/upload/health"
    ["Realtime Service"]="/api/v1/realtime/health"
)

# Function to test service
test_service() {
    local SERVICE_NAME=$1
    local ENDPOINT=$2
    local URL="${VPS_API}${ENDPOINT}"
    
    echo -e "${BLUE}Testing: $SERVICE_NAME${NC}"
    echo "   URL: $URL"
    
    # Make request with timeout
    HTTP_CODE=$(curl -s -o /tmp/health_response.json -w "%{http_code}" --max-time 5 "$URL" || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ $SERVICE_NAME: Healthy (HTTP $HTTP_CODE)${NC}"
        # Show response summary
        if [ -f /tmp/health_response.json ]; then
            STATUS=$(cat /tmp/health_response.json | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown")
            echo "   Status: $STATUS"
        fi
    elif [ "$HTTP_CODE" = "000" ]; then
        echo -e "${RED}❌ $SERVICE_NAME: Connection failed${NC}"
    else
        echo -e "${YELLOW}⚠️  $SERVICE_NAME: HTTP $HTTP_CODE${NC}"
        if [ -f /tmp/health_response.json ]; then
            echo "   Response: $(cat /tmp/health_response.json | head -c 200)"
        fi
    fi
    echo ""
}

# Test each service
for SERVICE_NAME in "${!SERVICES[@]}"; do
    test_service "$SERVICE_NAME" "${SERVICES[$SERVICE_NAME]}"
done

# Cleanup
rm -f /tmp/health_response.json

# Summary
echo -e "${GREEN}✅ Test tamamlandı!${NC}"
echo ""
echo "💡 Not: Eğer bağlantı hatası alıyorsanız:"
echo "   1. VPS'de servislerin çalıştığını kontrol edin: ssh root@46.62.212.96 'pm2 list'"
echo "   2. Nginx'in çalıştığını kontrol edin: ssh root@46.62.212.96 'systemctl status nginx'"
echo "   3. SSL sertifikasının geçerli olduğunu kontrol edin"
echo ""

