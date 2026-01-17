#!/bin/bash

# ==============================================================================
# VPS INFRASTRUCTURE SERVİSLERİ KURULUM SCRIPT
# ==============================================================================
# Bu script RabbitMQ, Prometheus ve Grafana'yı Docker ile kurar
# Kullanım: ./scripts/vps-setup-infrastructure.sh
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 VPS Infrastructure Servisleri Kurulum Script${NC}"
echo "=================================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Bu script root olarak çalıştırılmalı${NC}"
    echo "Kullanım: sudo ./scripts/vps-setup-infrastructure.sh"
    exit 1
fi

# Configuration
INFRA_DIR="/opt/benalsam/infrastructure"
COMPOSE_FILE="$INFRA_DIR/docker-compose.yml"
ENV_FILE="$INFRA_DIR/.env"

# Step 1: Check Docker
echo -e "${BLUE}Step 1: Docker kontrol ediliyor...${NC}"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "   Docker: $DOCKER_VERSION"
    echo -e "${GREEN}✅ Docker mevcut${NC}"
else
    echo -e "${RED}❌ Docker bulunamadı${NC}"
    echo "   Docker kurulumu için: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo "   Docker Compose: $COMPOSE_VERSION"
    echo -e "${GREEN}✅ Docker Compose mevcut${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose bulunamadı, kuruluyor...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose kuruldu${NC}"
fi
echo ""

# Step 2: Create Directory
echo -e "${BLUE}Step 2: Dizin yapısı oluşturuluyor...${NC}"
mkdir -p "$INFRA_DIR"
mkdir -p "$INFRA_DIR/data/rabbitmq"
mkdir -p "$INFRA_DIR/data/prometheus"
mkdir -p "$INFRA_DIR/data/grafana"
mkdir -p "$INFRA_DIR/config/prometheus"
echo -e "${GREEN}✅ Dizin yapısı oluşturuldu${NC}"
echo "   Dizin: $INFRA_DIR"
echo ""

# Step 3: Create Docker Compose File
echo -e "${BLUE}Step 3: Docker Compose dosyası oluşturuluyor...${NC}"
cat > "$COMPOSE_FILE" << 'EOF'
version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: benalsam-rabbitmq
    hostname: rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-benalsam}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:-change_me_password}
      RABBITMQ_DEFAULT_VHOST: /
    ports:
      - "5672:5672"   # AMQP port
      - "15672:15672" # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    restart: unless-stopped
    networks:
      - benalsam-network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  prometheus:
    image: prom/prometheus:latest
    container_name: benalsam-prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: unless-stopped
    networks:
      - benalsam-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3

  grafana:
    image: grafana/grafana:latest
    container_name: benalsam-grafana
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-change_me_password}
      GF_INSTALL_PLUGINS: ""
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped
    networks:
      - benalsam-network
    depends_on:
      - prometheus
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  rabbitmq_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local

networks:
  benalsam-network:
    driver: bridge
EOF

echo -e "${GREEN}✅ Docker Compose dosyası oluşturuldu${NC}"
echo ""

# Step 4: Create Prometheus Config
echo -e "${BLUE}Step 4: Prometheus yapılandırması oluşturuluyor...${NC}"
cat > "$INFRA_DIR/config/prometheus/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'benalsam-production'
    environment: 'production'

scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # RabbitMQ (Management UI - metrics endpoint yok, exporter gerekli)
  # RabbitMQ exporter kurulduktan sonra aktif edilebilir
  # - job_name: 'rabbitmq'
  #   static_configs:
  #     - targets: ['rabbitmq-exporter:9419']

  # Node.js Microservices (will be added after deployment)
  # VPS'te servisler aynı host'ta çalışacak, localhost kullanıyoruz
  - job_name: 'node-services'
    static_configs:
      - targets:
        - 'localhost:3002'  # Admin Backend
        - 'localhost:3006'  # Elasticsearch Service
        - 'localhost:3007'  # Upload Service
        - 'localhost:3008'  # Listing Service
        - 'localhost:3013'  # Backup Service
        - 'localhost:3014'  # Cache Service
        - 'localhost:3015'  # Categories Service
        - 'localhost:3016'  # Search Service
        - 'localhost:3019'  # Realtime Service
    metrics_path: '/api/v1/monitoring/prometheus'
    scrape_interval: 30s
    scrape_timeout: 10s
