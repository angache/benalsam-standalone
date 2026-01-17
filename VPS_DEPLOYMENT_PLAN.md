# 🚀 VPS DEPLOYMENT PLAN - BENALSAM

**VPS Bilgileri:**
- **Server**: CAX21 (Hetzner Cloud)
- **IP**: 46.62.212.46
- **Location**: Helsinki, Finland
- **Resources**: 4 vCPU, 8 GB RAM, 80 GB Disk
- **Price**: €5.99/month

---

## 📋 NE TAŞINACAK?

### ✅ **TAŞINACAK SERVİSLER** (9 Microservice)

| Servis | Port | Durum | Öncelik |
|--------|------|-------|---------|
| **Admin Backend** | 3002 | ✅ Production Ready | 🔴 Yüksek |
| **Elasticsearch Service** | 3006 | ✅ Production Ready | 🔴 Yüksek |
| **Upload Service** | 3007 | ✅ Production Ready | 🔴 Yüksek |
| **Listing Service** | 3008 | ✅ Production Ready | 🔴 Yüksek |
| **Backup Service** | 3013 | ✅ Production Ready | 🟡 Orta |
| **Cache Service** | 3014 | ✅ Production Ready | 🟡 Orta |
| **Categories Service** | 3015 | ✅ Production Ready | 🟡 Orta |
| **Search Service** | 3016 | ✅ Production Ready | 🟡 Orta |
| **Realtime Service** | 3019 | ✅ Production Ready | 🟡 Orta |

### ✅ **TAŞINACAK INFRASTRUCTURE**

| Servis | Port | Durum | Notlar |
|--------|------|-------|--------|
| **Redis** | 6379 | ✅ **ZATEN ÇALIŞIYOR** | 209.227.228.96:6379 |
| **Elasticsearch** | 9200 | ✅ **ZATEN ÇALIŞIYOR** | 209.227.228.96:9200 |
| **RabbitMQ** | 5672, 15672 | ⏳ Kurulacak | Message Queue |
| **Prometheus** | 9090 | ⏳ Kurulacak | Metrics |
| **Grafana** | 3000 | ⏳ Kurulacak | Dashboard |

### ❌ **TAŞINMAYACAK SERVİSLER**

| Servis | Neden |
|--------|-------|
| **PostgreSQL** | Supabase kullanılıyor (Cloud) |
| **Cloudinary** | Cloud servis (değişiklik yok) |
| **Admin UI** | Local development (şimdilik) |
| **Web App** | Vercel/Netlify'da olabilir |
| **Mobile App** | Local development |

---

## 🎯 DEPLOYMENT STRATEJİSİ

### **Faz 1: Infrastructure Setup** (30-60 dakika)
1. ✅ VPS hazırlığı (Node.js, Docker, Nginx)
2. ✅ **Mevcut servisler**: Redis ✅ ve Elasticsearch ✅ zaten çalışıyor
3. ⏳ Infrastructure servisleri (RabbitMQ - yeni kurulacak)
4. ⏳ Monitoring (Prometheus, Grafana - yeni kurulacak)
5. ✅ Firewall ve güvenlik

### **Faz 2: Core Services** (2-3 saat)
1. ✅ Admin Backend
2. ✅ Elasticsearch Service
3. ✅ Upload Service
4. ✅ Listing Service

### **Faz 3: Supporting Services** (1-2 saat)
1. ✅ Backup Service
2. ✅ Cache Service
3. ✅ Categories Service
4. ✅ Search Service
5. ✅ Realtime Service

