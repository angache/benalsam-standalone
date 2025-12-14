# 🤖 AI Öğrenme Sistemi Dokümantasyonu

## 📋 Genel Bakış

AI öğrenme sistemi, başarılı ilanlardan pattern'ları öğrenerek daha iyi öneriler üretmek için tasarlanmıştır. Sistem **hibrit bir yaklaşım** kullanır:

1. **Redis Cache**: Hızlı erişim için (24 saat TTL)
2. **PostgreSQL**: Kalıcı saklama ve analiz
3. **Real-time Learning**: Anlık benzer ilan analizi (fallback)

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────┐
│              AI Suggestion Request                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Learning Service    │
         └───────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐        ┌───────────────┐
│  Redis Cache  │        │  PostgreSQL   │
│  (24h TTL)    │        │  (Permanent)  │
└───────────────┘        └───────────────┘
        │                         │
        └────────────┬────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Learned Patterns     │
         │  (Top 10 per type)    │
         └───────────────────────┘
```

## 📊 Veri Modeli

### PostgreSQL Tablosu: `ai_learned_patterns`

```sql
CREATE TABLE ai_learned_patterns (
  id UUID PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  pattern_type VARCHAR(20) NOT NULL, -- 'title' or 'description'
  pattern TEXT NOT NULL,
  score INTEGER NOT NULL, -- 0-100 (success score)
  usage_count INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  success_rate DECIMAL(5,2) NOT NULL, -- Percentage
  last_used TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Redis Cache Yapısı

```
Key: ai:learned:{category}
Value: {
  category: string,
  titlePatterns: LearnedPattern[],
  descriptionHints: LearnedPattern[],
  lastUpdated: Date
}
TTL: 24 hours
```

## 🔄 Öğrenme Süreci

### 1. Pattern Extraction (Pattern Çıkarma)

Bir ilan başarılı olduğunda (yüksek görüntülenme, yanıt sayısı):

```typescript
// Başarı skoru hesaplama
score = views_score (40) + responses_score (40) + recency_bonus (20)

// Minimum skor: 60/100
if (score >= 60) {
  // Pattern çıkar
  titlePattern = extractTitlePattern(listing.title)
  descriptionHint = extractDescriptionHint(listing.description)
  
  // Veritabanına kaydet
  savePattern(pattern)
}
```

### 2. Pattern Normalization (Pattern Normalizasyonu)

Pattern'lar genelleştirilir:

```typescript
// Örnek: "iPhone 13 Pro Max 256GB Arıyorum"
// → "{brand} {model} {storage} Arıyorum"

// Örnek: "2023 model araç arıyorum"
// → "{year} model araç arıyorum"
```

### 3. Success Tracking (Başarı Takibi)

Her pattern kullanıldığında:

```typescript
// Pattern kullanıldı
usage_count++

// Başarılı oldu mu? (kullanıcı kabul etti mi?)
if (userAccepted) {
  success_count++
}

// Başarı oranı güncelle
success_rate = (success_count / usage_count) * 100
```

## 📈 Başarı Metrikleri

### Success Score Hesaplama

| Metrik | Puan | Açıklama |
|--------|------|----------|
| Views > 100 | 40 | Çok popüler |
| Views > 50 | 30 | Popüler |
| Views > 20 | 20 | Orta |
| Views > 10 | 10 | Başlangıç |
| Responses > 10 | 40 | Çok etkileşimli |
| Responses > 5 | 30 | Etkileşimli |
| Responses > 2 | 20 | Orta |
| Responses > 0 | 10 | Başlangıç |
| < 7 gün | 20 | Yeni |
| < 30 gün | 10 | Güncel |

**Minimum Skor**: 60/100 (öğrenme için)

## 🔍 Pattern Kullanımı

### Title Suggestions

```typescript
// 1. Öğrenilmiş pattern'ları yükle (Redis/DB)
const learnedPatterns = await learningService.getLearnedPatterns(category)

// 2. En yüksek skorlu pattern'ları al (Top 3)
for (const pattern of learnedPatterns.titlePatterns.slice(0, 3)) {
  // 3. Pattern'ı mevcut özelliklere uyarla
  const adaptedTitle = adaptTitleFromSimilar(
    pattern.pattern, 
    attributes, 
    category
  )
  
  // 4. Öneriye ekle
  suggestions.push({
    title: adaptedTitle,
    score: pattern.score * 0.8, // Biraz düşür
    reason: `${pattern.successRate}% başarı oranı`
  })
}
```

### Description Suggestions

```typescript
// Öğrenilmiş description hint'lerini kullan
if (learnedPatterns.descriptionHints.length > 0) {
  const hint = learnedPatterns.descriptionHints[0]
  const adaptedHint = adaptDescriptionHint(hint, attributes, category)
  description = `${description}\n\n${adaptedHint}`
}
```

## 🧹 Temizlik (Cleanup)

Düşük kaliteli pattern'lar otomatik temizlenir:

```typescript
// Her gün çalışan cron job
cleanupOldPatterns() {
  // Silinecek pattern'lar:
  // 1. 90 günden eski VE
  // 2. Başarı oranı < 30% VEYA
  // 3. Kullanım sayısı < 3
}
```

## 🚀 Kullanım Senaryoları

### Senaryo 1: Yeni Kategori

1. İlk ilanlar oluşturulur
2. Başarılı ilanlar analiz edilir
3. Pattern'lar çıkarılır ve kaydedilir
4. Sonraki ilanlar için öneriler gelişir

### Senaryo 2: Mevcut Kategori

1. Öğrenilmiş pattern'lar Redis'ten yüklenir
2. En başarılı pattern'lar kullanılır
3. Kullanım sonuçları takip edilir
4. Başarı oranları güncellenir

### Senaryo 3: Pattern Güncelleme

1. Yeni başarılı ilan gelir
2. Mevcut pattern ile karşılaştırılır
3. Daha iyi ise güncellenir
4. Cache invalidate edilir

## 📊 Performans

### Cache Hit Rate

- **Redis Cache**: ~95% hit rate (24h TTL)
- **Database Fallback**: ~5% (cache miss)

### Öğrenme Hızı

- **Minimum Pattern**: 3 kullanım
- **Başarı Oranı**: %30+ (kalıcı olması için)
- **Temizlik**: 90 gün kullanılmayan pattern'lar silinir

## 🔧 Yapılandırma

```typescript
// learningService.ts
private readonly CACHE_TTL = 24 * 60 * 60; // 24 saat
private readonly MIN_SUCCESS_SCORE = 60; // Minimum skor
private readonly MIN_USAGE_COUNT = 3; // Minimum kullanım
```

## 📝 Örnek Veri

```json
{
  "category": "telefon",
  "titlePatterns": [
    {
      "pattern": "{brand} {model} {storage} Arıyorum",
      "score": 85,
      "usageCount": 15,
      "successRate": 86.67,
      "lastUsed": "2025-01-20T10:00:00Z"
    },
    {
      "pattern": "{brand} {model} Arıyorum",
      "score": 75,
      "usageCount": 8,
      "successRate": 75.00,
      "lastUsed": "2025-01-19T15:30:00Z"
    }
  ],
  "descriptionHints": [
    {
      "pattern": "Merhaba, {brand} {model} arıyorum.",
      "score": 80,
      "usageCount": 12,
      "successRate": 83.33,
      "lastUsed": "2025-01-20T09:00:00Z"
    }
  ]
}
```

## 🎯 Sonuç

Bu sistem sayesinde:

1. ✅ **Başarılı pattern'lar kalıcı olarak saklanır**
2. ✅ **Hızlı erişim için Redis cache kullanılır**
3. ✅ **Başarı oranları takip edilir**
4. ✅ **Düşük kaliteli pattern'lar temizlenir**
5. ✅ **Sistem zamanla daha akıllı hale gelir**

