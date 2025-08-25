# AI Suggestions Hybrid Implementation TODO

## 🎯 **Hedef**
AI Suggestions sistemini hybrid yaklaşımla implement etmek:
- **Supabase**: Primary database (CRUD operations, Admin UI)
- **Elasticsearch**: Search engine (fast full-text search, fuzzy matching)

## 📋 **Görev Listesi**

### **1. Elasticsearch Index Oluşturma**
- [ ] `ai_suggestions` index'ini oluştur
- [ ] Mapping tanımla (turkish analyzer, confidence_score, etc.)
- [ ] Test verisi ile index'i doğrula

### **2. Supabase Trigger Sistemi**
- [ ] `category_ai_suggestions` tablosu için trigger oluştur
- [ ] Yeni kayıt eklendiğinde ES'e indexle
- [ ] Güncelleme yapıldığında ES'i güncelle
- [ ] Kayıt silindiğinde ES'den kaldır

### **3. Backend API Güncellemeleri**
- [ ] `aiSuggestions.ts` route'unu hybrid yapıya çevir
- [ ] ES search fonksiyonları ekle
- [ ] Supabase details çekme fonksiyonları ekle
- [ ] Sonuçları birleştirme fonksiyonu yaz
- [ ] Error handling ekle

### **4. Frontend Entegrasyonu**
- [ ] `aiSuggestionsService.ts`'i güncelle
- [ ] Search performansını test et
- [ ] Loading states ekle
- [ ] Error handling ekle

### **5. Admin UI Güncellemeleri**
- [ ] AI suggestion ekleme formunu test et
- [ ] Real-time ES indexing'i doğrula
- [ ] Search sonuçlarını test et

### **6. Test ve Optimizasyon**
- [ ] Performance testleri yap
- [ ] Search accuracy testleri yap
- [ ] Load testing yap
- [ ] Error scenarios test et

## 🔧 **Teknik Detaylar**

### **ES Index Mapping:**
```json
{
  "mappings": {
    "properties": {
      "id": { "type": "integer" },
      "category_id": { "type": "integer" },
      "category_name": { "type": "text", "analyzer": "turkish" },
      "category_path": { "type": "text", "analyzer": "turkish" },
      "suggestion_type": { "type": "keyword" },
      "suggestion_data": {
        "properties": {
          "keywords": { "type": "text", "analyzer": "turkish" },
          "description": { "type": "text", "analyzer": "turkish" }
        }
      },
      "confidence_score": { "type": "float" },
      "is_approved": { "type": "boolean" },
      "created_at": { "type": "date" }
    }
  }
}
```

### **Supabase Trigger:**
```sql
-- AI suggestions için ES sync trigger'ı
CREATE OR REPLACE FUNCTION sync_ai_suggestions_to_es()
RETURNS TRIGGER AS $$
BEGIN
  -- ES'e indexle/güncelle/sil
  -- Mevcut listings_queue_sync gibi
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_suggestions_es_sync
  AFTER INSERT OR UPDATE OR DELETE ON category_ai_suggestions
  FOR EACH ROW EXECUTE FUNCTION sync_ai_suggestions_to_es();
```

### **Backend API Flow:**
```javascript
// 1. ES'den hızlı search
const searchResults = await esClient.search({
  index: 'ai_suggestions',
  body: {
    query: {
      multi_match: {
        query: query,
        fields: ['suggestion_data.keywords', 'category_name'],
        fuzziness: 'AUTO'
      }
    },
    sort: [{ confidence_score: { order: 'desc' } }]
  }
});

// 2. Supabase'den detaylar
const suggestionIds = searchResults.hits.hits.map(hit => hit._id);
const details = await supabase
  .from('category_ai_suggestions')
  .select(`
    *,
    categories!inner(name, path, level)
  `)
  .in('id', suggestionIds);

// 3. Birleştir ve döndür
return combineResults(searchResults, details);
```

## 📊 **Performans Hedefleri**

### **Search Performance:**
- ✅ **ES Search**: < 20ms
- ✅ **Supabase Details**: < 50ms
- ✅ **Total Response**: < 100ms

### **Write Performance:**
- ✅ **Supabase Insert**: < 100ms
- ✅ **ES Indexing**: < 200ms
- ✅ **Total Write**: < 300ms

## 🚀 **Öncelik Sırası**

1. **ES Index Oluştur** (1-2 saat)
2. **Supabase Trigger** (2-3 saat)
3. **Backend API** (4-6 saat)
4. **Frontend Test** (2-3 saat)
5. **Admin UI Test** (1-2 saat)
6. **Performance Test** (2-3 saat)

**Toplam Tahmini Süre: 12-19 saat**

## 📝 **Notlar**

- Mevcut `listings_queue_sync` trigger'ını örnek al
- ES connection'ı mevcut config'den kullan
- Error handling'i güçlü yap
- Performance monitoring ekle
- Backup stratejisi planla

---
**Oluşturulma Tarihi:** 2025-01-25
**Durum:** Aktif
**Öncelik:** Yüksek
