#!/bin/bash

# ==============================================================================
# VPS SWAP EKLEME SCRIPT
# ==============================================================================
# Bu script VPS'e swap ekler (2-4 GB önerilir)
# Kullanım: ./scripts/vps-add-swap.sh [SIZE_IN_GB]
# Örnek: ./scripts/vps-add-swap.sh 4
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SWAP_SIZE_GB=${1:-4}  # Default: 4 GB
SWAP_FILE="/swapfile"
SWAP_SIZE_MB=$((SWAP_SIZE_GB * 1024))

echo -e "${BLUE}🔧 VPS Swap Ekleme Script${NC}"
echo "=================================="
echo ""
echo "📋 Yapılacaklar:"
echo "   Swap Boyutu: ${SWAP_SIZE_GB} GB (${SWAP_SIZE_MB} MB)"
echo "   Swap Dosyası: ${SWAP_FILE}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Bu script root olarak çalıştırılmalı${NC}"
    echo "Kullanım: sudo ./scripts/vps-add-swap.sh [SIZE_IN_GB]"
    exit 1
fi

# Check if swap already exists
if [ -f "$SWAP_FILE" ] || swapon --show | grep -q "$SWAP_FILE"; then
    echo -e "${YELLOW}⚠️  Swap dosyası zaten mevcut${NC}"
    echo ""
    echo "Mevcut swap durumu:"
    swapon --show
    echo ""
    read -p "Mevcut swap'i kaldırıp yeniden oluşturmak ister misiniz? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}İşlem iptal edildi${NC}"
        exit 0
    fi
    
    # Remove existing swap
    echo -e "${YELLOW}Mevcut swap kaldırılıyor...${NC}"
    swapoff "$SWAP_FILE" 2>/dev/null || true
    sed -i "\|$SWAP_FILE|d" /etc/fstab
    rm -f "$SWAP_FILE"
    echo -e "${GREEN}✅ Mevcut swap kaldırıldı${NC}"
    echo ""
fi

# Check available disk space
AVAILABLE_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt "$SWAP_SIZE_GB" ]; then
    echo -e "${RED}❌ Yetersiz disk alanı${NC}"
    echo "   Gereken: ${SWAP_SIZE_GB} GB"
    echo "   Mevcut: ${AVAILABLE_SPACE} GB"
    exit 1
fi

echo -e "${GREEN}✅ Disk alanı yeterli (${AVAILABLE_SPACE} GB mevcut)${NC}"
echo ""

# Step 1: Create swap file
echo -e "${BLUE}Step 1: Swap dosyası oluşturuluyor...${NC}"
echo "   Boyut: ${SWAP_SIZE_MB} MB"
echo "   Bu işlem birkaç dakika sürebilir..."

# Use fallocate (faster) or dd (more compatible)
if command -v fallocate &> /dev/null; then
    fallocate -l "${SWAP_SIZE_MB}M" "$SWAP_FILE"
else
    dd if=/dev/zero of="$SWAP_FILE" bs=1M count="$SWAP_SIZE_MB" status=progress
fi

# Set correct permissions
chmod 600 "$SWAP_FILE"
echo -e "${GREEN}✅ Swap dosyası oluşturuldu${NC}"
echo ""

# Step 2: Format as swap
echo -e "${BLUE}Step 2: Swap formatlanıyor...${NC}"
mkswap "$SWAP_FILE"
echo -e "${GREEN}✅ Swap formatlandı${NC}"
echo ""

# Step 3: Enable swap
echo -e "${BLUE}Step 3: Swap etkinleştiriliyor...${NC}"
swapon "$SWAP_FILE"
echo -e "${GREEN}✅ Swap etkinleştirildi${NC}"
echo ""

# Step 4: Add to fstab for persistence
echo -e "${BLUE}Step 4: Swap kalıcı hale getiriliyor...${NC}"
if ! grep -q "$SWAP_FILE" /etc/fstab; then
    echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
    echo -e "${GREEN}✅ Swap /etc/fstab'a eklendi${NC}"
else
    echo -e "${YELLOW}⚠️  Swap zaten /etc/fstab'da${NC}"
fi
echo ""

# Step 5: Optimize swap settings
echo -e "${BLUE}Step 5: Swap ayarları optimize ediliyor...${NC}"

# Swappiness (0-100): How aggressively the kernel swaps
# Default: 60, Recommended for servers: 10-20
SWAPPINESS=10

# Update sysctl
if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
    echo "vm.swappiness=$SWAPPINESS" >> /etc/sysctl.conf
else
    sed -i "s/vm.swappiness=.*/vm.swappiness=$SWAPPINESS/" /etc/sysctl.conf
fi

# Apply immediately
sysctl vm.swappiness=$SWAPPINESS

# Cache pressure (0-100): How aggressively the kernel reclaims cache
# Default: 100, Recommended: 50-60
CACHE_PRESSURE=50

if ! grep -q "vm.vfs_cache_pressure" /etc/sysctl.conf; then
    echo "vm.vfs_cache_pressure=$CACHE_PRESSURE" >> /etc/sysctl.conf
else
    sed -i "s/vm.vfs_cache_pressure=.*/vm.vfs_cache_pressure=$CACHE_PRESSURE/" /etc/sysctl.conf
fi

sysctl vm.vfs_cache_pressure=$CACHE_PRESSURE

echo -e "${GREEN}✅ Swap ayarları optimize edildi${NC}"
echo "   Swappiness: $SWAPPINESS (düşük = daha az swap kullanımı)"
echo "   Cache Pressure: $CACHE_PRESSURE"
echo ""

# Step 6: Verify
echo -e "${BLUE}Step 6: Swap durumu kontrol ediliyor...${NC}"
echo ""
echo "📊 Swap Durumu:"
swapon --show
echo ""
echo "💾 Memory Durumu:"
free -h
echo ""

# Summary
echo -e "${GREEN}✅ Swap başarıyla eklendi!${NC}"
echo ""
echo "📋 Özet:"
echo "   Swap Boyutu: ${SWAP_SIZE_GB} GB"
echo "   Swap Dosyası: ${SWAP_FILE}"
echo "   Swappiness: $SWAPPINESS"
echo "   Cache Pressure: $CACHE_PRESSURE"
echo ""
echo "💡 Notlar:"
echo "   - Swap otomatik olarak başlatılacak (kalıcı)"
echo "   - Swappiness düşük tutuldu (RAM öncelikli)"
echo "   - Sistem yeniden başlatıldığında swap aktif kalacak"
echo ""

