# VPS Migration - Benalsam Admin Panel

Bu klasör, Benalsam Admin Panel'in başka bir VPS'e geçişi için gerekli tüm dosyaları içerir.

## 📁 Dosya Yapısı

```
docs/vps-migration/
├── README.md                           # Bu dosya
├── VPS_MIGRATION_GUIDE.md             # Detaylı geçiş rehberi
├── VPS_MIGRATION_CHECKLIST.md         # Kontrol listesi
├── quick-migration.sh                 # Otomatik kurulum script'i
└── backup-current-vps.sh              # Mevcut VPS'den veri yedekleme
```

## 🚀 Hızlı Başlangıç

### 1. Mevcut VPS'den Yedekleme
```bash
# Mevcut VPS'de çalıştır
./docs/vps-migration/backup-current-vps.sh

# Backup dosyasını indir
scp root@MEVCUT_VPS_IP:/tmp/benalsam_backup_*.tar.gz ./
```

### 2. Yeni VPS'de Kurulum
```bash
# Backup dosyasını yeni VPS'e kopyala
scp benalsam_backup_*.tar.gz root@YENI_VPS_IP:/tmp/

# Yeni VPS'de otomatik kurulum
./docs/vps-migration/quick-migration.sh
```

## 📋 Detaylı Rehberler

- **[VPS_MIGRATION_GUIDE.md](./VPS_MIGRATION_GUIDE.md)** - Kapsamlı geçiş rehberi
- **[VPS_MIGRATION_CHECKLIST.md](./VPS_MIGRATION_CHECKLIST.md)** - Adım adım kontrol listesi

## 🔧 Script'ler

### backup-current-vps.sh
Mevcut VPS'den tüm verileri yedekler:
- PostgreSQL veritabanı
- Redis verileri
- Upload dosyaları
- Environment dosyaları
- Nginx konfigürasyonu
- SSL sertifikaları

### quick-migration.sh
Yeni VPS'de otomatik kurulum yapar:
- Sistem güncellemesi
- Docker, Nginx, PostgreSQL, Redis kurulumu
- Environment dosyaları oluşturma
- Nginx konfigürasyonu
- SSL sertifikası alma
- Backup ve monitoring script'leri

## ⚠️ Önemli Notlar

1. **DNS Ayarları**: Domain'in yeni VPS IP'sine yönlendirildiğinden emin olun
2. **SSL Sertifikası**: Yeni domain için SSL sertifikası alın
3. **Backup**: Düzenli backup almayı unutmayın
4. **Monitoring**: Sistem durumunu düzenli kontrol edin

## 🚨 Acil Durum Komutları

```bash
# Servisleri yeniden başlat
docker restart benalsam-admin-backend-prod
docker restart benalsam-admin-ui-prod

# Sistem durumu kontrol
/opt/monitor-benalsam.sh

# Backup al
/opt/backup-benalsam.sh
```

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Log dosyalarını kontrol edin
2. Sistem durumunu kontrol edin
3. Backup dosyalarını kontrol edin

---

**Son Güncelleme**: $(date)
**Versiyon**: 1.0 