#!/bin/bash

# ==============================================================================
# VPS QUICK CHECK - Vercel Deployment Öncesi Hızlı Kontrol
# ==============================================================================
# Bu script VPS'de çalıştırılmalıdır
# Kullanım: ssh root@46.62.212.96 "bash -s" < scripts/vps-quick-check.sh
# Veya: VPS'de direkt çalıştır: ./vps-quick-check.sh
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 VPS Quick Check - Vercel Deployment Öncesi${NC}"
echo "=============================================="
echo ""

ERRORS=0

# 1. PM2 Servisler
echo -e "${BLUE}1️⃣  PM2 Servisler:${NC}"
if command -v pm2 &> /dev/null; then
    PM2_COUNT=$(pm2 list | grep "benalsam-" | grep "online" | wc -l)
    PM2_TOTAL=$(pm2 list | grep "benalsam-" | wc -l)
    
    if [ "$PM2_COUNT" -eq "$PM2_TOTAL" ] && [ "$PM2_TOTAL" -gt 0 ]; then
        echo -e "   ${GREEN}✅${NC} Tüm servisler online ($PM2_COUNT/$PM2_TOTAL)"
        pm2 list | grep "benalsam-" | awk '{print "      - " $2 " (" $10 ")"}'
    else
        echo -e "   ${RED}❌${NC} Bazı servisler offline ($PM2_COUNT/$PM2_TOTAL)"
        pm2 list | grep "benalsam-" | grep -v "online" | awk '{print "      ❌ " $2 " (" $10 ")"}'
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "   ${RED}❌${NC} PM2 bulunamadı"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Docker Container'lar
echo -e "${BLUE}2️⃣  Docker Container'lar:${NC}"
if command -v docker &> /dev/null; then
    DOCKER_COUNT=$(docker ps --format "{{.Names}}" | grep -E "redis|elasticsearch|rabbitmq|prometheus|grafana" | wc -l)
    
    if [ "$DOCKER_COUNT" -ge 3 ]; then
        echo -e "   ${GREEN}✅${NC} Container'lar çalışıyor ($DOCKER_COUNT/5)"
        docker ps --format "      - {{.Names}} ({{.Status}})" | grep -E "redis|elasticsearch|rabbitmq|prometheus|grafana"
    else
        echo -e "   ${RED}❌${NC} Bazı container'lar çalışmıyor ($DOCKER_COUNT/5)"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "   ${RED}❌${NC} Docker bulunamadı"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 3. Nginx
echo -e "${BLUE}3️⃣  Nginx:${NC}"
if systemctl is-active --quiet nginx 2>/dev/null; then
    if nginx -t 2>&1 | grep -q "successful"; then
        echo -e "   ${GREEN}✅${NC} Nginx çalışıyor ve config OK"
    else
        echo -e "   ${RED}❌${NC} Nginx config hatası"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "   ${RED}❌${NC} Nginx çalışmıyor"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. SSL & Health Endpoint
echo -e "${BLUE}4️⃣  SSL & Health Endpoints:${NC}"
HEALTH_URL="https://api.benalsam.com/api/v1/admin/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅${NC} SSL çalışıyor ve Admin Backend erişilebilir (HTTP $HTTP_CODE)"
else
    echo -e "   ${RED}❌${NC} SSL veya Admin Backend erişilemiyor (HTTP $HTTP_CODE)"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. CORS
echo -e "${BLUE}5️⃣  CORS:${NC}"
CORS_HEADER=$(curl -s -H "Origin: https://benalsam.vercel.app" -X OPTIONS "$HEALTH_URL" -I --max-time 5 2>/dev/null | grep -i "access-control-allow-origin" || echo "")
if [ -n "$CORS_HEADER" ]; then
    echo -e "   ${GREEN}✅${NC} CORS yapılandırılmış"
    echo "      $CORS_HEADER"
else
    echo -e "   ${YELLOW}⚠️${NC}  CORS header bulunamadı (kontrol edilmeli)"
fi
echo ""

# Summary
echo "=============================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Tüm kritik kontroller başarılı! Vercel'e deploy edilebilir.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS hata bulundu. Lütfen önce düzeltin.${NC}"
    exit 1
fi

