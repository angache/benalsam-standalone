#!/bin/bash

# VPS CORS Fix Script
# Updates benalsam-shared-types and restarts services

SERVICES=(
    "benalsam-search-service"
    "benalsam-categories-service"
    "benalsam-upload-service"
    "benalsam-listing-service"
    "benalsam-admin-backend"
    "benalsam-cache-service"
    "benalsam-backup-service"
    "benalsam-elasticsearch-service"
)

LOG_FILE="/var/log/benalsam-cors-fix.log"
SHARED_TYPES_VERSION="^1.1.6"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "================================="
echo "BENALSAM VPS CORS FIX SCRIPT"
echo "Tarih: $(date)"
echo "================================="
echo ""

for service in "${SERVICES[@]}"; do
    SERVICE_PATH="/opt/benalsam/benalsam-standalone/$service"
    echo "🔧 $service düzeltiliyor..."

    if [ -d "$SERVICE_PATH" ]; then
        cd "$SERVICE_PATH" || { echo "   ❌ Dizine geçilemedi"; continue; }

        echo "   📦 benalsam-shared-types güncelleniyor..."
        npm update benalsam-shared-types@"$SHARED_TYPES_VERSION"

        if [ $? -eq 0 ]; then
            echo "   ✅ Package güncellendi"

            echo "   🚀 $service yeniden başlatılıyor..."
            pm2 restart "$service"

            if [ $? -eq 0 ]; then
                echo "   ✅ $service başarıyla yeniden başlatıldı"
            else
                echo "   ❌ $service yeniden başlatılamadı"
            fi
        else
            echo "   ❌ Package güncellenirken hata"
        fi
    else
        echo "   ❌ $SERVICE_PATH dizini bulunamadı"
    fi

    echo ""
done

echo "================================="
echo "Test Etme:"
echo "================================="
echo ""
echo "Local development'ta test et:"
echo "curl -H 'Origin: http://localhost:3000' -v https://api.benalsam.com/api/v1/categories"
echo ""
echo "Veya browser console'dan:"
echo "fetch('https://api.benalsam.com/api/v1/categories', {"
echo "  method: 'GET',"
echo "  headers: { 'Content-Type': 'application/json' }"
echo "})"
echo ""
echo "Detaylı log için: $LOG_FILE"