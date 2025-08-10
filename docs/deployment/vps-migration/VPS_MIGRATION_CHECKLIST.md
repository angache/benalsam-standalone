# VPS Migration Checklist - Benalsam Admin Panel

## 🔄 Geçiş Süreci Kontrol Listesi

### 📋 Ön Hazırlık (Mevcut VPS)

- [ ] **Veri Yedekleme**
  - [ ] PostgreSQL veritabanı backup
  - [ ] Redis veri backup
  - [ ] Upload dosyaları backup
  - [ ] Environment dosyaları backup
  - [ ] Nginx konfigürasyonu backup
  - [ ] SSL sertifikaları backup

- [ ] **Backup Script Çalıştırma**
  ```bash
  ./backup-current-vps.sh
  ```

- [ ] **Backup Dosyasını İndirme**
  ```bash
  scp root@MEVCUT_VPS_IP:/tmp/benalsam_backup_*.tar.gz ./
  ```

### 🚀 Yeni VPS Kurulumu

- [ ] **Sistem Gereksinimleri**
  - [ ] Ubuntu 22.04 LTS kurulumu
  - [ ] Root erişimi
  - [ ] Minimum 2GB RAM
  - [ ] Minimum 20GB disk alanı

- [ ] **Domain Ayarları**
  - [ ] Domain satın alma/yönlendirme
  - [ ] DNS A record ayarlama
  - [ ] DNS propagation bekleme (24-48 saat)

- [ ] **Otomatik Kurulum**
  ```bash
  # Backup dosyasını yeni VPS'e kopyala
  scp benalsam_backup_*.tar.gz root@YENI_VPS_IP:/tmp/
  
  # Yeni VPS'de çalıştır
  ./quick-migration.sh
  ```

### ⚙️ Manuel Kontroller

- [ ] **Docker Container'ları**
  ```bash
  docker ps
  # Tüm container'ların çalıştığını kontrol et
  ```

- [ ] **Servis Durumları**
  ```bash
  systemctl status postgresql
  systemctl status redis-server
  systemctl status nginx
  ```

- [ ] **Port Kontrolleri**
  ```bash
  netstat -tlnp
  # Port 80, 443, 3000, 3002 açık olmalı
  ```

- [ ] **SSL Sertifikası**
  ```bash
  certbot certificates
  # SSL sertifikasının geçerli olduğunu kontrol et
  ```

### 🌐 Erişim Testleri

- [ ] **Frontend Erişimi**
  ```bash
  curl -I https://YOUR_DOMAIN.com
  # HTTP 200 dönmeli
  ```

- [ ] **Backend API Erişimi**
  ```bash
  curl -X GET https://YOUR_DOMAIN.com/api/health
  # JSON response dönmeli
  ```

- [ ] **Database Bağlantısı**
  ```bash
  docker exec -it benalsam-admin-backend-prod npm run test:db
  ```

### 🔒 Güvenlik Kontrolleri

- [ ] **Firewall Ayarları**
  ```bash
  ufw status
  # Sadece 22, 80, 443 portları açık olmalı
  ```

- [ ] **SSL Güvenlik**
  ```bash
  curl -I https://YOUR_DOMAIN.com
  # HTTPS redirect çalışmalı
  ```

- [ ] **Environment Güvenliği**
  - [ ] JWT_SECRET değiştirildi
  - [ ] Database şifresi güçlü
  - [ ] CORS ayarları doğru

### 📊 Monitoring Kurulumu

- [ ] **Log Monitoring**
  ```bash
  # Log dosyalarını kontrol et
  tail -f /var/log/nginx/access.log
  tail -f /var/log/nginx/error.log
  docker logs -f benalsam-admin-backend-prod
  ```

- [ ] **Backup Script**
  ```bash
  # Cron'a backup ekle
  crontab -e
  # 0 2 * * * /opt/backup-benalsam.sh
  ```

- [ ] **Monitoring Script**
  ```bash
  # Sistem durumu kontrolü
  /opt/monitor-benalsam.sh
  ```

### 🔧 Post-Migration

- [ ] **İlk Admin Kullanıcısı**
  ```bash
  # Backend container'ına gir
  docker exec -it benalsam-admin-backend-prod bash
  
  # Admin kullanıcısı oluştur
  npm run create-admin
  ```

- [ ] **Test Kullanıcısı**
  - [ ] Admin paneline giriş yap
  - [ ] Temel fonksiyonları test et
  - [ ] Kategori yönetimini test et
  - [ ] Kullanıcı yönetimini test et

- [ ] **Performance Test**
  ```bash
  # Yük testi
  ab -n 100 -c 10 https://YOUR_DOMAIN.com/
  ```

### 🚨 Acil Durum Komutları

```bash
# Backend yeniden başlat
docker restart benalsam-admin-backend-prod

# Frontend yeniden başlat
docker restart benalsam-admin-ui-prod

# Tüm servisleri yeniden başlat
docker-compose -f docker-compose.prod.yml restart

# Nginx yeniden başlat
systemctl restart nginx

# Database yeniden başlat
systemctl restart postgresql

# Redis yeniden başlat
systemctl restart redis-server
```

### 📞 Destek Bilgileri

- **Backup Dosyası**: `/tmp/benalsam_backup_*.tar.gz`
- **Log Dosyaları**: `/var/log/nginx/`, `/opt/benalsam/logs/`
- **Monitoring**: `/opt/monitor-benalsam.sh`
- **Backup**: `/opt/backup-benalsam.sh`
- **Docker Compose**: `/opt/benalsam/benalsam-monorepo/packages/admin-ui/docker-compose.prod.yml`

### ✅ Geçiş Tamamlandı

- [ ] Tüm kontroller tamamlandı
- [ ] Eski VPS'den veriler silindi
- [ ] DNS ayarları güncellendi
- [ ] Monitoring aktif
- [ ] Backup sistemi çalışıyor
- [ ] Dokümantasyon güncellendi

---

**Not**: Bu checklist'i takip ederek güvenli ve sorunsuz bir VPS geçişi yapabilirsiniz. Her adımı tamamladıktan sonra işaretleyin ve gerekirse notlar ekleyin. 