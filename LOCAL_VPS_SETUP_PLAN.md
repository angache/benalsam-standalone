# 📋 Local/VPS Servis Kurulum Planı

## 🎯 Amaç
- **Test/Geliştirme**: Tüm servisler LOCAL'de çalışmalı
- **Production**: Tüm servisler VPS'de çalışmalı

---

## 📊 Mevcut Durum Analizi

### ✅ Local'de Çalışan Servisler
- Admin Backend (3002) ✅
- Elasticsearch Service (3006) ✅
- Upload Service (3007) ✅
- Categories Service (3015) ⚠️ (Cache sorunu var)
- Search Service (3016) ✅

### ❌ Local'de Çalışmayan Servisler
- Listing Service (3008) ❌
- Realtime Service (3019) ❌
- Backup Service (3013) ❓ (Kontrol edilmeli)
- Cache Service (3014) ❓ (Kontrol edilmeli)

### ✅ VPS'de Çalışan Servisler
- Tüm 9 servis online ✅

---

## 🔍 Yapılacak Kontroller

### 1. Local Servis Durumu Kontrolü
```bash
./scripts/check-local-services.sh
```
**Beklenen:** Hangi servislerin çalıştığını/çalışmadığını gösterir

### 2. Categories Service Cache Sorunu
**Sorun:** Cache unhealthy
**Kontrol:**
- Redis çalışıyor mu? (`redis-cli ping`)
- Categories Service .env dosyasında Redis URL doğru mu?
- Categories Service loglarını kontrol et

### 3. Local'de Çalışmayan Servisler
**Listing Service (3008):**
- .env dosyası var mı?
- Bağımlılıklar kurulu mu?
- Port 3008 kullanılıyor mu?

**Realtime Service (3019):**
- .env dosyası var mı?
- Firebase credentials doğru mu?
- Port 3019 kullanılıyor mu?

---

## 📝 Yapılacak İşlemler (Sırayla)

### Adım 1: Durum Tespiti
- [ ] Local servis durumunu kontrol et
- [ ] VPS servis durumunu kontrol et
- [ ] Frontend'in hangi servisleri kullandığını kontrol et

### Adım 2: Categories Service Cache Sorunu
- [ ] Redis bağlantısını kontrol et
- [ ] Categories Service .env dosyasını kontrol et
- [ ] Gerekirse Redis'i başlat veya .env'i düzelt

### Adım 3: Local'de Çalışmayan Servisleri Başlat
- [ ] Listing Service'i başlat (port 3008)
- [ ] Realtime Service'i başlat (port 3019)
- [ ] Backup Service'i kontrol et (port 3013)
- [ ] Cache Service'i kontrol et (port 3014)

### Adım 4: Tüm Servisleri Test Et
- [ ] Her servisin health endpoint'ini test et
- [ ] Frontend'den local servislere istek at
- [ ] CORS sorunlarını kontrol et

### Adım 5: Local/VPS Geçiş Mekanizmasını Test Et
- [ ] Local modda frontend'i test et
- [ ] VPS moduna geçiş yap
- [ ] VPS modunda frontend'i test et

---

## 🚀 Senaryolar

### Senaryo A: Local Development (Tüm Servisler Local)
```bash
# 1. Tüm local servisleri başlat
./scripts/local-services-start.sh

# 2. Frontend'i local modda başlat
cd benalsam-web-next
npm run env:local  # veya USE_VPS_SERVICES=false
npm run dev
```

### Senaryo B: VPS Test (Tüm Servisler VPS)
```bash
# 1. Local servisleri durdur
./scripts/local-services-stop.sh

# 2. Frontend'i VPS modunda başlat
cd benalsam-web-next
npm run env:vps  # veya USE_VPS_SERVICES=true
npm run dev
```

---

## ❓ Sorular

1. **Local'de tüm servislerin çalışması gerekiyor mu?**
   - Evet → Adım 3'e geç
   - Hayır → Sadece çalışan servisleri kullan

2. **Categories Service cache sorunu kritik mi?**
   - Evet → Önce bunu çöz
   - Hayır → Sonra çöz

3. **VPS'deki servisler şu an kullanılıyor mu?**
   - Evet → Frontend'in VPS modunda olduğunu kontrol et
   - Hayır → Local modda olduğunu kontrol et

---

## 📌 Sonraki Adım

**Önce durumu kontrol edelim:**
```bash
./scripts/check-local-services.sh
```

**Sonra birlikte karar verelim:**
- Hangi servisleri local'de başlatacağız?
- Categories Service cache sorununu nasıl çözeceğiz?
- Local/VPS geçiş mekanizması doğru çalışıyor mu?

