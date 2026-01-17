#!/bin/bash

# ==============================================================================
# VPS NODE.JS VE PM2 KURULUM SCRIPT
# ==============================================================================
# Bu script VPS'e Node.js ve PM2 kurar
# Kullanım: ./scripts/vps-setup-nodejs.sh
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 VPS Node.js ve PM2 Kurulum Script${NC}"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Bu script root olarak çalıştırılmalı${NC}"
    echo "Kullanım: sudo ./scripts/vps-setup-nodejs.sh"
    exit 1
fi

# Step 1: System Update
echo -e "${BLUE}Step 1: Sistem güncelleniyor...${NC}"
apt update
apt upgrade -y
echo -e "${GREEN}✅ Sistem güncellendi${NC}"
echo ""

# Step 2: Install Basic Tools
echo -e "${BLUE}Step 2: Temel araçlar kuruluyor...${NC}"
apt install -y curl wget git build-essential
echo -e "${GREEN}✅ Temel araçlar kuruldu${NC}"
echo ""

# Step 3: Check Node.js
echo -e "${BLUE}Step 3: Node.js kontrol ediliyor...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    
    echo "   Mevcut Node.js versiyonu: $NODE_VERSION"
    
    if [ "$NODE_MAJOR_VERSION" -ge 20 ]; then
        echo -e "${GREEN}✅ Node.js versiyonu yeterli (20+)${NC}"
        SKIP_NODE=true
    else
        echo -e "${YELLOW}⚠️  Node.js versiyonu eski (20+ gerekiyor)${NC}"
        SKIP_NODE=false
    fi
else
    echo -e "${YELLOW}⚠️  Node.js bulunamadı${NC}"
    SKIP_NODE=false
fi
echo ""

# Step 4: Install Node.js 20.x
if [ "$SKIP_NODE" != true ]; then
    echo -e "${BLUE}Step 4: Node.js 20.x kuruluyor...${NC}"
    
    # Remove old Node.js if exists
    if command -v node &> /dev/null; then
        echo "   Eski Node.js kaldırılıyor..."
        apt remove -y nodejs npm 2>/dev/null || true
    fi
    
    # Install Node.js 20.x from NodeSource
    echo "   NodeSource repository ekleniyor..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    
    echo "   Node.js kuruluyor..."
    apt install -y nodejs
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    echo -e "${GREEN}✅ Node.js kuruldu${NC}"
    echo "   Node.js: $NODE_VERSION"
    echo "   npm: $NPM_VERSION"
else
    echo -e "${GREEN}Step 4: Node.js zaten yüklü, atlanıyor${NC}"
fi
echo ""

# Step 5: Check PM2
echo -e "${BLUE}Step 5: PM2 kontrol ediliyor...${NC}"
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    echo "   Mevcut PM2 versiyonu: $PM2_VERSION"
    echo -e "${GREEN}✅ PM2 zaten yüklü${NC}"
    SKIP_PM2=true
else
    echo -e "${YELLOW}⚠️  PM2 bulunamadı${NC}"
    SKIP_PM2=false
fi
echo ""

# Step 6: Install PM2
if [ "$SKIP_PM2" != true ]; then
    echo -e "${BLUE}Step 6: PM2 kuruluyor...${NC}"
    npm install -g pm2
    
    # Setup PM2 startup script
    echo "   PM2 startup script kuruluyor..."
    pm2 startup systemd -u root --hp /root
    
    PM2_VERSION=$(pm2 --version)
    echo -e "${GREEN}✅ PM2 kuruldu${NC}"
    echo "   PM2: $PM2_VERSION"
else
    echo -e "${GREEN}Step 6: PM2 zaten yüklü, atlanıyor${NC}"
fi
echo ""

# Step 7: Install Additional Tools
echo -e "${BLUE}Step 7: Ek araçlar kuruluyor...${NC}"

# Install useful npm packages globally
npm install -g typescript ts-node nodemon

echo -e "${GREEN}✅ Ek araçlar kuruldu${NC}"
echo "   TypeScript: $(tsc --version 2>/dev/null || echo 'N/A')"
echo "   ts-node: $(ts-node --version 2>/dev/null || echo 'N/A')"
echo "   nodemon: $(nodemon --version 2>/dev/null || echo 'N/A')"
echo ""

# Step 8: Verify Installation
echo -e "${BLUE}Step 8: Kurulum doğrulanıyor...${NC}"
echo ""

echo "📊 Kurulum Özeti:"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo "   PM2: $(pm2 --version)"
echo ""

# Test PM2
echo "🧪 PM2 test ediliyor..."
pm2 list
echo ""

# Summary
echo -e "${GREEN}✅ Node.js ve PM2 kurulumu tamamlandı!${NC}"
echo ""
echo "📋 Sonraki Adımlar:"
echo "   1. Infrastructure servisleri kur (RabbitMQ, Prometheus, Grafana)"
echo "   2. Microservice'leri deploy et"
echo "   3. PM2 ile servisleri başlat"
echo ""
echo "💡 Yararlı Komutlar:"
echo "   pm2 list                    # Çalışan servisleri listele"
echo "   pm2 logs                    # Tüm logları göster"
echo "   pm2 monit                   # PM2 monitor"
echo "   pm2 save                    # PM2 durumunu kaydet"
echo "   pm2 startup                 # Startup script'i yeniden kur"
echo ""

