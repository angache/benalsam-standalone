# 🚀 VPS Deployment Tamamlandı

**Tarih**: 18 Ocak 2026  
**Durum**: ✅ PRODUCTION LIVE

---

## 🎉 benalsam.com Yayında!

| Domain | Platform | Açıklama |
|--------|----------|----------|
| `www.benalsam.com` | Vercel | Frontend (Next.js) |
| `benalsam.com` | Vercel | Redirect to www |
| `api.benalsam.com` | VPS | Backend API (9 microservice) |

---

## 📦 VPS Konfigürasyonu

### Sunucu Bilgileri
- **Provider**: Hetzner Cloud
- **Server Type**: CAX21 (ARM64)
- **IP Address**: 46.62.212.46
- **OS**: Ubuntu 22.04 LTS
- **SSH**: `ssh -i ~/.ssh/hetzner_cloud root@46.62.212.46`

### Kurulu Yazılımlar
- Node.js 20.19+
- PM2 (Process Manager)
- Nginx (Reverse Proxy)
- Docker (Redis, Elasticsearch, RabbitMQ)
- Certbot (SSL - Let's Encrypt)

---

## 🔧 Microservices (9 Servis)

| Servis | Port | Endpoint | Durum |
|--------|------|----------|-------|
| Admin Backend | 3002 | `/api/v1/admin/*` | ✅ |
| Elasticsearch Service | 3006 | `/api/v1/elasticsearch/*` | ✅ |
| Upload Service | 3007 | `/api/v1/upload/*` | ✅ |
| Listing Service | 3008 | `/api/v1/listings/*` | ✅ |
| Backup Service | 3013 | `/api/v1/backup/*` | ✅ |
| Cache Service | 3014 | `/api/v1/cache/*` | ✅ |
| Categories Service | 3015 | `/api/v1/categories/*` | ✅ |
| Search Service | 3016 | `/api/v1/search/*` | ✅ |
| Realtime Service | 3019 | `/api/v1/realtime/*` | ✅ |

### Health Check
```bash
# Tüm servislerin health durumunu kontrol et
for port in 3002 3006 3007 3008 3013 3014 3015 3016 3019; do
  echo "Port $port: $(curl -s http://localhost:$port/api/v1/health | jq -r '.status' 2>/dev/null || echo 'FAIL')"
done
```

---

## 🌐 Nginx Konfigürasyonu

**Dosya**: `/etc/nginx/sites-enabled/benalsam`

### Upstream Tanımları
```nginx
upstream admin_backend { server 127.0.0.1:3002; }
upstream elasticsearch_service { server 127.0.0.1:3006; }
upstream upload_service { server 127.0.0.1:3007; }
upstream listing_service { server 127.0.0.1:3008; }
upstream backup_service { server 127.0.0.1:3013; }
upstream cache_service { server 127.0.0.1:3014; }
upstream categories_service { server 127.0.0.1:3015; }
upstream search_service { server 127.0.0.1:3016; }
upstream realtime_service { server 127.0.0.1:3019; }
```

### Location Blokları
```nginx
location /api/v1/admin/ { proxy_pass http://admin_backend; }
location /api/v1/elasticsearch/ { proxy_pass http://elasticsearch_service; }
location /api/v1/upload/ { proxy_pass http://upload_service; }
location /api/v1/listings/ { proxy_pass http://listing_service; }
location /api/v1/backup/ { proxy_pass http://backup_service; }
location /api/v1/cache/ { proxy_pass http://cache_service; }
location /api/v1/categories/ { proxy_pass http://categories_service; }
location /api/v1/search/ { proxy_pass http://search_service; }
location /api/v1/realtime/ { proxy_pass http://realtime_service; }
```

### Nginx Komutları
```bash
# Config test
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Status
sudo systemctl status nginx
```

---

## 🔐 SSL Sertifikası

- **Provider**: Let's Encrypt
- **Tool**: Certbot
- **Auto-renew**: Aktif

```bash
# Sertifika durumu
sudo certbot certificates

# Manuel yenileme
sudo certbot renew
```

---

## ⚙️ PM2 Process Manager

### Komutlar
```bash
# Tüm servisleri listele
pm2 list

# Tüm servisleri yeniden başlat
pm2 restart all

# Belirli bir servisi yeniden başlat
pm2 restart benalsam-search-service

# Logları görüntüle
pm2 logs benalsam-search-service --lines 50

# Monitoring
pm2 monit
```

### Servis Yapısı
```
/opt/benalsam/benalsam-standalone/
├── benalsam-admin-backend/
├── benalsam-elasticsearch-service/
├── benalsam-upload-service/
├── benalsam-listing-service/
├── benalsam-backup-service/
├── benalsam-cache-service/
├── benalsam-categories-service/
├── benalsam-search-service/
└── benalsam-realtime-service/
```

---

## 🔄 CORS Konfigürasyonu

Her servisin `.env` dosyasında:

```env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,https://benalsam.vercel.app,https://www.benalsam.com,https://benalsam.com
```

### CORS Güncelleme Scripti
```bash
cd /opt/benalsam/benalsam-standalone

for service in benalsam-*-service benalsam-admin-backend; do
  if [ -f "$service/.env" ]; then
    # CORS_ORIGIN'e yeni domain ekle
    sed -i 's/CORS_ORIGIN=\(.*\)/CORS_ORIGIN=\1,https:\/\/yeni-domain.com/g' "$service/.env"
    echo "✅ $service güncellendi"
  fi
done

pm2 restart all
```

---

## 📊 Rate Limiting

Her servisin `.env` dosyasında:

```env
RATE_LIMIT_MAX=500
RATE_LIMIT_WINDOW_MS=60000
```

**429 Too Many Requests** hatası alındığında:
1. Rate limit'i artır
2. Servisi yeniden başlat: `pm2 restart <service-name>`

---

## 🐳 Docker Services

```bash
# Docker compose dosyası
cd /opt/benalsam/benalsam-standalone/benalsam-infrastructure

# Servisleri başlat
docker-compose up -d

# Durumu kontrol et
docker-compose ps
```

### Çalışan Containerlar
- **Redis**: localhost:6379
- **Elasticsearch**: localhost:9200
- **RabbitMQ**: localhost:5672 (Management: 15672)

---

## 🔧 Troubleshooting

### Servis Çalışmıyor
```bash
# Logları kontrol et
pm2 logs <service-name> --lines 100

# Servisi yeniden başlat
pm2 restart <service-name>

# Port kullanımını kontrol et
lsof -i :<port>
```

### CORS Hatası
```bash
# CORS ayarlarını kontrol et
cat /opt/benalsam/benalsam-standalone/<service>/.env | grep CORS

# Origin'i ekle ve servisi yeniden başlat
```

### 429 Rate Limit
```bash
# Rate limit'i artır
echo "RATE_LIMIT_MAX=1000" >> /opt/benalsam/benalsam-standalone/<service>/.env
pm2 restart <service>
```

### Nginx 502 Bad Gateway
```bash
# Nginx loglarını kontrol et
sudo tail -f /var/log/nginx/error.log

# Servisin çalıştığından emin ol
pm2 list
curl http://localhost:<port>/api/v1/health
```

---

## 📝 Deployment Checklist

- [x] VPS sunucusu kuruldu (Hetzner CAX21)
- [x] Node.js, PM2, Nginx, Docker kuruldu
- [x] Git repo klonlandı
- [x] 9 microservice deploy edildi
- [x] Nginx reverse proxy konfigüre edildi
- [x] SSL sertifikası alındı (Let's Encrypt)
- [x] CORS ayarları yapıldı
- [x] Rate limiting konfigüre edildi
- [x] Health check'ler başarılı
- [x] Frontend Vercel'e deploy edildi
- [x] Domain DNS ayarları yapıldı

---

## 📚 İlgili Dokümantasyon

- [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
- [SERVICE_PORTS_AND_ENDPOINTS.md](../SERVICE_PORTS_AND_ENDPOINTS.md)
- [VERCEL_ENV_VARIABLES.md](../benalsam-web-next/VERCEL_ENV_VARIABLES.md)
- [project_summary2.md](../project_summary2.md)

---

**Son Güncelleme**: 18 Ocak 2026
