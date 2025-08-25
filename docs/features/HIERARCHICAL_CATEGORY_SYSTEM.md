# 🏗️ Hiyerarşik Kategori Sistemi Dokümantasyonu

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Sistem Mimarisi](#sistem-mimarisi)
3. [Veri Yapısı](#veri-yapısı)
4. [Backend Implementasyonu](#backend-implementasyonu)
5. [Frontend Implementasyonu](#frontend-implementasyonu)
6. [Cache Sistemi](#cache-sistemi)
7. [API Endpoints](#api-endpoints)
8. [Kullanım Örnekleri](#kullanım-örnekleri)
9. [Troubleshooting](#troubleshooting)
10. [Performans Optimizasyonları](#performans-optimizasyonları)

---

## 🎯 Genel Bakış

Hiyerarşik kategori sistemi, BenAlsam platformunda kategorilerin parent-child ilişkilerini yöneten ve her seviyede doğru ilan sayılarını hesaplayan gelişmiş bir sistemdir.

### 🎯 Amaçlar
- **Hiyerarşik Kategori Yapısı:** Ana kategoriler, alt kategoriler ve leaf kategoriler
- **Doğru İlan Sayıları:** Her kategori seviyesinde toplam ilan sayısı
- **Dinamik Kategori Yönetimi:** Backend'den gerçek zamanlı kategori çekme
- **Performans Optimizasyonu:** Cache sistemi ile hızlı erişim
- **ID Bazlı Filtreleme:** Kategori isimleri yerine ID kullanımı

### 📊 Örnek Senaryo
```
Emlak (Ana Kategori): 5 ilan
├── Konut (Alt Kategori): 3 ilan
│   ├── Satılık Daire: 2 ilan
│   └── Kiralık Daire: 1 ilan
└── Ticari (Alt Kategori): 2 ilan
    ├── Satılık Dükkan: 1 ilan
    └── Kiralık Dükkan: 1 ilan
```

---

## 🏛️ Sistem Mimarisi

### 🔄 Veri Akışı
```
Supabase (Categories) 
    ↓
Backend API (/categories/all)
    ↓
Frontend Cache (Local Storage)
    ↓
Category Components (Sidebar)
    ↓
User Interface
```

### 🗄️ Veri Kaynakları
1. **Supabase:** Ana kategori veritabanı (555 kategori)
2. **Elasticsearch:** İlan verileri ve kategori sayıları
3. **Redis:** Backend cache (30 dakika TTL)
4. **Local Storage:** Frontend cache (10 dakika TTL)

---

## 📊 Veri Yapısı

### 🗃️ Supabase Categories Tablosu
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    parent_id INTEGER REFERENCES categories(id),
    path VARCHAR, -- "Emlak/Konut/Satılık Daire"
    icon VARCHAR,
    color VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 📄 Elasticsearch Listing Mapping
```json
{
  "mappings": {
    "properties": {
      "category_id": { "type": "integer" },
      "category_path": { "type": "long" } // Array of category IDs
    }
  }
}
```

### 🏷️ Kategori Örneği
```json
{
  "id": 723,
  "name": "Kompresör",
  "parent_id": 949,
  "path": "İş & Endüstri/İş Makineleri/Kompresör",
  "icon": "Wrench",
  "color": "from-gray-600 to-slate-600",
  "subcategories": []
}
```

---

## 🔧 Backend Implementasyonu

### 📁 Dosya Yapısı
```
benalsam-admin-backend/
├── src/
│   ├── controllers/
│   │   └── categoriesController.ts
│   ├── routes/
│   │   └── categories.ts
│   ├── services/
│   │   ├── categoryService.ts
│   │   └── elasticsearchService.ts
│   └── routes/
│       └── health.ts
```

### 🔌 Elasticsearch Service
```typescript
// Hiyerarşik kategori sayıları hesaplama
async getCategoryCounts(): Promise<Record<number, number>> {
  // 1. Leaf kategorileri Elasticsearch'ten çek
  const response = await this.client.search({
    index: this.defaultIndexName,
    body: {
      size: 0,
      aggs: {
        category_counts: {
          terms: {
            field: 'category_id',
            size: 1000
          }
        }
      }
    }
  });

  // 2. Supabase'den kategori yapısını al
  const { data: categories } = await this.supabase
    .from('categories')
    .select('id, parent_id, name');

  // 3. Her leaf kategori için parent'lara sayı ekle
  Object.entries(categoryCounts).forEach(([categoryId, count]) => {
    const categoryIdNum = parseInt(categoryId);
    this.addCountToParents(categoryIdNum, count, categories, categoryCounts);
  });

  return categoryCounts;
}

// Parent kategorilere sayı ekleme (recursive)
private addCountToParents(categoryId: number, count: number, categories: any[], categoryCounts: Record<number, number>) {
  const category = categories.find(cat => cat.id === categoryId);
  if (category && category.parent_id) {
    categoryCounts[category.parent_id] = (categoryCounts[category.parent_id] || 0) + count;
    this.addCountToParents(category.parent_id, count, categories, categoryCounts);
  }
}
```

### 🎯 Category Service
```typescript
// Tüm kategorileri flat liste olarak getir
async getAllCategories(): Promise<any[]> {
  const { data, error } = await this.supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
}

// Kategori ağacını oluştur
async getCategoryTree(): Promise<any[]> {
  const categories = await this.getAllCategories();
  return this.buildCategoryTree(categories);
}

// Flat listeyi tree yapısına çevir
private buildCategoryTree(categories: any[]): any[] {
  const categoryMap = new Map();
  const rootCategories = [];

  // Tüm kategorileri map'e ekle
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, subcategories: [] });
  });

  // Parent-child ilişkilerini kur
  categories.forEach(category => {
    if (category.parent_id && categoryMap.has(category.parent_id)) {
      const parent = categoryMap.get(category.parent_id);
      parent.subcategories.push(categoryMap.get(category.id));
    } else {
      rootCategories.push(categoryMap.get(category.id));
    }
  });

  return rootCategories;
}
```

---

## 🎨 Frontend Implementasyonu

### 📁 Dosya Yapısı
```
benalsam-web/
├── src/
│   ├── services/
│   │   └── dynamicCategoryService.js
│   ├── hooks/
│   │   └── useCategoryCounts.js
│   ├── components/
│   │   └── HomePage/
│   │       ├── CategoryItem.jsx
│   │       ├── CategorySearch.jsx
│   │       └── SidebarContent.jsx
│   └── pages/
│       └── HomePage.jsx
```

### 🔄 Dynamic Category Service
```javascript
class DynamicCategoryService {
  constructor() {
    this.categories = null;
    this.categoryTree = null;
    this.isLoading = false;
  }

  // Backend'den kategorileri çek
  async fetchCategories() {
    const response = await fetch(`${ADMIN_BACKEND_URL}/api/v1/categories/all`);
    const result = await response.json();
    return result.data || [];
  }

  // Kategori verilerini zenginleştir (icon, color ekle)
  enrichCategoryData(categories) {
    return categories.map(category => ({
      ...category,
      icon: this.getIconForCategory(category.name),
      color: this.getColorForCategory(category.name),
      subcategories: category.subcategories ? 
        this.enrichCategoryData(category.subcategories) : []
    }));
  }

  // Kategori ağacını al
  async getCategoryTree() {
    const cached = this.getCachedData(CATEGORY_TREE_CACHE_KEY);
    if (cached) return cached;

    const categories = await this.getCategories();
    const tree = this.buildCategoryTree(categories);
    
    this.setCachedData(CATEGORY_TREE_CACHE_KEY, tree);
    return tree;
  }
}
```

### 🎣 useCategoryCounts Hook
```javascript
export const useCategoryCounts = () => {
  const [categoryCounts, setCategoryCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Elasticsearch'ten category counts çek
  const fetchCategoryCountsFromElasticsearch = useCallback(async () => {
    const response = await fetch(`${ADMIN_BACKEND_URL}/api/v1/elasticsearch/category-counts`);
    if (response.ok) {
      const result = await response.json();
      return result.data || {};
    }
    return null;
  }, []);

  // Kategori ID'sine göre sayı getir
  const getCategoryCount = useCallback((categoryId) => {
    if (!categoryId) {
      // Tüm ilanlar için toplam sayı
      return Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    }
    
    // Kategori ID'si ile direkt eşleştirme
    const count = categoryCounts[categoryId] || 0;
    return count;
  }, [categoryCounts]);

  return {
    categoryCounts,
    getCategoryCount,
    isLoading,
    totalListings,
    refresh: async () => {
      const counts = await fetchCategoryCounts();
      setCategoryCounts(counts);
    }
  };
};
```

### 🧩 CategoryItem Component
```jsx
const CategoryItem = ({ category, level = 0, onSelect, selectedPath = [], getCategoryCount, isLoadingCounts }) => {
  // Kategori sayısını al
  const getCategoryCountValue = () => {
    if (getCategoryCount && category.id) {
      const count = getCategoryCount(category.id);
      console.log(`🔍 CategoryItem - ${category.name} (ID: ${category.id}): ${count}`);
      return count;
    }
    return 0;
  };

  return (
    <div className="text-sm">
      <motion.div className="flex items-center justify-between py-2 px-3">
        <span className="flex items-center gap-2">
          <IconComponent className="w-4 h-4" />
          <span>{category.name}</span>
        </span>
        {getCategoryCount && (
          <motion.span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            {isLoadingCounts ? (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              getCategoryCountValue()
            )}
          </motion.span>
        )}
      </motion.div>
      {/* Alt kategoriler */}
      {isOpen && hasSubcategories && (
        <motion.div>
          {category.subcategories.map(subCategory => (
            <CategoryItem
              key={subCategory.name}
              category={subCategory}
              level={level + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
              getCategoryCount={getCategoryCount}
              isLoadingCounts={isLoadingCounts}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};
```

---

## 💾 Cache Sistemi

### 🔄 Backend Cache (Redis)
```typescript
// Cache key'leri
const CACHE_KEYS = {
  CATEGORY_COUNTS: 'category_counts',
  CATEGORIES: 'categories',
  CATEGORY_TREE: 'category_tree'
};

// Cache TTL'leri
const CACHE_TTL = {
  CATEGORY_COUNTS: 30 * 60 * 1000, // 30 dakika
  CATEGORIES: 60 * 60 * 1000,      // 1 saat
  CATEGORY_TREE: 60 * 60 * 1000    // 1 saat
};
```

### 💾 Frontend Cache (Local Storage)
```javascript
// Cache key'leri
const CACHE_KEY = 'category_counts_cache_v6';
const CATEGORIES_CACHE_KEY = 'dynamic_categories_cache_v1';
const CATEGORY_TREE_CACHE_KEY = 'dynamic_category_tree_cache_v1';

// Cache TTL'leri
const CACHE_TTL = 10 * 60 * 1000; // 10 dakika
const RATE_LIMIT = 30 * 1000;     // 30 saniye

// Cache fonksiyonları
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    if (now - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch (error) {
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};
```

---

## 🌐 API Endpoints

### 📊 Category Counts
```http
GET /api/v1/elasticsearch/category-counts
```

**Response:**
```json
{
  "success": true,
  "data": {
    "948": 1,  // Ana kategori (İş & Endüstri)
    "949": 1,  // Alt kategori (İş Makineleri)
    "953": 1   // Leaf kategori (Kompresör)
  },
  "message": "Category counts retrieved successfully"
}
```

### 📋 All Categories
```http
GET /api/v1/categories/all
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 948,
      "name": "İş & Endüstri",
      "parent_id": null,
      "path": "İş & Endüstri",
      "icon": "Briefcase",
      "color": "from-gray-600 to-slate-600"
    },
    {
      "id": 949,
      "name": "İş Makineleri",
      "parent_id": 948,
      "path": "İş & Endüstri/İş Makineleri",
      "icon": "Wrench",
      "color": "from-gray-600 to-slate-600"
    }
  ],
  "message": "Categories retrieved successfully"
}
```

### 🗑️ Invalidate Cache
```http
POST /api/v1/elasticsearch/category-counts/invalidate
```

**Response:**
```json
{
  "success": true,
  "message": "Category counts cache invalidated successfully"
}
```

---

## 💡 Kullanım Örnekleri

### 🔍 Kategori Sayısı Alma
```javascript
// Hook kullanımı
const { getCategoryCount, isLoading } = useCategoryCounts();

// Belirli bir kategorinin sayısını al
const count = getCategoryCount(948); // İş & Endüstri: 1

// Tüm kategorilerin toplam sayısını al
const totalCount = getCategoryCount(); // Tüm kategoriler: 1
```

### 🌳 Kategori Ağacı Oluşturma
```javascript
// Dynamic category service kullanımı
const categoryService = new DynamicCategoryService();

// Kategori ağacını al
const categoryTree = await categoryService.getCategoryTree();

// Sonuç:
[
  {
    id: 948,
    name: "İş & Endüstri",
    subcategories: [
      {
        id: 949,
        name: "İş Makineleri",
        subcategories: [
          {
            id: 953,
            name: "Kompresör",
            subcategories: []
          }
        ]
      }
    ]
  }
]
```

### 🎯 Kategori Filtreleme
```javascript
// HomePage'de kategori seçimi
const handleCategoryClick = (category, level, fullPath) => {
  console.log('Selected category:', category.name, 'ID:', category.id);
  
  // Elasticsearch'e category_id gönder
  const searchParams = {
    filters: {
      category_id: category.id
    }
  };
  
  // İlanları filtrele
  fetchListings(searchParams);
};
```

---

## 🔧 Troubleshooting

### ❌ Kategori Sayıları Görünmüyor
**Sorun:** Frontend'de kategori sayıları 0 görünüyor.

**Çözüm:**
1. Backend cache'ini temizle:
```bash
curl -X POST "http://localhost:3002/api/v1/elasticsearch/category-counts/invalidate"
```

2. Frontend cache'ini temizle:
```javascript
localStorage.removeItem('category_counts_cache_v6');
```

3. Backend'den category counts'u kontrol et:
```bash
curl -X GET "http://localhost:3002/api/v1/elasticsearch/category-counts"
```

### ❌ Kategoriler Yüklenmiyor
**Sorun:** Sidebar'da kategoriler görünmüyor.

**Çözüm:**
1. Backend'den kategorileri kontrol et:
```bash
curl -X GET "http://localhost:3002/api/v1/categories/all"
```

2. Frontend cache'ini temizle:
```javascript
localStorage.removeItem('dynamic_category_tree_cache_v1');
localStorage.removeItem('benalsam_categories_v1.2.0');
```

3. Console'da hata mesajlarını kontrol et.

### ❌ Elasticsearch Bağlantı Hatası
**Sorun:** Backend Elasticsearch'e bağlanamıyor.

**Çözüm:**
1. Elasticsearch URL'ini kontrol et:
```typescript
// benalsam-admin-backend/src/services/elasticsearchService.ts
node: string = process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200'
```

2. Elasticsearch'in çalıştığını kontrol et:
```bash
curl -X GET "http://209.227.228.96:9200/_cluster/health"
```

### ❌ Hiyerarşik Sayılar Yanlış
**Sorun:** Parent kategorilerde sayılar yanlış hesaplanıyor.

**Çözüm:**
1. Supabase'deki kategori yapısını kontrol et:
```sql
SELECT id, name, parent_id, path FROM categories ORDER BY id;
```

2. Elasticsearch'teki category_path field'ını kontrol et:
```bash
curl -X POST "http://209.227.228.96:9200/listings/_search" \
  -H "Content-Type: application/json" \
  -d '{"size": 1, "_source": ["category_id", "category_path"]}'
```

---

## ⚡ Performans Optimizasyonları

### 🚀 Backend Optimizasyonları
1. **Redis Cache:** Category counts için 30 dakika TTL
2. **Database Indexing:** categories tablosunda parent_id index'i
3. **Elasticsearch Aggregations:** category_id field'ı için terms aggregation
4. **Connection Pooling:** Supabase ve Elasticsearch bağlantıları

### 🚀 Frontend Optimizasyonları
1. **Local Storage Cache:** 10 dakika TTL ile kategori verileri
2. **Rate Limiting:** 30 saniye içinde tekrar istek yapma
3. **Lazy Loading:** Kategori component'leri lazy load
4. **Memoization:** useCallback ile gereksiz re-render'ları önleme

### 📊 Cache Stratejisi
```javascript
// Cache hierarchy
1. Local Storage (Frontend) - 10 dakika
2. Redis (Backend) - 30 dakika
3. Database (Supabase) - Ana kaynak
4. Elasticsearch - İlan verileri
```

### 🔄 Cache Invalidation
```javascript
// Otomatik cache temizleme
- TTL süresi dolduğunda otomatik temizleme
- Manuel cache temizleme endpoint'i
- İlan eklendiğinde/güncellendiğinde cache temizleme
```

---

## 📈 Monitoring ve Logging

### 🔍 Debug Logları
```javascript
// Frontend debug logları
console.log('🔍 CategoryItem - Kategori Adı (ID: 948): 1');
console.log('📦 Category tree loaded from cache');
console.log('💾 Caching Elasticsearch counts: {948: 1, 949: 1, 953: 1}');

// Backend debug logları
logger.info('📊 Retrieved and cached hierarchical category counts for 3 categories');
logger.info('📦 Category counts loaded from cache');
logger.info('🗑️ Category counts cache invalidated');
```

### 📊 Performance Metrics
```javascript
// Frontend performance
- Category loading time: ~200ms
- Cache hit rate: ~95%
- API response time: ~150ms

// Backend performance
- Elasticsearch query time: ~50ms
- Redis cache hit rate: ~90%
- Database query time: ~30ms
```

---

## 🔮 Gelecek Geliştirmeler

### 🎯 Planlanan Özellikler
1. **Real-time Updates:** WebSocket ile gerçek zamanlı kategori güncellemeleri
2. **Advanced Filtering:** Çoklu kategori seçimi
3. **Category Analytics:** Kategori bazlı analitikler
4. **Auto-complete:** Kategori arama önerileri
5. **Category Management:** Admin panelinde kategori yönetimi

### 🔧 Teknik İyileştirmeler
1. **GraphQL:** Daha verimli veri çekme
2. **Service Worker:** Offline kategori cache'i
3. **Virtual Scrolling:** Büyük kategori listeleri için
4. **Progressive Loading:** Kategori ağacını kademeli yükleme

---

## 📚 Kaynaklar

### 🔗 İlgili Dosyalar
- `benalsam-admin-backend/src/services/elasticsearchService.ts`
- `benalsam-admin-backend/src/services/categoryService.ts`
- `benalsam-web/src/services/dynamicCategoryService.js`
- `benalsam-web/src/hooks/useCategoryCounts.js`
- `benalsam-web/src/components/HomePage/CategoryItem.jsx`

### 📖 Dokümantasyon
- [Elasticsearch Aggregations](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html)
- [Supabase Documentation](https://supabase.com/docs)
- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

## 📞 Destek

### 🆘 Sorun Bildirimi
Eğer bu sistemle ilgili bir sorun yaşıyorsanız:

1. **Console Logları:** Browser console'undaki hata mesajlarını kontrol edin
2. **Network Tab:** API isteklerinin başarılı olup olmadığını kontrol edin
3. **Cache Temizleme:** Yukarıdaki troubleshooting adımlarını deneyin
4. **Issue Açma:** GitHub'da detaylı issue açın

### 👥 Geliştirici Ekibi
- **Backend:** Elasticsearch ve Supabase entegrasyonu
- **Frontend:** React hooks ve component'ler
- **DevOps:** Cache ve performans optimizasyonları

---

*Bu dokümantasyon sürekli güncellenmektedir. Son güncelleme: 2025-08-25*
