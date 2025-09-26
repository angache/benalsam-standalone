#!/bin/bash

# Benalsam Grafana Dashboard Setup Script

echo "🚀 Setting up Benalsam Grafana Dashboard..."

# Grafana configuration
GRAFANA_URL="http://localhost:3000"
GRAFANA_USER="admin"
GRAFANA_PASSWORD="admin123"  # Change this in production

# Wait for Grafana to be ready
echo "⏳ Waiting for Grafana to be ready..."
until curl -s "$GRAFANA_URL/api/health" > /dev/null; do
    echo "Waiting for Grafana..."
    sleep 5
done

echo "✅ Grafana is ready!"

# Create Prometheus data source
echo "📊 Creating Prometheus data source..."
curl -X POST \
  "$GRAFANA_URL/api/datasources" \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d '{
    "name": "Prometheus",
    "type": "prometheus",
    "url": "http://prometheus:9090",
    "access": "proxy",
    "isDefault": true
  }' > /dev/null

echo "✅ Prometheus data source created!"

# Import dashboard
echo "📈 Importing Benalsam dashboard..."
curl -X POST \
  "$GRAFANA_URL/api/dashboards/db" \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d @grafana-dashboard.json > /dev/null

echo "✅ Dashboard imported!"

# Create alert channels
echo "🔔 Setting up alert channels..."

# Email alert channel
curl -X POST \
  "$GRAFANA_URL/api/alert-notifications" \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d '{
    "name": "Email Alerts",
    "type": "email",
    "settings": {
      "addresses": "admin@benalsam.com",
      "subject": "Benalsam Alert: {{ .GroupLabels.alertname }}"
    }
  }' > /dev/null

# Slack alert channel (optional)
curl -X POST \
  "$GRAFANA_URL/api/alert-notifications" \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d '{
    "name": "Slack Alerts",
    "type": "slack",
    "settings": {
      "url": "YOUR_SLACK_WEBHOOK_URL",
      "channel": "#alerts",
      "title": "Benalsam Alert",
      "text": "{{ .GroupLabels.alertname }}: {{ .CommonAnnotations.summary }}"
    }
  }' > /dev/null

echo "✅ Alert channels configured!"

# Create user (optional)
echo "👤 Creating monitoring user..."
curl -X POST \
  "$GRAFANA_URL/api/admin/users" \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d '{
    "name": "Benalsam Monitor",
    "email": "monitor@benalsam.com",
    "login": "monitor",
    "password": "monitor123",
    "OrgId": 1
  }' > /dev/null

echo "✅ Monitoring user created!"

echo ""
echo "🎉 Grafana setup completed!"
echo ""
echo "📊 Access your dashboard:"
echo "   URL: $GRAFANA_URL"
echo "   Username: $GRAFANA_USER"
echo "   Password: $GRAFANA_PASSWORD"
echo ""
echo "📈 Dashboard: Benalsam Microservices Monitoring"
echo "🔔 Alerts: Configured for critical issues"
echo "📊 Data Source: Prometheus (http://prometheus:9090)"
echo ""
echo "🔧 Next steps:"
echo "   1. Update alert notification settings"
echo "   2. Customize dashboard panels"
echo "   3. Set up additional alert rules"
echo "   4. Configure user permissions"
echo ""
