# AI Suggestions Hybrid System - Teknik Dokümantasyon

## 📋 **Genel Bakış**

AI Suggestions sistemi, kullanıcıların arama yaparken daha iyi sonuçlar alması için tasarlanmış hibrit bir sistemdir. Bu sistem **Elasticsearch** ve **Supabase**'i birlikte kullanarak hem hızlı arama hem de detaylı veri sağlar.

### **🎯 Sistem Hedefleri:**
- **Hızlı Arama**: Elasticsearch ile full-text search
- **Detaylı Veri**: Supabase ile kategori bilgileri
- **Gerçek Zamanlı Sync**: Otomatik veri senkronizasyonu
- **Akıllı Filtreleme**: Query bazlı kategori filtreleme
- **Fallback Sistemi**: ES yoksa database'den veri

---

## 🏗️ **Sistem Mimarisi**

### **Veri Akışı:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin UI      │───►│   Supabase      │───►│ Elasticsearch   │
│   (CRUD)        │    │   (Primary DB)  │    │   (Search)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Queue         │    │   Frontend      │
                       │   (Redis)       │    │   (Search)      │
                       └─────────────────┘    └─────────────────┘
```

### **Teknoloji Stack:**
- **Primary Database**: Supabase (PostgreSQL)
- **Search Engine**: Elasticsearch
- **Cache**: Redis
- **Queue System**: PostgreSQL + Redis
- **Backend**: Node.js + Express
- **Frontend**: React + TypeScript

---

## 🔧 **Veritabanı Yapısı**

### **1. Supabase Tabloları**

#### **category_ai_suggestions**
```sql
CREATE TABLE category_ai_suggestions (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id),
  suggestion_type VARCHAR(50), -- 'keyword', 'phrase', 'category', 'brand'
  suggestion_data JSONB, -- { keywords: [], brand: '', model: '', description: '' }
  confidence_score DECIMAL(3,2), -- 0.00 - 1.00
  is_approved BOOLEAN DEFAULT false,
  search_boost DECIMAL(3,2) DEFAULT 1.0,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **elasticsearch_sync_queue**
```sql
CREATE TABLE elasticsearch_sync_queue (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
  record_id UUID NOT NULL,
  change_data JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);
```

### **2. Elasticsearch Index**

#### **ai_suggestions Index Mapping**
```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "turkish_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "turkish_stop", "turkish_stemmer", "asciifolding"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "integer" },
      "category_id": { "type": "integer" },
      "category_name": { 
        "type": "text",
        "analyzer": "turkish_analyzer",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "category_path": { 
        "type": "text",
        "analyzer": "turkish_analyzer",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "suggestion_type": { "type": "keyword" },
      "suggestion_data": {
        "properties": {
          "keywords": { 
            "type": "text",
            "analyzer": "turkish_analyzer",
            "fields": { "keyword": { "type": "keyword" } }
          },
          "description": { "type": "text", "analyzer": "turkish_analyzer" },
          "brand": { 
            "type": "text",
            "analyzer": "turkish_analyzer",
            "fields": { "keyword": { "type": "keyword" } }
          },
          "model": { 
            "type": "text",
            "analyzer": "turkish_analyzer",
            "fields": { "keyword": { "type": "keyword" } }
          },
          "attributes": { "type": "object", "dynamic": true }
        }
      },
      "confidence_score": { "type": "float" },
      "is_approved": { "type": "boolean" },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" },
      "search_boost": { "type": "float" },
      "usage_count": { "type": "integer" },
      "last_used_at": { "type": "date" }
    }
  }
}
```

---

## 🔄 **Senkronizasyon Sistemi**

### **1. Supabase Triggers**

#### **category_ai_suggestions_queue_sync**
```sql
CREATE TRIGGER category_ai_suggestions_queue_sync
    AFTER INSERT OR UPDATE OR DELETE ON category_ai_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION add_to_elasticsearch_queue();
```