EOF

echo -e "${GREEN}✅ Prometheus yapılandırması oluşturuldu${NC}"
echo ""

# Step 5: Create Environment File
echo -e "${BLUE}Step 5: Environment dosyası oluşturuluyor...${NC}"
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << 'EOF'
# RabbitMQ Configuration
RABBITMQ_USER=benalsam
RABBITMQ_PASSWORD=change_me_strong_password_here

# Grafana Configuration
GRAFANA_USER=admin
GRAFANA_PASSWORD=change_me_strong_password_here
EOF
    
    echo -e "${GREEN}✅ Environment dosyası oluşturuldu${NC}"
    echo -e "${YELLOW}⚠️  ÖNEMLİ: $ENV_FILE dosyasını düzenleyip şifreleri değiştirin!${NC}"
else
    echo -e "${YELLOW}⚠️  Environment dosyası zaten mevcut${NC}"
fi
echo ""

# Step 6: Start Services
echo -e "${BLUE}Step 6: Servisler başlatılıyor...${NC}"
cd "$INFRA_DIR"

# Pull images first
echo "   Docker image'ları çekiliyor..."
docker-compose pull

# Start services
echo "   Servisler başlatılıyor..."
docker-compose up -d

echo -e "${GREEN}✅ Servisler başlatıldı${NC}"
echo ""

# Step 7: Wait for Services
echo -e "${BLUE}Step 7: Servislerin hazır olması bekleniyor...${NC}"
sleep 10

# Check service status
echo "   Servis durumları kontrol ediliyor..."
docker-compose ps
echo ""

# Step 8: Verify Services
echo -e "${BLUE}Step 8: Servisler doğrulanıyor...${NC}"
echo ""

# Check RabbitMQ
if docker exec benalsam-rabbitmq rabbitmq-diagnostics ping &>/dev/null; then
    echo -e "${GREEN}✅ RabbitMQ çalışıyor${NC}"
    echo "   Management UI: http://46.62.212.46:15672"
    echo "   Kullanıcı: benalsam (şifre: .env dosyasından)"
else
    echo -e "${RED}❌ RabbitMQ başlatılamadı${NC}"
fi

# Check Prometheus
if curl -s http://localhost:9090/-/healthy &>/dev/null; then
    echo -e "${GREEN}✅ Prometheus çalışıyor${NC}"
    echo "   UI: http://46.62.212.46:9090"
else
    echo -e "${RED}❌ Prometheus başlatılamadı${NC}"
fi

# Check Grafana
if curl -s http://localhost:3000/api/health &>/dev/null; then
    echo -e "${GREEN}✅ Grafana çalışıyor${NC}"
    echo "   UI: http://46.62.212.46:3000"
    echo "   Kullanıcı: admin (şifre: .env dosyasından)"
else
    echo -e "${RED}❌ Grafana başlatılamadı${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}✅ Infrastructure servisleri kurulumu tamamlandı!${NC}"
echo ""
echo "📋 Özet:"
echo "   RabbitMQ: http://46.62.212.46:15672"
echo "   Prometheus: http://46.62.212.46:9090"
echo "   Grafana: http://46.62.212.46:3000"
echo ""
echo "⚠️  ÖNEMLİ:"
echo "   1. $ENV_FILE dosyasını düzenleyip şifreleri değiştirin!"
echo "   2. Firewall'da portları açın (5672, 15672, 9090, 3000)"
echo "   3. Servisleri kontrol edin: docker-compose ps"
echo ""
echo "💡 Yararlı Komutlar:"
echo "   cd $INFRA_DIR"
echo "   docker-compose ps          # Servis durumları"
echo "   docker-compose logs        # Tüm loglar"
echo "   docker-compose logs -f     # Canlı loglar"
echo "   docker-compose restart    # Servisleri yeniden başlat"
echo "   docker-compose down        # Servisleri durdur"
echo ""

