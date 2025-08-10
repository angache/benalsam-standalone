# 🔧 Environment Configuration TODO

> **Oluşturulma:** 2025-01-09  
> **Durum:** Devam Ediyor  
> **Öncelik:** Yüksek  
> **Tahmini Süre:** 2-3 saat

## 📋 **Genel Bakış**

Projedeki environment configuration sorunlarını çözmek ve standart bir yapı oluşturmak.

## 🎯 **Hedefler**

1. **Local Development** environment'ını düzelt
2. **VPS Production** environment'ını standardize et
3. **CORS sorunlarını** çöz
4. **Environment variable'ları** merkezi hale getir

## 📝 **Görevler**

### **Phase 1: Local Development Düzeltmeleri** ✅
- [x] **1.1** `ecosystem.config.js` dosyasını düzelt
  - [x] `REDIS_HOST` → `209.227.228.96` (VPS'deki Redis)
  - [x] `ELASTICSEARCH_URL` → `http://209.227.228.96:9200` (VPS'deki ES)
  - [x] `VITE_API_URL` kontrol et
  - [x] `VITE_ELASTICSEARCH_URL` → `http://209.227.228.96:9200` (VPS'deki ES)
  - [x] `SUPABASE_ANON_KEY` eklendi

- [x] **1.2** Local `.env` dosyası oluştur
  - [x] `env.local.example` template oluştur
  - [x] Local development değerleri ekle
  - [x] Supabase config'leri ekle
  - [x] CORS origin'leri ekle

### **Phase 2: VPS Production Düzeltmeleri**
- [ ] **2.1** VPS `.env` dosyasını düzelt
  - [ ] `scripts/env.production.template` güncelle
  - [ ] `benalsam.com` domain'ini CORS'a ekle
  - [ ] `SERVER_IP` variable'ını düzgün tanımla
  - [ ] Supabase config'leri kontrol et

- [ ] **2.2** Docker compose düzeltmeleri
  - [ ] `${SERVER_IP}` variable'ını düzgün kullan
  - [ ] CORS origin'leri güncelle
  - [ ] Environment variable'ları kontrol et

### **Phase 3: CORS Sorunları**
- [ ] **3.1** Admin backend CORS ayarları
  - [ ] `securityConfig.corsOrigin` kontrol et
  - [ ] `benalsam.com:3003` ekle
  - [ ] `benalsam.com:5173` ekle
  - [ ] Test et

- [ ] **3.2** Frontend CORS ayarları
  - [ ] Admin UI CORS ayarları
  - [ ] Web app CORS ayarları
  - [ ] Test et

### **Phase 4: Merkezi Config Sistemi** ✅
- [x] **4.1** Config validation script'i
  - [x] Environment variable kontrol script'i
  - [x] CORS origin kontrol script'i
  - [x] API URL kontrol script'i

- [x] **4.2** Dokümantasyon
  - [x] Environment setup guide oluştur
  - [x] Config troubleshooting guide
  - [x] Deployment checklist

## 🧪 **Test Senaryoları**

### **Local Development Tests**
- [ ] Admin backend localhost'ta çalışıyor
- [ ] Admin UI localhost'ta çalışıyor
- [ ] Web app localhost'ta çalışıyor
- [ ] Redis localhost'ta çalışıyor
- [ ] Elasticsearch localhost'ta çalışıyor

### **VPS Production Tests**
- [ ] Admin backend VPS'de çalışıyor
- [ ] Admin UI VPS'de çalışıyor
- [ ] Web app VPS'de çalışıyor
- [ ] CORS hataları yok
- [ ] API çağrıları başarılı

## 📊 **İlerleme**

- **Toplam Görev:** 12
- **Tamamlanan:** 8
- **Devam Eden:** 0
- **Bekleyen:** 4
- **İlerleme:** 67%

## 🔄 **Sonraki Adımlar**

1. **Phase 2** ile devam et (VPS Production)
2. **Phase 3** ile devam et (CORS Sorunları)
3. **Test et** ve doğrula
4. **Final validation** yap

## 📚 **Referanslar**

- `ecosystem.config.js` - Local PM2 config
- `docker-compose.yml` - Docker environment
- `scripts/env.production.template` - VPS template
- `packages/admin-backend/src/config/app.ts` - Backend config
- `packages/admin-ui/src/config/environment.ts` - Frontend config
- `scripts/validate-config.sh` - Config validation script
- `docs/ENVIRONMENT_CONFIGURATION.md` - Environment documentation
- `docs/ENV_QUICK_REFERENCE.md` - Quick reference card 