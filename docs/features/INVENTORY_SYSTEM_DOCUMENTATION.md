# 📦 Inventory System Documentation

## 📋 **Genel Bakış**

Inventory sistemi, kullanıcıların sahip oldukları ürünleri yönetmelerini sağlayan kapsamlı bir sistemdir. Bu sistem, ürün ekleme, düzenleme, silme ve görüntüleme işlemlerini destekler.

## 🏗️ **Sistem Mimarisi**

### **Backend API (Hazır)**
- **Controller**: `benalsam-admin-backend/src/controllers/inventoryController.ts`
- **Routes**: `benalsam-admin-backend/src/routes/inventory.ts`
- **Service**: `benalsam-admin-backend/src/services/cloudinaryService.ts`

### **Mobile App (Aktif)**
- **Service**: `benalsam-mobile/src/services/inventoryService.ts`
- **Image Service**: `benalsam-mobile/src/services/imageService.ts`
- **Screens**: `benalsam-mobile/src/screens/InventoryFormScreen.tsx`

### **Recommendation System**
- **Service**: `benalsam-mobile/src/services/recommendationService.ts`
- **Integration**: Seller-focused öneriler için inventory kullanımı

## 🔧 **Teknik Detaylar**

### **Veritabanı Şeması**
```sql
-- inventory_items tablosu
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  main_image_url TEXT,
  additional_image_urls TEXT[],
  image_url TEXT, -- Legacy field
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **API Endpoints (Backend - Hazır)**
```
GET    /api/v1/inventory           - Kullanıcının inventory'lerini getir
POST   /api/v1/inventory           - Yeni inventory item ekle
GET    /api/v1/inventory/:id       - Inventory item detayını getir
PUT    /api/v1/inventory/:id       - Inventory item güncelle
DELETE /api/v1/inventory/:id       - Inventory item sil
POST   /api/v1/inventory/upload-images - Görsel yükle
```

### **Mobile App Service Fonksiyonları**
```typescript
// Inventory CRUD Operations
fetchInventoryItems(userId: string)           // Inventory listesi getir
addInventoryItem(itemData, userId)            // Yeni item ekle
updateInventoryItem(itemData, userId)         // Item güncelle
deleteInventoryItem(itemId, userId)           // Item sil
getInventoryItemById(itemId)                  // Item detayı getir

// Image Processing
processImagesForSupabase(images, mainImageIndex, ...) // Görsel işleme
```

## 🖼️ **Image Upload Sistemi**

### **Mevcut Durum: Supabase Storage**
- **Bucket**: `item_images`
- **Path**: `{userId}/inventory/{timestamp}-{randomId}.{ext}`
- **MIME Type**: Otomatik tespit ve düzeltme
- **Optimization**: Client-side MIME type handling

### **Gelecek: Cloudinary Integration (Hazır)**
- **Folder**: `benalsam/inventory`
- **Optimization**: Thumbnail ve medium size generation
- **Transformation**: 1200x800 original, 800x600 medium, 400x300 thumbnail
- **Format**: Auto (WebP preferred)

### **Image Processing Flow**
1. **Client**: React Native image picker
2. **Processing**: MIME type detection ve düzeltme
3. **Upload**: Supabase Storage (şu an aktif)
4. **URL Generation**: Public URL oluşturma
5. **Database**: URL'leri inventory_items tablosuna kaydetme

## 🔍 **Recommendation System Integration**

### **Seller-Focused Recommendations**
```typescript
// Kullanıcının inventory'sini analiz et
const userInventory = await supabase
  .from('inventory_items')
  .select('id, category')
  .eq('user_id', userId);

// Kategorileri analiz et
const categoryCounts = userInventory.reduce((acc, item) => {
  if (item.category) {
    acc[item.category] = (acc[item.category] || 0) + 1;
  }
  return acc;
}, {});

// Bu kategorilerde alış yapan kullanıcıları bul
const buyerBehaviors = await supabase
  .from('user_behaviors')
  .select('user_id, listing_id, action, category, created_at')
  .in('category', sellerCategories);
```

### **Recommendation Algorithm**
1. **Inventory Analysis**: Kullanıcının inventory kategorilerini analiz et
2. **Buyer Behavior**: Bu kategorilerde alış yapan kullanıcıları bul
3. **Active Buyers**: En aktif alıcıları tespit et
4. **Recommendations**: Bu alıcıların ilgilendiği ilanları öner

## 🚀 **Performans Optimizasyonları**

### **Database Indexes**
```sql
-- Performance için gerekli indexler
CREATE INDEX idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_created_at ON inventory_items(created_at DESC);
```

### **Caching Strategy**
- **User Inventory**: Session-based caching
- **Category Analysis**: 5 dakika TTL
- **Recommendations**: 10 dakika TTL

### **Image Optimization**
- **Compression**: Client-side image compression
- **Format**: WebP preferred, JPEG fallback
- **Size**: Max 5MB per image
- **Count**: Max 10 images per item

## 🔒 **Güvenlik**

### **Authentication**
- **JWT Token**: Tüm API istekleri için gerekli
- **User Isolation**: Kullanıcılar sadece kendi inventory'lerini görebilir
- **Rate Limiting**: API rate limiting aktif

### **Data Validation**
```typescript
// Required fields validation
if (!name || !category) {
  return ApiResponseUtil.badRequest(res, 'Name and category are required');
}

