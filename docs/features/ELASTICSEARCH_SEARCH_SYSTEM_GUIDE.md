# 🔍 Elasticsearch Search Sistemi - Kapsamlı Rehber

## 📋 İçindekiler
1. [Sistem Genel Bakış](#sistem-genel-bakış)
2. [Mimari Yapı](#mimari-yapı)
3. [Veri Akışı](#veri-akışı)
4. [Search Algoritması](#search-algoritması)
5. [API Endpoints](#api-endpoints)
6. [Kullanım Örnekleri](#kullanım-örnekleri)
7. [Sistem Durumu](#sistem-durumu)
8. [Kurulum ve Yapılandırma](#kurulum-ve-yapılandırma)

---

## 🎯 Sistem Genel Bakış

### **Hibrit Search Sistemi**
Benalsam projesi, **hibrit bir search yaklaşımı** kullanır:

```
Frontend → Admin Backend → Elasticsearch (Primary)
                    ↓
                Supabase (Fallback)
```

### **Neden Bu Yaklaşım?**
- ✅ **Performance**: Elasticsearch 10-100x daha hızlı
- ✅ **Intelligence**: Fuzzy search, boosting, MLT
- ✅ **Scalability**: Büyük veri setleri için optimize
- ✅ **Reliability**: Fallback mekanizması
- ✅ **Analytics**: Arama istatistikleri ve monitoring

---

## 🏗️ Mimari Yapı

### **Bileşenler:**

#### **1. Admin Backend (Port 3002)**
- **Elasticsearch Service**: Search işlemleri
- **Queue Processor**: Veri senkronizasyonu
- **Indexer Service**: Toplu veri aktarımı
- **Sync Service**: Real-time senkronizasyon

#### **2. Elasticsearch (VPS: 209.227.228.96:9200)**
- **Index**: `benalsam_listings`
- **Mapping**: Optimize edilmiş field mapping
- **Sharding**: Horizontal scaling desteği

#### **3. Supabase (Fallback)**
- **PostgreSQL Functions**: `search_listings_with_attributes`
- **Full-text Search**: PostgreSQL FTS
- **Attribute Search**: JSONB attribute filtreleme

#### **4. Redis (VPS: 209.227.228.96:6379)**
- **Message Queue**: Elasticsearch sync queue
- **Caching**: Search result caching
- **Session Management**: Admin sessions

---

## 🔄 Veri Akışı

### **İlan Oluşturma Süreci:**

```
1. İlan Oluştur → Supabase'e Kaydet → Status: 'draft'
     ↓
2. Admin Onayla → Status: 'active' → Trigger Tetiklenir
     ↓
3. PostgreSQL Trigger → Elasticsearch Sync Queue
     ↓
4. Queue Processor → Elasticsearch'e Index
     ↓
5. Search Sonuçlarında Görünür
```

### **Real-time Senkronizasyon:**

#### **PostgreSQL Triggers:**
```sql
CREATE TRIGGER listings_elasticsearch_sync
    AFTER INSERT OR UPDATE OR DELETE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION log_elasticsearch_change();
```

#### **Queue Processing:**
```typescript
// Her 5 saniyede bir queue'yu kontrol et
setInterval(async () => {
  await this.processQueue();
}, 5000);
```

### **Veri Dönüşümü:**
```typescript
private transformListingForElasticsearch(listing: any): any {
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    budget: listing.budget,
    location: {
      lat: listing.latitude,
      lon: listing.longitude,
      text: listing.location
    },
    urgency: listing.urgency,
    attributes: listing.attributes || {},
    user_id: listing.user_id,
    status: listing.status,
    created_at: listing.created_at,
    updated_at: listing.updated_at,
    popularity_score: listing.popularity_score || 0,
    is_premium: listing.is_premium || false,
    tags: listing.tags || []
  };
}
```

---

## 🔍 Search Algoritması

### **Multi-Match Search:**
```typescript
multi_match: {
  query: "arama metni",
  fields: ['title^3', 'description^2', 'category', 'tags'],
  type: 'best_fields',
  fuzziness: 'AUTO'
}
```

### **Ağırlıklandırma:**
- **Başlık**: 3x ağırlık (en önemli)
- **Açıklama**: 2x ağırlık (orta önem)
- **Kategori**: 1x ağırlık (düşük önem)
- **Etiketler**: 1x ağırlık (düşük önem)

### **Filtreler:**

#### **Kategori Filtresi:**
```typescript
term: { category: "elektronik" }
```

#### **Fiyat Aralığı:**
```typescript
range: { budget: { gte: 100, lte: 1000 } }
```

#### **Konum Filtresi:**
```typescript
geo_distance: {
  distance: "10km",
  location: { lat: 41.0082, lon: 28.9784 }
}
```

#### **Premium Filtresi:**
```typescript
term: { is_premium: true }
```

### **Sıralama:**
```typescript
sort: [
  { _score: { order: 'desc' } },        // Relevance score
  { created_at: { order: 'desc' } }     // Tarih sıralaması
]
```

---

## 🌐 API Endpoints

### **Search Endpoints:**

#### **1. Elasticsearch Search**
```
POST /api/v1/elasticsearch/search
```

**Request Body:**
```json
{
  "query": "iPhone",
  "filters": {
    "category": "elektronik",
    "minBudget": 1000,
    "maxBudget": 5000,
    "isPremium": true
  },
  "sort": {
    "field": "created_at",
    "order": "desc"
  },
  "page": 1,
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hits": [
      {
        "id": "listing-id",
        "score": 0.95,
        "title": "iPhone 13 Pro",
        "description": "Mint condition iPhone",
        "category": "elektronik",
        "budget": 2500,
        "location": "İstanbul",
        "created_at": "2025-07-21T10:00:00Z"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

#### **2. Health Check**
```
GET /api/v1/elasticsearch/health
```

#### **3. Index Statistics**
```
GET /api/v1/elasticsearch/stats
```

#### **4. Reindex All**
```
POST /api/v1/elasticsearch/reindex
```

#### **5. Sync Status**
```
GET /api/v1/elasticsearch/sync/status
```

---

## 📝 Kullanım Örnekleri

### **1. Basit Arama:**
```bash
curl -X POST http://localhost:3002/api/v1/elasticsearch/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "iPhone",
    "page": 1,
    "limit": 10
  }'
```

### **2. Filtreli Arama:**
```bash
curl -X POST http://localhost:3002/api/v1/elasticsearch/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "telefon",
    "filters": {
      "category": "elektronik",
      "minBudget": 1000,
      "maxBudget": 5000,
      "isPremium": true
    },
    "sort": {
      "field": "created_at",
      "order": "desc"
    }
  }'
```

### **3. Konum Bazlı Arama:**
```bash
curl -X POST http://localhost:3002/api/v1/elasticsearch/search \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "location": {
        "lat": 41.0082,
        "lon": 28.9784,
        "radius": "5km"
      }
    }
  }'
```

### **4. JavaScript/TypeScript Kullanımı:**
```typescript
// Admin Backend API kullanımı
const searchListings = async (query: string, filters?: any) => {
  const response = await fetch('http://localhost:3002/api/v1/elasticsearch/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query,
      filters,
      page: 1,
      limit: 20
    })
  });
  
  return response.json();
};

