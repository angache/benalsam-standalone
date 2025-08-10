#!/bin/bash

# ===== CLEAN DOCKER DEPLOYMENT SCRIPT =====

set -e

echo "🚀 Benalsam Clean Docker Deployment"
echo "==================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please run ./scripts/setup-env.sh first"
    exit 1
fi

print_status "Starting clean deployment..."

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.clean.yml down --remove-orphans

# Clean up old images
print_status "Cleaning up old images..."
docker system prune -f

# Build and start services
print_status "Building and starting services..."
docker-compose -f docker-compose.clean.yml up -d --build

# Wait for services to start
print_status "Waiting for services to start..."
sleep 60

# Check service health
print_status "Checking service health..."

# Check admin-backend
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    print_status "✅ Admin Backend is healthy"
else
    print_error "❌ Admin Backend health check failed"
    docker-compose -f docker-compose.clean.yml logs admin-backend
    exit 1
fi

# Check admin-ui
if curl -f http://localhost:3003/ > /dev/null 2>&1; then
    print_status "✅ Admin UI is running"
else
    print_error "❌ Admin UI health check failed"
    docker-compose -f docker-compose.clean.yml logs admin-ui
    exit 1
fi

# Check web
if curl -f http://localhost:5173/ > /dev/null 2>&1; then
    print_status "✅ Web App is running"
else
    print_error "❌ Web App health check failed"
    docker-compose -f docker-compose.clean.yml logs web
    exit 1
fi

# Check Elasticsearch
if curl -f http://localhost:9200/ > /dev/null 2>&1; then
    print_status "✅ Elasticsearch is running"
else
    print_error "❌ Elasticsearch health check failed"
    docker-compose -f docker-compose.clean.yml logs elasticsearch
    exit 1
fi

# Check Redis
if docker-compose -f docker-compose.clean.yml exec redis redis-cli ping > /dev/null 2>&1; then
    print_status "✅ Redis is running"
else
    print_error "❌ Redis health check failed"
    docker-compose -f docker-compose.clean.yml logs redis
    exit 1
fi

# Show running containers
print_status "Current container status:"
docker-compose -f docker-compose.clean.yml ps

print_status "🎉 Clean deployment completed successfully!"
print_status "Services are now running:"
echo "  - Admin Backend: http://localhost:3002"
echo "  - Admin UI: http://localhost:3003"
echo "  - Web App: http://localhost:5173"
echo "  - Elasticsearch: http://localhost:9200"
echo "  - Redis: localhost:6379" 