// File type validation
if (!file.mimetype.startsWith('image/')) {
  cb(new Error('Only image files are allowed'));
}
```

### **File Upload Security**
- **MIME Type**: Strict validation
- **File Size**: 5MB limit
- **File Count**: Max 10 images
- **Virus Scan**: Cloudinary built-in protection

## 📊 **Monitoring ve Logging**

### **Log Messages**
```typescript
// Inventory operations
console.log('📦 [InventoryService] Found inventory items:', data?.length || 0);
console.log('🧠 Seller-focused: User inventory items:', userInventory.length);
console.log('🧠 Seller-focused: Seller categories:', sellerCategories);
```

### **Error Handling**
```typescript
// Comprehensive error handling
try {
  const { data, error } = await supabase.from('inventory_items').select('*');
  if (error) {
    console.error('Error fetching inventory items:', error);
    return [];
  }
  return data || [];
} catch (e) {
  console.error('Unexpected error in fetchInventoryItems:', e);
  return [];
}
```

## 🔄 **Migration ve Deployment**

### **Backend API (Hazır)**
- **Status**: Implemented, tested, ready for production
- **Deployment**: PM2 ile deploy edilebilir
- **Environment**: Development ve production configs hazır

### **Mobile App (Aktif)**
- **Status**: Supabase ile çalışıyor
- **Migration**: Backend API'ye geçiş hazır
- **Fallback**: Supabase fallback mekanizması aktif

### **Database Migration**
```sql
-- Inventory items tablosu zaten mevcut
-- Ek indexler eklenebilir
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_category 
ON inventory_items(user_id, category);
```

## 📈 **Analytics ve Metrics**

### **Key Metrics**
- **Inventory Count**: Kullanıcı başına ortalama inventory sayısı
- **Category Distribution**: En popüler inventory kategorileri
- **Image Upload Success Rate**: Başarılı görsel yükleme oranı
- **Recommendation CTR**: Inventory-based önerilerin tıklanma oranı

### **Monitoring Queries**
```sql
-- Inventory statistics
SELECT 
  COUNT(*) as total_inventories,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(items_per_user) as avg_items_per_user
FROM (
  SELECT user_id, COUNT(*) as items_per_user 
  FROM inventory_items 
  GROUP BY user_id
) user_stats;

-- Category distribution
SELECT 
  category,
  COUNT(*) as item_count,
  COUNT(DISTINCT user_id) as user_count
FROM inventory_items 
GROUP BY category 
ORDER BY item_count DESC;
```

## 🛠️ **Troubleshooting**

### **Yaygın Sorunlar**

#### **1. "No inventory found" Mesajı**
**Sorun**: Recommendation service yanlış tablodan veri çekiyor
**Çözüm**: `listings` yerine `inventory_items` tablosunu kullan
```typescript
// Yanlış
.from('listings')

// Doğru
.from('inventory_items')
```

#### **2. MIME Type Hatası**
**Sorun**: `mime type application/json, image/jpeg is not supported`
**Çözüm**: Client-side MIME type detection ve düzeltme
```typescript
const getMimeTypeFromExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg': case 'jpeg': return 'image/jpeg';
    default: return 'image/jpeg';
  }
};
```

#### **3. Image Upload Başarısız**
**Sorun**: Supabase Storage upload hatası
**Çözüm**: File object'i doğru formatta oluştur
```typescript
const fileToUpload = {
  uri: file.uri,
  name: file.name,
  type: mimeType,
} as any;
```

### **Debug Commands**
```bash
# Backend health check
curl -X GET http://192.168.1.10:3002/health

# Inventory API test (auth required)
curl -X GET http://192.168.1.10:3002/api/v1/inventory

# Supabase direct query test
psql -h db.supabase.co -U postgres -d postgres -c "SELECT COUNT(*) FROM inventory_items;"
```

## 🔮 **Gelecek Planları**

### **Kısa Vadeli (1-2 Hafta)**
- [ ] Backend API'yi production'a deploy et
- [ ] Mobile app'i backend API'ye geçir
- [ ] Cloudinary integration'ı aktif et
- [ ] Performance monitoring ekle

### **Orta Vadeli (1-2 Ay)**
- [ ] Advanced inventory analytics
- [ ] Bulk import/export functionality
- [ ] Inventory sharing features
- [ ] Advanced recommendation algorithms

### **Uzun Vadeli (3-6 Ay)**
- [ ] AI-powered inventory management
- [ ] Predictive analytics
- [ ] Integration with external marketplaces
- [ ] Advanced image recognition

## 📚 **Referanslar**

### **Dokümantasyon**
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Cloudinary API Reference](https://cloudinary.com/documentation/admin_api)
- [React Native Image Picker](https://github.com/react-native-image-picker/react-native-image-picker)

### **Kod Referansları**
- `benalsam-mobile/src/services/inventoryService.ts` - Ana inventory service
- `benalsam-mobile/src/services/imageService.ts` - Image processing
- `benalsam-mobile/src/services/recommendationService.ts` - Recommendation integration
- `benalsam-admin-backend/src/controllers/inventoryController.ts` - Backend API

---

**Son Güncelleme**: 31 Ağustos 2025  
**Versiyon**: 1.0.0  
**Durum**: Production Ready
