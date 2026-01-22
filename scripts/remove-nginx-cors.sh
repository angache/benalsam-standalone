#!/bin/bash

# Remove CORS headers from Nginx configuration
# Since services handle CORS, Nginx shouldn't duplicate them

NGINX_CONFIG="/etc/nginx/sites-enabled/benalsam"
BACKUP_DIR="/etc/nginx/sites-enabled/backups"

echo "🔧 Removing CORS headers from Nginx configuration..."
echo "Config file: $NGINX_CONFIG"

# Create backup directory if it doesn't exist
sudo mkdir -p "$BACKUP_DIR"

# Create backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/benalsam.backup.$TIMESTAMP"

echo "📦 Creating backup: $BACKUP_FILE"
sudo cp "$NGINX_CONFIG" "$BACKUP_FILE"

# Remove CORS-related add_header lines
echo "🗑️  Removing CORS headers from Nginx config..."
sudo sed -i '/add_header.*Access-Control-Allow-Origin/d' "$NGINX_CONFIG"
sudo sed -i '/add_header.*Access-Control-Allow-Methods/d' "$NGINX_CONFIG"
sudo sed -i '/add_header.*Access-Control-Allow-Headers/d' "$NGINX_CONFIG"
sudo sed -i '/add_header.*Access-Control-Allow-Credentials/d' "$NGINX_CONFIG"

echo "✅ CORS headers removed from Nginx"
echo "🔄 Reloading Nginx configuration..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Nginx reloaded successfully"
echo "📋 Backup created at: $BACKUP_FILE"

echo ""
echo "🎯 Test CORS now:"
echo "curl -H 'Origin: http://localhost:3000' -v https://api.benalsam.com/api/v1/categories"