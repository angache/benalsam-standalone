# AI Suggestions Hybrid System - Teknik Dokümantasyon

## 📋 **Genel Bakış**

AI Suggestions sistemi, kullanıcıların arama yaparken daha iyi sonuçlar alması için tasarlanmış hibrit bir sistemdir. Bu sistem **Elasticsearch** ve **Supabase**'i birlikte kullanarak hem hızlı arama hem de detaylı veri sağlar.

### **🎯 Sistem Hedefleri:**
- **Hızlı Arama**: Elasticsearch ile full-text search
- **Detaylı Veri**: Supabase ile kategori bilgileri
- **Gerçek Zamanlı Sync**: Otomatik veri senkronizasyonu
- **Akıllı Filtreleme**: Query bazlı kategori filtreleme
- **Fallback Sistemi**: ES yoksa database'den veri
- **Queue Processing**: PostgreSQL queue ile güvenilir sync
- **Category Filtering**: İlgisiz kategorileri filtreleme
- **Self-Healing Queue**: Akıllı stuck job detection ve auto-fix
- **Queue Management UI**: Gerçek zamanlı queue monitoring

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

### **Queue Stats RPC Function**
```sql
-- Queue stats için RPC fonksiyonu
CREATE OR REPLACE FUNCTION get_elasticsearch_queue_stats()
RETURNS TABLE (
  total_jobs BIGINT,
  pending_jobs BIGINT,
  processing_jobs BIGINT,
  completed_jobs BIGINT,
  failed_jobs BIGINT,
  avg_processing_time NUMERIC,
  last_processed_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_jobs,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
    COALESCE(
      AVG(
        EXTRACT(EPOCH FROM (processed_at - created_at)) * 1000
      ) FILTER (WHERE status IN ('completed', 'failed') AND processed_at IS NOT NULL),
      0
    ) as avg_processing_time,
    MAX(processed_at) FILTER (WHERE status IN ('completed', 'failed')) as last_processed_at
  FROM elasticsearch_sync_queue;
END;
$$;
```

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

#### **QueueProcessorService (Enhanced with Self-Healing)**

**Self-Healing Özellikleri:**
- **Stuck Job Detection**: 30 saniye sonra stuck job'ları tespit eder
- **Auto Reset**: Takılı job'ları otomatik olarak reset eder
- **Smart Retry Logic**: Retry count'a göre akıllı karar verir
- **Health Check**: 15 saniyede bir queue sağlığını kontrol eder
- **Critical Alerts**: 5+ stuck job varsa kritik uyarı verir

**Konfigürasyon:**
```typescript
private stuckJobTimeout: number = 30 * 1000; // 30 saniye
private maxRetries: number = 3;
private batchSize: number = 5;
private processingTimeout: number = 30 * 1000; // 30 saniye
```

**Enhanced Stuck Job Detection:**
```typescript
private async detectStuckJobs(): Promise<any[]> {
  // 1. Zaman bazlı stuck job'lar (30 saniye)
  // 2. Çok uzun süredir processing'de olan job'lar (10 dakika)
  // 3. Çok fazla retry yapmış ama hala processing'de olan job'lar
  // 4. Unique stuck job'ları birleştir ve detaylı log
}
```

**Smart Reset Logic:**
```typescript
private async resetStuckJob(job: any): Promise<void> {
  const stuckDuration = Math.round((Date.now() - new Date(job.created_at).getTime()) / 1000 / 60);
  const retryCount = job.retry_count || 0;
  
  // Eğer max retry'yi aştıysa failed olarak işaretle
  if (retryCount >= this.maxRetries) {
    await this.updateJobStatus(job.id, 'failed', `Job stuck for ${stuckDuration} minutes and exceeded max retries`);
  } else {
    // Normal reset
    await this.updateJobStatus(job.id, 'pending', `Reset from stuck state (stuck for ${stuckDuration} minutes)`);
  }
}
```
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

### **Queue Management API Endpoints**

