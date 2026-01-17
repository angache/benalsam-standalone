# 🔍 VPS Kontrol Komutları

VPS'e bağlandıktan sonra bu komutları sırayla çalıştırın.

---

## 📋 Kontrol Adımları

### 1. PM2 Servislerini Kontrol Et

```bash
pm2 list
```

**Beklenen:** Tüm `benalsam-*` servisleri `online` durumunda olmalı.

**Hızlı Özet:**
```bash
pm2 list | grep benalsam | awk '{print $2, "-", $10}'
```

**Beklenen Çıktı:**
```
benalsam-admin-backend - online
benalsam-elasticsearch-service - online
benalsam-upload-service - online
benalsam-listing-service - online
benalsam-backup-service - online
benalsam-cache-service - online
benalsam-categories-service - online
benalsam-search-service - online
benalsam-realtime-service - online
```

**Eğer offline servis varsa:**
```bash
# Servisi yeniden başlat
pm2 restart <servis-adi>

# Logları kontrol et
pm2 logs <servis-adi> --lines 50
```

---

### 2. Docker Container'ları Kontrol Et

```bash
docker ps
```

**Beklenen:** Redis, Elasticsearch, RabbitMQ, Prometheus, Grafana çalışıyor olmalı.

**Hızlı Özet:**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "redis|elasticsearch|rabbitmq|prometheus|grafana"
```

**Beklenen Çıktı:**
```
NAMES              STATUS
redis              Up X minutes
elasticsearch       Up X minutes
rabbitmq            Up X minutes
prometheus          Up X minutes
grafana             Up X minutes
```

**Eğer container çalışmıyorsa:**
```bash
# Container'ı başlat
docker start <container-name>

# Veya docker-compose ile
cd /opt/benalsam/infrastructure
docker-compose up -d
```

---

### 3. Nginx Durumunu Kontrol Et

```bash
systemctl status nginx
```

**Beklenen:** `Active: active (running)`

**Config Kontrolü:**
```bash
nginx -t
```

**Beklenen Çıktı:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Eğer hata varsa:**
```bash
# Nginx'i yeniden başlat
systemctl reload nginx
```

---

### 4. SSL Sertifikasını Kontrol Et

```bash
curl -I https://api.benalsam.com/api/v1/admin/health
```

**Beklenen Çıktı:**
```
HTTP/2 200
...
```

**Eğer SSL hatası varsa:**
```bash
# SSL sertifikasını kontrol et
certbot certificates

# Gerekirse yenile
certbot renew --force-renewal
systemctl reload nginx
```

---

### 5. Health Endpoint'lerini Test Et

```bash
# Admin Backend
echo "Admin Backend:"
curl -s https://api.benalsam.com/api/v1/admin/health | jq '.status // .health'

# Diğer servisler
for service in elasticsearch upload listings cache categories search realtime; do
  echo -n "$service: "
  curl -s https://api.benalsam.com/api/v1/$service/health | jq -r '.status // .health // "unknown"'
done
```

**Beklenen Çıktı:**
```
Admin Backend: "healthy"
elasticsearch: "healthy"
upload: "healthy"
listings: "healthy"
cache: "healthy"
categories: "healthy"
search: "healthy"
realtime: "healthy"
```

**Eğer bir servis `healthy` değilse:**
```bash
# Servis loglarını kontrol et
pm2 logs <servis-adi> --lines 50

# Servisi yeniden başlat
pm2 restart <servis-adi>
```

---

### 6. CORS Kontrolü

```bash
curl -H "Origin: https://benalsam.vercel.app" \
     -X OPTIONS \
     https://api.benalsam.com/api/v1/admin/health \
     -I | grep -i "access-control"
```

**Beklenen Çıktı:**
```
access-control-allow-origin: https://benalsam.vercel.app
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
access-control-allow-headers: Content-Type, Authorization
```

**Eğer CORS header yoksa:**
```bash
# Admin Backend .env dosyasını kontrol et
cat /opt/benalsam/services/benalsam-admin-backend/.env | grep CORS

# CORS_ORIGIN ekle (gerekirse)
echo 'CORS_ORIGIN=https://benalsam.vercel.app' >> /opt/benalsam/services/benalsam-admin-backend/.env

# Servisi yeniden başlat
pm2 restart benalsam-admin-backend
```

---

## ✅ Kontrol Sonucu

Tüm kontroller ✅ ise → **Vercel'e deploy edebilirsiniz!**

Herhangi bir ❌ varsa → Yukarıdaki çözümleri uygulayın.

---

## 🚀 Hızlı Kontrol Scripti (Opsiyonel)

Eğer script kullanmak isterseniz:

```bash
# Script'i VPS'e kopyala (local'den)
scp scripts/vps-quick-check.sh root@46.62.212.96:/root/

# VPS'de çalıştır
ssh root@46.62.212.96 "chmod +x /root/vps-quick-check.sh && /root/vps-quick-check.sh"
```

---

## 📊 Kontrol Sonrası

Kontrol tamamlandıktan sonra:

1. **Tüm kontroller ✅ ise:**
   - Vercel Dashboard'a gidin
   - Environment variables'ları ekleyin (VERCEL_ENV_VARIABLES.md'ye göre)
   - Deploy edin

2. **Herhangi bir ❌ varsa:**
   - Sorunları düzeltin
   - Tekrar kontrol edin
   - Sonra deploy edin

---

## 🆘 Yardım

Sorun yaşarsanız:
- PM2 logları: `pm2 logs <servis-adi> --lines 100`
- Nginx logları: `tail -f /var/log/nginx/error.log`
- Docker logları: `docker logs <container-name>`

