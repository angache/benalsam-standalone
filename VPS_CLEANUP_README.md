# VPS Temizlik Scriptleri - Benalsam

Bu klasör VPS'te disk alanını temizlemek için otomatik script'ler içerir.

## 📁 Dosyalar

- `vps-cleanup.sh` - Ana temizlik script'i (VPS'te çalışır)
- `deploy-cleanup.sh` - Deploy script'i (Lokal'den VPS'e yükler)
- `VPS_CLEANUP_README.md` - Bu dosya

## 🚀 Kullanım

### Hızlı Başlangıç

```bash
# VPS'i otomatik temizle
./deploy-cleanup.sh
```

### Manuel Kullanım

```bash
# 1. Script'i VPS'e yükle
scp vps-cleanup.sh root@209.227.228.96:/tmp/

# 2. VPS'e bağlan
ssh root@209.227.228.96

# 3. Script'i çalıştır
chmod +x /tmp/vps-cleanup.sh
/tmp/vps-cleanup.sh
```

## 🧹 Temizlik İşlemleri

Script şu işlemleri yapar:

### 1. Docker Temizliği
- Çalışan container'ları durdur
- Tüm container'ları sil
- Docker system prune (image, volume, cache)
- Overlay2 dizini kontrolü

### 2. Proje Dosyaları
- `/opt/benalsam-admin/benalsam-monorepo`
- `/opt/benalsam-monorepo`
- `/root/benalsam-monorepo`
- `/home/ubuntu/benalsam-monorepo`

### 3. Sistem Cache
- `apt-get clean`
- `apt-get autoremove`
- `/var/cache` temizliği

### 4. Log Dosyaları
- `/var/log/*.log` (10MB+ dosyalar)
- `/var/log/*.gz`
- `/tmp/*`, `/var/tmp/*`
- `journalctl --vacuum-time=1d`

### 5. Node.js Cache
- `/root/.npm`
- `/root/.cache`
- `/root/.node-gyp`
- `/home/ubuntu/.npm` (varsa)

### 6. Nginx Log
- `/var/log/nginx/*.log` (10MB+ dosyalar)

### 7. Sistem Güncellemeleri
- `apt-get update`
- `apt-get autoremove --purge`

## 📊 Hedef

**Hedef:** 21GB boş alan elde etmek

**Kontrol:** Script otomatik olarak hedefi kontrol eder ve sonucu raporlar.

## 🔧 Gereksinimler

### VPS'te Gerekli
- `bc` (hesaplama için)
- `docker` (varsa)
- `apt-get` (Ubuntu/Debian)

### Lokal'de Gerekli
- `ssh` client
- `scp` client
- SSH key authentication

## 📝 Çıktı Örneği

```
[2025-07-20 07:30:15] VPS Temizlik Scripti Başlatılıyor...
[2025-07-20 07:30:15] Başlangıç disk durumu:
Filesystem              Size  Used Avail Use% Mounted on
/dev/mapper/vg-lv_root   39G   27G   11G  72% /

[2025-07-20 07:30:15] Mevcut boş alan: 11.0GB
[2025-07-20 07:30:15] 1. Docker servisleri durduruluyor...
[2025-07-20 07:30:16] 2. Docker cache temizleniyor...
[2025-07-20 07:30:20] 3. Eski proje dosyaları temizleniyor...
[2025-07-20 07:30:21] 4. Sistem cache'leri temizleniyor...
[2025-07-20 07:30:22] 5. Log dosyaları temizleniyor...
[2025-07-20 07:30:23] 6. Journal log'ları temizleniyor...
[2025-07-20 07:30:24] 7. Node.js cache'leri temizleniyor...
[2025-07-20 07:30:25] 8. Nginx log'ları temizleniyor...
[2025-07-20 07:30:26] 9. Sistem güncellemeleri kontrol ediliyor...
[2025-07-20 07:30:28] 10. Gereksiz paketler kaldırılıyor...

[2025-07-20 07:30:30] Temizlik tamamlandı!
[2025-07-20 07:30:30] Son disk durumu:
Filesystem              Size  Used Avail Use% Mounted on
/dev/mapper/vg-lv_root   39G   17G   21G  46% /

[2025-07-20 07:30:30] Temizlik öncesi: 11.0GB
[2025-07-20 07:30:30] Temizlik sonrası: 21.0GB
[2025-07-20 07:30:30] Kazanılan alan: 10.0GB
[2025-07-20 07:30:30] ✅ HEDEF BAŞARILI: 21GB+ boş alan elde edildi!
```

## ⚠️ Uyarılar

1. **Yedekleme:** Script çalıştırmadan önce önemli verileri yedekleyin
2. **Docker:** Çalışan servisler durdurulacak
3. **Log'lar:** Eski log dosyaları silinecek
4. **Cache:** Tüm cache'ler temizlenecek

## 🛠️ Sorun Giderme

### SSH Bağlantı Hatası
```bash
# SSH key'leri kontrol et
ssh-add -l

# Manuel bağlantı test et
ssh root@209.227.228.96
```

### Script Çalışmıyor
```bash
# Çalıştırma izni ver
chmod +x vps-cleanup.sh

# Manuel çalıştır
bash vps-cleanup.sh
```

### Disk Alanı Yetersiz
```bash
# Manuel büyük dosyaları bul
ssh root@209.227.228.96 "du -h --max-depth=1 / 2>/dev/null | sort -hr | head -10"
```

## 📞 Destek

Sorun yaşarsanız:
1. Script çıktısını kontrol edin
2. VPS disk durumunu kontrol edin
3. Manuel temizlik yapın

---

**Not:** Bu script'ler production VPS'lerde dikkatli kullanılmalıdır. 