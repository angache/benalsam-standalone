#!/bin/bash

# ==============================================================================
# Check All Benalsam Services Health
# ==============================================================================
# This script checks the health status of all Benalsam microservices
# ==============================================================================

echo "🏥 Checking health of all Benalsam services..."
echo ""

# Define services with their ports
SERVICES="Admin-Backend:3002 Elasticsearch-Service:3006 Upload-Service:3007 Listing-Service:3008 Backup-Service:3013 Cache-Service:3014 Categories-Service:3015 Search-Service:3016 Realtime-Service:3019"

HEALTHY=0
UNHEALTHY=0

# Check each service
for SERVICE_INFO in $SERVICES; do
  SERVICE_NAME=$(echo $SERVICE_INFO | cut -d: -f1)
  PORT=$(echo $SERVICE_INFO | cut -d: -f2)
  URL="http://localhost:$PORT/api/v1/health"
  
  # Make request with timeout
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "$URL" 2>/dev/null)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ $SERVICE_NAME (port $PORT) - Healthy"
    HEALTHY=$((HEALTHY + 1))
  else
    echo "❌ $SERVICE_NAME (port $PORT) - Unhealthy (HTTP $HTTP_CODE)"
    UNHEALTHY=$((UNHEALTHY + 1))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "   ✅ Healthy: $HEALTHY"
echo "   ❌ Unhealthy: $UNHEALTHY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $UNHEALTHY -eq 0 ]; then
  echo "🎉 All services are healthy!"
  exit 0
else
  echo "⚠️  Some services are unhealthy. Check logs for details."
  exit 1
fi

