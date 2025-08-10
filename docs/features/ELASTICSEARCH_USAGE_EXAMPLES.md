# Elasticsearch Kullanım Örnekleri - Benalsam Projesi

## 🎯 Kullanım Senaryoları

### 1. Kullanıcı Arama Deneyimi

#### Senaryo: "iPhone 13" Araması
**Kullanıcı Davranışı:**
1. Kullanıcı "iPhone 13" yazıyor
2. Sistem otomatik tamamlama öneriyor
3. Arama sonuçları gösteriliyor
4. Filtreler otomatik öneriliyor

**Elasticsearch Query:**
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "iPhone 13",
            "fields": [
              "title^3",
              "description^2",
              "category^1.5",
              "tags^1"
            ],
            "type": "best_fields",
            "fuzziness": "AUTO",
            "operator": "and"
          }
        }
      ],
      "filter": [
        { "term": { "status": "active" }},
        { "range": { "expires_at": { "gte": "now" }}}
      ]
    }
  },
  "aggs": {
    "price_ranges": {
      "range": {
        "field": "budget",
        "ranges": [
          {"to": 5000},
          {"from": 5000, "to": 10000},
          {"from": 10000, "to": 20000},
          {"from": 20000}
        ]
      }
    },
    "conditions": {
      "terms": {
        "field": "condition",
        "size": 5
      }
    },
    "locations": {
      "terms": {
        "field": "location.text",
        "size": 10
      }
    }
  },
  "sort": [
    { "is_premium": { "order": "desc" }},
    { "popularity_score": { "order": "desc" }},
    { "created_at": { "order": "desc" }}
  ],
  "size": 20
}
```

**Beklenen Sonuç:**
- iPhone 13 ile ilgili tüm ilanlar
- Fiyat aralığı önerileri (0-5K, 5K-10K, vs.)
- Durum filtreleri (Yeni, Az Kullanılmış, vs.)
- Popüler lokasyonlar
- Premium ilanlar üstte

### 2. Gelişmiş Filtreleme

#### Senaryo: "Bilgisayar" + Fiyat + Konum
**Kullanıcı Filtreleri:**
- Kategori: Elektronik > Bilgisayar
- Fiyat: 5000-15000 TL
- Konum: İstanbul, 50km yakın
- Durum: Yeni veya Az Kullanılmış

**Elasticsearch Query:**
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "bilgisayar",
            "fields": ["title", "description", "category"],
            "type": "best_fields"
          }
        }
      ],
      "filter": [
        {
          "bool": {
            "should": [
              { "term": { "condition": "Yeni" }},
              { "term": { "condition": "Az Kullanılmış" }}
            ]
          }
        },
        {
          "range": {
            "budget": {
              "gte": 5000,
              "lte": 15000
            }
          }
        },
        {
          "geo_distance": {
            "location": {
              "lat": 41.0082,
              "lon": 28.9784
            },
            "distance": "50km"
          }
        },
        {
          "term": {
            "category": "Elektronik > Bilgisayar"
          }
        }
      ]
    }
  },
  "sort": [
    {
      "_script": {
        "type": "number",
        "script": {
          "source": """
            double score = 0;
            // Premium boost
            if (doc['is_premium'].value) score += 1000;
            // Popularity boost
            score += doc['popularity_score'].value * 10;
            // Freshness boost (newer = higher score)
            long now = System.currentTimeMillis();
            long created = doc['created_at'].value.toInstant().toEpochMilli();
            score += (now - created) / 86400000; // Days since creation
            return score;
          """
        },
        "order": "desc"
      }
    }
  ]
}
```

### 3. Otomatik Tamamlama (Autocomplete)

#### Senaryo: Kullanıcı "iph" yazıyor
**Elasticsearch Query:**
```json
{
  "suggest": {
    "listing-suggest": {
      "prefix": "iph",
      "completion": {
        "field": "title.suggest",
        "size": 5,
        "skip_duplicates": true
      }
    },
    "category-suggest": {
      "prefix": "iph",
      "completion": {
        "field": "category.suggest",
        "size": 3
      }
    }
  }
}
```