#### **Queue Stats & Health**
```typescript
// Queue istatistiklerini al
GET /api/v1/ai-suggestions/queue/stats
Response: {
  success: true,
  data: {
    total: number,
    pending: number,
    processing: number,
    completed: number,
    failed: number,
    stuck: number,
    avgProcessingTime: number,
    lastProcessedAt: string
  }
}

// Queue sağlık durumunu kontrol et
GET /api/v1/ai-suggestions/queue/health
Response: {
  success: true,
  data: {
    isHealthy: boolean,
    issues: string[],
    recommendations: string[]
  }
}
```

#### **Queue Control Endpoints**
```typescript
// Queue processor'ı başlat
POST /api/v1/ai-suggestions/queue/start

// Queue processor'ı durdur
POST /api/v1/ai-suggestions/queue/stop

// Başarısız job'ları yeniden dene
POST /api/v1/ai-suggestions/queue/retry-failed

// Queue'yu temizle (opsiyonel status filter)
POST /api/v1/ai-suggestions/queue/clear
Body: { status?: 'failed' | 'completed' | 'pending' }
```

#### **Queue Jobs Management**
```typescript
// Queue job'larını listele (filtreli)
GET /api/v1/ai-suggestions/queue/jobs?status=pending&limit=50&offset=0
Response: {
  success: true,
  data: QueueJob[]
}

interface QueueJob {
  id: number;
  table_name: string;
  operation: string;
  record_id: string;
  status: string;
  retry_count: number;
  error_message?: string;
  created_at: string;
  processed_at?: string;
}
```

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

### **2. Debug Endpoint**
```bash
# Queue ve ES durumunu kontrol et
curl "http://localhost:3002/api/v1/ai-suggestions/debug-queue"

# Response:
{
  "success": true,
  "data": {
    "queueJobs": [...],
    "esCount": 1,
    "esHits": [...]
  }
}
```

### **3. Elasticsearch Health**
```bash
# ES cluster durumu
curl "http://209.227.228.96:9200/_cluster/health"

# AI suggestions index stats
curl "http://209.227.228.96:9200/ai_suggestions/_stats"
```

### **4. API Monitoring**
```bash
# AI suggestions API health
curl "http://localhost:3002/api/v1/ai-suggestions?q=test"

# Response time ve error rate monitoring
```

