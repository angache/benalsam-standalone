#!/bin/bash

# ==============================================================================
# Environment Switch Script
# ==============================================================================
# Bu script .env.local ve .env.vps dosyaları arasında geçiş yapar
# Kullanım:
#   ./scripts/switch-env.sh local   -> .env.local.example -> .env.local
#   ./scripts/switch-env.sh vps      -> .env.vps -> .env.local
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check argument
if [ $# -lt 1 ]; then
    echo -e "${RED}❌ Kullanım: $0 <local|vps>${NC}"
    echo ""
    echo "Örnekler:"
    echo "  $0 local  -> Localhost servisleri kullan"
    echo "  $0 vps    -> VPS servisleri kullan"
    exit 1
fi

ENV_TYPE=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_LOCAL="$PROJECT_ROOT/.env.local"
ENV_VPS="$PROJECT_ROOT/.env.vps"
ENV_LOCAL_EXAMPLE="$PROJECT_ROOT/.env.local.example"

echo -e "${BLUE}🔄 Environment Switch: $ENV_TYPE${NC}"
echo ""

# Check if source file exists
if [ "$ENV_TYPE" = "local" ]; then
    SOURCE_FILE="$ENV_LOCAL_EXAMPLE"
    if [ ! -f "$SOURCE_FILE" ]; then
        echo -e "${RED}❌ $SOURCE_FILE dosyası bulunamadı${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Local environment aktif ediliyor...${NC}"
elif [ "$ENV_TYPE" = "vps" ]; then
    SOURCE_FILE="$ENV_VPS"
    if [ ! -f "$SOURCE_FILE" ]; then
        echo -e "${RED}❌ $SOURCE_FILE dosyası bulunamadı${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ VPS environment aktif ediliyor...${NC}"
else
    echo -e "${RED}❌ Geçersiz environment tipi: $ENV_TYPE${NC}"
    echo "Geçerli değerler: local, vps"
    exit 1
fi

# Backup existing .env.local if exists
if [ -f "$ENV_LOCAL" ]; then
    BACKUP_FILE="$ENV_LOCAL.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$ENV_LOCAL" "$BACKUP_FILE"
    echo -e "${YELLOW}⚠️  Mevcut .env.local yedeklendi: $BACKUP_FILE${NC}"
fi

# Copy source to .env.local
cp "$SOURCE_FILE" "$ENV_LOCAL"
echo -e "${GREEN}✅ .env.local dosyası güncellendi${NC}"
echo ""

# Show summary
if [ "$ENV_TYPE" = "local" ]; then
    echo -e "${BLUE}📋 Local Environment Aktif:${NC}"
    echo "   - Servisler: localhost (3002, 3007, 3008, 3015, 3016)"
    echo "   - USE_VPS_SERVICES=false"
elif [ "$ENV_TYPE" = "vps" ]; then
    echo -e "${BLUE}📋 VPS Environment Aktif:${NC}"
    echo "   - Servisler: https://api.benalsam.com"
    echo "   - USE_VPS_SERVICES=true"
fi

echo ""
echo -e "${GREEN}✅ Environment switch tamamlandı!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Frontend'i yeniden başlatın: npm run dev${NC}"