**Beklenen Sonuçlar:**
- iPhone 13
- iPhone 14
- iPhone 15
- iPhone SE
- iPhone Pro

### 4. Benzer İlan Önerileri

#### Senaryo: Kullanıcı bir ilanı görüntülüyor
**Elasticsearch Query:**
```json
{
  "query": {
    "more_like_this": {
      "fields": ["title", "description", "category", "tags"],
      "like": [
        {
          "_index": "listings",
          "_id": "listing_123"
        }
      ],
      "min_term_freq": 1,
      "max_query_terms": 12,
      "min_doc_freq": 1
    }
  },
  "filter": [
    { "term": { "status": "active" }},
    { "bool": { "must_not": [{ "term": { "id": "listing_123" }}]}}
  ],
  "size": 10
}
```

### 5. Kategori Bazlı Arama

#### Senaryo: Elektronik kategorisinde arama
**Elasticsearch Query:**
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "telefon",
            "fields": ["title", "description"]
          }
        }
      ],
      "filter": [
        {
          "prefix": {
            "category": "Elektronik"
          }
        }
      ]
    }
  },
  "aggs": {
    "subcategories": {
      "terms": {
        "field": "category",
        "size": 20
      }
    },
    "brands": {
      "nested": {
        "path": "attributes"
      },
      "aggs": {
        "brand_values": {
          "terms": {
            "field": "attributes.brand",
            "size": 10
          }
        }
      }
    }
  }
}
```

## 🔧 API Endpoint Örnekleri

### 1. Temel Arama API
```typescript
// GET /api/search
interface SearchRequest {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  radius?: number;
  condition?: string[];
  sortBy?: 'relevance' | 'price' | 'date' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

interface SearchResponse {
  hits: Listing[];
  total: number;
  aggregations: {
    priceRanges: PriceRange[];
    categories: Category[];
    locations: Location[];
    conditions: Condition[];
  };
  suggestions: string[];
}
```

### 2. Otomatik Tamamlama API
```typescript
// GET /api/search/suggest?q=iph
interface SuggestRequest {
  q: string;
  type?: 'title' | 'category' | 'all';
  size?: number;
}

interface SuggestResponse {
  suggestions: {
    title: string[];
    category: string[];
    tags: string[];
  };
}
```

### 3. Benzer İlanlar API
```typescript
// GET /api/search/similar/:listingId
interface SimilarRequest {
  listingId: string;
  size?: number;
  excludeIds?: string[];
}

interface SimilarResponse {
  listings: Listing[];
  score: number;
}
```

## 📊 Aggregation Örnekleri

### 1. Fiyat Dağılımı
```json
{
  "aggs": {
    "price_distribution": {
      "histogram": {
        "field": "budget",
        "interval": 1000,
        "min_doc_count": 1
      }
    }
  }
}
```

### 2. Kategori Popülerliği
```json
{
  "aggs": {
    "popular_categories": {
      "terms": {
        "field": "category",
        "size": 10,
        "order": { "_count": "desc" }
      }
    }
  }
}
```

### 3. Konum Analizi
```json
{
  "aggs": {
    "location_heatmap": {
      "geohash_grid": {
        "field": "location",
        "precision": 5
      },
      "aggs": {
        "listing_count": {
          "value_count": {
            "field": "id"
          }
        }
      }
    }
  }
}
```

## 🎨 Frontend Entegrasyonu

### 1. React Hook Örneği
```typescript
// hooks/useElasticSearch.ts
export const useElasticSearch = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (searchQuery: string, searchFilters = {}) => {
    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          filters: searchFilters
        })
      });
      
      const data = await response.json();
      setResults(data.hits);
      return data;
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, results, loading, query, setQuery, filters, setFilters };
};
```

### 2. Search Component Örneği
```typescript
// components/ElasticSearchBar.tsx
const ElasticSearchBar = () => {
  const { search, results, loading, query, setQuery } = useElasticSearch();
  const [suggestions, setSuggestions] = useState([]);

  const handleSearch = useCallback(async (searchTerm: string) => {
    if (searchTerm.length >= 2) {
      const data = await search(searchTerm);
      setSuggestions(data.suggestions?.title || []);
    }
  }, [search]);

  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    handleSearch(value);
  }, [setQuery, handleSearch]);

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Ne arıyorsunuz?"
        className="search-input"
      />
      
      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item">
              {suggestion}
            </div>
          ))}
        </div>
      )}
      
      {loading && <div className="loading">Aranıyor...</div>}
    </div>
  );
};
```

## 🔍 Arama Optimizasyonu

### 1. Index Optimizasyonu
```json
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "refresh_interval": "1s",
    "analysis": {
      "analyzer": {
        "turkish_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "turkish_stop",
            "turkish_stemmer",
            "asciifolding"
          ]
        }
      }
    }
  }
}
```

### 2. Query Optimizasyonu
```typescript
// Optimized search query
const buildOptimizedQuery = (searchParams: SearchParams) => {
  const query: any = {
    bool: {
      must: [],
      filter: [],
      should: []
    }
  };

  // Text search with boosting
  if (searchParams.query) {
    query.bool.must.push({
      multi_match: {
        query: searchParams.query,
        fields: [
          "title^3",
          "description^2",
          "category^1.5",
          "tags^1"
        ],
        type: "best_fields",
        fuzziness: "AUTO"
      }
    });
  }

  // Filters (more efficient than must clauses)
  if (searchParams.category) {
    query.bool.filter.push({
      term: { category: searchParams.category }
    });
  }

  if (searchParams.minPrice || searchParams.maxPrice) {
    query.bool.filter.push({
      range: {
        budget: {
          gte: searchParams.minPrice,
          lte: searchParams.maxPrice
        }
      }
    });
  }

  return query;
};
```

## 📈 Monitoring ve Analytics

### 1. Search Analytics
```typescript
// Track search metrics
const trackSearch = async (searchParams: SearchParams, results: SearchResponse) => {
  await fetch('/api/analytics/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: searchParams.query,
      filters: searchParams.filters,
      resultCount: results.total,
      timestamp: new Date().toISOString(),
      userId: getCurrentUserId()
    })
  });
};
```

### 2. Performance Monitoring
```typescript
// Monitor search performance
const measureSearchPerformance = async (searchFn: Function) => {
  const startTime = performance.now();
  const results = await searchFn();
  const endTime = performance.now();
  
  console.log(`Search took ${endTime - startTime}ms`);
  
  // Send to monitoring service
  await sendMetrics({
    type: 'search_performance',
    duration: endTime - startTime,
    resultCount: results.total
  });
  
  return results;
};
```

## 🚀 Deployment Checklist

### 1. Elasticsearch Setup
- [ ] Docker container kurulumu
- [ ] Index mapping tanımları
- [ ] Analyzer konfigürasyonu
- [ ] Security settings
- [ ] Monitoring setup

### 2. Data Sync
- [ ] Initial data migration
- [ ] Real-time sync triggers
- [ ] Error handling
- [ ] Retry mechanisms

### 3. API Development
- [ ] Search endpoints
- [ ] Suggest endpoints
- [ ] Similar items endpoints
- [ ] Error handling
- [ ] Rate limiting

### 4. Frontend Integration
- [ ] Search components
- [ ] Autocomplete
- [ ] Filter components
- [ ] Loading states
- [ ] Error handling

### 5. Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance tests
- [ ] User acceptance tests

---

*Bu dokümantasyon Elasticsearch implementasyonu için pratik rehber niteliğindedir.* 