#!/bin/bash

# ==============================================================================
# PM2 Reconfiguration Script
# ==============================================================================
# Tüm servisleri /opt/benalsam/benalsam-standalone altından çalıştıracak şekilde PM2'yi yapılandırır
# Kullanım: ./reconfigure-pm2.sh
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directories
STANDALONE_DIR="/opt/benalsam/benalsam-standalone"
SERVICES_DIR="${STANDALONE_DIR}"

# All services
SERVICES=(
  "benalsam-categories-service"
  "benalsam-search-service"
  "benalsam-upload-service"
  "benalsam-listing-service"
  "benalsam-admin-backend"
  "benalsam-cache-service"
  "benalsam-realtime-service"
  "benalsam-backup-service"
  "benalsam-elasticsearch-service"
)

echo -e "${BLUE}🔄 PM2 Reconfiguration - benalsam-standalone${NC}"
echo "=========================================="
echo ""

# Function to reconfigure a service
reconfigure_service() {
  local SERVICE=$1
  local SERVICE_DIR="${SERVICES_DIR}/${SERVICE}"
  
  if [ ! -d "$SERVICE_DIR" ]; then
    echo -e "${YELLOW}⚠️  Service not found: ${SERVICE} (skipping)${NC}"
    return 0
  fi
  
  echo -e "${BLUE}📦 Reconfiguring: ${SERVICE}${NC}"
  
  # Delete existing PM2 process (if exists)
  pm2 delete "$SERVICE" 2>/dev/null || echo -e "${YELLOW}  → Service not running in PM2${NC}"
  
  # Build and start from benalsam-standalone
  cd "$SERVICE_DIR"
  
  echo -e "${YELLOW}  → Building...${NC}"
  if npm run build; then
    echo -e "${GREEN}  ✅ Build successful${NC}"
  else
    echo -e "${RED}  ❌ Build failed${NC}"
    cd - > /dev/null
    return 1
  fi
  
  echo -e "${YELLOW}  → Starting with PM2...${NC}"
  if pm2 start npm --name "$SERVICE" -- start; then
    echo -e "${GREEN}  ✅ Started successfully${NC}"
  else
    echo -e "${RED}  ❌ Start failed${NC}"
    cd - > /dev/null
    return 1
  fi
  
  cd - > /dev/null
  echo ""
}

# Main reconfiguration
main() {
  # Reconfigure each service
  for SERVICE in "${SERVICES[@]}"; do
    reconfigure_service "$SERVICE"
  done
  
  # Save PM2 configuration
  echo -e "${BLUE}💾 Saving PM2 configuration...${NC}"
  pm2 save
  
  # Summary
  echo -e "${GREEN}✅ Reconfiguration completed!${NC}"
  echo ""
  echo -e "${BLUE}📊 PM2 Status:${NC}"
  pm2 list
  echo ""
  echo -e "${BLUE}📋 Checking service paths:${NC}"
  for SERVICE in "${SERVICES[@]}"; do
    CWD=$(pm2 info "$SERVICE" 2>/dev/null | grep "exec cwd" | awk '{print $4}' || echo "not running")
    echo "  ${SERVICE}: ${CWD}"
  done
}

# Run main function
main

