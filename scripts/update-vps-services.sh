#!/bin/bash

# VPS Services Update Script
# Updates all services to use benalsam-shared-types@1.1.6

SERVICES=(
    "benalsam-search-service"
    "benalsam-categories-service"
    "benalsam-upload-service"
    "benalsam-listing-service"
    "benalsam-elasticsearch-service"
    "benalsam-cache-service"
    "benalsam-backup-service"
    "benalsam-admin-backend"
)

echo "================================="
echo "VPS SERVICES UPDATE SCRIPT"
echo "benalsam-shared-types@1.1.6"
echo "================================="

for service in "${SERVICES[@]}"; do
    echo ""
    echo "🔄 Updating $service..."

    # Check if service directory exists
    if [ ! -d "/opt/benalsam/benalsam-standalone/$service" ]; then
        echo "❌ Directory not found: /opt/benalsam/benalsam-standalone/$service"
        continue
    fi

    # Navigate to service directory
    cd "/opt/benalsam/benalsam-standalone/$service" || {
        echo "❌ Failed to cd to $service directory"
        continue
    }

    # Update shared types
    echo "📦 Installing benalsam-shared-types@1.1.6..."
    if npm install benalsam-shared-types@^1.1.6; then
        echo "✅ $service updated successfully"

        # Check if service is running with PM2
        if pm2 describe "$service" > /dev/null 2>&1; then
            echo "🔄 Restarting $service..."
            pm2 restart "$service"
            echo "✅ $service restarted"
        else
            echo "⚠️  $service not found in PM2 (might not be running)"
        fi
    else
        echo "❌ Failed to update $service"
    fi
done

echo ""
echo "================================="
echo "UPDATE COMPLETE"
echo "================================="
echo "Check service logs with: pm2 logs [service-name]"
echo "Monitor services with: pm2 monit"