#### **sync_ai_suggestion_to_elasticsearch**
```sql
CREATE OR REPLACE FUNCTION sync_ai_suggestion_to_elasticsearch()
RETURNS TRIGGER AS $$
DECLARE
    record_id INTEGER;
    category_data JSONB;
    suggestion_doc JSONB;
BEGIN
    -- Kategori bilgilerini al
    SELECT jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'path', c.path,
        'level', c.level
    ) INTO category_data
    FROM categories c
    WHERE c.id = COALESCE(NEW.category_id, OLD.category_id);

    -- AI suggestion dokümanını hazırla
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        suggestion_doc := jsonb_build_object(
            'id', NEW.id,
            'category_id', NEW.category_id,
            'category_name', category_data->>'name',
            'category_path', category_data->>'path',
            'suggestion_type', NEW.suggestion_type,
            'suggestion_data', NEW.suggestion_data,
            'confidence_score', NEW.confidence_score,
            'is_approved', NEW.is_approved,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at,
            'search_boost', COALESCE(NEW.search_boost, 1.0),
            'usage_count', COALESCE(NEW.usage_count, 0),
            'last_used_at', NEW.last_used_at
        );
    END IF;

    -- Queue'ya ekle
    INSERT INTO elasticsearch_sync_queue (
        table_name, operation, record_id, change_data
    ) VALUES (
        TG_TABLE_NAME, TG_OP, record_id::UUID, suggestion_doc
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### **2. Queue Processing**

#### **QueueProcessorService**
```typescript
private async processAiSuggestionJob(operation: string, recordId: string, changeData: any): Promise<void> {
  try {
    switch (operation) {
      case 'INSERT':
        if (changeData.is_approved) {
          await this.elasticsearchService.indexDocument(
            `ai_suggestions_${recordId}`, 
            this.transformAiSuggestionForElasticsearch(changeData),
            'ai_suggestions'
          );
        }
        break;

      case 'UPDATE':
        const newData = changeData.new;
        const oldData = changeData.old;

        if (newData.is_approved && oldData.is_approved) {
          // Onaylı suggestion güncellendi
          await this.elasticsearchService.updateDocument(
            `ai_suggestions_${recordId}`,
            this.transformAiSuggestionForElasticsearch(newData),
            'ai_suggestions'
          );
        } else if (newData.is_approved && !oldData.is_approved) {
          // Suggestion onaylandı
          await this.elasticsearchService.indexDocument(
            `ai_suggestions_${recordId}`,
            this.transformAiSuggestionForElasticsearch(newData),
            'ai_suggestions'
          );
        } else if (!newData.is_approved && oldData.is_approved) {
          // Suggestion onayı kaldırıldı
          await this.elasticsearchService.deleteDocument(`ai_suggestions_${recordId}`, 'ai_suggestions');
        }
        break;

      case 'DELETE':
        await this.elasticsearchService.deleteDocument(`ai_suggestions_${recordId}`, 'ai_suggestions');
        break;
    }
  } catch (error) {
    logger.error(`❌ Error processing AI suggestion job:`, error);
    throw error;
  }
}
```

---

## 🔍 **Arama API'si**

### **1. Hybrid Search Endpoint**

#### **GET /api/v1/ai-suggestions**
```typescript
router.get('/', aiSuggestionsLimiter, async (req, res) => {
  try {
    const { q: query, categoryId } = req.query;
    let suggestions = [];

    // 1. Query-based suggestions from Elasticsearch
    if (query) {
      const esSuggestions = await getESSuggestions(query as string);
      suggestions.push(...esSuggestions);
    }

    // 2. Category-based suggestions
    if (categoryId) {
      const categorySuggestions = await getCategoryAISuggestions(parseInt(categoryId as string));
      suggestions.push(...categorySuggestions);
    }

    // 3. Trending suggestions (fallback)
    if (suggestions.length < 5) {
      const trendingSuggestions = await getTrendingSuggestions(query as string);
      suggestions.push(...trendingSuggestions);
    }

    // 4. Popular suggestions (fallback)
    if (suggestions.length < 10) {
      const popularSuggestions = await getPopularSuggestions();
      suggestions.push(...popularSuggestions);
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.id === suggestion.id)
      )
      .slice(0, 20);

    res.json({
      success: true,
      data: {
        suggestions: uniqueSuggestions,
        total: uniqueSuggestions.length,
        query: query || null,
        source: query ? 'hybrid' : 'database'
      }
    });
  } catch (error) {
    // Error handling
  }
});
```

### **2. Elasticsearch Search Function**

#### **getESSuggestions**
```typescript
async function getESSuggestions(query: string) {
  try {
    // Build Elasticsearch query
    const esQuery = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query,
                fields: [
                  'suggestion_data.keywords^3',
                  'suggestion_data.brand^2',
                  'suggestion_data.model^2',
                  'category_name^1.5',
                  'suggestion_data.description^1'
                ],
                fuzziness: 'AUTO',
                type: 'best_fields'
              }
            }
          ],
          filter: [
            { term: { is_approved: true } },
            { range: { confidence_score: { gte: 0.7 } } }
          ]
        }
      },
      sort: [
        { confidence_score: { order: 'desc' } },
        { search_boost: { order: 'desc' } }
      ],
      size: 10
    };

    // Search in Elasticsearch
    const response = await aiSuggestionsES.search(esQuery);
    
    // Get suggestion IDs from ES results
    const suggestionIds = response.hits.hits.map((hit: any) => hit._source.id);

    // Get detailed data from Supabase
    const { data: suggestions, error } = await supabase
      .from('category_ai_suggestions')
      .select(`
        *,
        categories!inner(name, path, level)
      `)
      .in('id', suggestionIds)
      .eq('is_approved', true);

    // Combine ES scores with Supabase data
    const esScores = new Map();
    response.hits.hits.forEach((hit: any) => {
      esScores.set(hit._source.id, hit._score);
    });

    return suggestions.map(suggestion => ({
      id: `es-${suggestion.id}`,
      text: extractSuggestionText(suggestion),
      type: 'search',
      score: esScores.get(suggestion.id) || suggestion.confidence_score,
      metadata: {
        categoryName: suggestion.categories?.name,
        categoryPath: suggestion.categories?.path,
        confidenceScore: suggestion.confidence_score,
        source: 'elasticsearch'
      }
    }));
  } catch (error) {
    logger.error('Error in getESSuggestions:', error);
    return [];
  }
}
```

---

## 🎯 **Kategori Filtreleme**

### **Relevant Categories Mapping**
```typescript
function getRelevantCategories(query: string): number[] {
  const queryLower = query.toLowerCase();
  
  const categoryMappings: { [key: string]: number[] } = {
    'samsung': [499], // Elektronik
    'iphone': [499], // Elektronik
    'telefon': [499], // Elektronik
    'bilgisayar': [499], // Elektronik
    'laptop': [499], // Elektronik
    'tablet': [499], // Elektronik
    'ev': [1], // Emlak
    'emlak': [1], // Emlak
    'daire': [1], // Emlak
    'villa': [1], // Emlak
    'araba': [2], // Araç
    'otomobil': [2], // Araç
    'araç': [2], // Araç
    'futbol': [712], // Spor & Outdoor
    'basketbol': [712], // Spor & Outdoor
    'spor': [712], // Spor & Outdoor
  };

  // Find matching categories
  for (const [keyword, categoryIds] of Object.entries(categoryMappings)) {
    if (queryLower.includes(keyword)) {
      return categoryIds;
    }
  }

  return [];
}
```

---

## 🚀 **Kurulum ve Deployment**

### **1. Elasticsearch Index Oluşturma**
```bash
# AI suggestions index'ini oluştur
node benalsam-admin-backend/scripts/create-ai-suggestions-index.js
```

### **2. Supabase Migration**
```sql
-- Migration dosyasını Supabase UI'da çalıştır
-- 20250825180000_ai_suggestions_elasticsearch_sync.sql
```

### **3. Infrastructure Setup**
```bash
# Tüm altyapıyı kur (ES + Redis + AI suggestions)
./scripts/setup-infrastructure.sh
```

### **4. Backend Başlatma**
```bash
cd benalsam-admin-backend
npm run dev
```

---

## 📊 **Test Senaryoları**

### **1. "samsung" Araması**
```bash
curl "http://localhost:3002/api/v1/ai-suggestions?q=samsung"
```

**Beklenen Sonuç:**
- ES'den Samsung ile ilgili öneriler
- Database'den trending Samsung önerileri
- Elektronik kategorisi odaklı sonuçlar

### **2. Kategori Bazlı Arama**
```bash
curl "http://localhost:3002/api/v1/ai-suggestions?categoryId=712"
```

**Beklenen Sonuç:**
- Spor & Outdoor kategorisi önerileri
- Fallback olarak trending öneriler

### **3. Boş Arama**
```bash
curl "http://localhost:3002/api/v1/ai-suggestions"
```

**Beklenen Sonuç:**
- Sadece database'den trending öneriler
- Mixed kategoriler

---

## 🔧 **Performans Optimizasyonları**

### **1. Elasticsearch**
- **Turkish Analyzer**: Türkçe arama için özel analyzer
- **Multi-field Search**: Keywords, brand, model, category araması
- **Fuzzy Matching**: Yazım hatalarını tolere eder
- **Score Boosting**: En uygun sonuçlar üstte

### **2. Supabase**
- **Indexes**: Performans için gerekli index'ler
- **Triggers**: Real-time sync
- **Queue System**: Asenkron işleme

### **3. Caching**
- **Redis**: AI suggestions cache
- **Local Storage**: Frontend cache
- **Rate Limiting**: API koruması

---

## 🛠️ **Monitoring ve Debugging**

### **1. Queue Monitoring**
```sql
-- Queue durumunu kontrol et
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time
FROM elasticsearch_sync_queue 
GROUP BY status;
```

### **2. Elasticsearch Health**
```bash
# ES cluster durumu
curl "http://209.227.228.96:9200/_cluster/health"

