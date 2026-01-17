#!/bin/bash

# ==============================================================================
# SWITCH TO VPS SCRIPT
# ==============================================================================
# Bu script local servisleri durdurur ve VPS kullanımını aktif eder
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 VPS'e Geçiş${NC}"
echo "=================================="
echo ""

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_NEXT_DIR="$PROJECT_ROOT/benalsam-web-next"

# Step 1: Stop local services
echo -e "${BLUE}1️⃣  Local servisleri durduruluyor...${NC}"
if [ -f "$SCRIPT_DIR/local-services-stop.sh" ]; then
    bash "$SCRIPT_DIR/local-services-stop.sh"
else
    echo -e "${YELLOW}⚠️${NC}  local-services-stop.sh bulunamadı, manuel durdurun"
fi
echo ""

# Step 2: Set environment variables
echo -e "${BLUE}2️⃣  Environment variables ayarlanıyor...${NC}"
ENV_FILE="$WEB_NEXT_DIR/.env.local"

# Create .env.local if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
    echo -e "${GREEN}✅${NC}  .env.local dosyası oluşturuldu"
fi

# Remove existing USE_VPS_SERVICES entries
sed -i '' '/USE_VPS_SERVICES/d' "$ENV_FILE" 2>/dev/null || sed -i '/USE_VPS_SERVICES/d' "$ENV_FILE" 2>/dev/null || true

# Add VPS settings
echo "USE_VPS_SERVICES=true" >> "$ENV_FILE"
echo "NEXT_PUBLIC_USE_VPS_SERVICES=true" >> "$ENV_FILE"

echo -e "${GREEN}✅${NC}  Environment variables eklendi"
echo "   USE_VPS_SERVICES=true"
echo "   NEXT_PUBLIC_USE_VPS_SERVICES=true"
echo ""

# Step 3: Summary
echo "=================================="
echo -e "${GREEN}✅ VPS'e geçiş tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📋 Sonraki Adımlar:${NC}"
echo "   1. Frontend'i yeniden başlatın:"
echo "      cd benalsam-web-next && npm run dev"
echo ""
echo "   2. VPS servislerini kontrol edin:"
echo "      curl https://api.benalsam.com/api/v1/admin/health"
echo ""
echo -e "${YELLOW}💡 Not:${NC} Local'e geri dönmek için:"
echo "   ./scripts/switch-to-local.sh"

