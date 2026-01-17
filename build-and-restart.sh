#!/bin/bash

# ==============================================================================
# Build and Restart Services Script
# ==============================================================================
# VPS'de benalsam-standalone içinde çalıştırılacak
# Kullanım: ./build-and-restart.sh [service1] [service2] ...
# Örnek: ./build-and-restart.sh categories search
# Tüm servisleri build/restart etmek için: ./build-and-restart.sh
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Services directory (benalsam-standalone içinde)
SERVICES_DIR="."

# Services to build/restart (if specified, otherwise all)
SERVICES_TO_BUILD=("$@")

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

# Function to build and restart a service
build_and_restart_service() {
  local SERVICE=$1
  local SERVICE_DIR="${SERVICES_DIR}/${SERVICE}"
  
  if [ ! -d "$SERVICE_DIR" ]; then
    echo -e "${RED}❌ Service not found: ${SERVICE}${NC}"
    return 1
  fi
  
  echo -e "${BLUE}📦 Building and restarting: ${SERVICE}${NC}"
  
  cd "$SERVICE_DIR"
  
  # 1. Build
  echo -e "${YELLOW}  → Building...${NC}"
  if npm run build; then
    echo -e "${GREEN}  ✅ Build successful${NC}"
  else
    echo -e "${RED}  ❌ Build failed${NC}"
    cd - > /dev/null
    return 1
  fi
  
  # 2. Restart with PM2
  echo -e "${YELLOW}  → Restarting with PM2...${NC}"
  if pm2 restart "${SERVICE}" --update-env; then
    echo -e "${GREEN}  ✅ Restart successful${NC}"
  else
    echo -e "${RED}  ❌ Restart failed${NC}"
    cd - > /dev/null
    return 1
  fi
  
  cd - > /dev/null
  echo -e "${GREEN}✅ ${SERVICE} completed${NC}"
  echo ""
}

# Main logic
main() {
  echo -e "${BLUE}🚀 Build and Restart Services${NC}"
  echo "=========================================="
  echo ""
  
  # Determine which services to build
  if [ ${#SERVICES_TO_BUILD[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No services specified. Building all services...${NC}"
    echo ""
    SERVICES_TO_BUILD=("${ALL_SERVICES[@]}")
  else
    # Add benalsam- prefix if not present
    for i in "${!SERVICES_TO_BUILD[@]}"; do
      if [[ ! "${SERVICES_TO_BUILD[$i]}" == benalsam-* ]]; then
        SERVICES_TO_BUILD[$i]="benalsam-${SERVICES_TO_BUILD[$i]}"
      fi
    done
  fi
  
  # Build and restart each service
  for SERVICE in "${SERVICES_TO_BUILD[@]}"; do
    build_and_restart_service "$SERVICE"
  done
  
  # Summary
  echo -e "${GREEN}✅ All services completed!${NC}"
  echo ""
  echo -e "${BLUE}📊 PM2 Status:${NC}"
  pm2 list
}

# Run main function
main

