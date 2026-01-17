# 🚀 VPS Quick Check - Vercel Deployment Öncesi

Bu rehber, Vercel'e deploy etmeden önce VPS'deki servislerin durumunu hızlıca kontrol etmek için kullanılır.

---

## 📋 Hızlı Kontrol Adımları

### 1. VPS'e Bağlan

```bash
ssh root@46.62.212.96
```

### 2. PM2 Servislerini Kontrol Et

```bash
pm2 list
```

**Beklenen:** Tüm `benalsam-*` servisleri `online` durumunda olmalı.

**Hızlı Kontrol:**
```bash
pm2 list | grep benalsam | grep -v "online" && echo "❌ Bazı servisler offline!" || echo "✅ Tüm servisler online"
```

### 3. Docker Container'ları Kontrol Et

```bash
docker ps
```

**Beklenen:** Redis, Elasticsearch, RabbitMQ, Prometheus, Grafana çalışıyor olmalı.

**Hızlı Kontrol:**
```bash
docker ps --format "{{.Names}}" | grep -E "redis|elasticsearch|rabbitmq|prometheus|grafana" | wc -l
# Beklenen: 5
```

### 4. Nginx Durumunu Kontrol Et

```bash
systemctl status nginx
nginx -t
```

**Beklenen:** Nginx çalışıyor ve config doğru.

### 5. SSL Sertifikasını Kontrol Et

```bash
curl -I https://api.benalsam.com/api/v1/admin/health
```

**Beklenen:** `HTTP/2 200` veya `HTTP/1.1 200 OK`

### 6. Health Endpoint'lerini Test Et

```bash
# Admin Backend
curl -s https://api.benalsam.com/api/v1/admin/health | jq '.status // .health'

# Diğer servisler
for service in elasticsearch upload listings cache categories search realtime; do
  echo -n "$service: "
  curl -s https://api.benalsam.com/api/v1/$service/health | jq -r '.status // .health // "unknown"'
done
```

**Beklenen:** Her endpoint `healthy`, `ok` veya `200` döndürmeli.

### 7. CORS Kontrolü

```bash
curl -H "Origin: https://benalsam.vercel.app" \
     -X OPTIONS \
     https://api.benalsam.com/api/v1/admin/health \
     -I | grep -i "access-control"
```

**Beklenen:** `Access-Control-Allow-Origin: https://benalsam.vercel.app` veya benzeri.

---

## 🔧 Otomatik Kontrol Scripti

VPS'de kontrol scriptini çalıştır:

```bash
# Script'i VPS'e kopyala (local'den)
scp scripts/vps-pre-vercel-check.sh root@46.62.212.96:/root/

# VPS'de çalıştır
ssh root@46.62.212.96 "chmod +x /root/vps-pre-vercel-check.sh && /root/vps-pre-vercel-check.sh"
```

Veya direkt VPS'de oluştur:

```bash
# VPS'de
cat > /root/vps-pre-vercel-check.sh << 'EOF'
#!/bin/bash
# ... (script içeriği)
EOF

chmod +x /root/vps-pre-vercel-check.sh
./vps-pre-vercel-check.sh
```

---

## ✅ Kontrol Sonucu

Tüm kontroller ✅ ise → **Vercel'e deploy edebilirsiniz!**

Herhangi bir ❌ varsa → Önce sorunları düzeltin.

---

## 🐛 Yaygın Sorunlar ve Çözümleri

### Sorun: PM2 servisleri offline

```bash
# Servisleri yeniden başlat
pm2 restart all

# Logları kontrol et
pm2 logs benalsam-admin-backend --lines 50
```

### Sorun: Health endpoint'ler çalışmıyor

```bash
# Nginx'i yeniden başlat
systemctl reload nginx

# Servisleri kontrol et
pm2 list
```

### Sorun: SSL hatası

```bash
# SSL sertifikasını kontrol et
certbot certificates

# Gerekirse yenile
certbot renew --force-renewal
systemctl reload nginx
```

### Sorun: CORS hatası

```bash
# Admin Backend .env dosyasını kontrol et
cat /opt/benalsam/services/benalsam-admin-backend/.env | grep CORS

# CORS_ORIGIN ekle (gerekirse)
echo 'CORS_ORIGIN=https://benalsam.vercel.app' >> /opt/benalsam/services/benalsam-admin-backend/.env

# Servisi yeniden başlat
pm2 restart benalsam-admin-backend
```

---

## 📊 Detaylı Kontrol

Daha detaylı kontrol için `VPS_PRE_VERCEL_CHECKLIST.md` dosyasına bakın.

