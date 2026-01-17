#!/bin/bash

# ==============================================================================
# VPS Deployment Script
# ==============================================================================
# Kullanım: ./deploy-vps.sh [service1] [service2] ...
# Örnek: ./deploy-vps.sh categories search
# Tüm servisleri deploy etmek için: ./deploy-vps.sh
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# VPS Configuration
VPS_HOST="root@benalsam"
VPS_SERVICES_DIR="/opt/benalsam/services"
LOCAL_SERVICES_DIR="."

# Services to deploy (if specified, otherwise all)
SERVICES_TO_DEPLOY=("$@")

# All available services
ALL_SERVICES=(
  "benalsam-categories-service"
  "benalsam-search-service"
  "benalsam-upload-service"
  "benalsam-listing-service"
  "benalsam-admin-backend"
  "benalsam-cache-service"
  "benalsam-realtime-service"
)

# Function to deploy a service
deploy_service() {
  local SERVICE=$1
  local SERVICE_DIR="${LOCAL_SERVICES_DIR}/${SERVICE}"
  
  if [ ! -d "$SERVICE_DIR" ]; then
    echo -e "${RED}❌ Service not found: ${SERVICE}${NC}"
    return 1
  fi
  
  echo -e "${BLUE}📦 Deploying: ${SERVICE}${NC}"
  
  # 1. Sync source files
  echo -e "${YELLOW}  → Syncing source files...${NC}"
  rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.env' \
    --exclude 'logs' \
    --exclude '.git' \
    "${SERVICE_DIR}/" "${VPS_HOST}:${VPS_SERVICES_DIR}/${SERVICE}/"
  
  # 2. Build on VPS
  echo -e "${YELLOW}  → Building on VPS...${NC}"
  ssh "${VPS_HOST}" "cd ${VPS_SERVICES_DIR}/${SERVICE} && npm run build"
  
  # 3. Restart with PM2
  echo -e "${YELLOW}  → Restarting service...${NC}"
  ssh "${VPS_HOST}" "pm2 restart ${SERVICE} --update-env"
  
  echo -e "${GREEN}✅ ${SERVICE} deployed successfully${NC}"
  echo ""
}

# Main deployment logic
main() {
  echo -e "${BLUE}🚀 VPS Deployment Script${NC}"
  echo "=========================================="
  echo ""
  
  # Determine which services to deploy
  if [ ${#SERVICES_TO_DEPLOY[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No services specified. Deploying all services...${NC}"
    echo ""
    SERVICES_TO_DEPLOY=("${ALL_SERVICES[@]}")
  else
    # Add benalsam- prefix if not present
    for i in "${!SERVICES_TO_DEPLOY[@]}"; do
      if [[ ! "${SERVICES_TO_DEPLOY[$i]}" == benalsam-* ]]; then
        SERVICES_TO_DEPLOY[$i]="benalsam-${SERVICES_TO_DEPLOY[$i]}"
      fi
    done
  fi
  
  # Deploy each service
  for SERVICE in "${SERVICES_TO_DEPLOY[@]}"; do
    deploy_service "$SERVICE"
  done
  
  # Summary
  echo -e "${GREEN}✅ Deployment completed!${NC}"
  echo ""
  echo -e "${BLUE}📊 PM2 Status:${NC}"
  ssh "${VPS_HOST}" "pm2 list"
}

# Run main function
main

