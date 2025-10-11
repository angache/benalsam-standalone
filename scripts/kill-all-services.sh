#!/bin/bash

# ==============================================================================
# Kill All Benalsam Services
# ==============================================================================
# This script kills all running Benalsam microservices by their ports
# ==============================================================================

echo "🛑 Stopping all Benalsam services..."
echo ""

# Define all service ports
PORTS=(
  3002  # Admin Backend
  3006  # Elasticsearch Service
  3007  # Upload Service
  3008  # Listing Service
  3013  # Backup Service
  3014  # Cache Service
  3015  # Categories Service
  3016  # Search Service
  3019  # Realtime Service
)

# Kill each port
for PORT in "${PORTS[@]}"; do
  PID=$(lsof -ti:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    kill -9 $PID 2>/dev/null
    echo "✅ Port $PORT killed (PID: $PID)"
  else
    echo "⚪ Port $PORT - no process running"
  fi
done

echo ""
echo "✅ All services stopped!"
echo ""
echo "📝 To start services again, run:"
echo "   cd benalsam-[service-name] && npm run dev"