// Kullanım
const results = await searchListings('iPhone', {
  category: 'elektronik',
  minBudget: 1000
});
```

---

## 📊 Sistem Durumu

### **Mevcut Durum:**
- ✅ **Admin Backend**: Çalışıyor (Port 3002)
- ✅ **Elasticsearch**: Çalışıyor (VPS - Green status)
- ✅ **Redis**: Çalışıyor (VPS)
- ✅ **Database**: Çalışıyor (Supabase)
- ⚠️ **Elasticsearch Index**: Henüz oluşturulmamış

### **Health Check:**
```bash
curl http://localhost:3002/api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "elasticsearch": "healthy"
  }
}
```

---

## 🚀 Kurulum ve Yapılandırma

### **1. Environment Variables:**
```bash
# Elasticsearch
ELASTICSEARCH_URL=http://209.227.228.96:9200
ELASTICSEARCH_INDEX=benalsam_listings

# Redis
REDIS_HOST=209.227.228.96
REDIS_PORT=6379

# Supabase
SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **2. Index Oluşturma:**
```bash
# Elasticsearch index'ini oluştur
curl -X POST http://localhost:3002/api/v1/elasticsearch/reindex
```

### **3. Sync Başlatma:**
```bash
# Manuel sync tetikle
curl -X POST http://localhost:3002/api/v1/elasticsearch/sync/trigger
```

