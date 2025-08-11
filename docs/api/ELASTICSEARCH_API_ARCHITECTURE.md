# Elasticsearch API Mimari Rehberi

## 🏗️ Mimari Karar: Hibrit API Katmanı

### Neden Ayrı API Katmanı?

**Mevcut Sorunlar:**
- Frontend'ler direkt Supabase RPC çağırıyor
- Elasticsearch entegrasyonu için her platform ayrı kod
- Güvenlik ve rate limiting eksik
- Monitoring ve logging dağınık

**Çözüm: Merkezi API Katmanı**

## 📋 API Katmanı Yapısı

### 1. Search Service (Admin Backend)
```typescript
// benalsam-admin-backend/src/services/searchService.ts
export class SearchService {
  // Elasticsearch primary, Supabase fallback
  async searchListings(params: SearchParams): Promise<SearchResult> {
    try {
      // 1. Elasticsearch'e sorgu
      const esResult = await this.elasticsearchSearch(params);
      return esResult;
    } catch (error) {
      // 2. Fallback: Supabase RPC
      console.warn('Elasticsearch failed, using Supabase fallback');
      return await this.supabaseFallback(params);
    }
  }
}
```

### 2. API Endpoints
```typescript
// benalsam-admin-backend/src/routes/search/
POST /api/search/listings
GET  /api/search/suggestions
GET  /api/search/analytics
POST /api/search/reindex
```

### 3. Frontend Service Updates
```typescript
// benalsam-mobile/src/services/searchService.ts
export const searchListings = async (params) => {
  const response = await fetch('/api/search/listings', {
    method: 'POST',
    body: JSON.stringify(params)
  });
  return response.json();
};
```

## 🔄 Veri Akışı

### Normal Akış:
```
User Search → Frontend → Admin Backend API → Elasticsearch → Response
```

### Fallback Akış:
```
User Search → Frontend → Admin Backend API → Supabase RPC → Response
```

### Sync Akış:
```
Supabase Trigger → Admin Backend → Elasticsearch Index
```

## 🛡️ Güvenlik ve Performance

### Rate Limiting
```typescript
// benalsam-admin-backend/src/middleware/rateLimit.ts
export const searchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına max 100 istek
  message: 'Çok fazla arama isteği gönderildi'
});
```

### Caching
```typescript
// Redis cache ile sık yapılan aramaları cache'le
const cacheKey = `search:${JSON.stringify(params)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### Monitoring
```typescript
// Search metrics
- Response time (ES vs Supabase)
- Cache hit rate
- Error rates
- Popular searches
```

## 📊 Implementation Plan

### Phase 1: API Katmanı (1-2 gün)
- [ ] Search service oluştur
- [ ] API endpoints ekle
- [ ] Rate limiting ve caching
- [ ] Error handling ve fallback

### Phase 2: Frontend Integration (1 gün)
- [ ] Mobile service güncelle
- [ ] Web service güncelle
- [ ] Test ve validation

### Phase 3: Elasticsearch Integration (2-3 gün)
- [ ] Index mapping
- [ ] Sync mechanism
- [ ] Performance testing

## 🎯 Avantajlar

1. **Merkezi Kontrol**: Tüm arama istekleri tek noktadan yönetilir
2. **Güvenlik**: API key, rate limiting, input validation
3. **Performance**: Caching, connection pooling
4. **Monitoring**: Detaylı analytics ve error tracking
5. **Scalability**: Load balancing, horizontal scaling
6. **Fallback**: Elasticsearch down olsa bile sistem çalışır

## 🔧 Teknik Detaylar

### Environment Variables
```bash
# Admin Backend
ELASTICSEARCH_URL=http://your-vps:9200
ELASTICSEARCH_INDEX=benalsam_listings
REDIS_URL=redis://your-vps:6379
SEARCH_RATE_LIMIT=100
SEARCH_CACHE_TTL=300
```

### API Response Format
```typescript
interface SearchResponse {
  data: Listing[];
  totalCount: number;
  searchEngine: 'elasticsearch' | 'supabase';
  responseTime: number;
  cached: boolean;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
```

Bu mimari ile hem performans hem de güvenlik açısından en iyi çözümü elde ederiz. 