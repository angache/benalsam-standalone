#!/bin/bash

# Benalsam Admin Panel - Current VPS Backup Script
# Bu script mevcut VPS'den tüm verileri yedekler

set -e

echo "💾 Benalsam Admin Panel - Current VPS Backup Script"
echo "=================================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Backup dizini oluştur
BACKUP_DIR="/tmp/benalsam_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}📁 Backup dizini oluşturuldu: $BACKUP_DIR${NC}"

# 1. PostgreSQL veritabanı yedekleme
echo -e "${YELLOW}🗄️ PostgreSQL veritabanı yedekleniyor...${NC}"
if pg_dump -h localhost -U postgres benalsam_admin > $BACKUP_DIR/benalsam_admin_backup.sql 2>/dev/null; then
    echo -e "${GREEN}✅ PostgreSQL backup tamamlandı${NC}"
else
    echo -e "${YELLOW}⚠️ PostgreSQL backup başarısız, Docker container'dan yedekleniyor...${NC}"
    docker exec benalsam-admin-backend-prod pg_dump -h localhost -U postgres benalsam_admin > $BACKUP_DIR/benalsam_admin_backup.sql
fi

# 2. Redis veri yedekleme
echo -e "${YELLOW}🔴 Redis veri yedekleniyor...${NC}"
if redis-cli BGSAVE > /dev/null 2>&1; then
    sleep 2
    if [ -f /var/lib/redis/dump.rdb ]; then
        cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_backup.rdb
        echo -e "${GREEN}✅ Redis backup tamamlandı${NC}"
    else
        echo -e "${YELLOW}⚠️ Redis backup dosyası bulunamadı${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Redis backup başarısız${NC}"
fi

# 3. Upload dosyaları yedekleme
echo -e "${YELLOW}📁 Upload dosyaları yedekleniyor...${NC}"
if [ -d "/opt/benalsam/uploads" ]; then
    tar -czf $BACKUP_DIR/uploads_backup.tar.gz -C /opt/benalsam uploads
    echo -e "${GREEN}✅ Upload dosyaları backup tamamlandı${NC}"
elif [ -d "/opt/benalsam/benalsam-standalone/benalsam-admin-backend/uploads" ]; then
    tar -czf $BACKUP_DIR/uploads_backup.tar.gz -C /opt/benalsam/benalsam-standalone/benalsam-admin-backend uploads
    echo -e "${GREEN}✅ Upload dosyaları backup tamamlandı${NC}"
else
    echo -e "${YELLOW}⚠️ Upload dizini bulunamadı${NC}"
fi

# 4. Environment dosyaları yedekleme
echo -e "${YELLOW}⚙️ Environment dosyaları yedekleniyor...${NC}"
if [ -f "/opt/benalsam/benalsam-standalone/benalsam-admin-backend/.env.production" ]; then
    cp /opt/benalsam/benalsam-standalone/benalsam-admin-backend/.env.production $BACKUP_DIR/backend_env.production
    echo -e "${GREEN}✅ Backend environment backup tamamlandı${NC}"
fi

if [ -f "/opt/benalsam/benalsam-standalone/benalsam-admin-ui/.env.production" ]; then
    cp /opt/benalsam/benalsam-standalone/benalsam-admin-ui/.env.production $BACKUP_DIR/frontend_env.production
    echo -e "${GREEN}✅ Frontend environment backup tamamlandı${NC}"
fi

# 5. Nginx konfigürasyonu yedekleme
echo -e "${YELLOW}🌐 Nginx konfigürasyonu yedekleniyor...${NC}"
if [ -f "/etc/nginx/sites-available/benalsam" ]; then
    cp /etc/nginx/sites-available/benalsam $BACKUP_DIR/nginx_benalsam.conf
    echo -e "${GREEN}✅ Nginx konfigürasyonu backup tamamlandı${NC}"
fi

