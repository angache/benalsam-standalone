#!/bin/bash

# ==============================================================================
# BENALSAM VPS DEPLOYMENT SCRIPT
# ==============================================================================
# This script deploys all Benalsam services to VPS
# Usage: ./scripts/vps-deploy.sh
# ==============================================================================

set -e

echo "🚀 Benalsam VPS Deployment Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="${VPS_IP:-46.62.212.46}"
VPS_USER="${VPS_USER:-root}"
DEPLOY_DIR="/opt/benalsam"
PROJECT_NAME="benalsam-standalone"

# Check if running on VPS
if [ "$(hostname)" != "CAX21" ] && [ -z "$FORCE_DEPLOY" ]; then
    echo -e "${YELLOW}⚠️  This script should be run on VPS${NC}"
    echo "Set FORCE_DEPLOY=1 to continue anyway"
    exit 1
fi

echo "📋 Deployment Configuration:"
echo "   VPS IP: $VPS_IP"
echo "   Deploy Directory: $DEPLOY_DIR"
echo ""

# Step 1: System Update
echo -e "${GREEN}Step 1: System Update${NC}"
sudo apt update && sudo apt upgrade -y
echo "✅ System updated"
echo ""

# Step 2: Install Dependencies
echo -e "${GREEN}Step 2: Installing Dependencies${NC}"

# Node.js 20.x
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "✅ Node.js $(node --version) installed"

# Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi
echo "✅ Docker $(docker --version) installed"

# Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi
echo "✅ Docker Compose $(docker-compose --version) installed"

# PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi
echo "✅ PM2 $(pm2 --version) installed"

# Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt install -y nginx
fi
echo "✅ Nginx installed"
echo ""

# Step 3: Create Directory Structure
echo -e "${GREEN}Step 3: Creating Directory Structure${NC}"
sudo mkdir -p $DEPLOY_DIR
sudo mkdir -p $DEPLOY_DIR/infrastructure
sudo mkdir -p $DEPLOY_DIR/services
sudo mkdir -p $DEPLOY_DIR/logs
sudo mkdir -p $DEPLOY_DIR/config
sudo chown -R $USER:$USER $DEPLOY_DIR
echo "✅ Directory structure created"
echo ""

# Step 4: Setup Infrastructure (Docker)
echo -e "${GREEN}Step 4: Setting up Infrastructure${NC}"
cd $DEPLOY_DIR/infrastructure

# Copy docker-compose.yml
if [ -f "$(dirname $0)/../benalsam-infrastructure/docker-compose.yml" ]; then
    cp "$(dirname $0)/../benalsam-infrastructure/docker-compose.yml" ./docker-compose.yml
else
    echo -e "${YELLOW}⚠️  docker-compose.yml not found, creating default...${NC}"
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    restart: unless-stopped

volumes:
  redis_data:
  elasticsearch_data:
EOF
fi

# Create .env file if not exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Infrastructure Environment Variables
REDIS_PASSWORD=change_me_redis_password
ES_JAVA_OPTS=-Xms512m -Xmx512m
EOF
    echo -e "${YELLOW}⚠️  Please update .env file with secure passwords${NC}"
fi

# Start infrastructure
echo "Starting infrastructure services..."
docker-compose up -d
echo "✅ Infrastructure services started"
echo ""

# Step 5: Deploy Services
echo -e "${GREEN}Step 5: Deploying Microservices${NC}"
cd $DEPLOY_DIR/services

# List of services
SERVICES=(
    "benalsam-admin-backend:3002"
    "benalsam-elasticsearch-service:3006"
    "benalsam-upload-service:3007"
    "benalsam-listing-service:3008"
    "benalsam-backup-service:3013"
    "benalsam-cache-service:3014"
    "benalsam-categories-service:3015"
    "benalsam-search-service:3016"
    "benalsam-realtime-service:3019"
)

echo "Services to deploy:"
for service in "${SERVICES[@]}"; do
    echo "  - $service"
done
echo ""

echo -e "${YELLOW}⚠️  Service deployment will be done manually${NC}"
echo "Each service needs:"
echo "  1. Code deployment (git clone or rsync)"
echo "  2. npm install"
echo "  3. Environment variables setup"
echo "  4. PM2 process start"
echo ""

# Step 6: Setup Nginx
echo -e "${GREEN}Step 6: Setting up Nginx${NC}"
echo -e "${YELLOW}⚠️  Nginx configuration will be created${NC}"
echo ""

# Step 7: Setup SSL (Let's Encrypt)
echo -e "${GREEN}Step 7: SSL Certificate Setup${NC}"
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
fi
echo -e "${YELLOW}⚠️  Run: sudo certbot --nginx -d your-domain.com${NC}"
echo ""

# Step 8: Setup Firewall
echo -e "${GREEN}Step 8: Setting up Firewall${NC}"
if command -v ufw &> /dev/null; then
    echo "Configuring UFW firewall..."
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw --force enable
    echo "✅ Firewall configured"
else
    echo -e "${YELLOW}⚠️  UFW not found, please configure firewall manually${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}✅ Deployment Preparation Complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo "  1. Update infrastructure/.env with secure passwords"
echo "  2. Deploy service code to $DEPLOY_DIR/services"
echo "  3. Setup environment variables for each service"
echo "  4. Start services with PM2"
echo "  5. Configure Nginx reverse proxy"
echo "  6. Setup SSL certificate"
echo ""
echo "📚 Documentation: See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""

