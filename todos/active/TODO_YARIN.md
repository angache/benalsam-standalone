# 🚀 YARIN ÇALIŞMA PLANI - 29 Temmuz 2025

## 📋 GÜNLÜK HEDEFLER

### 🎯 **ÖNCELİK 1: ADMIN BACKEND DÜZELTME**
- [ ] **Admin backend'i yeniden başlat** (TypeScript hatası düzeltildi)
- [ ] **Port 3002'de çalıştığını doğrula** (`lsof -i :3002`)
- [ ] **Admin UI'da live user activity test et**
- [ ] **Elasticsearch'te user profile verilerini kontrol et**

### 🎯 **ÖNCELİK 2: MOBILE APP TEST**
- [ ] **Mobile app'te analytics tracking test et**
- [ ] **User profile verilerinin doğru gönderildiğini doğrula**
- [ ] **Admin panel'de gerçek kullanıcı adı görünüyor mu kontrol et**

### 🎯 **ÖNCELİK 3: SİSTEM STABİLİZASYONU**
- [ ] **Tüm servislerin çalıştığını kontrol et** (pm2 status)
- [ ] **Network bağlantılarını test et**
- [ ] **Error loglarını temizle**

---

## 🔧 TEKNİK GÖREVLER

### **1. Admin Backend Kontrolü**
```bash
# Admin backend durumu
pm2 status
pm2 logs admin-backend

# Port kontrolü
lsof -i :3002
curl http://localhost:3002/health

# Elasticsearch bağlantısı
curl http://localhost:9200/_cluster/health
```

### **2. Mobile App Analytics Test**
```bash
# Mobile app'te test event gönder
# Admin panel'de görünüyor mu kontrol et
# User profile verileri doğru mu?
```

### **3. Admin UI Kontrolü**
```bash
# Admin UI çalışıyor mu?
# Live user activity sayfası
# Real-time analytics
```

---

## 📱 MOBILE APP GÖREVLERİ

### **Analytics Service Kontrolü**
- [ ] `analyticsService.ts` - user profile mapping doğru mu?
- [ ] `useAuthStore` - user data doğru alınıyor mu?
- [ ] Network requests - admin backend'e ulaşıyor mu?

### **Test Senaryoları**
- [ ] **Yeni kullanıcı kaydı** → Analytics tracking
- [ ] **İlan oluşturma** → User behavior tracking
- [ ] **Mesaj gönderme** → Activity tracking
- [ ] **Arama yapma** → Search analytics

---

## 🖥️ ADMIN PANEL GÖREVLERİ

### **Real-Time Analytics**
- [ ] **Live User Activity** sayfası çalışıyor mu?
- [ ] **User profile** verileri görünüyor mu?
- [ ] **Real-time updates** çalışıyor mu?

### **Admin Backend API**
- [ ] `/analytics/track-behavior` endpoint çalışıyor mu?
- [ ] **Elasticsearch** bağlantısı stabil mi?
- [ ] **User profile** verileri doğru kaydediliyor mu?

---

## 🗄️ VERİTABANI GÖREVLERİ

### **Elasticsearch Kontrolü**
```bash
# User behavior verilerini kontrol et
curl -X GET "localhost:9200/user-behavior/_search" -H "Content-Type: application/json" -d'
{
  "query": {
    "match_all": {}
  },
  "sort": [
    {
      "timestamp": {
        "order": "desc"
      }
    }
  ],
  "size": 10
}'
```

### **Supabase Kontrolü**
- [ ] **User profiles** doğru mu?
- [ ] **Authentication** çalışıyor mu?
- [ ] **RLS policies** doğru mu?

---

## 🐛 BUG FIXES

### **Beklenen Sorunlar**
- [ ] **Admin backend port 3002** erişim sorunu
- [ ] **Mobile app network** bağlantı hatası
- [ ] **User profile** verilerinin yanlış mapping'i
- [ ] **Real-time updates** çalışmıyor

