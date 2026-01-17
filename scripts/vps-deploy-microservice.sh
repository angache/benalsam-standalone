#!/bin/bash

# ==============================================================================
# VPS MICROSERVICE DEPLOYMENT SCRIPT
# ==============================================================================
# Bu script bir microservice'i VPS'e deploy eder
# Kullanım: ./scripts/vps-deploy-microservice.sh <service-name> <port>
# Örnek: ./scripts/vps-deploy-microservice.sh benalsam-admin-backend 3002
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}❌ Kullanım: $0 <service-name> <port>${NC}"
    echo "Örnek: $0 benalsam-admin-backend 3002"
    exit 1
fi

SERVICE_NAME=$1
SERVICE_PORT=$2
DEPLOY_DIR="/opt/benalsam/services"
SERVICE_DIR="$DEPLOY_DIR/$SERVICE_NAME"

# Detect if running from project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCAL_SERVICE_DIR="$PROJECT_ROOT/$SERVICE_NAME"

# VPS Configuration
VPS_IP="46.62.212.96"
REDIS_IP="209.227.228.96"
ELASTICSEARCH_IP="209.227.228.96"
RABBITMQ_URL="amqp://benalsam:YeniSifre123!@localhost:5672"

echo -e "${BLUE}🚀 Microservice Deployment: $SERVICE_NAME${NC}"
echo "=========================================="
echo ""
echo "📋 Konfigürasyon:"
echo "   Servis: $SERVICE_NAME"
echo "   Port: $SERVICE_PORT"
echo "   Dizin: $SERVICE_DIR"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Root olarak çalıştırılması önerilir${NC}"
    echo "Kullanım: sudo $0 $SERVICE_NAME $SERVICE_PORT"
    read -p "Devam etmek istiyor musunuz? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Create Directory
echo -e "${BLUE}Step 1: Dizin oluşturuluyor...${NC}"
mkdir -p "$SERVICE_DIR"
echo -e "${GREEN}✅ Dizin oluşturuldu: $SERVICE_DIR${NC}"
echo ""

# Step 2: Check if code exists
echo -e "${BLUE}Step 2: Kod kontrol ediliyor...${NC}"
echo "   Script dizini: $SCRIPT_DIR"
echo "   Proje root: $PROJECT_ROOT"
echo "   Local servis dizini: $LOCAL_SERVICE_DIR"
echo "   Deploy dizini: $SERVICE_DIR"

# Check if service exists in project root (git clone scenario)
if [ -d "$LOCAL_SERVICE_DIR" ] && [ -f "$LOCAL_SERVICE_DIR/package.json" ]; then
    echo -e "${GREEN}✅ Servis proje root'ta bulundu: $LOCAL_SERVICE_DIR${NC}"
    echo "   Deploy dizinine kopyalanıyor..."
    
    # Copy service to deploy directory
    mkdir -p "$SERVICE_DIR"
    rsync -avz --exclude 'node_modules' \
      --exclude '.git' \
      --exclude 'dist' \
      --exclude 'logs' \
      --exclude '*.log' \
      --exclude '.env' \
      "$LOCAL_SERVICE_DIR/" "$SERVICE_DIR/"
    
    echo -e "${GREEN}✅ Kod kopyalandı${NC}"
elif [ -d "$SERVICE_DIR/.git" ]; then
    echo -e "${GREEN}✅ Git repository mevcut${NC}"
    echo "   Güncelleniyor..."
    cd "$SERVICE_DIR"
    git pull
elif [ -d "$SERVICE_DIR" ] && [ -f "$SERVICE_DIR/package.json" ]; then
    echo -e "${GREEN}✅ Servis dizini zaten mevcut${NC}"
    echo "   Devam ediliyor..."
else
    echo -e "${YELLOW}⚠️  Servis bulunamadı${NC}"
    echo ""
    echo "   Kontrol edilen yerler:"
    echo "   - $LOCAL_SERVICE_DIR"
    echo "   - $SERVICE_DIR"
    echo ""
    echo "   Çözüm:"
    echo "   1. Proje root'tan çalıştırın:"
    echo "      cd /opt/benalsam/benalsam-standalone"
    echo "      sudo ./scripts/vps-deploy-microservice.sh $SERVICE_NAME $SERVICE_PORT"
    echo ""
    echo "   2. Veya projeyi clone edin:"
    echo "      cd /opt/benalsam"
    echo "      git clone https://github.com/angache/benalsam-standalone.git"
    echo "      cd benalsam-standalone"
    echo "      sudo ./scripts/vps-deploy-microservice.sh $SERVICE_NAME $SERVICE_PORT"
    echo ""
    read -p "Devam etmek istiyor musunuz? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment iptal edildi${NC}"
        exit 1
    fi
    
    # Check again if package.json exists after user confirmation
    if [ ! -f "$SERVICE_DIR/package.json" ]; then
        echo -e "${RED}❌ package.json hala bulunamadı${NC}"
        echo "   Lütfen önce kodu kopyalayın veya proje root'tan çalıştırın"
        exit 1
    fi