### **4. Queue Monitoring:**
```bash
# Queue istatistiklerini kontrol et
curl http://localhost:3002/api/v1/elasticsearch/sync/queue/stats
```

---

## 🎯 Avantajlar ve Özellikler

### **✅ Performance Avantajları:**
- **Hızlı Arama**: 10-100x daha hızlı
- **Fuzzy Search**: Yazım hatalarına tolerans
- **Boosting**: Akıllı sıralama
- **Caching**: Built-in caching

### **✅ Intelligence Özellikleri:**
- **MLT (More Like This)**: Benzer ilan önerileri
- **Auto-complete**: Otomatik tamamlama
- **Suggestions**: Arama önerileri
- **Analytics**: Arama istatistikleri

### **✅ Reliability Özellikleri:**
- **Fallback**: Supabase backup
- **Redundancy**: İki sistem
- **Monitoring**: Health checks
- **Error Handling**: Kapsamlı hata yönetimi

### **✅ Scalability Özellikleri:**
- **Horizontal Scaling**: Cluster support
- **Sharding**: Otomatik sharding
- **Replication**: Data replication
- **Load Balancing**: Otomatik load balancing

---

## 🔧 Troubleshooting

### **Yaygın Sorunlar:**

#### **1. Index Not Found:**
```bash
# Index'i yeniden oluştur
curl -X POST http://localhost:3002/api/v1/elasticsearch/reindex
```

#### **2. Connection Issues:**
```bash
# Elasticsearch bağlantısını test et
curl http://localhost:3002/api/v1/elasticsearch/test-connection
```

#### **3. Sync Problems:**
```bash
# Queue durumunu kontrol et
curl http://localhost:3002/api/v1/elasticsearch/sync/queue/stats

# Failed job'ları retry et
curl -X POST http://localhost:3002/api/v1/elasticsearch/sync/queue/retry
```

#### **4. Performance Issues:**
```bash
# Index istatistiklerini kontrol et
curl http://localhost:3002/api/v1/elasticsearch/stats
```

---

## 📈 Monitoring ve Analytics

### **Key Metrics:**
- **Search Response Time**: Ortalama arama süresi
- **Search Volume**: Günlük arama sayısı
- **Popular Queries**: En popüler aramalar
- **Click-through Rate**: Arama sonucu tıklama oranı
- **Index Size**: Elasticsearch index boyutu

### **Monitoring Endpoints:**
```bash
# Genel health
GET /api/v1/elasticsearch/health

# Index stats
GET /api/v1/elasticsearch/stats

# Queue stats
GET /api/v1/elasticsearch/sync/queue/stats

# Performance metrics
GET /api/v1/elasticsearch/analytics
```

---

## 🎯 Sonuç

Bu hibrit search sistemi, Benalsam projesinin **production-ready** arama ihtiyaçlarını karşılar:

- ✅ **Hızlı ve akıllı arama**
- ✅ **Güvenilir fallback mekanizması**
- ✅ **Ölçeklenebilir mimari**
- ✅ **Kapsamlı monitoring**
- ✅ **Kolay yönetim**

Sistem, kullanıcı deneyimini optimize ederken, teknik altyapıyı da güçlendirir.

---

*Bu doküman, Benalsam Elasticsearch Search Sistemi'nin kapsamlı rehberidir. Güncellemeler için lütfen dokümanı takip edin.* 