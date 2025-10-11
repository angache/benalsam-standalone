#!/bin/bash

# ==============================================================================
# Start All Benalsam Services
# ==============================================================================
# This script starts all Benalsam microservices in the background
# ==============================================================================

echo "🚀 Starting all Benalsam services..."
echo ""

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Define services and their directories
declare -A SERVICES=(
  ["Admin Backend"]="benalsam-admin-backend"
  ["Elasticsearch Service"]="benalsam-elasticsearch-service"
  ["Upload Service"]="benalsam-upload-service"
  ["Listing Service"]="benalsam-listing-service"
  ["Backup Service"]="benalsam-backup-service"
  ["Cache Service"]="benalsam-cache-service"
  ["Categories Service"]="benalsam-categories-service"
  ["Search Service"]="benalsam-search-service"
  ["Realtime Service"]="benalsam-realtime-service"
)

# Start each service
for SERVICE_NAME in "${!SERVICES[@]}"; do
  SERVICE_DIR="${SERVICES[$SERVICE_NAME]}"
  
  if [ -d "$PROJECT_ROOT/$SERVICE_DIR" ]; then
    echo "▶️  Starting $SERVICE_NAME..."
    cd "$PROJECT_ROOT/$SERVICE_DIR"
    
    # Start service in background with nohup
    nohup npm run dev > "/tmp/${SERVICE_DIR}.log" 2>&1 &
    
    echo "   ✅ Started (logs: /tmp/${SERVICE_DIR}.log)"
  else
    echo "   ⚠️  Directory not found: $SERVICE_DIR"
  fi
done

echo ""
echo "✅ All services started!"
echo ""
echo "📝 Useful commands:"
echo "   • View logs: tail -f /tmp/benalsam-[service-name].log"
echo "   • Stop all: ./scripts/kill-all-services.sh"
echo "   • Check health: ./scripts/check-all-health.sh"

