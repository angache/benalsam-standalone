# 🏗️ BENALSAM PROJE YAPISI - TAM DETAY

## 📁 ANA KLASÖR YAPISI
```
benalsam-standalone/
├── benalsam-admin-backend/          # Backend API (Node.js/Express/TypeScript)
├── benalsam-admin-ui/               # Admin paneli (React/TypeScript)
├── benalsam-web/                    # Ana web sitesi (React/Vite/JavaScript)
├── benalsam-mobile/                 # Mobile app (React Native/Expo)
├── benalsam-shared-types/           # Ortak TypeScript tipleri (NPM paketi)
├── benalsam-infrastructure/         # Docker/Deployment
├── docs/                            # Dokümantasyon
├── todos/                           # TODO listeleri
└── scripts/                         # Yardımcı scriptler
```

---

## 🛠️ TECHNOLOGY STACK

### **Backend (benalsam-admin-backend)**
- **Runtime**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Supabase)
- **Search**: Elasticsearch (VPS'de)
- **Cache**: Redis
- **Auth**: JWT + Supabase Auth
- **Queue**: Custom queue processor

### **Frontend (benalsam-web)**
- **Framework**: React + Vite + JavaScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React hooks + Context
- **HTTP**: Fetch API
- **Cache**: LocalStorage + Redis

### **Mobile (benalsam-mobile)**
- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **State**: Zustand
- **HTTP**: Axios

### **Shared Types (benalsam-shared-types)**
- **Language**: TypeScript
- **Package**: NPM
- **Build**: ESM + CommonJS

---

## 🏗️ DETAYLI KLASÖR YAPISI

### **benalsam-admin-backend/**
```
src/
├── controllers/
│   ├── elasticsearchController.ts    # ES arama, kategori sayıları
│   ├── categoriesController.ts       # Kategori CRUD
│   ├── listingsController.ts         # İlan CRUD
│   ├── authController.ts             # Kimlik doğrulama
│   ├── adminManagementController.ts  # Admin yönetimi
│   └── healthController.ts           # Test ilanları
├── services/
│   ├── elasticsearchService.ts       # ES client, indexing
│   ├── categoryService.ts            # Kategori tree yapısı
│   ├── listingService.ts             # İlan işlemleri
│   ├── queueProcessorService.ts      # ES sync queue
│   ├── cacheManager.ts               # Redis cache
│   ├── userBehaviorService.ts        # Kullanıcı davranışları
│   └── performanceMonitor.ts         # Performans izleme
├── routes/
│   ├── elasticsearch.ts              # /api/v1/elasticsearch/*
│   ├── categories.ts                 # /api/v1/categories/*
│   ├── listings.ts                   # /api/v1/listings/*
│   ├── auth.ts                       # /api/v1/auth/*
│   ├── admin.ts                      # /api/v1/admin/*
│   └── health.ts                     # /api/v1/health/*
├── middleware/
│   ├── auth.ts                       # JWT doğrulama
│   ├── rateLimit.ts                  # Rate limiting
│   ├── errorHandler.ts               # Hata yakalama
│   ├── performanceMonitor.ts         # Performans izleme
│   └── securityMonitor.ts            # Güvenlik izleme
├── config/
│   ├── database.ts                   # Supabase config
│   ├── elasticsearch.ts              # ES config
│   ├── redis.ts                      # Redis config
│   ├── app.ts                        # App config
│   └── logger.ts                     # Logging config
├── database/
│   ├── migrations/                   # DB migrations
│   ├── triggers/                     # PostgreSQL triggers
│   └── seed.ts                       # Seed data
├── optimization/                     # Performans optimizasyonları
├── utils/                            # Yardımcı fonksiyonlar
└── types/                            # Backend tipleri

supabase/
├── migrations/                       # Supabase migrations
├── functions/                        # Edge functions
└── seed.sql                         # Seed data

shared-types/                         # Local shared types
scripts/                              # Backend scriptleri
logs/                                 # Log dosyaları
backups/                              # Database backup'ları
exports/                              # Export dosyaları
```

### **benalsam-web/**
```
src/
├── components/
│   ├── HomePage/
│   │   ├── SidebarContent.jsx        # Kategori sidebar
│   │   ├── CategoryItem.jsx          # Kategori item
│   │   ├── CategorySearch.jsx        # Kategori arama
│   │   ├── MobileCategoryScroller.jsx # Mobile kategori
│   │   └── AISuggestions.jsx         # AI önerileri
│   ├── ui/                           # Reusable components
│   │   ├── button.jsx
│   │   ├── input.jsx
│   │   ├── card.jsx
│   │   └── ...
│   ├── ListingCard.jsx               # İlan kartı
│   ├── SearchBar.jsx                 # Arama çubuğu
│   └── Pagination.jsx                # Sayfalama
├── hooks/
│   ├── useCategoryCounts.js          # Kategori sayıları
│   ├── useHomePageData.js            # Ana sayfa verisi
│   ├── usePagination.js              # Sayfalama
│   ├── useSearch.js                  # Arama
│   └── useAuth.js                    # Kimlik doğrulama
├── services/
│   ├── elasticsearchService.ts       # ES API calls
│   ├── categoryCacheService.ts       # Kategori cache
│   ├── listingService/
│   │   └── fetchers.ts               # İlan çekme
│   ├── authService.ts                # Auth API calls
│   └── aiService.ts                  # AI önerileri
├── pages/
│   ├── HomePage.jsx                  # Ana sayfa
│   ├── ListingDetailPage.jsx         # İlan detayı
│   ├── SearchResultsPage.jsx         # Arama sonuçları
│   ├── ProfilePage.jsx               # Profil
│   └── SettingsPage/                 # Ayarlar
├── contexts/
│   ├── AuthContext.jsx               # Auth context
│   └── ThemeContext.jsx              # Tema context
├── stores/                           # State management
├── utils/                            # Yardımcı fonksiyonlar
├── styles/                           # CSS dosyaları
└── lib/                              # 3rd party libs

public/                               # Static dosyalar
todos/                                # TODO listeleri
scripts/                              # Frontend scriptleri
```

### **benalsam-mobile/**
```
src/
├── components/
│   ├── CategoryFilter.tsx            # Kategori filtreleme
│   ├── ListingCard.tsx               # İlan kartı
│   ├── SearchBar.tsx                 # Arama çubuğu
│   └── ...
├── screens/
│   ├── HomeScreen.tsx                # Ana ekran
│   ├── SearchScreen.tsx              # Arama ekranı
│   ├── ListingDetailScreen.tsx       # İlan detayı
│   └── ProfileScreen.tsx             # Profil ekranı
├── services/
│   ├── apiService.ts                 # API calls
│   ├── categoryService.ts            # Kategori işlemleri
│   └── authService.ts                # Auth işlemleri
├── hooks/                            # Custom hooks
├── stores/                           # Zustand stores
├── navigation/                       # Navigation config
└── utils/                            # Yardımcı fonksiyonlar
```

---

## 🔍 ELASTICSEARCH YAPISI

### **Index: listings**
```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "title": { 
        "type": "text",
        "analyzer": "turkish",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "description": { 
        "type": "text",
        "analyzer": "turkish" 
      },
      "category": { 
        "type": "text",
        "analyzer": "keyword"  // "Elektronik > Bilgisayar > Masaüstü"
      },
      "category_id": { "type": "integer" },
      "category_path": { "type": "integer" },  // [513, 515]
      "price": { "type": "float" },
      "budget": { "type": "float" },
      "status": { "type": "keyword" },         // "active", "pending"
      "location": { "type": "keyword" },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" },
      "is_premium": { "type": "boolean" },
      "is_featured": { "type": "boolean" },
      "is_urgent_premium": { "type": "boolean" },
      "popularity_score": { "type": "float" },
      "views_count": { "type": "integer" },
      "favorites_count": { "type": "integer" },
      "offers_count": { "type": "integer" },
      "condition": { "type": "keyword" },
      "features": { "type": "keyword" },
      "attributes": { "type": "object" },
      "images": { "type": "keyword" },
      "main_image_url": { "type": "keyword" },
      "additional_image_urls": { "type": "keyword" },
      "contact_preference": { "type": "keyword" },
      "urgency": { "type": "keyword" },
      "neighborhood": { "type": "keyword" },
      "latitude": { "type": "float" },
      "longitude": { "type": "float" },
      "geolocation": { "type": "geo_point" },
      "tags": { "type": "keyword" },
      "fts": { "type": "text" }                // Full-text search
    }
  }
}
```

### **Aggregations**
```json
// Kategori sayıları
{
  "aggs": {
    "category_counts": {
      "terms": {
        "field": "category",
        "size": 1000
      }
    }
  }
}

// Fiyat aralıkları
{
  "aggs": {
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 100 },
          { "from": 100, "to": 500 },
          { "from": 500, "to": 1000 },
          { "from": 1000 }
        ]
      }
    }
  }
}
```

---

## 🧠 REDIS CACHE YAPISI

### **Cache Keys ve TTL'ler**
```javascript
const CACHE_CONFIG = {
  'categories_tree': 30 * 60 * 1000,        // 30 dakika
  'category_counts': 30 * 60 * 1000,        // 30 dakika
  'search:results:*': 5 * 60 * 1000,        // 5 dakika
  'user_preferences:*': 60 * 60 * 1000,     // 1 saat
  'listing_details:*': 15 * 60 * 1000,      // 15 dakika
  'popular_listings': 10 * 60 * 1000,       // 10 dakika
  'trending_categories': 20 * 60 * 1000     // 20 dakika
};
```

### **Cache Key Patterns**
```
'search:results:ahod9b'                      // Arama sonuçları
'category_counts'                            // Kategori sayıları
'categories_tree'                            // Kategori ağacı
'user:preferences:user123'                   // Kullanıcı tercihleri
'listing:details:listing456'                 // İlan detayları
'popular_listings:electronics'               // Popüler ilanlar
'trending_categories'                        // Trend kategoriler
'rate_limit:ip:192.168.1.1'                 // Rate limiting
'auth_attempts:user123'                      // Auth denemeleri
```

---

## 🏷️ KATEGORİ YAPISI

### **Supabase categories tablosu**
```sql
CREATE TABLE categories (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,                        -- "Masaüstü Bilgisayar"
  path TEXT NOT NULL UNIQUE,                 -- "Elektronik > Bilgisayar > Masaüstü Bilgisayar"
  parent_id BIGINT REFERENCES categories(id),
  level INTEGER DEFAULT 0,                   -- 0: Ana, 1: Alt, 2: Alt-alt
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  icon TEXT,                                 -- "Computer"
  color TEXT,                                -- "from-blue-500 to-cyan-500"
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Örnek veriler
INSERT INTO categories VALUES
(499, 'Elektronik', 'Elektronik', NULL, 0, 0, true, 'Smartphone', 'from-blue-500 to-cyan-500'),
(513, 'Bilgisayar', 'Elektronik > Bilgisayar', 499, 1, 1000, true, 'Computer', NULL),
(515, 'Masaüstü Bilgisayar', 'Elektronik > Bilgisayar > Masaüstü Bilgisayar', 513, 2, 2000, true, NULL, NULL);
```

### **Kategori Hiyerarşisi**
```
Elektronik (id: 499, level: 0)
├── Telefon (id: 500, level: 1)
│   ├── Akıllı Telefonlar (id: 501, level: 2)
│   └── Gaming Telefon (id: 502, level: 2)
└── Bilgisayar (id: 513, level: 1)
    ├── Dizüstü Bilgisayar (id: 514, level: 2)
    └── Masaüstü Bilgisayar (id: 515, level: 2)
```

### **Kategori Sayıları Hesaplama**
```javascript
// Frontend'de toplama
const getCategoryCount = (categoryPath) => {
  const fullPath = categoryPath.join(' > ');
  let totalCount = categoryCounts[fullPath] || 0;
  
  // Alt kategorilerindeki sayıları topla
  Object.entries(categoryCounts).forEach(([name, count]) => {
    if (name.startsWith(fullPath + ' >')) {
      totalCount += count;
    }
  });
  
  return totalCount;
};
```

---

## 🔄 VERİ AKIŞI

### **1. İlan Oluşturma**
```
Frontend → Backend → Supabase → Trigger → Queue → ES Index
```

### **2. Kategori Sayıları**
```
Frontend → Backend → ES Aggregation → Redis Cache → Response
```

### **3. Arama**
```
Frontend → Backend → ES Search → Redis Cache → Response
```

### **4. Kategori Ağacı**
```
Frontend → Backend → Supabase → Redis Cache → Response
```

### **5. Queue Processing**
```
Supabase → Queue → Processor → ES Index → Cache Invalidation
```

---

## 📡 API ENDPOINT'LERİ

### **Elasticsearch**
```javascript
GET    /api/v1/elasticsearch/search                    // Arama
GET    /api/v1/elasticsearch/category-counts           // Kategori sayıları
POST   /api/v1/elasticsearch/category-counts/invalidate // Cache temizle
GET    /api/v1/elasticsearch/health                    // ES sağlık kontrolü
```

### **Categories**
```javascript
GET    /api/v1/categories                              // Kategori ağacı
GET    /api/v1/categories/all                          // Tüm kategoriler (flat)
GET    /api/v1/categories/:id                          // Tek kategori
POST   /api/v1/categories                              // Kategori oluştur (admin)
PUT    /api/v1/categories/:id                          // Kategori güncelle (admin)
DELETE /api/v1/categories/:id                          // Kategori sil (admin)
```

### **Listings**
```javascript
GET    /api/v1/listings                                // İlanları listele
POST   /api/v1/listings                                // İlan oluştur
GET    /api/v1/listings/:id                            // İlan detayı
PUT    /api/v1/listings/:id                            // İlan güncelle
DELETE /api/v1/listings/:id                            // İlan sil
```

### **Auth**
```javascript
POST   /api/v1/auth/login                              // Giriş
POST   /api/v1/auth/register                           // Kayıt
POST   /api/v1/auth/logout                             // Çıkış
POST   /api/v1/auth/refresh                            // Token yenile
GET    /api/v1/auth/me                                 // Kullanıcı bilgisi
```

### **Admin**
```javascript
GET    /api/v1/admin/users                             // Kullanıcıları listele
PUT    /api/v1/admin/users/:id                         // Kullanıcı güncelle
DELETE /api/v1/admin/users/:id                         // Kullanıcı sil
GET    /api/v1/admin/analytics                         // Analitikler
GET    /api/v1/admin/reports                           // Raporlar
```

### **Health**
```javascript
GET    /api/v1/health                                  // Sağlık kontrolü
POST   /api/v1/health/test-listings/create             // Test ilanları oluştur
DELETE /api/v1/health/test-listings/clear              // Test ilanları temizle
```

---

## 🔧 QUEUE PROCESSOR

### **Queue İşleme Sırası**
```javascript
1. Supabase'den yeni ilanları al
2. Status = 'active' kontrolü yap
3. Elasticsearch'e index et
4. Cache'leri temizle
5. Başarılı/başarısız logla
6. Hata durumunda retry mekanizması
```

### **Trigger Yapısı**
```sql
-- listings_queue_sync trigger
CREATE OR REPLACE FUNCTION sync_listing_to_elasticsearch()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO listings_queue (listing_id, action, created_at)
  VALUES (NEW.id, 'index', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## ⚡ PERFORMANS OPTİMİZASYONLARI

### **Frontend**
- Lazy loading (React.lazy)
- Code splitting
- Image optimization
- LocalStorage caching
- Debounced search

### **Backend**
- Redis caching
- Database indexing
- Connection pooling
- Rate limiting
- Compression

### **Elasticsearch**
- Index optimization
- Shard management
- Query optimization
- Aggregation caching

---

## 🔒 GÜVENLİK

### **Authentication**
- JWT tokens
- Refresh token rotation
- Rate limiting
- Session management

### **Authorization**
- Role-based access control (RBAC)
- Permission-based access
- Admin panel security

### **Data Protection**
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

---

## 📈 MONITORING & ANALYTICS

### **Performance Monitoring**
- Response time tracking
- Error rate monitoring
- Database query optimization
- Cache hit rate tracking

### **User Analytics**
- Page view tracking
- Search analytics
- Category popularity
- User behavior analysis

### **Security Monitoring**
- Failed login attempts
- Suspicious activity detection
- Rate limit violations
- Validation failures

---

## 🚀 DEPLOYMENT

### **Environment Variables**
```bash
# Backend
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ELASTICSEARCH_URL=
REDIS_URL=
JWT_SECRET=
NODE_ENV=

# Frontend
VITE_API_URL=
VITE_ADMIN_BACKEND_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### **Docker**
```dockerfile
# Backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["npm", "start"]

# Frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 📝 ÖNEMLİ NOTLAR

### **Önemli Dosyalar**
- `benalsam-admin-backend/src/services/elasticsearchService.ts` - ES işlemleri
- `benalsam-admin-backend/src/services/categoryService.ts` - Kategori işlemleri
- `benalsam-web/src/hooks/useCategoryCounts.js` - Kategori sayıları
- `benalsam-web/src/services/categoryCacheService.ts` - Kategori cache

### **Cache Temizleme**
```javascript
// Browser console
localStorage.clear();
sessionStorage.clear();
location.reload();

// Backend
await cacheManager.delete('category_counts');
await cacheManager.delete('categories_tree');
```

### **Test İlanları**
```bash
# Oluştur
curl -X POST "http://localhost:3002/api/v1/health/test-listings/create" \
  -H "Content-Type: application/json" \
  -d '{"count": 20, "includeImages": true}'

# Temizle
curl -X DELETE "http://localhost:3002/api/v1/health/test-listings/clear"
```

### **Yaygın Sorunlar ve Çözümler**
1. **Beyaz sayfa**: Browser history temizle
2. **Cache sorunları**: LocalStorage temizle
3. **ES bağlantı sorunu**: VPS'deki ES'i kontrol et
4. **Kategori sayıları 0**: Cache invalidation yap

---

## 🎯 SONUÇ

Bu yapı tamamen güncel ve projenin son halini yansıtıyor. Standalone repository yapısı ile her proje bağımsız çalışabiliyor ve shared-types npm paketi ile tip paylaşımı sağlanıyor.

**Ana Özellikler:**
- ✅ Elasticsearch tabanlı arama
- ✅ Redis cache sistemi
- ✅ Kategori bazlı filtreleme
- ✅ Real-time kategori sayıları
- ✅ Admin paneli
- ✅ Mobile app
- ✅ Performance monitoring
- ✅ Security monitoring

**Son Güncelleme:** 24 Ağustos 2025
