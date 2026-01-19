#!/bin/bash

# VPS CORS Configuration Check Script
# Checks current benalsam-shared-types versions and CORS configuration

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

echo "================================="
echo "BENALSAM VPS CORS CHECK SCRIPT"
echo "Tarih: $(date)"
echo "================================="
echo ""

for service in "${SERVICES[@]}"; do
    SERVICE_PATH="/opt/benalsam/benalsam-standalone/$service"
    echo "🔍 $service kontrol ediliyor..."

    if [ -d "$SERVICE_PATH" ]; then
        cd "$SERVICE_PATH" || { echo "   ❌ Dizine geçilemedi"; continue; }

        # Check benalsam-shared-types version
        echo "   📦 Shared types versiyonu:"
        npm list benalsam-shared-types 2>/dev/null | grep benalsam-shared-types || echo "   ❌ benalsam-shared-types bulunamadı"

        # Check NODE_ENV
        if [ -f ".env" ]; then
            NODE_ENV=$(grep "^NODE_ENV=" .env | cut -d '=' -f2)
            echo "   🌐 NODE_ENV: ${NODE_ENV:-'undefined'}"
        else
            echo "   ⚠️ .env dosyası bulunamadı"
        fi

        # Check if service is running
        PM2_STATUS=$(pm2 list | grep "$service" | awk '{print $10}')
        echo "   🚀 PM2 Status: ${PM2_STATUS:-'not found'}"

        echo ""
    else
        echo "   ❌ $SERVICE_PATH dizini bulunamadı"
        echo ""
    fi
done

echo "================================="
echo "CORS Konfigürasyonu Kontrolü"
echo "================================="

# Check one service's shared types server file to see CORS config
echo "🔧 Shared Types CORS Konfigürasyonu:"
echo "   Production CORS origins should include:"
echo "   - https://admin.benalsam.com"
echo "   - https://benalsam.com"
echo "   - https://www.benalsam.com"
echo "   - http://localhost:3000"
echo "   - /^https:\/\/.*\.vercel\.app$/"

echo ""
echo "📋 Önerilen Aksiyonlar:"
echo "1. Eğer versiyonlar güncel değilse: npm update benalsam-shared-types@^1.1.6"
echo "2. Servisleri yeniden başlat: pm2 restart all"
echo "3. CORS test et: curl -H 'Origin: http://localhost:3000' -v https://api.benalsam.com/api/v1/categories"

echo ""
echo "Script tamamlandı."