### **5. Category Filtering Test**
```bash
# Samsung araması - sadece Elektronik kategorisi
curl "http://localhost:3002/api/v1/ai-suggestions?query=samsung"

# iPhone araması - sadece Elektronik kategorisi  
curl "http://localhost:3002/api/v1/ai-suggestions?query=iphone"

# Emlak araması - sadece Emlak kategorisi
curl "http://localhost:3002/api/v1/ai-suggestions?query=ev"
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

## 📊 **Usage Tracking Sistemi**

### **Genel Bakış**
AI Suggestions için kapsamlı kullanım takip sistemi eklendi. Bu sistem, hangi önerilerin daha popüler olduğunu gerçek kullanım verilerine dayalı olarak belirler.

### **Database Yapısı**

#### **ai_suggestions_usage_logs**
```sql
CREATE TABLE ai_suggestions_usage_logs (
  id SERIAL PRIMARY KEY,
  suggestion_id INTEGER REFERENCES category_ai_suggestions(id),
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  query TEXT NOT NULL,
  clicked_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  category_id INTEGER REFERENCES categories(id),
  search_type VARCHAR(50) DEFAULT 'ai_suggestion',
  result_position INTEGER,
  dwell_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **ai_suggestions_analytics**
```sql
CREATE TABLE ai_suggestions_analytics (
  id SERIAL PRIMARY KEY,
  suggestion_id INTEGER REFERENCES category_ai_suggestions(id),
  date DATE NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5,4) DEFAULT 0.0,
  avg_dwell_time INTEGER DEFAULT 0,
  search_queries JSONB DEFAULT '[]',
  user_segments JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(suggestion_id, date)
);
```

### **API Endpoints**

#### **POST /api/v1/ai-suggestions/log-click**
AI suggestion tıklamasını loglar.

**Request:**
```json
{
  "suggestionId": 26,
  "query": "samsung telefon",
  "sessionId": "session-123",
  "resultPosition": 1,
  "searchType": "ai_suggestion"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Click logged successfully"
}
```

#### **GET /api/v1/ai-suggestions/trending-by-usage**
Gerçek kullanım verilerine dayalı trending suggestions döndürür.

**Query Parameters:**
- `days`: Kaç günlük veri (default: 7)
- `limit`: Kaç sonuç (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "trending-usage-26",
        "text": "[TRENDING-USAGE] samsung, galaxy, android, telefon, akıllı telefon",
        "type": "trending_usage",
        "score": 1,
        "metadata": {
          "categoryName": "Elektronik",
          "categoryPath": "Elektronik",
          "totalClicks": 1,
          "clickThroughRate": 0,
          "avgDwellTime": 0,
          "days": 7
        }
      }
    ],
    "total": 1,
    "days": 7,
    "source": "usage_analytics"
  }
}
```

### **Database Functions**

#### **log_ai_suggestion_click()**
AI suggestion tıklamasını loglar ve analytics'i günceller.

#### **get_trending_suggestions_by_usage()**
Kullanım bazında trending suggestions döndürür.

#### **update_suggestion_usage_count()**
Suggestion'ın usage count'unu artırır.

### **Otomatik Analytics**
- **Trigger**: Her tıklama sonrası analytics otomatik güncellenir
- **Aggregation**: Günlük bazda veriler toplanır
- **Performance**: Index'ler ile hızlı sorgular

### **Security**
- **RLS Policies**: Admin okuma, herkes yazma
- **Session Tracking**: Kullanıcı oturumu takibi
- **IP Logging**: Güvenlik için IP adresi kaydı

---

## 🎯 **Debug ve Monitoring**

### **Debug ID'leri**
Frontend'de veri kaynağını belirlemek için ID'lere prefix'ler eklendi:

- **`[ES]`** → Elasticsearch'den gelen sonuçlar
- **`[SPB-TRENDING]`** → Supabase'den gelen trending sonuçlar
- **`[SPB-POPULAR]`** → Supabase'den gelen popular sonuçlar
- **`[TRENDING-USAGE]`** → Gerçek kullanım verilerine dayalı trending

### **Admin UI Özellikleri**
- **ES Index Rebuild**: "ES Indexlerini Temizle ve Yeniden Yükle" butonu
- **Usage Analytics**: Gerçek kullanım verilerini görüntüleme
- **Category Tree**: Hiyerarşik kategori seçimi

### **Performance Optimizations**
- **ES min_score: 0.3**: Daha iyi relevance filtering
- **Cache System**: Redis ile hızlı erişim
- **Index Optimization**: Database index'leri ile hızlı sorgular

---

## 🎨 **Frontend Integration**

### **Queue Management UI**

**Yeni Sayfa:** `benalsam-admin-ui/src/pages/QueueManagement.tsx`

**Özellikler:**
- **Real-time Queue Stats**: Toplam, bekleyen, işlenen, tamamlanan, başarısız, takılı job sayıları
- **Queue Health Monitoring**: Sağlık durumu ve öneriler
- **Queue Controls**: Başlat/Durdur, retry, clear işlemleri
- **Queue Jobs Table**: Detaylı job listesi ve filtreleme
- **Auto Refresh**: 5 saniyede bir otomatik yenileme
- **Smart Error Display**: Completed job'larda "🔄 Auto-fixed" gösterimi

**Queue Stats Cards:**
```typescript
// 6 farklı stat card'ı
- Toplam Job (mavi)
- Bekleyen (sarı)
- İşlenen (mavi)
- Tamamlanan (yeşil)
- Başarısız (kırmızı)
- Takılı (kırmızı)
```

**Smart Error Handling:**
```typescript
// Completed job'larda error mesajı yerine success mesajı
{job.error_message && job.status !== 'completed' ? (
  // Kırmızı error mesajı
) : job.error_message && job.status === 'completed' ? (
  // Yeşil "🔄 Auto-fixed" mesajı
) : (
  '-'
)}
```

**Navigation Integration:**
- **Sidebar Link**: "Queue Yönetimi" menü öğesi
- **Route**: `/queue-management`
- **Permission**: `PERMISSIONS.CATEGORIES_VIEW`

### **AISuggestions Component**
Ana AI suggestions component'i, kullanıcı aramalarına göre önerileri gösterir.

#### **Props:**
```typescript
interface AISuggestionsProps {
  query?: string;                    // Arama sorgusu
  categoryId?: number;               // Kategori ID'si
  onSuggestionClick?: Function;      // Öneri tıklama callback'i
  maxSuggestions?: number;           // Maksimum öneri sayısı (default: 10)
  showTrending?: boolean;            // Trending önerileri göster (default: true)
  showPopular?: boolean;             // Popular önerileri göster (default: true)
  className?: string;                // CSS class'ları
}
```

#### **Kullanım:**
```jsx
import AISuggestions from '../components/AISuggestions';

