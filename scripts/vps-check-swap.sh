#!/bin/bash

# ==============================================================================
# VPS SWAP DURUMU KONTROL SCRIPT
# ==============================================================================
# Bu script VPS'teki mevcut swap durumunu gösterir
# Kullanım: ./scripts/vps-check-swap.sh
# ==============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 VPS Swap Durumu Kontrolü${NC}"
echo "=================================="
echo ""

# Check if running as root (optional, but some commands work better as root)
if [ "$EUID" -eq 0 ]; then
    ROOT_MODE=true
else
    ROOT_MODE=false
fi

# 1. Check active swap
echo -e "${BLUE}1. Aktif Swap Durumu:${NC}"
if swapon --show 2>/dev/null | grep -q .; then
    echo -e "${GREEN}✅ Swap aktif${NC}"
    echo ""
    swapon --show
    echo ""
    
    # Calculate total swap
    TOTAL_SWAP=$(swapon --show --bytes | awk 'NR>1 {sum+=$4} END {print sum}')
    if [ -n "$TOTAL_SWAP" ]; then
        TOTAL_SWAP_GB=$(echo "scale=2; $TOTAL_SWAP / 1024 / 1024 / 1024" | bc)
        echo "   Toplam Swap: ${TOTAL_SWAP_GB} GB"
    fi
else
    echo -e "${RED}❌ Aktif swap bulunamadı${NC}"
fi
echo ""

# 2. Check swap usage
echo -e "${BLUE}2. Swap Kullanımı:${NC}"
echo ""
free -h
echo ""

# 3. Check swap files
echo -e "${BLUE}3. Swap Dosyaları:${NC}"
SWAP_FILES=$(find / -name "swapfile" -o -name "*.swap" 2>/dev/null | head -5)
if [ -n "$SWAP_FILES" ]; then
    echo -e "${GREEN}✅ Swap dosyaları bulundu:${NC}"
    for file in $SWAP_FILES; do
        if [ -f "$file" ]; then
            SIZE=$(du -h "$file" | cut -f1)
            PERMS=$(stat -c "%a %U:%G" "$file" 2>/dev/null || stat -f "%OLp %Su:%Sg" "$file" 2>/dev/null)
            echo "   📄 $file"
            echo "      Boyut: $SIZE"
            echo "      İzinler: $PERMS"
        fi
    done
else
    echo -e "${YELLOW}⚠️  Swap dosyası bulunamadı${NC}"
fi
echo ""

# 4. Check fstab for swap entries
echo -e "${BLUE}4. /etc/fstab Swap Kayıtları:${NC}"
if grep -q "swap" /etc/fstab 2>/dev/null; then
    echo -e "${GREEN}✅ /etc/fstab'da swap kayıtları var:${NC}"
    grep "swap" /etc/fstab | grep -v "^#"
else
    echo -e "${YELLOW}⚠️  /etc/fstab'da swap kaydı yok${NC}"
fi
echo ""

# 5. Check swap partitions
echo -e "${BLUE}5. Swap Partition'ları:${NC}"
if [ "$ROOT_MODE" = true ]; then
    SWAP_PARTITIONS=$(blkid | grep -i swap || true)
    if [ -n "$SWAP_PARTITIONS" ]; then
        echo -e "${GREEN}✅ Swap partition'ları bulundu:${NC}"
        echo "$SWAP_PARTITIONS"
    else
        echo -e "${YELLOW}⚠️  Swap partition bulunamadı${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Root yetkisi gerekiyor (partition kontrolü için)${NC}"
fi
echo ""

# 6. Check swap settings
echo -e "${BLUE}6. Swap Ayarları:${NC}"
SWAPPINESS=$(sysctl vm.swappiness 2>/dev/null | cut -d' ' -f3)
CACHE_PRESSURE=$(sysctl vm.vfs_cache_pressure 2>/dev/null | cut -d' ' -f3)

if [ -n "$SWAPPINESS" ]; then
    echo "   Swappiness: $SWAPPINESS"
    if [ "$SWAPPINESS" -gt 20 ]; then
        echo -e "   ${YELLOW}⚠️  Yüksek swappiness (önerilen: 10-20)${NC}"
    else
        echo -e "   ${GREEN}✅ İyi swappiness değeri${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Swappiness değeri bulunamadı${NC}"
fi

if [ -n "$CACHE_PRESSURE" ]; then
    echo "   Cache Pressure: $CACHE_PRESSURE"
    if [ "$CACHE_PRESSURE" -gt 100 ]; then
        echo -e "   ${YELLOW}⚠️  Yüksek cache pressure (önerilen: 50-60)${NC}"
    else
        echo -e "   ${GREEN}✅ İyi cache pressure değeri${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Cache pressure değeri bulunamadı${NC}"
fi
echo ""

# 7. Summary
echo -e "${BLUE}📋 Özet:${NC}"
echo ""

# Get memory info
TOTAL_MEM=$(free -h | awk '/^Mem:/ {print $2}')
USED_MEM=$(free -h | awk '/^Mem:/ {print $3}')
AVAIL_MEM=$(free -h | awk '/^Mem:/ {print $7}')

TOTAL_SWAP=$(free -h | awk '/^Swap:/ {print $2}')
USED_SWAP=$(free -h | awk '/^Swap:/ {print $3}')
FREE_SWAP=$(free -h | awk '/^Swap:/ {print $4}')

echo "💾 Memory:"
echo "   Toplam: $TOTAL_MEM"
echo "   Kullanılan: $USED_MEM"
echo "   Kullanılabilir: $AVAIL_MEM"
echo ""

if [ "$TOTAL_SWAP" != "0B" ] && [ -n "$TOTAL_SWAP" ]; then
    echo "💾 Swap:"
    echo "   Toplam: $TOTAL_SWAP"
    echo "   Kullanılan: $USED_SWAP"
    echo "   Boş: $FREE_SWAP"
    
    # Calculate swap usage percentage
    if [ "$TOTAL_SWAP" != "0B" ]; then
        echo -e "   ${GREEN}✅ Swap mevcut${NC}"
    fi
else
    echo "💾 Swap:"
    echo -e "   ${RED}❌ Swap yok${NC}"
    echo ""
    echo "💡 Swap eklemek için:"
    echo "   sudo ./scripts/vps-add-swap.sh 4"
fi
echo ""

