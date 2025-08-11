#!/bin/bash

# Benalsam VPS PM2 Deployment Script
# Bu script VPS'de uygulamaları PM2 ile deploy eder

set -e

echo "🚀 Benalsam VPS PM2 Deployment başlatılıyor..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/root/benalsam-standalone"
ADMIN_BACKEND_DIR="$PROJECT_ROOT/benalsam-admin-backend"
ADMIN_UI_DIR="$PROJECT_ROOT/benalsam-admin-ui"
WEB_APP_DIR="$PROJECT_ROOT/benalsam-web"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 bulunamadı! Yükleniyor..."
        npm install -g pm2
        log_success "PM2 yüklendi"
    else
        log_success "PM2 zaten yüklü"
    fi
}

# Deploy Admin Backend
deploy_admin_backend() {
    log_info "Admin Backend deploy ediliyor..."
    
    cd "$ADMIN_BACKEND_DIR"
    
    # Install dependencies
    log_info "Dependencies yükleniyor..."
    npm install --production
    
    # Build project
    log_info "Proje build ediliyor..."
    npm run build
    
    # Create logs directory
    mkdir -p logs
    
    # Stop existing process if running
    pm2 stop benalsam-admin-backend 2>/dev/null || true
    pm2 delete benalsam-admin-backend 2>/dev/null || true
    
    # Start with PM2
    log_info "PM2 ile başlatılıyor..."
    pm2 start pm2.config.js --env production
    
    log_success "Admin Backend deploy edildi"
}

# Deploy Admin UI
deploy_admin_ui() {
    log_info "Admin UI deploy ediliyor..."
    
    cd "$ADMIN_UI_DIR"
    
    # Install dependencies
    log_info "Dependencies yükleniyor..."
    npm install --production
    
    # Build project
    log_info "Proje build ediliyor..."
    npm run build
    
    # Create logs directory
    mkdir -p logs
    
    # Stop existing process if running
    pm2 stop benalsam-admin-ui 2>/dev/null || true
    pm2 delete benalsam-admin-ui 2>/dev/null || true
    
    # Start with PM2
    log_info "PM2 ile başlatılıyor..."
    pm2 start pm2.config.js --env production
    
    log_success "Admin UI deploy edildi"
}

# Deploy Web App
deploy_web_app() {
    log_info "Web App deploy ediliyor..."
    
    cd "$WEB_APP_DIR"
    
    # Install dependencies
    log_info "Dependencies yükleniyor..."
    npm install --production
    
    # Build project
    log_info "Proje build ediliyor..."
    npm run build
    
    # Create logs directory
    mkdir -p logs
    
    # Stop existing process if running
    pm2 stop benalsam-web 2>/dev/null || true
    pm2 delete benalsam-web 2>/dev/null || true
    
    # Start with PM2
    log_info "PM2 ile başlatılıyor..."
    pm2 start pm2.config.js --env production
    
    log_success "Web App deploy edildi"
}

# Save PM2 configuration
save_pm2_config() {
    log_info "PM2 konfigürasyonu kaydediliyor..."
    pm2 save
    pm2 startup
    log_success "PM2 konfigürasyonu kaydedildi"
}

# Show status
show_status() {
    log_info "PM2 Status:"
    pm2 status
    
    log_info "PM2 Logs (son 10 satır):"
    pm2 logs --lines 10
}

# Main deployment
main() {
    log_info "Benalsam VPS PM2 Deployment başlatılıyor..."
    
    # Check PM2
    check_pm2
    
    # Deploy applications
    deploy_admin_backend
    deploy_admin_ui
    deploy_web_app
    
    # Save PM2 config
    save_pm2_config
    
    # Show status
    show_status
    
    log_success "🎉 Tüm uygulamalar başarıyla deploy edildi!"
    log_info "Admin Backend: http://localhost:3002"
    log_info "Admin UI: http://localhost:3003"
    log_info "Web App: http://localhost:5173"
}

# Run main function
main "$@"