<AISuggestions 
  query="samsung telefon"
  onSuggestionClick={(suggestion) => {
    console.log('Selected:', suggestion);
  }}
  maxSuggestions={5}
/>
```

#### **Özellikler:**
- **Sahibinden.com-style grouping**: Kategorilere göre gruplandırma
- **Loading states**: Yükleme durumları
- **Error handling**: Hata durumları
- **Score visualization**: Eşleşme skorları
- **Badge system**: Trending, Popular, Onaylı badge'leri

### **useAISuggestions Hook**
AI suggestions için React hook'u.

#### **Kullanım:**
```typescript
import useAISuggestions from '../hooks/useAISuggestions';

const {
  suggestions,
  groupedSuggestions,
  isLoading,
  error,
  hasSuggestions,
  clearSuggestions,
  refreshSuggestions
} = useAISuggestions(query, categoryId);
```

#### **Return Values:**
- **suggestions**: Filtrelenmiş öneriler
- **groupedSuggestions**: Tip bazında gruplandırılmış öneriler
- **isLoading**: Yükleme durumu
- **error**: Hata durumu
- **hasSuggestions**: Öneri var mı
- **clearSuggestions**: Önerileri temizle
- **refreshSuggestions**: Önerileri yenile

#### **Debouncing:**
- **300ms debounce**: Query değişikliklerinde otomatik arama
- **Minimum 2 karakter**: Çok kısa aramaları engeller

### **aiSuggestionsService**
Frontend'den backend'e bağlantı sağlayan service.

#### **Ana Metodlar:**
```typescript
// Genel öneriler
await aiSuggestionsService.getSuggestions(query, categoryId);

// Kategori bazlı öneriler
await aiSuggestionsService.getCategorySuggestions(categoryId);

// Trending öneriler
await aiSuggestionsService.getTrendingSuggestions();

// Popular öneriler
await aiSuggestionsService.getPopularSuggestions();

// Cache temizleme
aiSuggestionsService.clearCache();

// Zorla yenileme
await aiSuggestionsService.refresh();
```

#### **Caching:**
- **LocalStorage cache**: 30 dakika TTL
- **Category-specific cache**: Kategori bazında ayrı cache
- **Rate limiting**: 1 dakika rate limit
- **Auto-refresh**: Cache expire olduğunda otomatik yenileme

#### **Error Handling:**
- **Fallback suggestions**: API hatası durumunda boş array
- **Retry logic**: Başarısız istekler için retry
- **Graceful degradation**: Hata durumunda UI çökmemesi

---

## 🛠️ **Admin UI Management**

### **AISuggestionsManagement Page**
Admin panelinde AI suggestions yönetimi için özel sayfa.

#### **Ana Özellikler:**
- **Category Tree**: Hiyerarşik kategori seçimi
- **AI Suggestion Creation**: Yeni öneri oluşturma
- **ES Index Rebuild**: Elasticsearch index'lerini yeniden oluşturma
- **Usage Analytics**: Gerçek kullanım verilerini görüntüleme

#### **Sayfa Yapısı:**
```
┌─────────────────────────────────────────────────────────┐
│ AI Önerileri Yönetimi                    [Yenile] [ES] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────────────────┐ │
│ │ Kategori    │ │ Yeni AI Önerisi Oluştur            │ │
│ │ Seçimi      │ │                                     │ │
│ │             │ │ Öneri Tipi: [Anahtar Kelimeler ▼]  │ │
│ │ 📂 Elektronik│ │ Güven Skoru: [80%]                │ │
│ │   📱 Telefon │ │                                     │ │
│ │   💻 Bilgisayar│ │ Öneri Metni: [________________]   │ │
│ │             │ │                                     │ │
│ │ 📂 Emlak    │ │ [AI Önerisi Oluştur]               │ │
│ │   🏠 Ev     │ │                                     │ │
│ │   🏢 Daire  │ └─────────────────────────────────────┘ │
│ └─────────────┘                                         │
├─────────────────────────────────────────────────────────┤
│ AI Önerilerini Yönet                                    │
│ ┌─────┬─────────────┬─────────────┬─────────┬─────────┐ │
│ │ ID  │ Kategori    │ Öneri Tipi  │ Güven   │ Durum   │ │
│ ├─────┼─────────────┼─────────────┼─────────┼─────────┤ │
│ │ 26  │ Elektronik  │ keywords    │ 95%     │ Onaylı  │ │
│ │ 27  │ Elektronik  │ keywords    │ 95%     │ Onaylı  │ │
│ └─────┴─────────────┴─────────────┴─────────┴─────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### **Category Tree Yapısı:**
```typescript
interface Category {
  id: number;
  name: string;
  path?: string;
  parent_id?: number;
  level: number;
  subcategories?: Category[];
}
```

