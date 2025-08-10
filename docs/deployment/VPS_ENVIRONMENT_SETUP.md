# 🔧 VPS Environment Setup Guide

## 📋 İçindekiler
1. [Environment Değişkenleri](#environment-değişkenleri)
2. [VPS IP Konfigürasyonu](#vps-ip-konfigürasyonu)
3. [Güvenlik Ayarları](#güvenlik-ayarları)
4. [Production Checklist](#production-checklist)

---

## 🌐 Environment Değişkenleri

### **VPS'de Kullanılan IP Adresleri:**

| Servis | Development | Production (VPS) |
|--------|-------------|------------------|
| **Redis** | `localhost` | `209.227.228.96` |
| **Elasticsearch** | `localhost:9200` | `http://209.227.228.96:9200` |
| **Admin Backend** | `localhost:3002` | `http://209.227.228.96:3002` |
| **Admin UI** | `localhost:3003` | `http://209.227.228.96:3003` |
| **Web** | `localhost:5173` | `http://209.227.228.96:5173` |

---

## 🔗 VPS IP Konfigürasyonu

### **1. Redis Konfigürasyonu:**
```bash
# Development
REDIS_HOST=localhost
REDIS_PORT=6379

# Production (VPS)
REDIS_HOST=209.227.228.96
REDIS_PORT=6379
```

### **2. Elasticsearch Konfigürasyonu:**
```bash
# Development
ELASTICSEARCH_URL=http://localhost:9200

# Production (VPS)
ELASTICSEARCH_URL=http://209.227.228.96:9200
```

### **3. Frontend API URL'leri:**
```bash
# Admin UI
VITE_API_URL=http://209.227.228.96:3002/api/v1
VITE_ELASTICSEARCH_URL=http://209.227.228.96:3002/api/v1/elasticsearch

# Web
VITE_API_URL=http://209.227.228.96:3002/api/v1
VITE_SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
```

### **4. CORS Ayarları:**
```bash
# Production CORS
CORS_ORIGIN=http://209.227.228.96:5173,http://209.227.228.96:3003
ALLOWED_ORIGINS=http://209.227.228.96:5173,http://209.227.228.96:3003
```

---

## 🔐 Güvenlik Ayarları

### **1. JWT Secret:**
```bash
# Güçlü bir JWT secret oluşturun
ADMIN_JWT_SECRET=your_very_secure_jwt_secret_here
```

### **2. Supabase Keys:**
```bash
# Supabase service role key (admin yetkileri)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Supabase anon key (public erişim)
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### **3. Rate Limiting:**
```bash
# API rate limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
```

---

## 🚀 Production Checklist

### **✅ Environment Setup:**
- [ ] `.env` dosyası oluşturuldu
- [ ] VPS IP adresleri doğru
- [ ] Supabase keys eklendi
- [ ] JWT secret güvenli
- [ ] CORS ayarları doğru

### **✅ Network Configuration:**
- [ ] Redis port (6379) açık
- [ ] Elasticsearch port (9200) açık
- [ ] Admin Backend port (3002) açık
- [ ] Admin UI port (3003) açık
- [ ] Web port (5173) açık

### **✅ Security:**
- [ ] Firewall aktif
- [ ] SSH key authentication
- [ ] Root login kapalı
- [ ] Fail2ban kurulu
- [ ] SSL sertifikası (opsiyonel)

### **✅ Monitoring:**
- [ ] PM2 monitoring aktif
- [ ] Log rotation ayarlandı
- [ ] Backup sistemi kurulu
- [ ] Health check endpoints

---

## 🔧 Environment Template Kullanımı

### **1. Template'i Kopyala:**
```bash
# VPS'de
cp scripts/env.production.template .env
```

### **2. Gerekli Değerleri Güncelle:**
```bash
# .env dosyasını düzenle
nano .env

# Özellikle şunları güncelle:
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_ANON_KEY
# - ADMIN_JWT_SECRET
```

### **3. Environment'i Test Et:**
```bash
# Environment variables'ları kontrol et
pm2 show admin-backend

# Health check yap
curl http://localhost:3002/api/v1/health
```

---

## 🌍 Domain vs IP Kullanımı

### **IP Kullanımı (Mevcut):**
```bash
# Avantajlar:
# ✅ Hızlı setup
# ✅ DNS sorunu yok
# ✅ Direkt erişim

# Dezavantajlar:
# ❌ Güvenlik riski
# ❌ SSL sertifikası zor
# ❌ Professional görünüm yok
```

### **Domain Kullanımı (Önerilen):**
```bash
# Avantajlar:
# ✅ Professional görünüm
# ✅ SSL sertifikası kolay
# ✅ Güvenlik artırımı
# ✅ SEO avantajı

# Dezavantajlar:
# ❌ Domain satın alma
# ❌ DNS konfigürasyonu
# ❌ SSL sertifikası
```

### **Domain Setup (Gelecek):**
```bash
# 1. Domain satın al
# 2. DNS A record ekle
# 3. SSL sertifikası kur
# 4. Nginx reverse proxy ayarla
# 5. Environment'ı güncelle
```

---

## 🔄 Environment Güncelleme

### **1. Yeni Environment Değişkeni Ekleme:**
```bash
# 1. Template'i güncelle
nano scripts/env.production.template

# 2. Production config'i güncelle
nano ecosystem.production.config.js

# 3. VPS'de yeniden deploy et
pm2 reload ecosystem.production.config.js
```

### **2. IP Değişikliği:**
```bash
# 1. Tüm IP referanslarını güncelle
# 2. Firewall ayarlarını güncelle
# 3. DNS kayıtlarını güncelle (varsa)
# 4. Servisleri restart et
```

---

## 📊 Environment Monitoring

### **1. Environment Variables Kontrolü:**
```bash
# PM2 ile environment kontrolü
pm2 show admin-backend | grep env

# Process environment kontrolü
ps aux | grep node
```

### **2. Connection Test:**
```bash
# Redis bağlantı testi
redis-cli -h 209.227.228.96 ping

# Elasticsearch bağlantı testi
curl http://209.227.228.96:9200

# Admin Backend testi
curl http://209.227.228.96:3002/api/v1/health
```

### **3. Log Monitoring:**
```bash
# Environment hatalarını kontrol et
pm2 logs admin-backend --err | grep -i env

# Connection hatalarını kontrol et
pm2 logs admin-backend --err | grep -i connection
```

---

## 🎯 Özet

**VPS Environment Setup'ı şu adımları içerir:**

1. ✅ **IP Adresleri**: localhost → VPS IP
2. ✅ **Security Keys**: Supabase ve JWT
3. ✅ **CORS Settings**: VPS domain'leri
4. ✅ **Network Access**: Port açma
5. ✅ **Monitoring**: Health check ve logging

**Production deployment için environment hazır!** 🚀

---

*Bu rehber, VPS'de environment değişkenlerini doğru şekilde ayarlamak için hazırlanmıştır.* 