#!/bin/bash

# ==============================================================================
# VPS/LOCAL TOGGLE SCRIPT
# ==============================================================================
# Kullanım: ./scripts/toggle-vps.sh [vps|local]
# Veya: npm run env:vps / npm run env:local
# ==============================================================================

ENV_FILE=".env.local"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE_PATH="$CURRENT_DIR/$ENV_FILE"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if [ ! -f "$ENV_FILE_PATH" ]; then
    echo -e "${YELLOW}⚠️  .env.local dosyası bulunamadı!${NC}"
    exit 1
fi

# Get current value
CURRENT_VALUE=$(grep "^USE_VPS_SERVICES=" "$ENV_FILE_PATH" | cut -d'=' -f2 | tr -d '[:space:]')

# Determine target value
if [ "$1" = "local" ]; then
    TARGET_VALUE="false"
    TARGET_MODE="LOCAL"
elif [ "$1" = "vps" ]; then
    TARGET_VALUE="true"
    TARGET_MODE="VPS"
else
    # Toggle current value
    if [ "$CURRENT_VALUE" = "true" ]; then
        TARGET_VALUE="false"
        TARGET_MODE="LOCAL"
    else
        TARGET_VALUE="true"
        TARGET_MODE="VPS"
    fi
fi

# Update USE_VPS_SERVICES (macOS compatible)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/^USE_VPS_SERVICES=.*/USE_VPS_SERVICES=$TARGET_VALUE/" "$ENV_FILE_PATH"
    sed -i '' "s/^NEXT_PUBLIC_USE_VPS_SERVICES=.*/NEXT_PUBLIC_USE_VPS_SERVICES=$TARGET_VALUE/" "$ENV_FILE_PATH"
else
    # Linux
    sed -i.bak "s/^USE_VPS_SERVICES=.*/USE_VPS_SERVICES=$TARGET_VALUE/" "$ENV_FILE_PATH"
    sed -i.bak "s/^NEXT_PUBLIC_USE_VPS_SERVICES=.*/NEXT_PUBLIC_USE_VPS_SERVICES=$TARGET_VALUE/" "$ENV_FILE_PATH"
    rm -f "$ENV_FILE_PATH.bak"
fi

echo -e "${GREEN}✅ Environment değiştirildi: $TARGET_MODE${NC}"
echo -e "${BLUE}📋 USE_VPS_SERVICES=$TARGET_VALUE${NC}"
echo ""
echo -e "${YELLOW}⚠️  Frontend'i yeniden başlatın: npm run dev${NC}"