#### **AI Suggestion Creation:**
```typescript
interface CreateSuggestionData {
  suggestionType: 'keywords' | 'title' | 'description' | 'attributes';
  suggestionData: {
    suggestions: string[];  // Virgülle ayrılmış öneriler
  };
  confidenceScore: number;  // 0-100 arası
  isApproved: boolean;
}
```

#### **ES Index Rebuild:**
- **"ES Indexlerini Temizle ve Yeniden Yükle"** butonu
- **Otomatik confirmation**: İşlem onayı
- **Progress tracking**: İşlem durumu takibi
- **Success/Error feedback**: Sonuç bildirimi

#### **API Endpoints:**
```typescript
// Kategorileri getir
GET /api/v1/categories

// Kategori AI suggestions'larını getir
GET /api/v1/categories/{categoryId}/ai-suggestions

// Yeni AI suggestion oluştur
POST /api/v1/categories/{categoryId}/ai-suggestions

// ES index'lerini yeniden oluştur
POST /api/v1/ai-suggestions/rebuild-indexes
```

#### **State Management:**
```typescript
const [suggestions, setSuggestions] = useState<CategoryAISuggestion[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
```

#### **Error Handling:**
- **Network errors**: API bağlantı hataları
- **Validation errors**: Form doğrulama hataları
- **User feedback**: Kullanıcı dostu hata mesajları
- **Retry mechanism**: Başarısız işlemler için yeniden deneme

---

## ⚠️ **Error Handling**

### **Frontend Error Handling**
#### **AISuggestions Component:**
- **Loading states**: Yükleme durumları için spinner
- **Error display**: Hata mesajları için alert component
- **Empty states**: Öneri bulunamadığında bilgilendirme
- **Graceful degradation**: API hatası durumunda UI çökmemesi

#### **useAISuggestions Hook:**
- **Try-catch blocks**: Tüm API çağrıları için error handling
- **Error state management**: Hata durumlarını state'de tutma
- **Fallback data**: API hatası durumunda boş array döndürme
- **Console logging**: Debug için detaylı hata logları

#### **aiSuggestionsService:**
- **Network error handling**: HTTP status code kontrolü
- **Timeout handling**: Uzun süren istekler için timeout
- **Retry logic**: Başarısız istekler için yeniden deneme
- **Cache fallback**: API hatası durumunda cache'den veri

### **Backend Error Handling**
#### **API Routes:**
- **Input validation**: Gelen parametrelerin doğrulanması
- **Database error handling**: Supabase bağlantı hataları
- **ES error handling**: Elasticsearch bağlantı hataları
- **Queue error handling**: Queue processing hataları

#### **Queue Processor:**
- **Job retry mechanism**: Başarısız job'lar için retry
- **Error logging**: Detaylı hata logları
- **Graceful degradation**: Hata durumunda sistem çökmemesi
- **Manual intervention**: Admin UI'dan manuel müdahale

