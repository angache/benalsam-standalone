# 🚀 MOBİL KATEGORİ SİSTEMİ MİGRASYONU (Web'deki Mevcut Sisteme Göre)

## 📋 **GENEL BAKIŞ**
Web'de zaten dinamik kategori sistemi mevcut! Backend API'leri, cache sistemi ve web entegrasyonu hazır. Sadece mobil uygulamayı web'deki sisteme uyarlamak gerekiyor.

## 🎯 **MEVCUT DURUM ANALİZİ**

### ✅ **Web'de Zaten Var:**
- ✅ Backend kategori API'leri (`/api/v1/categories`)
- ✅ Redis cache sistemi (5 dakika TTL)
- ✅ Kategori service (`categoryService.ts`)
- ✅ Web'de dinamik kategori kullanımı
- ✅ Cache invalidation sistemi
- ✅ Kategori version kontrolü

### ❌ **Mobil'de Eksik:**
- ❌ Kategori API entegrasyonu
- ❌ AsyncStorage cache sistemi
- ❌ React Query hooks
- ❌ UI güncellemeleri

---

## 📝 **MOBİL MİGRASYON TODO LİSTESİ**

### 🔧 **1. MOBİL KATEGORİ SERVICE**

#### **1.1 Kategori Service Oluştur**
- [ ] `benalsam-mobile/src/services/categoryService.ts` oluştur
- [ ] Web'deki `categoryService.ts`'i baz al
- [ ] AsyncStorage cache sistemi ekle
- [ ] Error handling ve fallback

#### **1.2 API Entegrasyonu**
- [ ] `fetchCategories()` - Tüm kategorileri getir
- [ ] `fetchCategoryTree()` - Hiyerarşik yapı
- [ ] `fetchCategoryById(id)` - Tek kategori
- [ ] Backend URL: `EXPO_PUBLIC_ADMIN_BACKEND_URL/api/v1/categories`

#### **1.3 Cache Sistemi**
- [ ] AsyncStorage cache key: `categories_cache`
- [ ] Version kontrolü sistemi (TTL yok)
- [ ] Uygulama açılışında version check
- [ ] Version değişmişse yeni veri çek
- [ ] Offline support

### 📱 **2. REACT QUERY HOOKS**

#### **2.1 Kategori Hooks**
- [ ] `useCategories()` - Tüm kategoriler
- [ ] `useCategoryTree()` - Hiyerarşik yapı
- [ ] `useCategoryById(id)` - Tek kategori
- [ ] Background refetch
- [ ] Error states

#### **2.2 Cache Yönetimi**
- [ ] React Query cache configuration
- [ ] Version-based cache invalidation
- [ ] Uygulama açılışında version check
- [ ] Background updates (version değişikliği varsa)

### 🎨 **3. UI GÜNCELLEMELERİ**

#### **3.1 Kategori Seçim Ekranı**
- [ ] `CategorySelector` component'ini güncelle
- [ ] Statik config yerine API kullan
- [ ] Loading states ekle
- [ ] Error handling
- [ ] Offline indicator

#### **3.2 İlan Oluşturma Ekranı**
- [ ] `CreateListingScreen` güncelle
- [ ] Kategori seçimini dinamik yap
- [ ] Category ID mapping'i kaldır

#### **3.3 Arama Ekranı**
- [ ] `SearchScreen` güncelle
- [ ] Kategori filtrelerini dinamik yap
- [ ] Category path'lerini API'den al

### 🔄 **4. MEVCUT KOD GÜNCELLEMELERİ**

#### **4.1 Mutations Güncelleme**
- [ ] `mutations.ts` - Statik config kaldır
- [ ] `getCategoryIds()` fonksiyonunu kaldır
- [ ] API'den gelen category_id kullan

#### **4.2 Import Güncellemeleri**
- [ ] `categories-enhanced.ts` import'larını kaldır
- [ ] Yeni categoryService import'ları ekle
- [ ] React Query hooks import'ları

### 🧪 **5. TEST VE DOĞRULAMA**

#### **5.1 Fonksiyonel Testler**
- [ ] Kategori yükleme testi
- [ ] Cache çalışma testi
- [ ] Offline çalışma testi
- [ ] İlan oluşturma testi

#### **5.2 Performance Testleri**
- [ ] Kategori yükleme süresi
- [ ] Version check response time
- [ ] Memory usage

---

## 🚨 **ACİL ÖNCELİKLER (Bu Hafta)**

### **1. Hemen Yapılacaklar (Bugün)**
- [ ] `categoryService.ts` oluştur (web'deki sistemi baz al)
- [ ] `useCategories()` hook'u oluştur
- [ ] `CategorySelector` component'ini güncelle

### **2. Bu Hafta**
- [ ] Tüm UI component'lerini güncelle
- [ ] Test migration
- [ ] Performance optimizasyonu

---

## 💡 **TEKNİK DETAYLAR**

### **Backend API Endpoint'leri (Zaten Mevcut)**
```typescript
GET /api/v1/categories          // Tüm kategoriler
GET /api/v1/categories/all      // Flat liste
GET /api/v1/categories/:id      // Tek kategori
GET /api/v1/categories/version  // Cache version
```

### **Cache Stratejisi**
```typescript
// AsyncStorage Keys
categories_cache: { data, version }
categories_tree_cache: { data, version }

// Version kontrolü sistemi
// Uygulama açılışında: GET /api/v1/categories/version
// Version değişmişse: Yeni veri çek
// Version aynıysa: Cache'den göster
```

### **Error Handling**
- Network error → Cache'den göster
- Version değişikliği → Yeni veri çek
- API error → Fallback kategoriler
- Offline → Cache'den göster

---

## 📈 **BAŞARI KRİTERLERİ**

- [ ] Kategori yükleme süresi < 1 saniye
- [ ] Version check response time < 200ms
- [ ] Offline kategori desteği
- [ ] Web ile tutarlı kategori yapısı
- [ ] Zero breaking changes

---

## 🎯 **SONUÇ**

**Web'deki mevcut dinamik kategori sistemini mobil'e uyarlayarak:**
- ✅ Performans artışı
- ✅ Web ile tutarlılık
- ✅ Offline destek
- ✅ Admin kontrolü

**Mevcut backend API'leri kullanarak hızlı migration!** 🚀
