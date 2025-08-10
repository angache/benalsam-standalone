# Nginx Yedeklemeleri

Bu klasör VPS'deki Nginx konfigürasyonlarının yedeklerini içerir.

## Klasör Yapısı

```
nginx-backups/
├── README.md                    # Bu dosya
├── 2025-07-25/                  # 25 Temmuz 2025 yedeklemesi
│   ├── nginx-backup-20250725_225608.tar.gz  # Sıkıştırılmış yedekleme
│   └── BACKUP_REPORT.txt        # Yedekleme raporu ve restore talimatları
└── [gelecek-tarihler]/          # Gelecek yedeklemeler
```

## İçerik

Her yedekleme şunları içerir:
- Nginx site konfigürasyonları
- SSL sertifikaları (Let's Encrypt)
- Nginx ana konfigürasyonu
- Restore talimatları

## Restore

Yedeklemeyi geri yüklemek için:
1. `BACKUP_REPORT.txt` dosyasını okuyun
2. VPS'de restore talimatlarını takip edin

## Güvenlik

Bu dosyalar SSL sertifikaları içerir. Güvenli bir yerde saklayın!
