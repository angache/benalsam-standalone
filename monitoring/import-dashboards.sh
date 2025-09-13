#!/bin/bash

echo "🚀 Grafana Dashboard Import Script"
echo "=================================="

# Grafana API endpoint
GRAFANA_URL="http://localhost:3000"
GRAFANA_USER="admin"
GRAFANA_PASS="admin123"

# Prometheus datasource ekle
echo "📊 Adding Prometheus datasource..."
curl -X POST \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASS" \
  -d '{
    "name": "Prometheus",
    "type": "prometheus",
    "url": "http://prometheus:9090",
    "access": "proxy",
    "isDefault": true
  }' \
  "$GRAFANA_URL/api/datasources"

echo ""
echo "📈 Importing Benalsam System Dashboard..."

# Dashboard import et
curl -X POST \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASS" \
  -d @monitoring/grafana/dashboards/benalsam-system.json \
  "$GRAFANA_URL/api/dashboards/db"

echo ""
echo "✅ Dashboard import completed!"
echo "🌐 Open Grafana: http://localhost:3000"
echo "👤 Username: admin"
echo "🔑 Password: admin123"
