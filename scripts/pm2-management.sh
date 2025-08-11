#!/bin/bash

# Benalsam PM2 Management Script
# Bu script PM2 process'lerini yönetir

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Show usage
show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  status     - Show PM2 status"
    echo "  start      - Start all applications"
    echo "  stop       - Stop all applications"
    echo "  restart    - Restart all applications"
    echo "  logs       - Show logs"
    echo "  monitor    - Show PM2 monitor"
    echo "  backend    - Manage admin backend only"
    echo "  admin-ui   - Manage admin UI only"
    echo "  web        - Manage web app only"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 restart"
    echo "  $0 backend restart"
    echo "  $0 logs"
}

# Start all applications
start_all() {
    log_info "Tüm uygulamalar başlatılıyor..."
    
    cd benalsam-admin-backend
    pm2 start pm2.config.js --env production
    
    cd ../benalsam-admin-ui
    pm2 start pm2.config.js --env production
    
    cd ../benalsam-web
    pm2 start pm2.config.js --env production
    
    log_success "Tüm uygulamalar başlatıldı"
}

# Stop all applications
stop_all() {
    log_info "Tüm uygulamalar durduruluyor..."
    
    pm2 stop benalsam-admin-backend
    pm2 stop benalsam-admin-ui
    pm2 stop benalsam-web
    
    log_success "Tüm uygulamalar durduruldu"
}

# Restart all applications
restart_all() {
    log_info "Tüm uygulamalar yeniden başlatılıyor..."
    
    pm2 restart benalsam-admin-backend
    pm2 restart benalsam-admin-ui
    pm2 restart benalsam-web
    
    log_success "Tüm uygulamalar yeniden başlatıldı"
}

# Manage specific application
manage_app() {
    local app_name=$1
    local action=$2
    
    case $app_name in
        "backend")
            log_info "Admin Backend $action ediliyor..."
            pm2 $action benalsam-admin-backend
            ;;
        "admin-ui")
            log_info "Admin UI $action ediliyor..."
            pm2 $action benalsam-admin-ui
            ;;
        "web")
            log_info "Web App $action ediliyor..."
            pm2 $action benalsam-web
            ;;
        *)
            log_error "Geçersiz uygulama: $app_name"
            exit 1
            ;;
    esac
    
    log_success "$app_name $action edildi"
}

# Main function
main() {
    case $1 in
        "status")
            log_info "PM2 Status:"
            pm2 status
            ;;
        "start")
            start_all
            ;;
        "stop")
            stop_all
            ;;
        "restart")
            restart_all
            ;;
        "logs")
            log_info "PM2 Logs:"
            pm2 logs
            ;;
        "monitor")
            log_info "PM2 Monitor:"
            pm2 monit
            ;;
        "backend"|"admin-ui"|"web")
            if [ -z "$2" ]; then
                log_error "Action belirtilmedi"
                show_usage
                exit 1
            fi
            manage_app $1 $2
            ;;
        *)
            log_error "Geçersiz komut: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
