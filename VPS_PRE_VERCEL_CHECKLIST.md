# ✅ VPS PRE-VERCEL DEPLOYMENT CHECKLIST

Bu checklist, Vercel'e deploy etmeden önce VPS'deki servislerin hazır olduğundan emin olmak için kullanılır.

---

## 🎯 AMAÇ

Vercel'de deploy edilen frontend'in, VPS'de çalışan backend mikroservislere bağlanabilmesi için gerekli kontroller.

---

## 📋 KONTROL LİSTESİ

### 1. ✅ VPS'de Çalışan Servisler

#### Mikroservisler (PM2 ile)

```bash
# VPS'e SSH ile bağlan
ssh root@46.62.212.96

# PM2 servislerini kontrol et
pm2 list

# Beklenen servisler:
# ✅ benalsam-admin-backend (port 3002)
# ✅ benalsam-elasticsearch-service (port 3006)
# ✅ benalsam-upload-service (port 3007)
# ✅ benalsam-listing-service (port 3008)
# ✅ benalsam-backup-service (port 3013)
# ✅ benalsam-cache-service (port 3014)
# ✅ benalsam-categories-service (port 3015)
# ✅ benalsam-search-service (port 3016)
# ✅ benalsam-realtime-service (port 3019)
```

**Kontrol Komutu:**
```bash
pm2 list | grep -E "benalsam-|online|errored|stopped"
```

**Beklenen Çıktı:** Tüm servisler `online` durumunda olmalı.

---

### 2. ✅ Infrastructure Servisleri (Docker)

```bash
# Docker container'ları kontrol et
docker ps

# Beklenen servisler:
# ✅ Redis (port 6379)
# ✅ Elasticsearch (port 9200)
# ✅ RabbitMQ (port 5672, 15672)
# ✅ Prometheus (port 9090)
# ✅ Grafana (port 3000)
```

**Kontrol Komutu:**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Beklenen Çıktı:** Tüm container'lar `Up` durumunda olmalı.

---

### 3. ✅ Nginx Reverse Proxy

```bash
# Nginx durumunu kontrol et
systemctl status nginx

# Nginx config'i kontrol et
nginx -t

# Beklenen: "syntax is ok" ve "test is successful"
```

**Kontrol Komutu:**
```bash
curl -I https://api.benalsam.com/api/v1/admin/health
```

**Beklenen Çıktı:** `HTTP/2 200` veya `HTTP/1.1 200 OK`

---

### 4. ✅ SSL Sertifikası

```bash
# SSL sertifikasını kontrol et
certbot certificates

# Beklenen: api.benalsam.com için geçerli sertifika
```

**Kontrol Komutu:**
```bash
curl -I https://api.benalsam.com/api/v1/admin/health
```

**Beklenen Çıktı:** HTTPS bağlantısı başarılı (SSL hatası yok)

---

### 5. ✅ API Health Endpoints

Her servisin health endpoint'ini test et:

```bash
# Admin Backend
curl https://api.benalsam.com/api/v1/admin/health

# Elasticsearch Service
curl https://api.benalsam.com/api/v1/elasticsearch/health

# Upload Service
curl https://api.benalsam.com/api/v1/upload/health

# Listing Service
curl https://api.benalsam.com/api/v1/listings/health

# Cache Service
curl https://api.benalsam.com/api/v1/cache/health

# Categories Service
curl https://api.benalsam.com/api/v1/categories/health

# Search Service
curl https://api.benalsam.com/api/v1/search/health

# Realtime Service
curl https://api.benalsam.com/api/v1/realtime/health
```

**Beklenen Çıktı:** Her endpoint `{"status":"healthy"}` veya benzeri bir JSON response döndürmeli.

---

### 6. ✅ CORS Ayarları

Admin Backend'in CORS ayarlarını kontrol et:

```bash
# VPS'de Admin Backend .env dosyasını kontrol et
cat /opt/benalsam/services/benalsam-admin-backend/.env | grep CORS

# Veya kod içinde kontrol et
grep -r "benalsam.vercel.app" /opt/benalsam/services/benalsam-admin-backend/src/config/
```

**Beklenen:** `https://benalsam.vercel.app` CORS origins listesinde olmalı.

**Kontrol Komutu:**
```bash
curl -H "Origin: https://benalsam.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.benalsam.com/api/v1/admin/health
```

**Beklenen Çıktı:** CORS headers döndürülmeli (`Access-Control-Allow-Origin: https://benalsam.vercel.app`)

---

### 7. ✅ Environment Variables (Vercel)

Vercel Dashboard'da aşağıdaki environment variables'ların ayarlandığından emin ol:

```env
# Frontend API URL'leri (VPS'deki servislere işaret ediyor)
NEXT_PUBLIC_ADMIN_BACKEND_URL=https://api.benalsam.com/api/v1
NEXT_PUBLIC_ADMIN_BACKEND_WS_URL=wss://api.benalsam.com

# Supabase (zaten cloud'da)
NEXT_PUBLIC_SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Environment
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# Server-only (API routes için)
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_BACKEND_JWT_SECRET=...
```

**Kontrol:** Vercel Dashboard → Settings → Environment Variables

---

### 8. ✅ Firewall Ayarları

VPS firewall'unda gerekli portların açık olduğundan emin ol:

