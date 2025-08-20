# 🏠 Ana Sayfa Sidebar ve Kategori Fonksiyonelliği TODO

## 📋 Genel Bakış
Ana sayfa sidebar'ını ve kategori sistemini modern e-ticaret standartlarına uygun hale getirmek, kullanıcı deneyimini iyileştirmek ve performansı artırmak.

## 🎯 Hedefler
- Sidebar layout'unu optimize etmek
- Kategori sistemini geliştirmek
- Filtre sistemini genişletmek
- Mobile deneyimini iyileştirmek
- Performansı artırmak

---

## 🔧 **1. Sidebar Layout İyileştirmeleri**

### 1.1 Genişlik Oranlarını Düzelt
- [ ] `lg:w-1/3 xl:w-1/4 2xl:w-1/5` → `lg:w-1/4 xl:w-1/5 2xl:w-1/6`
- [ ] Sticky pozisyonu düzelt: `lg:top-24` → `lg:top-20`
- [ ] Sidebar yüksekliğini viewport'a göre ayarla
- [ ] Scroll davranışını iyileştir

### 1.2 Responsive Tasarım
- [ ] Tablet için sidebar drawer/modal ekle
- [ ] Mobile'da daha iyi kategori navigasyonu
- [ ] Breakpoint'leri optimize et

### 1.3 Visual İyileştirmeler
- [ ] Sidebar gölge efektlerini iyileştir
- [ ] Hover states'leri geliştir
- [ ] Loading skeleton'ları ekle

---

## 📂 **2. Kategori Sistemi Geliştirmeleri**

### 2.1 Kategori Sayılarını Güncelle
- [ ] Gerçek veri ile kategori sayılarını hesapla
- [ ] API endpoint'i oluştur: `/api/categories/with-counts`
- [ ] Kategori sayılarını cache'le
- [ ] Real-time güncelleme ekle

### 2.2 Kategori Arama Özelliği
- [ ] Sidebar'a kategori arama input'u ekle
- [ ] Debounced search implementasyonu
- [ ] Fuzzy search algoritması
- [ ] Arama sonuçlarını highlight et

### 2.3 Popüler Kategoriler
- [ ] En çok görüntülenen kategorileri göster
- [ ] Trend kategorileri ekle
- [ ] Kullanıcı davranışlarına göre öneriler

### 2.4 Son Görüntülenen Kategoriler
- [ ] LocalStorage'da son kategorileri sakla
- [ ] Hızlı erişim için "Son Görüntülenenler" bölümü
- [ ] Kategori geçmişini temizleme özelliği

---

## 🔍 **3. Filtre Sistemi İyileştirmeleri**

### 3.1 Fiyat Filtresi
- [ ] Fiyat aralıklarını mantıklı hale getir:
  - 0-1000 TL
  - 1000-5000 TL
  - 5000-10000 TL
  - 10000+ TL
- [ ] Preset fiyat aralıkları ekle
- [ ] "Fiyat belirtilmemiş" seçeneği

### 3.2 Konum Filtresi
- [ ] Şehir dropdown'u ekle
- [ ] İlçe seçimi (şehir seçildikten sonra)
- [ ] "Tüm Türkiye" seçeneği
- [ ] Yakın konumlar önerisi

### 3.3 Acil Durum Filtresi
- [ ] Acil durum checkbox'ı ekle
- [ ] Acil durum badge'lerini göster
- [ ] Acil durum sıralaması

### 3.4 Tarih Filtresi
- [ ] Son 1 gün, 1 hafta, 1 ay seçenekleri
- [ ] Özel tarih aralığı seçimi
- [ ] Tarih picker komponenti

### 3.5 Durum Filtresi
- [ ] Aktif ilanlar
- [ ] Satılmış ilanlar
- [ ] Pasif ilanlar
- [ ] Onay bekleyen ilanlar

### 3.6 Gelişmiş Filtreler
- [ ] Filtre kombinasyonlarını kaydetme
- [ ] Filtre geçmişi
- [ ] "Benzer ilanlar" önerisi

---

## 📱 **4. Mobile Deneyimi İyileştirmeleri**

### 4.1 Tablet Sidebar
- [ ] Drawer/modal sidebar implementasyonu
- [ ] Swipe gesture desteği
- [ ] Overlay background blur efekti