### **Çözüm Stratejileri**
- [ ] **Admin backend restart** (pm2 restart admin-backend)
- [ ] **Network configuration** kontrolü
- [ ] **User data mapping** düzeltme
- [ ] **WebSocket connection** kontrolü

---

## 📊 TEST SENARYOLARI

### **1. End-to-End Test**
```
Mobile App → Analytics Event → Admin Backend → Elasticsearch → Admin UI
```

### **2. User Flow Test**
```
Kullanıcı Girişi → İlan Oluşturma → Mesaj Gönderme → Admin Panel'de Görünme
```

### **3. Real-Time Test**
```
Live Activity → Real-time Updates → User Profile Display
```

---

## 🚨 ACİL DURUMLAR

### **Admin Backend Çalışmıyorsa**
1. `pm2 status` kontrol et
2. `pm2 restart admin-backend`
3. `lsof -i :3002` port kontrolü
4. `pm2 logs admin-backend` hata logları

### **Mobile App Bağlanamıyorsa**
1. Network configuration kontrol et
2. Admin backend URL'ini doğrula
3. Firewall/port ayarları
4. VPN bağlantısı

### **Elasticsearch Sorunu**
1. `curl localhost:9200` bağlantı testi
2. `pm2 restart elasticsearch` (varsa)
3. Disk space kontrolü
4. Memory usage kontrolü

---

## 📈 PERFORMANS KONTROLLERİ

### **System Resources**
- [ ] **CPU usage** kontrol et
- [ ] **Memory usage** kontrol et
- [ ] **Disk space** kontrol et
- [ ] **Network bandwidth** kontrol et

### **Application Performance**
- [ ] **Admin backend response time**
- [ ] **Mobile app analytics latency**
- [ ] **Elasticsearch query performance**
- [ ] **Real-time update frequency**

---

## 🎯 BAŞARI KRİTERLERİ

### **Gün Sonu Hedefleri**
- [ ] **Admin backend** port 3002'de çalışıyor
- [ ] **Mobile app** analytics gönderiyor
- [ ] **Admin UI** live user activity gösteriyor
- [ ] **User profile** verileri doğru görünüyor
- [ ] **Real-time updates** çalışıyor

### **Kalite Kontrolleri**
- [ ] **Error rate** %1'in altında
- [ ] **Response time** 2 saniyenin altında
- [ ] **Data accuracy** %100
- [ ] **System uptime** %99.9

---

## 📝 NOTLAR

### **Bugün Çözülen Sorunlar**
- ✅ TypeScript hatası düzeltildi (analytics.ts)
- ✅ User profile mapping düzeltildi
- ✅ Privacy Policy oluşturuldu
- ✅ Elasticsearch'te user data doğru kaydediliyor

### **Yarın Odaklanılacak**
- 🔄 Admin backend stabilizasyonu
- 🔄 End-to-end testing
- 🔄 Performance optimization
- 🔄 Documentation update

---

## 🌅 SABAH RUTİNİ

### **09:00 - Sistem Kontrolü**
1. `pm2 status` - tüm servisler çalışıyor mu?
2. `lsof -i :3002` - admin backend port'u açık mı?
3. `curl localhost:3002/health` - admin backend yanıt veriyor mu?

### **09:15 - Test Başlangıcı**
1. Mobile app'te test event gönder
2. Admin panel'de görünüyor mu kontrol et
3. User profile verileri doğru mu?

### **09:30 - Debug & Fix**
1. Sorun varsa hemen çöz
2. Logları kontrol et
3. Gerekirse restart yap

---

**🎯 YARIN HEDEFİ: Tüm sistem stabil çalışıyor ve user profile verileri admin panel'de doğru görünüyor!**

**📅 Tarih:** 29 Temmuz 2025  
**👤 Hazırlayan:** AI Assistant  
**📋 Durum:** Hazır 