fi
echo ""

# Step 3: Install Dependencies
echo -e "${BLUE}Step 3: Bağımlılıklar kuruluyor...${NC}"
cd "$SERVICE_DIR"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json bulunamadı${NC}"
    exit 1
fi

echo "   npm install çalıştırılıyor..."
# Build için devDependencies de gerekli (TypeScript, type definitions)
npm install
echo -e "${GREEN}✅ Bağımlılıklar kuruldu${NC}"
echo ""

# Step 4: Create .env file
echo -e "${BLUE}Step 4: Environment dosyası oluşturuluyor...${NC}"
ENV_FILE="$SERVICE_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env dosyası zaten mevcut${NC}"
    read -p "Üzerine yazmak istiyor musunuz? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "   Mevcut .env dosyası korunuyor"
        SKIP_ENV=true
    fi
fi

if [ "$SKIP_ENV" != true ]; then
    # Create base .env from env.example if exists
    if [ -f "$SERVICE_DIR/env.example" ]; then
        cp "$SERVICE_DIR/env.example" "$ENV_FILE"
        echo "   env.example kopyalandı"
    fi

    # Update common variables
    echo "   VPS IP'leri güncelleniyor..."
    
    # Update NODE_ENV
    sed -i "s/NODE_ENV=.*/NODE_ENV=production/" "$ENV_FILE" 2>/dev/null || echo "NODE_ENV=production" >> "$ENV_FILE"
    
    # Update PORT
    sed -i "s/^PORT=.*/PORT=$SERVICE_PORT/" "$ENV_FILE" 2>/dev/null || echo "PORT=$SERVICE_PORT" >> "$ENV_FILE"
    
    # Update Redis
    sed -i "s/REDIS_HOST=.*/REDIS_HOST=$REDIS_IP/" "$ENV_FILE" 2>/dev/null || echo "REDIS_HOST=$REDIS_IP" >> "$ENV_FILE"
    sed -i "s|REDIS_URL=.*|REDIS_URL=redis://$REDIS_IP:6379|" "$ENV_FILE" 2>/dev/null || echo "REDIS_URL=redis://$REDIS_IP:6379" >> "$ENV_FILE"
    
    # Update Elasticsearch
    sed -i "s|ELASTICSEARCH_URL=.*|ELASTICSEARCH_URL=http://$ELASTICSEARCH_IP:9200|" "$ENV_FILE" 2>/dev/null || echo "ELASTICSEARCH_URL=http://$ELASTICSEARCH_IP:9200" >> "$ENV_FILE"
    
    # Update RabbitMQ
    sed -i "s|RABBITMQ_URL=.*|RABBITMQ_URL=$RABBITMQ_URL|" "$ENV_FILE" 2>/dev/null || echo "RABBITMQ_URL=$RABBITMQ_URL" >> "$ENV_FILE"
    
    # Update service URLs (localhost -> VPS IP or service names)
    sed -i "s|BACKUP_SERVICE_URL=.*|BACKUP_SERVICE_URL=http://localhost:3013|" "$ENV_FILE" 2>/dev/null
    sed -i "s|CACHE_SERVICE_URL=.*|CACHE_SERVICE_URL=http://localhost:3014|" "$ENV_FILE" 2>/dev/null
    sed -i "s|CATEGORIES_SERVICE_URL=.*|CATEGORIES_SERVICE_URL=http://localhost:3015|" "$ENV_FILE" 2>/dev/null
    sed -i "s|SEARCH_SERVICE_URL=.*|SEARCH_SERVICE_URL=http://localhost:3016|" "$ENV_FILE" 2>/dev/null
    
    echo -e "${GREEN}✅ Environment dosyası oluşturuldu${NC}"
    echo -e "${YELLOW}⚠️  ÖNEMLİ: $ENV_FILE dosyasını düzenleyip eksik değişkenleri ekleyin!${NC}"
    echo "   Özellikle: JWT_SECRET, SUPABASE_*, SENTRY_*, vb."
fi
echo ""