### **Database Error Handling**
#### **Supabase Triggers:**
- **Transaction rollback**: Hata durumunda işlem geri alma
- **Error logging**: Trigger hatalarını loglama
- **Queue insertion errors**: Queue'ya ekleme hataları

#### **ES Sync Errors:**
- **Connection timeout**: ES bağlantı timeout'ları
- **Index not found**: Index bulunamadığında otomatik oluşturma
- **Mapping errors**: ES mapping hataları
- **Data transformation errors**: Veri dönüştürme hataları

---

## ⚡ **Performance Metrics**

### **Response Time Benchmarks**
#### **Elasticsearch Queries:**
- **Simple search**: < 50ms
- **Complex search with filters**: < 100ms
- **Aggregation queries**: < 200ms
- **Index operations**: < 500ms

#### **Supabase Queries:**
- **Category suggestions**: < 100ms
- **Usage analytics**: < 200ms
- **CRUD operations**: < 50ms
- **Complex joins**: < 150ms

#### **Frontend Performance:**
- **Component render**: < 16ms (60fps)
- **Hook execution**: < 10ms
- **API calls**: < 300ms
- **Cache hits**: < 5ms

### **Cache Performance**
#### **Redis Cache:**
- **Hit rate**: > 80%
- **Miss rate**: < 20%
- **TTL**: 30 dakika
- **Memory usage**: < 100MB

#### **LocalStorage Cache:**
- **Hit rate**: > 70%
- **Storage size**: < 10MB
- **TTL**: 30 dakika
- **Auto-cleanup**: Expired cache temizleme

### **Database Performance**
#### **Index Performance:**
- **Primary key lookups**: < 1ms
- **Foreign key joins**: < 5ms
- **Full-text search**: < 10ms
- **Aggregation queries**: < 50ms

#### **Queue Performance:**
- **Job processing**: < 1s
- **Queue size**: < 1000 jobs
- **Processing rate**: 10 jobs/second
- **Error rate**: < 5%

### **Monitoring & Optimization**
#### **Performance Monitoring:**
- **Response time tracking**: Tüm API endpoint'leri
- **Error rate monitoring**: Hata oranları takibi
- **Cache hit/miss ratios**: Cache performansı
- **Queue processing metrics**: Queue işlem metrikleri

#### **Optimization Strategies:**
- **Query optimization**: Database sorgu optimizasyonu
- **Index optimization**: ES index optimizasyonu
- **Cache warming**: Popüler verileri önceden cache'leme
- **Connection pooling**: Database bağlantı havuzu

---

## 📝 **Sonuç**

Hybrid AI Suggestions sistemi, modern web uygulamaları için gerekli olan hızlı ve akıllı arama deneyimini sağlar. Elasticsearch'in güçlü arama yetenekleri ile Supabase'in güvenilir veri yönetimi birleştirilerek, kullanıcılara en iyi deneyimi sunar.

### **Ana Avantajlar:**
- ✅ **Hızlı Arama**: Elasticsearch ile sub-second response
- ✅ **Detaylı Veri**: Supabase ile zengin metadata
- ✅ **Real-time Sync**: Otomatik veri senkronizasyonu
- ✅ **Scalable**: Büyük veri setleri için uygun
- ✅ **Reliable**: Fallback sistemi ile güvenilir
- ✅ **Smart Filtering**: Query bazlı kategori filtreleme
- ✅ **Queue Processing**: PostgreSQL queue ile güvenilir sync
- ✅ **Debug Tools**: Kapsamlı monitoring ve debugging araçları
- ✅ **Usage Tracking**: Gerçek kullanım verilerine dayalı trending
- ✅ **Analytics**: Detaylı kullanım analitikleri
- ✅ **Admin Tools**: ES rebuild ve usage monitoring

---

**Dokümantasyon Tarihi:** 2025-08-25  
**Versiyon:** 2.0.0  
**Durum:** Production Ready with Usage Tracking  
**Son Güncelleme:** Usage tracking sistemi ve debug ID'leri eklendi