### **Faz 4: Production Setup** (1 saat)
1. ✅ Nginx reverse proxy
2. ✅ SSL sertifikası (Let's Encrypt)
3. ✅ PM2 process management
4. ✅ Health checks ve monitoring

---

## 📊 KAYNAK KULLANIMI TAHMİNİ

### **Mevcut VPS: 4 vCPU, 8 GB RAM, 80 GB Disk**

| Servis | CPU | RAM | Disk | Notlar |
|--------|-----|-----|------|--------|
| **Redis** | 0.1 | 256 MB | 1 GB | ✅ Zaten çalışıyor |
| **Elasticsearch** | 0.5 | 1 GB | 10 GB | ✅ Zaten çalışıyor |
| **RabbitMQ** | 0.2 | 512 MB | 2 GB | ⏳ Yeni kurulacak |
| **Prometheus** | 0.1 | 256 MB | 5 GB | ⏳ Yeni kurulacak |
| **Grafana** | 0.1 | 256 MB | 1 GB | ⏳ Yeni kurulacak |
| **9 Microservice** | 1.5 | 4 GB | 10 GB | PM2 (ortalama) |
| **Sistem** | 0.5 | 1 GB | 5 GB | OS, logs, etc. |
| **Toplam** | **3.0** | **7.3 GB** | **34 GB** | ✅ Yeterli |

**Not**: Redis ve Elasticsearch zaten çalıştığı için kaynak kullanımı daha az olacak.

**Sonuç**: ✅ VPS kaynakları yeterli (yaklaşık %90 kullanım)

---

## 🔧 DEPLOYMENT YÖNTEMİ

### **Seçenek 1: Docker Compose** (Önerilen)
- ✅ Kolay yönetim
- ✅ Servis izolasyonu
- ✅ Otomatik restart
- ❌ Daha fazla kaynak kullanımı

### **Seçenek 2: PM2 + Docker Hybrid**
- ✅ Infrastructure: Docker (Redis, ES, RabbitMQ)
- ✅ Microservices: PM2 (daha az kaynak)
- ✅ En iyi performans
- ✅ Önerilen yöntem

---

## 📝 DEPLOYMENT ADIMLARI

### **1. VPS Hazırlığı**
```bash
# SSH bağlantısı
ssh root@46.62.212.46

# Sistem güncellemesi
apt update && apt upgrade -y

# Temel araçlar
apt install -y curl wget git build-essential
```

### **2. Node.js & Docker Kurulumu**
```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# PM2
npm install -g pm2
```

### **3. Infrastructure Servisleri**
```bash
# Infrastructure dizini
mkdir -p /opt/benalsam/infrastructure
cd /opt/benalsam/infrastructure

# NOT: Redis ve Elasticsearch zaten çalışıyor (209.227.228.96)
# Sadece RabbitMQ, Prometheus ve Grafana kurulacak

# Docker Compose ile başlat (sadece yeni servisler)
docker-compose up -d rabbitmq prometheus grafana
```

### **4. Microservice Deployment**
```bash
# Servisler dizini
mkdir -p /opt/benalsam/services

# Her servis için:
cd /opt/benalsam/services/[service-name]
git clone [repo-url] .
npm install
npm run build
pm2 start ecosystem.config.js
```

### **5. Nginx Reverse Proxy**
```bash
# Nginx kurulumu
apt install -y nginx

# Configuration
/etc/nginx/sites-available/benalsam
```

### **6. SSL Sertifikası**
```bash
# Certbot kurulumu
apt install -y certbot python3-certbot-nginx

# SSL sertifikası
certbot --nginx -d api.benalsam.com
```

---

## ⚠️ DİKKAT EDİLMESİ GEREKENLER

### **1. Environment Variables**
- ✅ Her servis için `.env` dosyası hazırlanmalı
- ✅ Production secrets güvenli saklanmalı
- ✅ Database connection strings güncellenmeli

### **2. Database Bağlantıları**
- ✅ Supabase connection string'leri kontrol edilmeli
- ✅ **Redis**: Zaten çalışıyor (209.227.228.96:6379) - Bağlantı kontrol edilmeli
- ✅ **Elasticsearch**: Zaten çalışıyor (209.227.228.96:9200) - Bağlantı kontrol edilmeli
- ⏳ **RabbitMQ**: Yeni kurulacak - Connection string'ler güncellenmeli

### **3. Port Yönetimi**
- ✅ Firewall kuralları ayarlanmalı
- ✅ Sadece gerekli portlar açılmalı
- ✅ Nginx reverse proxy kullanılmalı

### **4. Monitoring**
- ✅ Prometheus metrics toplama
- ✅ Grafana dashboard'ları
- ✅ Alert kuralları

### **5. Backup**
- ✅ Database backup stratejisi
- ✅ Log rotation
- ✅ Disaster recovery planı

---

## 🎯 SONRAKI ADIMLAR

1. ✅ **Plan onayı** (şu an)
2. ⏳ **VPS hazırlığı** (script hazırla)
3. ⏳ **Infrastructure deployment** (Docker)
4. ⏳ **Microservice deployment** (PM2)
5. ⏳ **Nginx & SSL** (reverse proxy)
6. ⏳ **Testing & Monitoring** (health checks)

---

**Son Güncelleme**: 12 Ocak 2026
**Durum**: Planlama aşaması

