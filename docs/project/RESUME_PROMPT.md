# 🔄 Projeye Devam Etmek İçin Prompt

**⚠️ ÖNEMLİ**: Bu dosya her önemli değişiklikte otomatik güncellenir. Yeni versiyonla geri döndüğünüzde bu prompt'u kullanarak projeyi hatırlatabilirsiniz.

---

## 📋 **STANDART PROMPT (Önerilen)**

```
Ben Benalsam projesinde çalışıyorum. Projeyi hatırlaman için şu bilgileri oku:

1. Proje yapısını hatırlamak için:
   - `docs/project/project summary2` dosyasını oku (güncel durum)
   - `HATIRLATICI.md` dosyasını oku (hızlı başlatma)
   - `docs/project/CHANGELOG.md` dosyasını oku (son güncellemeler)

2. Son yapılan değişiklikler için `docs/project/project summary2` dosyasının en üstündeki "Current Status" bölümüne bak.

3. Proje yapısı:
   - Microservices mimarisi (9 servis)
   - Listing Service (Port 3008) - Job system ile listing management
   - Upload Service (Port 3007) - Image upload, Cloudinary
   - Web Next (Port 5173) - Next.js web application
   - Admin Backend (Port 3002) - Admin API
   - Admin UI (Port 3003) - Admin dashboard
   - Elasticsearch Service (Port 3006) - Search engine
   - Backup Service (Port 3013) - Data backup
   - Cache Service (Port 3014) - Redis caching
   - Categories Service (Port 3015) - Category management
   - Search Service (Port 3016) - Advanced search
   - Realtime Service (Port 3019) - Firebase Realtime Queue

Lütfen bu dosyaları okuyup projeyi hatırla ve kaldığımız yerden devam edelim.
```

---

## 🎯 **Kısa Versiyon (Hızlı Başlangıç)**

Eğer daha kısa bir prompt istiyorsanız:

```
Benalsam projesinde çalışıyorum. Lütfen şu dosyaları oku ve projeyi hatırla:
- docs/project/project summary2 (güncel durum - en üstteki "Current Status" bölümüne bak)
- HATIRLATICI.md (hızlı başlatma)
- docs/project/CHANGELOG.md (son güncellemeler)

Son değişiklikler için `docs/project/project summary2` dosyasının en üstündeki "Current Status" bölümünü kontrol et.
```

---

## 📝 **Detaylı Versiyon (Tam Bağlam)**

Eğer tüm bağlamı vermek istiyorsanız:

```
Ben Benalsam projesinde çalışıyorum. Bu bir ilan platformu projesi (alınık ilanlar - wanted listings).

PROJE YAPISI (Microservices - 9 Servis):
- benalsam-listing-service (Port 3008) - Listing management, job system
- benalsam-upload-service (Port 3007) - Image upload, Cloudinary
- benalsam-web-next (Port 5173) - Next.js web application
- benalsam-admin-backend (Port 3002) - Admin API
- benalsam-admin-ui (Port 3003) - Admin dashboard
- benalsam-elasticsearch-service (Port 3006) - Search engine
- benalsam-backup-service (Port 3013) - Data backup
- benalsam-cache-service (Port 3014) - Redis caching
- benalsam-categories-service (Port 3015) - Category management
- benalsam-search-service (Port 3016) - Advanced search
- benalsam-realtime-service (Port 3019) - Firebase Realtime Queue
- benalsam-shared-types - NPM package (benalsam-shared-types)

SON DEĞİŞİKLİKLER:
Lütfen `docs/project/project summary2` dosyasının en üstündeki "Current Status" bölümünü oku. 
Bu bölüm her önemli değişiklikte güncellenir ve şu bilgileri içerir:
- Bugün yapılan değişiklikler
- Değiştirilen dosyalar
- Teknik detaylar
- Root cause ve solution'lar

ÖNEMLİ NOTLAR:
- Listing status flow: PENDING_APPROVAL → Admin moderation → ACTIVE or REJECTED
- Job system: Listing Service uses job system for async processing
- Job endpoint: /api/v1/listings/jobs/:jobId (Listing Service)
- Status normalization: All statuses normalized to lowercase
- Firebase Realtime Queue: Queue Service deprecated, Firebase Realtime DB kullanılıyor

Lütfen şu dosyaları oku:
1. docs/project/project summary2 (güncel durum - EN ÜSTTEKİ "Current Status" bölümüne bak)
2. HATIRLATICI.md (hızlı başlatma ve servis komutları)
3. docs/project/CHANGELOG.md (tüm değişiklikler geçmişi)

Projeyi hatırla ve kaldığımız yerden devam edelim.
```

---

## 💡 **Kullanım Önerileri**

1. **İlk Oturum**: Detaylı versiyonu kullanın - tüm bağlamı verir
2. **Devam Oturumları**: Kısa versiyonu kullanın - hızlı başlangıç için
3. **Özel Durumlar**: Önerilen prompt'u kullanın - dengeli bilgi

---

## 🔍 **Alternatif: Dosya Bazlı Prompt**

Eğer dosyaları okutmak istiyorsanız:

```
Lütfen şu dosyaları sırayla oku ve projeyi hatırla:

1. docs/project/project summary2 - Güncel durum (EN ÜSTTEKİ "Current Status" bölümüne bak)
2. HATIRLATICI.md - Proje yapısı ve hızlı başlatma
3. docs/project/CHANGELOG.md - Son değişiklikler geçmişi

Son değişiklikler için `docs/project/project summary2` dosyasının en üstündeki "Current Status" bölümünü kontrol et.
```

---

## ⚙️ **GÜNCELLEME SİSTEMİ**

### **Otomatik Güncelleme Kuralları**

Bu dosya şu durumlarda otomatik güncellenir:

1. ✅ **Her önemli bug fix sonrası**
2. ✅ **Her major feature ekleme sonrası**
3. ✅ **Her mimari değişiklik sonrası**
4. ✅ **Her dokümantasyon güncellemesi sonrası**

### **Güncelleme Süreci**

1. `docs/project/project summary2` dosyası güncellenir (en üstteki "Current Status" bölümü)
2. `docs/project/CHANGELOG.md` dosyası güncellenir
3. `HATIRLATICI.md` dosyası güncellenir (gerekirse)
4. Bu dosya (`RESUME_PROMPT.md`) otomatik olarak güncel kalır çünkü `project summary2`'ye referans verir

### **Kullanım Notu**

Bu prompt'u kullanırken:
- ✅ `project summary2` dosyasının en üstündeki "Current Status" bölümünü kontrol edin
- ✅ Tarih bilgisi `project summary2` dosyasında güncel tutulur
- ✅ Bu dosya (`RESUME_PROMPT.md`) her zaman güncel kalır çünkü dinamik referanslar kullanır

---

**Son Güncelleme**: 2025-01-XX (Otomatik güncellenir)  
**Hazırlayan**: AI Assistant  
**Amaç**: Yeni versiyonla geri döndüğünde projeyi hatırlatmak  
**Güncelleme Stratejisi**: `project summary2` dosyasına dinamik referans - her zaman güncel

