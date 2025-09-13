#!/bin/bash

echo "🚀 Starting Benalsam Monitoring Stack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create monitoring network
echo "📡 Creating monitoring network..."
docker network create monitoring 2>/dev/null || true

# Start monitoring stack
echo "🐳 Starting monitoring containers..."
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "🔍 Checking service status..."

services=("prometheus:9090" "grafana:3000" "alertmanager:9093" "loki:3100")
for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -s "http://localhost:$port" > /dev/null; then
        echo "✅ $name is running on port $port"
    else
        echo "❌ $name is not responding on port $port"
    fi
done

echo ""
echo "🎉 Monitoring stack is ready!"
echo ""
echo "📊 Access URLs:"
echo "  Grafana:      http://localhost:3000 (admin/admin123)"
echo "  Prometheus:   http://localhost:9090"
echo "  AlertManager: http://localhost:9093"
echo "  Loki:         http://localhost:3100"
echo ""
echo "🔧 To stop monitoring:"
echo "  docker-compose -f docker-compose.monitoring.yml down"
echo ""
echo "📈 To view logs:"
echo "  docker-compose -f docker-compose.monitoring.yml logs -f"