# AI suggestions index stats
curl "http://209.227.228.96:9200/ai_suggestions/_stats"
```

### **3. API Monitoring**
```bash
# AI suggestions API health
curl "http://localhost:3002/api/v1/ai-suggestions?q=test"

# Response time ve error rate monitoring
```

---

## 🔮 **Gelecek Geliştirmeler**

### **1. Otomatik AI Suggestion Generation**
- **AISuggestionGenerator**: Otomatik öneri oluşturma
- **Machine Learning**: Kullanıcı davranışlarına göre öneriler
- **Trend Analysis**: Popüler aramaları analiz etme

### **2. Gelişmiş Arama**
- **Semantic Search**: Anlam bazlı arama
- **Auto-complete**: Otomatik tamamlama
- **Spell Correction**: Yazım düzeltme

### **3. Personalization**
- **User Preferences**: Kullanıcı tercihleri
- **Search History**: Arama geçmişi
- **Recommendations**: Kişiselleştirilmiş öneriler

---

## 📝 **Sonuç**

Hybrid AI Suggestions sistemi, modern web uygulamaları için gerekli olan hızlı ve akıllı arama deneyimini sağlar. Elasticsearch'in güçlü arama yetenekleri ile Supabase'in güvenilir veri yönetimi birleştirilerek, kullanıcılara en iyi deneyimi sunar.

### **Ana Avantajlar:**
- ✅ **Hızlı Arama**: Elasticsearch ile sub-second response
- ✅ **Detaylı Veri**: Supabase ile zengin metadata
- ✅ **Real-time Sync**: Otomatik veri senkronizasyonu
- ✅ **Scalable**: Büyük veri setleri için uygun
- ✅ **Reliable**: Fallback sistemi ile güvenilir

---

**Dokümantasyon Tarihi:** 2025-08-25  
**Versiyon:** 1.0.0  
**Durum:** Production Ready
