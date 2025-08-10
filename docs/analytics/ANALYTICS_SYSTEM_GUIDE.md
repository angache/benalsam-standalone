# 📊 Analytics Sistemi Kullanıcı Rehberi

## 🎯 **Analytics Sistemi Nedir?**

Analytics sistemi, web sitenizin/mobil uygulamanızın nasıl performans gösterdiğini ve kullanıcıların nasıl davrandığını takip eden bir **"gözetleme sistemi"** gibidir.

Tıpkı bir arabanın dashboard'u gibi - hız, yakıt, motor sıcaklığı gibi her şeyi görür ve gerekirse müdahale edersiniz! 🚗📊

---

## 🔧 **Phase 1: Performance Monitoring (Performans İzleme)**

### **Ne İşe Yarar?**
Sisteminizin sağlığını kontrol eder, tıpkı bir doktorun hastayı muayene etmesi gibi.

### **Kontrol Ettiği Sistemler:**

#### **Backend Kontrolleri:**
```
✅ API Response Time (API yanıt süresi)
✅ Server CPU Kullanımı
✅ Server Memory (RAM) Kullanımı
✅ Database Query Performance
✅ Error Rate (Hata oranı)
✅ Server Uptime (Çalışma süresi)
```

#### **Frontend Kontrolleri:**
```
✅ Sayfa Yükleme Süresi
✅ Kullanıcı Tıklamaları
✅ Sayfa Geçişleri
✅ Form Doldurma Süreleri
✅ Scroll Derinliği
✅ Kullanıcı Yolculuğu
```

### **Örnekler:**

**1. CPU Kullanımı:**
```
CPU: %25 kullanım ✅ (Normal)
CPU: %95 kullanım 🚨 (Sistem yavaşlıyor!)
```

**2. Memory (RAM) Kullanımı:**
```
Memory: %60 kullanım ✅ (Normal)
Memory: %99 kullanım 🚨 (Sistem çökebilir!)
```

**3. API Hızı:**
```
API Response: 50ms ✅ (Hızlı)
API Response: 2000ms 🚨 (Çok yavaş!)
```

---

## 🛤️ **Phase 2: User Journey Tracking (Kullanıcı Yolculuğu)**

### **Ne İşe Yarar?**
Kullanıcıların sitenizde nasıl gezindiğini takip eder, tıpkı bir mağazada müşterinin hangi rafları ziyaret ettiğini görmek gibi.

### **Örnekler:**

**1. Kullanıcı Yolculuğu:**
```
Kullanıcı A:
Ana Sayfa → Arama → İlan Detayı → İletişim ✅ (Başarılı)
Kullanıcı B:
Ana Sayfa → Arama → ❌ (Sayfadan ayrıldı) 🚨 (Sorun var!)
```

**2. Drop-off Noktaları:**
```
%70 kullanıcı: Ana sayfada kalıyor ✅
%30 kullanıcı: Arama sayfasında ayrılıyor 🚨
%10 kullanıcı: İlan detayında ayrılıyor 🚨
```

**3. Engagement Score (Etkileşim Puanı):**
```
Kullanıcı A: 85/100 ✅ (Çok aktif)
Kullanıcı B: 15/100 🚨 (Az aktif)
```

---

## 🚨 **Phase 3: Analytics Alerts (Uyarı Sistemi)**

### **Ne İşe Yarar?**
Sistemde bir sorun olduğunda size otomatik olarak haber verir, tıpkı evinizdeki yangın alarmı gibi.

### **Örnekler:**

**1. Memory Alert:**
```
🚨 ALERT: Memory kullanımı %99'a ulaştı!
Eylem: Sistemi yeniden başlat veya RAM ekle
```

**2. API Error Alert:**
```
🚨 ALERT: Login API'si %20 hata veriyor!
Eylem: Kod hatasını kontrol et
```

**3. Business Alert:**
```
🚨 ALERT: Bugün sadece 5 yeni kullanıcı kaydoldu!
Normal: Günde 50 kullanıcı
Eylem: Reklamları kontrol et
```

---

## 📊 **Phase 4: Data Export (Veri Dışa Aktarma)**

### **Ne İşe Yarar?**
Analytics verilerini Excel, CSV gibi dosyalara aktarır, böylece raporlar hazırlayabilirsiniz.

### **Örnekler:**

**1. Günlük Rapor:**
```
📊 Günlük Rapor (29 Temmuz 2025)
- Toplam Ziyaretçi: 1,250
- Yeni Kayıt: 45
- İlan Oluşturma: 23
- Başarı Oranı: %78
```

**2. Aylık Analiz:**
```
📈 Aylık Performans (Temmuz 2025)
- En Popüler Sayfa: Ana Sayfa (%40)
- En Çok Drop-off: Arama Sayfası (%30)
- En İyi Saat: 14:00-16:00
```