```bash
# UFW durumunu kontrol et
ufw status

# Beklenen açık portlar:
# ✅ 80 (HTTP)
# ✅ 443 (HTTPS)
# ✅ 22 (SSH)
```

**Kontrol Komutu:**
```bash
ufw status numbered
```

---

### 9. ✅ DNS Ayarları

DNS kayıtlarını kontrol et:

```bash
# A Record kontrolü
dig api.benalsam.com A +short

# Beklenen: 46.62.212.96 (VPS IP)
```

**Kontrol Komutu:**
```bash
nslookup api.benalsam.com
```

**Beklenen Çıktı:** `api.benalsam.com` → `46.62.212.96`

---

### 10. ✅ Database Bağlantıları

VPS'deki servislerin Supabase'e bağlanabildiğinden emin ol:

```bash
# Admin Backend loglarını kontrol et
pm2 logs benalsam-admin-backend --lines 50 | grep -i "database\|supabase\|connected"

# Beklenen: "Database connected" veya benzeri başarı mesajı
```

**Kontrol Komutu:**
```bash
curl https://api.benalsam.com/api/v1/admin/health | jq '.database'
```

**Beklenen Çıktı:** `"healthy"` veya `"connected"`

---

## 🚀 HIZLI TEST SCRIPT

Tüm kontrolleri tek seferde yapmak için:

```bash
#!/bin/bash
# vps-pre-vercel-check.sh

echo "🔍 VPS Pre-Vercel Deployment Check"
echo "=================================="
echo ""

# 1. PM2 Servisler
echo "1️⃣  PM2 Servisler:"
pm2 list | grep benalsam | awk '{print "   ✅", $2, "-", $10}'
echo ""

# 2. Docker Container'lar
echo "2️⃣  Docker Container'lar:"
docker ps --format "   ✅ {{.Names}} - {{.Status}}" | grep -E "redis|elasticsearch|rabbitmq|prometheus|grafana"
echo ""

# 3. Nginx
echo "3️⃣  Nginx:"
nginx -t 2>&1 | grep -q "successful" && echo "   ✅ Nginx config OK" || echo "   ❌ Nginx config ERROR"
echo ""

# 4. SSL
echo "4️⃣  SSL Sertifikası:"
curl -I https://api.benalsam.com/api/v1/admin/health 2>&1 | grep -q "HTTP" && echo "   ✅ SSL OK" || echo "   ❌ SSL ERROR"
echo ""

# 5. Health Endpoints
echo "5️⃣  Health Endpoints:"
for service in admin elasticsearch upload listings cache categories search realtime; do
  status=$(curl -s https://api.benalsam.com/api/v1/$service/health | jq -r '.status // .health // "unknown"')
  if [ "$status" = "healthy" ] || [ "$status" = "ok" ]; then
    echo "   ✅ $service - $status"
  else
    echo "   ❌ $service - $status"
  fi
done
echo ""

# 6. CORS
echo "6️⃣  CORS:"
cors=$(curl -s -H "Origin: https://benalsam.vercel.app" -X OPTIONS https://api.benalsam.com/api/v1/admin/health -I | grep -i "access-control-allow-origin")
if [ -n "$cors" ]; then
  echo "   ✅ CORS configured"
else
  echo "   ❌ CORS not configured"
fi
echo ""

echo "✅ Check complete!"
```

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Tüm servisler çalışıyor olmalı** - Vercel'deki frontend VPS'deki servislere bağlanacak
2. **SSL sertifikası geçerli olmalı** - HTTPS bağlantısı zorunlu
3. **CORS ayarları doğru olmalı** - Vercel domain'i CORS listesinde olmalı
4. **Environment variables ayarlanmalı** - Vercel Dashboard'da `NEXT_PUBLIC_ADMIN_BACKEND_URL` doğru olmalı

---

## 🐛 SORUN GİDERME

### Sorun: Health endpoint'ler çalışmıyor

**Çözüm:**
```bash
# Servisleri yeniden başlat
pm2 restart all

# Logları kontrol et
pm2 logs benalsam-admin-backend --lines 100
```

### Sorun: CORS hatası

**Çözüm:**
```bash
# Admin Backend .env dosyasını güncelle
echo 'CORS_ORIGIN=https://benalsam.vercel.app' >> /opt/benalsam/services/benalsam-admin-backend/.env

# Servisi yeniden başlat
pm2 restart benalsam-admin-backend
```

### Sorun: SSL hatası

**Çözüm:**
```bash
# SSL sertifikasını yenile
certbot renew --force-renewal

# Nginx'i yeniden başlat
systemctl reload nginx
```

---

## ✅ DEPLOYMENT ÖNCESİ SON KONTROL

Vercel'e deploy etmeden önce:

- [ ] Tüm PM2 servisleri `online`
- [ ] Tüm Docker container'lar `Up`
- [ ] Nginx çalışıyor ve config doğru
- [ ] SSL sertifikası geçerli
- [ ] Tüm health endpoint'ler çalışıyor
- [ ] CORS ayarları doğru
- [ ] Vercel environment variables ayarlı
- [ ] DNS kayıtları doğru
- [ ] Firewall portları açık
- [ ] Database bağlantıları çalışıyor

**Tüm kontroller ✅ ise → Vercel'e deploy edebilirsiniz!**

