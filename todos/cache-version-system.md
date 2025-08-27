# Cache Version Sistemi TODO

## 🎯 **Amaç**
Web uygulamasında kategori değişikliklerini otomatik algılayıp cache'i temizlemek için version sistemi kurmak.

## 📋 **Sistem Tasarımı**

### **Backend (Supabase)**
- [x] `system_settings` tablosu oluştur ✅ *(2025-08-27)*
- [x] `categories_version` kaydı ekle (başlangıç: 1) ✅ *(2025-08-27)*
- [x] Trigger oluştur: kategori güncellendiğinde version artır ✅ *(2025-08-27)*
- [x] `/api/v1/categories/version` endpoint'i ekle ✅ *(2025-08-27)*
- [x] Kategori güncelleme noktalarında version artırma ✅ *(2025-08-27)*
- [x] Manuel version artırma endpoint'i (test için) ✅ *(2025-08-27)*

### **Web Uygulaması**
- [x] Uygulama başlangıcında version kontrolü ✅ *(2025-08-27)*
- [x] Version farklıysa cache temizleme ✅ *(2025-08-27)*
- [x] Kategorileri yeniden yükleme ✅ *(2025-08-27)*
- [x] Error handling ve fallback mekanizması ✅ *(2025-08-27)*
- [x] Cache version service oluştur ✅ *(2025-08-27)*
- [x] CategoryGrid component'ine entegrasyon ✅ *(2025-08-27)*

## 🔧 **Implementasyon Adımları**

### **1. Supabase Migration**
```sql
-- system_settings tablosu
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES admin_users(id)
);

-- İlk kayıt
INSERT INTO system_settings (key, value, description) 
VALUES ('categories_version', '1', 'Kategori cache version numarası');

-- Trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_categories_version()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE system_settings 
  SET value = (CAST(value AS INTEGER) + 1)::TEXT,
      updated_at = now()
  WHERE key = 'categories_version';
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_categories_version
  AFTER UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_version();
```

### **2. Backend API Endpoint**
```javascript
// GET /api/v1/categories/version
router.get('/version', async (req, res) => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'categories_version')
    .single();
  
  if (error) {
    return res.status(500).json({ version: 0 });
  }
  
  res.json({ version: parseInt(data.value) });
});
```

### **3. Web Version Kontrolü**
```javascript
// Uygulama başlangıcında
const checkCategoryVersion = async () => {
  const currentVersion = localStorage.getItem('categories_version') || '0';
  const response = await fetch('/api/v1/categories/version');
  const { version } = await response.json();
  
  if (currentVersion !== version.toString()) {
    console.log(`🔄 Version değişti: ${currentVersion} → ${version}`);
    localStorage.clear();
    await loadCategories();
  }
};
```

## 📁 **Dosyalar**

### **Backend**
- `supabase/migrations/20250827xxxxxx_add_cache_version_system.sql`
- `src/routes/categories.ts` - Version endpoint ekle
- `src/services/categoryService.ts` - Version artırma

### **Web**
- `src/services/dynamicCategoryService.js` - Version kontrolü
- `src/components/CategoryGrid.jsx` - Uygulama başlangıcı

## 🎯 **Test Senaryoları**

1. **Admin'de kategori sırası değiştir**
2. **Web'de sayfayı yenile**
3. **Version kontrolü çalışmalı**
4. **Cache temizlenmeli**
5. **Yeni sıra görünmeli**

## ⚠️ **Dikkat Edilecekler**

- [ ] Version kontrolü sadece uygulama başlangıcında
- [ ] Error durumunda fallback (version 0)
- [ ] Performance impact kontrol et
- [ ] Logging ekle
- [ ] Test coverage

## 📅 **Öncelik**
- **Yüksek** - Kategori sıralama sistemi için kritik
- **Tahmini Süre** - 2-3 saat
- **Bağımlılık** - Mevcut kategori sistemi

## ✅ **Tamamlanan İşler (2025-08-27)**

### **Backend Implementasyonu**
- ✅ Supabase migration dosyası oluşturuldu
- ✅ system_settings tablosu ve trigger'lar eklendi
- ✅ `/api/v1/categories/version` endpoint'i eklendi
- ✅ Manuel version artırma endpoint'i eklendi (test için)
- ✅ Log tablosu ve fonksiyonları eklendi (debugging için)

### **Frontend Implementasyonu**
- ✅ Cache version service oluşturuldu
- ✅ App.jsx'e version kontrolü eklendi
- ✅ CategoryGrid component'ine entegrasyon yapıldı
- ✅ TTL (Time To Live) sistemi eklendi (5 dakika)
- ✅ Error handling ve fallback mekanizması eklendi

### **Özellikler**
- ✅ Otomatik cache temizleme
- ✅ Version karşılaştırma
- ✅ Local storage yönetimi
- ✅ React Query cache invalidation
- ✅ Debug fonksiyonları (development'ta)
- ✅ Toast notification'ları

---
*Oluşturulma: 2025-08-26*
*Tamamlanma: 2025-08-27*
*Durum: ✅ Tamamlandı*