# 6. SSL sertifikaları yedekleme
echo -e "${YELLOW}🔒 SSL sertifikaları yedekleniyor...${NC}"
DOMAIN=$(grep -o 'server_name [^;]*' /etc/nginx/sites-available/benalsam | awk '{print $2}' | head -1)
if [ ! -z "$DOMAIN" ] && [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    sudo cp -r /etc/letsencrypt/live/$DOMAIN $BACKUP_DIR/ssl_certificates
    echo -e "${GREEN}✅ SSL sertifikaları backup tamamlandı${NC}"
else
    echo -e "${YELLOW}⚠️ SSL sertifikaları bulunamadı${NC}"
fi

# 7. Docker container durumları
echo -e "${YELLOW}🐳 Docker container durumları yedekleniyor...${NC}"
docker ps -a > $BACKUP_DIR/container_status.txt
docker images > $BACKUP_DIR/docker_images.txt
echo -e "${GREEN}✅ Docker durumları backup tamamlandı${NC}"

# 8. Sistem bilgileri
echo -e "${YELLOW}💻 Sistem bilgileri yedekleniyor...${NC}"
uname -a > $BACKUP_DIR/system_info.txt
cat /etc/os-release > $BACKUP_DIR/os_info.txt
df -h > $BACKUP_DIR/disk_usage.txt
free -h > $BACKUP_DIR/memory_usage.txt
echo -e "${GREEN}✅ Sistem bilgileri backup tamamlandı${NC}"

# 9. Backup manifest dosyası oluştur
echo -e "${YELLOW}📋 Backup manifest dosyası oluşturuluyor...${NC}"
cat > $BACKUP_DIR/backup_manifest.txt << EOF
Benalsam Admin Panel - Backup Manifest
=====================================
Backup Tarihi: $(date)
VPS IP: $(curl -s ifconfig.me)
Domain: $DOMAIN

Backup İçeriği:
- PostgreSQL Database: benalsam_admin_backup.sql
- Redis Data: redis_backup.rdb
- Upload Files: uploads_backup.tar.gz
- Backend Environment: backend_env.production
- Frontend Environment: frontend_env.production
- Nginx Config: nginx_benalsam.conf
- SSL Certificates: ssl_certificates/
- Docker Status: container_status.txt
- Docker Images: docker_images.txt
- System Info: system_info.txt
- OS Info: os_info.txt
- Disk Usage: disk_usage.txt
- Memory Usage: memory_usage.txt

Restore Notları:
1. Yeni VPS'de PostgreSQL kurulumu yapın
2. Database restore: psql -h localhost -U benalsam_user -d benalsam_admin < benalsam_admin_backup.sql
3. Redis restore: cp redis_backup.rdb /var/lib/redis/dump.rdb
4. Upload files restore: tar -xzf uploads_backup.tar.gz -C /opt/benalsam/
5. Environment dosyalarını yeni VPS'e kopyalayın
6. SSL sertifikalarını yeni domain için yeniden alın
EOF

# 10. Tüm backup'ları tek dosyada sıkıştır
echo -e "${YELLOW}📦 Backup dosyaları sıkıştırılıyor...${NC}"
cd /tmp
tar -czf benalsam_backup_$(date +%Y%m%d_%H%M%S).tar.gz $(basename $BACKUP_DIR)
FINAL_BACKUP="/tmp/benalsam_backup_$(date +%Y%m%d_%H%M%S).tar.gz"

# 11. Backup boyutunu kontrol et
BACKUP_SIZE=$(du -h $FINAL_BACKUP | cut -f1)
echo -e "${GREEN}✅ Backup tamamlandı!${NC}"
echo ""
echo "📋 Backup Özeti:"
echo "================"
echo "Backup Dosyası: $FINAL_BACKUP"
echo "Backup Boyutu: $BACKUP_SIZE"
echo "Backup Dizini: $BACKUP_DIR"
echo ""
echo "📤 Backup'ı İndirme:"
echo "==================="
echo "scp root@$(curl -s ifconfig.me):$FINAL_BACKUP ./"
echo ""
echo "🔧 Restore Komutları:"
echo "===================="
echo "1. Backup'ı yeni VPS'e kopyalayın"
echo "2. Sıkıştırmayı açın: tar -xzf $FINAL_BACKUP"
echo "3. quick-migration.sh script'ini çalıştırın"
echo "4. Backup manifest dosyasını takip edin"
echo ""
echo -e "${GREEN}🎉 Backup işlemi başarıyla tamamlandı!${NC}"

# 12. Eski backup dizinini temizle
rm -rf $BACKUP_DIR 