# Step 5: Build (if needed)
echo -e "${BLUE}Step 5: Build kontrol ediliyor...${NC}"
if [ -f "package.json" ] && grep -q "\"build\"" package.json; then
    echo "   Build script bulundu, çalıştırılıyor..."
    npm run build
    echo -e "${GREEN}✅ Build tamamlandı${NC}"
else
    echo "   Build script yok, atlanıyor"
fi
echo ""

# Step 6: Check PM2
echo -e "${BLUE}Step 6: PM2 kontrol ediliyor...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 bulunamadı${NC}"
    echo "   PM2 kurulumu için: sudo npm install -g pm2"
    exit 1
fi
echo -e "${GREEN}✅ PM2 mevcut${NC}"
echo ""

# Step 7: Stop existing process (if any)
echo -e "${BLUE}Step 7: Mevcut process kontrol ediliyor...${NC}"
if pm2 list | grep -q "$SERVICE_NAME"; then
    echo "   Mevcut process durduruluyor..."
    pm2 stop "$SERVICE_NAME" || true
    pm2 delete "$SERVICE_NAME" || true
    echo -e "${GREEN}✅ Mevcut process durduruldu${NC}"
else
    echo "   Mevcut process yok"
fi
echo ""

# Step 8: Start with PM2
echo -e "${BLUE}Step 8: Servis PM2 ile başlatılıyor...${NC}"
cd "$SERVICE_DIR"

# Determine start command
if [ -f "package.json" ]; then
    if grep -q "\"start\"" package.json; then
        START_CMD="npm run start"
    elif grep -q "\"start:prod\"" package.json; then
        START_CMD="npm run start:prod"
    else
        START_CMD="node dist/index.js"
    fi
else
    START_CMD="node dist/index.js"
fi

echo "   Start komutu: $START_CMD"

# Create PM2 ecosystem config
PM2_CONFIG="$SERVICE_DIR/ecosystem.config.js"
cat > "$PM2_CONFIG" << EOF
module.exports = {
  apps: [{
    name: '$SERVICE_NAME',
    script: '$START_CMD',
    cwd: '$SERVICE_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: $SERVICE_PORT
    },
    error_file: '$SERVICE_DIR/logs/pm2-error.log',
    out_file: '$SERVICE_DIR/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false
  }]
};
EOF

# Create logs directory
mkdir -p "$SERVICE_DIR/logs"

# Start with PM2
pm2 start "$PM2_CONFIG"
pm2 save

echo -e "${GREEN}✅ Servis başlatıldı${NC}"
echo ""

# Step 9: Verify
echo -e "${BLUE}Step 9: Servis doğrulanıyor...${NC}"
sleep 3

# Check PM2 status
if pm2 list | grep -q "$SERVICE_NAME.*online"; then
    echo -e "${GREEN}✅ Servis çalışıyor (PM2)${NC}"
else
    echo -e "${YELLOW}⚠️  Servis durumu kontrol edin: pm2 list${NC}"
fi

# Check health endpoint
if curl -s "http://localhost:$SERVICE_PORT/api/v1/health" &>/dev/null || \
   curl -s "http://localhost:$SERVICE_PORT/health" &>/dev/null || \
   curl -s "http://localhost:$SERVICE_PORT/api/v1/monitoring/health" &>/dev/null; then
    echo -e "${GREEN}✅ Health endpoint çalışıyor${NC}"
    echo "   Health: http://$VPS_IP:$SERVICE_PORT/api/v1/health"
else
    echo -e "${YELLOW}⚠️  Health endpoint henüz hazır değil (birkaç saniye bekleyin)${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}✅ Microservice deployment tamamlandı!${NC}"
echo ""
echo "📋 Özet:"
echo "   Servis: $SERVICE_NAME"
echo "   Port: $SERVICE_PORT"
echo "   Dizin: $SERVICE_DIR"
echo "   PM2: pm2 list | grep $SERVICE_NAME"
echo ""
echo "💡 Yararlı Komutlar:"
echo "   pm2 logs $SERVICE_NAME          # Logları göster"
echo "   pm2 restart $SERVICE_NAME       # Yeniden başlat"
echo "   pm2 stop $SERVICE_NAME          # Durdur"
echo "   pm2 monit                        # PM2 monitor"
echo ""
echo "⚠️  ÖNEMLİ:"
echo "   1. $ENV_FILE dosyasını kontrol edin ve eksik değişkenleri ekleyin"
echo "   2. Firewall'da port $SERVICE_PORT'u açın"
echo "   3. Health endpoint'i test edin: curl http://localhost:$SERVICE_PORT/api/v1/health"
echo ""

