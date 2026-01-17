#!/bin/bash

# ==============================================================================
# VPS PRE-VERCEL DEPLOYMENT CHECK SCRIPT
# ==============================================================================
# Bu script, Vercel'e deploy etmeden önce VPS'deki servislerin hazır olduğunu kontrol eder
# Kullanım: ./scripts/vps-pre-vercel-check.sh
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 VPS Pre-Vercel Deployment Check${NC}"
echo "=================================="
echo ""

# Check if running on VPS
if [ ! -f "/opt/benalsam/services/benalsam-admin-backend/package.json" ]; then
    echo -e "${YELLOW}⚠️  Bu script VPS'de çalıştırılmalıdır${NC}"
    echo "   VPS'e SSH ile bağlanın: ssh root@46.62.212.96"
    exit 1
fi

ERRORS=0
WARNINGS=0

# 1. PM2 Servisler
echo -e "${BLUE}1️⃣  PM2 Servisler:${NC}"
PM2_SERVICES=(
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

for service in "${PM2_SERVICES[@]}"; do
    SERVICE_NAME=$(echo $service | cut -d: -f1)
    SERVICE_PORT=$(echo $service | cut -d: -f2)
    
    if pm2 list | grep -q "$SERVICE_NAME.*online"; then
        echo -e "   ${GREEN}✅${NC} $SERVICE_NAME (port $SERVICE_PORT) - online"
    else
        echo -e "   ${RED}❌${NC} $SERVICE_NAME (port $SERVICE_PORT) - offline"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# 2. Docker Container'lar
echo -e "${BLUE}2️⃣  Docker Container'lar:${NC}"
DOCKER_SERVICES=("redis" "elasticsearch" "rabbitmq" "prometheus" "grafana")

for service in "${DOCKER_SERVICES[@]}"; do
    if docker ps --format "{{.Names}}" | grep -q "^${service}"; then
        STATUS=$(docker ps --format "{{.Status}}" --filter "name=^${service}$")
        echo -e "   ${GREEN}✅${NC} $service - $STATUS"
    else
        echo -e "   ${RED}❌${NC} $service - not running"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# 3. Nginx
echo -e "${BLUE}3️⃣  Nginx:${NC}"
if systemctl is-active --quiet nginx; then
    if nginx -t 2>&1 | grep -q "successful"; then
        echo -e "   ${GREEN}✅${NC} Nginx is running and config is OK"
    else
        echo -e "   ${RED}❌${NC} Nginx config has errors"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "   ${RED}❌${NC} Nginx is not running"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. SSL
echo -e "${BLUE}4️⃣  SSL Sertifikası:${NC}"
if curl -I https://api.benalsam.com/api/v1/admin/health 2>&1 | grep -q "HTTP"; then
    echo -e "   ${GREEN}✅${NC} SSL certificate is valid"
else
    echo -e "   ${RED}❌${NC} SSL certificate error"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. Health Endpoints
echo -e "${BLUE}5️⃣  Health Endpoints:${NC}"
HEALTH_ENDPOINTS=(
    "admin:https://api.benalsam.com/api/v1/admin/health"
    "elasticsearch:https://api.benalsam.com/api/v1/elasticsearch/health"
    "upload:https://api.benalsam.com/api/v1/upload/health"
    "listings:https://api.benalsam.com/api/v1/listings/health"
    "cache:https://api.benalsam.com/api/v1/cache/health"
    "categories:https://api.benalsam.com/api/v1/categories/health"
    "search:https://api.benalsam.com/api/v1/search/health"
    "realtime:https://api.benalsam.com/api/v1/realtime/health"
)

for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
    SERVICE_NAME=$(echo $endpoint | cut -d: -f1)
    ENDPOINT_URL=$(echo $endpoint | cut -d: -f2-)
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$ENDPOINT_URL" || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        STATUS=$(curl -s "$ENDPOINT_URL" | jq -r '.status // .health // "ok"' 2>/dev/null || echo "ok")
        echo -e "   ${GREEN}✅${NC} $SERVICE_NAME - $STATUS (HTTP $HTTP_CODE)"
    else
        echo -e "   ${RED}❌${NC} $SERVICE_NAME - HTTP $HTTP_CODE"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# 6. CORS
echo -e "${BLUE}6️⃣  CORS:${NC}"
CORS_HEADER=$(curl -s -H "Origin: https://benalsam.vercel.app" -X OPTIONS https://api.benalsam.com/api/v1/admin/health -I | grep -i "access-control-allow-origin" || echo "")
if [ -n "$CORS_HEADER" ]; then
    echo -e "   ${GREEN}✅${NC} CORS configured for Vercel domain"
    echo "      $CORS_HEADER"
else
    echo -e "   ${YELLOW}⚠️${NC}  CORS header not found (may need to check Admin Backend config)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 7. Database Connection
echo -e "${BLUE}7️⃣  Database Connection:${NC}"
DB_STATUS=$(curl -s https://api.benalsam.com/api/v1/admin/health | jq -r '.database // .db // "unknown"' 2>/dev/null || echo "unknown")
if [ "$DB_STATUS" = "healthy" ] || [ "$DB_STATUS" = "connected" ] || [ "$DB_STATUS" = "ok" ]; then
    echo -e "   ${GREEN}✅${NC} Database connection: $DB_STATUS"
else
    echo -e "   ${YELLOW}⚠️${NC}  Database status: $DB_STATUS"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "=================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for Vercel deployment.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  All critical checks passed, but $WARNINGS warning(s) found.${NC}"
    echo -e "${YELLOW}   You can proceed with deployment, but review warnings above.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) found. Please fix before deploying to Vercel.${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}   Also $WARNINGS warning(s) found.${NC}"
    fi
    exit 1
fi