---

## 🏗️ **Sistem Mimarisi**

```
📱 Mobile App / 🌐 Web Site
         ↓
    📊 Analytics Tracking
         ↓
    🔧 Backend API
         ↓
    📊 Analytics Service
         ↓
    🗄️ Elasticsearch Database
         ↓
    📊 Admin Dashboard
```

---

## 🎯 **Hangi Verileri Topluyor?**

### **Backend Verileri:**
```javascript
{
  "system": {
    "cpu_usage": 25.5,        // CPU kullanımı
    "memory_usage": 99.9,     // RAM kullanımı
    "api_response_time": 150, // API yanıt süresi
    "error_rate": 0.5         // Hata oranı
  }
}
```

### **Frontend Verileri:**
```javascript
{
  "user_journey": {
    "page_views": ["Home", "Search", "Listing"],
    "time_spent": 180,        // Saniye
    "scroll_depth": 75,       // Yüzde
    "clicks": 12,             // Tıklama sayısı
    "conversion": true        // Başarılı mı?
  }
}
```

---

## 🚨 **Alert Örnekleri**

### **Backend Alert:**
```
🚨 CRITICAL: Server Memory %99
⚠️ Backend sunucusu çökebilir!
🔧 Hemen RAM ekle veya restart et
```

### **Frontend Alert:**
```
🚨 HIGH: Login sayfası 5 saniyede yükleniyor
📍 Kullanıcılar bekleyip ayrılıyor
🔧 Sayfa optimizasyonu yap
```

### **Business Alert:**
```
🚨 MEDIUM: Bugün sadece 10 ilan oluşturuldu
📍 Normal: Günde 100 ilan
🔧 Reklamları veya UX'i kontrol et
```

---

## 🔧 **Nasıl Çalışıyor?**

### **1. Backend Monitoring:**
```javascript
// Her API çağrısında
app.use('/api', (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    // Analytics'e gönder
    analyticsService.trackAPIMetrics({
      endpoint: req.path,
      response_time: responseTime,
      status_code: res.statusCode
    });
  });
  
  next();
});
```

### **2. Frontend Monitoring:**
```javascript
// Kullanıcı her sayfa değiştirdiğinde
analyticsService.trackPageView({
  page_name: 'Home',
  time_spent: 30,
  scroll_depth: 60
});
```

---

## 📈 **Pratik Faydaları**

### **1. Sorun Tespiti:**
```
❌ Önceki Durum: "Site yavaş" (neden bilinmiyor)
✅ Şimdi: "CPU %95, Memory %99, API 2 saniye" (sorun net!)
```

### **2. Kullanıcı Deneyimi:**
```
❌ Önceki Durum: "Kullanıcılar ayrılıyor" (neden bilinmiyor)
✅ Şimdi: "Arama sayfasında %30 drop-off, form çok karmaşık"
```

### **3. Proaktif Yönetim:**
```
❌ Önceki Durum: "Site çöktü!" (geç fark ettik)
✅ Şimdi: "Memory %90'a ulaştı, 10 dakika içinde çökebilir" (önceden uyarı)
```

### **4. İş Kararları:**
```
❌ Önceki Durum: "Tahmin yürütüyoruz"
✅ Şimdi: "Veriler gösteriyor ki mobil kullanıcılar %60 daha az ilan oluşturuyor"
```

---

## 🎯 **Sistem Faydaları**

### **Backend İçin:**
- ✅ Server performansını izler
- ✅ API hızını kontrol eder
- ✅ Hataları önceden tespit eder
- ✅ Sistem kaynaklarını optimize eder

### **Frontend İçin:**
- ✅ Kullanıcı deneyimini izler
- ✅ Sayfa hızlarını kontrol eder
- ✅ Drop-off noktalarını bulur
- ✅ UX'i iyileştirir

### **Business İçin:**
- ✅ Kullanıcı davranışlarını anlar
- ✅ Conversion rate'i artırır
- ✅ Sorunları proaktif çözer
- ✅ Veriye dayalı kararlar alır

---

## 🚀 **Sonuç**

Bu sistem **tam bir gözetleme sistemi** gibi çalışıyor:

- **Backend'i** → Server sağlığını kontrol eder
- **Frontend'i** → Kullanıcı deneyimini izler  
- **Business'i** → İş metriklerini takip eder

Tıpkı bir hastanenin hem hastanın kalp atışını (backend) hem de nasıl hissettiğini (frontend) izlemesi gibi! 🏥📊

---

## 📞 **Destek**

Bu sistem hakkında sorularınız için:
- **Teknik Destek**: Backend ekibi
- **Kullanım Soruları**: Product ekibi
- **Rapor İstekleri**: Analytics ekibi

---

*Bu dokümantasyon sürekli güncellenmektedir. Son güncelleme: 29 Temmuz 2025* 