### 4.2 Mobile Kategori Navigasyonu
- [ ] Daha iyi breadcrumb tasarımı
- [ ] Kategori arama özelliği
- [ ] Hızlı filtre butonları
- [ ] Kategori geçmişi

### 4.3 Touch Optimizasyonu
- [ ] Touch target'ları büyüt (min 44px)
- [ ] Swipe gesture'ları ekle
- [ ] Haptic feedback
- [ ] Pull-to-refresh

---

## ⚡ **5. Performans İyileştirmeleri**

### 5.1 Caching
- [ ] Kategori verilerini cache'le
- [ ] Filtre sonuçlarını cache'le
- [ ] API response'larını optimize et

### 5.2 Lazy Loading
- [ ] Alt kategorileri lazy load et
- [ ] Kategori ikonlarını lazy load et
- [ ] Filtre sonuçlarını paginate et

### 5.3 Debouncing
- [ ] Kategori araması için debounce
- [ ] Filtre değişiklikleri için debounce
- [ ] Search input için debounce

---

## 🎨 **6. UX İyileştirmeleri**

### 6.1 Loading States
- [ ] Kategori yüklenirken skeleton
- [ ] Filtre uygulanırken loading
- [ ] Arama yapılırken loading

### 6.2 Empty States
- [ ] Kategori boşken mesaj
- [ ] Filtre sonucu boşken öneriler
- [ ] Arama sonucu boşken alternatifler

### 6.3 Error Handling
- [ ] Kategori yüklenemezse fallback
- [ ] Filtre uygulanamazsa hata mesajı
- [ ] Network error handling

### 6.4 Keyboard Navigation
- [ ] Tab navigation desteği
- [ ] Arrow key navigation
- [ ] Enter/Space key support
- [ ] Escape key ile sidebar kapatma

---

## 🔧 **7. Teknik İyileştirmeler**

### 7.1 Component Yapısı
- [ ] Sidebar'ı ayrı component'e çıkar
- [ ] Kategori item'ını optimize et
- [ ] Filtre component'lerini modülerleştir

### 7.2 State Management
- [ ] Sidebar state'ini optimize et
- [ ] Kategori state'ini merkezi hale getir
- [ ] Filtre state'ini persist et

### 7.3 Accessibility
- [ ] ARIA labels ekle
- [ ] Screen reader desteği
- [ ] High contrast mode
- [ ] Focus management

---

## 📊 **8. Analytics ve Tracking**

### 8.1 Kullanıcı Davranışları
- [ ] Kategori tıklama oranları
- [ ] Filtre kullanım istatistikleri
- [ ] Arama terimleri analizi
- [ ] Mobile vs desktop kullanım

### 8.2 Performance Metrics
- [ ] Sidebar load time
- [ ] Kategori response time
- [ ] Filtre uygulama süresi
- [ ] Mobile performance

---

## 🚀 **Implementasyon Sırası**

### Faz 1: Temel İyileştirmeler (1-2 gün)
1. Sidebar genişlik oranlarını düzelt
2. Sticky pozisyonu optimize et
3. Kategori sayılarını gerçek veri ile güncelle
4. Temel filtre iyileştirmeleri

### Faz 2: Gelişmiş Özellikler (2-3 gün)
1. Kategori arama özelliği
2. Gelişmiş filtre sistemi
3. Mobile deneyimi iyileştir
4. Tablet sidebar

### Faz 3: Performans ve UX (1-2 gün)
1. Caching implementasyonu
2. Loading states
3. Error handling
4. Accessibility iyileştirmeleri

### Faz 4: Analytics ve Optimizasyon (1 gün)
1. Analytics tracking
2. Performance monitoring
3. A/B testing setup
4. Final optimizasyonlar

---

## 📝 **Notlar**
- Tüm değişiklikler responsive olmalı
- Performance impact'i minimize edilmeli
- Backward compatibility korunmalı
- Accessibility standartlarına uyulmalı
- Mobile-first approach benimsenmeli

---

**Toplam Tahmini Süre: 5-8 gün**
**Öncelik: Yüksek**
**Etki: Kullanıcı deneyimi ve conversion rate**
