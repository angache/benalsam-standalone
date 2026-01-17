#!/bin/bash

# ==============================================================================
# VPS CONNECTION CHECK SCRIPT
# ==============================================================================
# Bu script VPS servislerine bağlantıyı kontrol eder
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 VPS Bağlantı Kontrolü${NC}"
echo "=================================="
echo ""

VPS_DOMAIN="api.benalsam.com"
LOCAL_DOMAIN="localhost"

# Check VPS endpoints
echo -e "${BLUE}1️⃣  VPS Health Endpoints:${NC}"
ENDPOINTS=(
    "https://${VPS_DOMAIN}/api/v1/admin/health"
    "https://${VPS_DOMAIN}/api/v1/elasticsearch/health"
    "https://${VPS_DOMAIN}/api/v1/upload/health"
    "https://${VPS_DOMAIN}/api/v1/listings/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$endpoint" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        STATUS=$(curl -s "$endpoint" | jq -r '.status // .health // "ok"' 2>/dev/null || echo "ok")
        echo -e "   ${GREEN}✅${NC} $endpoint - $STATUS (HTTP $HTTP_CODE)"
    else
        echo -e "   ${RED}❌${NC} $endpoint - HTTP $HTTP_CODE"
    fi
done
echo ""

# Check local endpoints (should fail if VPS is being used)
echo -e "${BLUE}2️⃣  Local Endpoints (VPS kullanıyorsanız bunlar çalışmamalı):${NC}"
LOCAL_ENDPOINTS=(
    "http://localhost:3002/api/v1/health"
    "http://localhost:3008/api/v1/health"
)

for endpoint in "${LOCAL_ENDPOINTS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$endpoint" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "   ${YELLOW}⚠️${NC}  $endpoint - ÇALIŞIYOR (Local servis hala aktif)"
    else
        echo -e "   ${GREEN}✅${NC} $endpoint - ÇALIŞMIYOR (VPS kullanılıyor)"
    fi
done
echo ""

# Check environment variables
echo -e "${BLUE}3️⃣  Environment Variables:${NC}"
if [ -f "benalsam-web-next/.env.local" ]; then
    if grep -q "USE_VPS_SERVICES=true" benalsam-web-next/.env.local; then
        echo -e "   ${GREEN}✅${NC} USE_VPS_SERVICES=true ayarlı"
    else
        echo -e "   ${YELLOW}⚠️${NC}  USE_VPS_SERVICES ayarlı değil"
    fi
    
    if grep -q "NEXT_PUBLIC_USE_VPS_SERVICES=true" benalsam-web-next/.env.local; then
        echo -e "   ${GREEN}✅${NC} NEXT_PUBLIC_USE_VPS_SERVICES=true ayarlı"
    else
        echo -e "   ${YELLOW}⚠️${NC}  NEXT_PUBLIC_USE_VPS_SERVICES ayarlı değil"
    fi
else
    echo -e "   ${YELLOW}⚠️${NC}  .env.local dosyası bulunamadı"
fi
echo ""

# Summary
echo "=================================="
echo -e "${BLUE}💡 Browser'da Kontrol:${NC}"
echo "   1. Browser console'da:"
echo "      console.log('API URL:', process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL)"
echo ""
echo "   2. Network tab'de API isteklerinin 'api.benalsam.com' adresine gittiğini kontrol edin"
echo ""
echo "   3. Frontend'de environment config'i görmek için:"
echo "      import { config } from '@/config/environment'"
echo "      console.log('Admin API:', config.adminApi.url)"

