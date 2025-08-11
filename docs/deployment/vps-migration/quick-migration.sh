#!/bin/bash

# Benalsam Admin Panel - Quick VPS Migration Script
# Bu script yeni VPS'de otomatik kurulum yapar

set -e  # Hata durumunda script'i durdur

echo "🚀 Benalsam Admin Panel - VPS Migration Script"
echo "=============================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Domain ve IP bilgileri
read -p "Yeni domain adınızı girin (örn: admin.benalsam.com): " DOMAIN
read -p "VPS IP adresinizi girin: " VPS_IP
read -p "PostgreSQL şifresini girin: " DB_PASSWORD
read -p "JWT secret key girin: " JWT_SECRET

echo -e "${GREEN}✓ Bilgiler alındı${NC}"

# Sistem güncellemesi
echo -e "${YELLOW}📦 Sistem güncelleniyor...${NC}"
sudo apt update && sudo apt upgrade -y

# Temel paketler
echo -e "${YELLOW}📦 Temel paketler kuruluyor...${NC}"
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release htop

# Docker kurulumu
echo -e "${YELLOW}🐳 Docker kuruluyor...${NC}"
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo usermod -aG docker $USER

# Nginx kurulumu
echo -e "${YELLOW}🌐 Nginx kuruluyor...${NC}"
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# PostgreSQL kurulumu
echo -e "${YELLOW}🗄️ PostgreSQL kuruluyor...${NC}"
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Redis kurulumu
echo -e "${YELLOW}🔴 Redis kuruluyor...${NC}"
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# SSL sertifikası araçları
echo -e "${YELLOW}🔒 SSL araçları kuruluyor...${NC}"
sudo apt install -y certbot python3-certbot-nginx

# Proje dizini oluşturma
echo -e "${YELLOW}📁 Proje dizini oluşturuluyor...${NC}"
sudo mkdir -p /opt/benalsam
sudo chown $USER:$USER /opt/benalsam
cd /opt/benalsam

# Repository clone
echo -e "${YELLOW}📥 Repository klonlanıyor...${NC}"
git clone https://github.com/angache/benalsam-standalone.git .
cd benalsam-standalone

# Environment dosyaları oluşturma
echo -e "${YELLOW}⚙️ Environment dosyaları oluşturuluyor...${NC}"

# Backend environment
cd admin-backend
cp env.example .env.production

# Environment değişkenlerini güncelle
sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"postgresql://benalsam_user:${DB_PASSWORD}@localhost:5432/benalsam_admin\"|" .env.production
sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env.production
sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://${DOMAIN},http://localhost:3000|" .env.production
sed -i "s|NODE_ENV=.*|NODE_ENV=production|" .env.production
sed -i "s|PORT=.*|PORT=3002|" .env.production

# Frontend environment
cd ../admin-ui
cat > .env.production << EOF
VITE_API_URL=https://${DOMAIN}/api
VITE_APP_ENV=production
EOF

# Veritabanı oluşturma
echo -e "${YELLOW}🗄️ Veritabanı oluşturuluyor...${NC}"
sudo -u postgres psql -c "CREATE DATABASE benalsam_admin;"
sudo -u postgres psql -c "CREATE USER benalsam_user WITH PASSWORD '${DB_PASSWORD}';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE benalsam_admin TO benalsam_user;"

# Nginx konfigürasyonu
echo -e "${YELLOW}🌐 Nginx konfigürasyonu oluşturuluyor...${NC}"
sudo tee /etc/nginx/sites-available/benalsam > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    
    # HTTP'den HTTPS'e yönlendirme
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    
    # SSL sertifikaları (Let's Encrypt sonrası)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # SSL güvenlik ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Frontend (React)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Nginx site'ını aktifleştir
sudo ln -sf /etc/nginx/sites-available/benalsam /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Firewall ayarları
echo -e "${YELLOW}🔥 Firewall ayarları yapılıyor...${NC}"
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Docker Compose ile başlatma
echo -e "${YELLOW}🐳 Docker container'ları başlatılıyor...${NC}"
cd /opt/benalsam/benalsam-standalone/benalsam-admin-ui
docker-compose -f docker-compose.prod.yml up -d

# SSL sertifikası alma
echo -e "${YELLOW}🔒 SSL sertifikası alınıyor...${NC}"
echo "DNS ayarlarınızı kontrol edin ve domain'in VPS IP'sine yönlendirildiğinden emin olun."
read -p "DNS ayarları tamamlandı mı? (y/n): " DNS_READY

if [ "$DNS_READY" = "y" ]; then
    sudo certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}
else
    echo -e "${YELLOW}⚠️ DNS ayarlarını tamamladıktan sonra manuel olarak SSL sertifikası alın:${NC}"
    echo "sudo certbot --nginx -d ${DOMAIN}"
fi

# Backup script oluşturma
echo -e "${YELLOW}💾 Backup script oluşturuluyor...${NC}"
sudo mkdir -p /opt/backups
sudo tee /opt/backup-benalsam.sh > /dev/null << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"

# Database backup
pg_dump -h localhost -U benalsam_user benalsam_admin > $BACKUP_DIR/db_backup_$DATE.sql

# Upload files backup (eğer varsa)
if [ -d "/opt/benalsam/uploads" ]; then
    tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /opt/benalsam/uploads
fi

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

sudo chmod +x /opt/backup-benalsam.sh

# Monitoring script oluşturma
sudo tee /opt/monitor-benalsam.sh > /dev/null << 'EOF'
#!/bin/bash
echo "=== Benalsam Admin Panel Status ==="
echo "Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "System Resources:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
echo "Disk: $(df -h / | awk 'NR==2{print $5}')"
echo ""
echo "Services:"
echo "PostgreSQL: $(systemctl is-active postgresql)"
echo "Redis: $(systemctl is-active redis-server)"
echo "Nginx: $(systemctl is-active nginx)"
EOF

sudo chmod +x /opt/monitor-benalsam.sh

# Kurulum tamamlandı
echo -e "${GREEN}✅ Kurulum tamamlandı!${NC}"
echo ""
echo "📋 Kurulum Özeti:"
echo "=================="
echo "Domain: ${DOMAIN}"
echo "VPS IP: ${VPS_IP}"
echo "Backend Port: 3002"
echo "Frontend Port: 3000"
echo "Database: benalsam_admin"
echo ""
echo "🔧 Kontrol Komutları:"
echo "====================="
echo "Container durumu: docker ps"
echo "Backend logları: docker logs benalsam-admin-backend-prod"
echo "Frontend logları: docker logs benalsam-admin-ui-prod"
echo "Sistem durumu: /opt/monitor-benalsam.sh"
echo "Backup: /opt/backup-benalsam.sh"
echo ""
echo "🌐 Erişim:"
echo "=========="
echo "Admin Panel: https://${DOMAIN}"
echo "API: https://${DOMAIN}/api"
echo ""
echo "⚠️ Önemli Notlar:"
echo "================="
echo "1. DNS ayarlarınızı kontrol edin"
echo "2. SSL sertifikası alın (eğer alınmadıysa)"
echo "3. İlk admin kullanıcısını oluşturun"
echo "4. Backup script'ini cron'a ekleyin"
echo ""
echo -e "${GREEN}🎉 Benalsam Admin Panel başarıyla kuruldu!${NC}" 