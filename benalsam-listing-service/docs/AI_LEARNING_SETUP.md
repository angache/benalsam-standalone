# 🚀 AI Öğrenme Sistemi Kurulum Rehberi

## 📋 Ön Gereksinimler

1. ✅ PostgreSQL/Supabase veritabanı
2. ✅ Redis bağlantısı
3. ✅ Migration dosyası çalıştırılmış

## 🔧 Kurulum Adımları

### 1. Veritabanı Migration'ı Çalıştır

```bash
# Supabase SQL Editor'da veya psql ile:
psql -d your_database -f migrations/create_ai_learned_patterns_table.sql
```

Veya Supabase Dashboard'da SQL Editor'ı açıp migration dosyasını çalıştırın.

### 2. Environment Variables

`.env` dosyanıza ekleyin:

```bash
# AI Learning Configuration
AI_LEARNING_ENABLED=true
AI_LEARNING_ANALYSIS_INTERVAL_HOURS=6
AI_LEARNING_CLEANUP_HOUR=2
```

### 3. Servisi Başlat

```bash
npm run dev
```

Scheduler otomatik olarak başlayacak:
- ✅ İlk analiz: 5 dakika sonra
- ✅ Düzenli analiz: Her 6 saatte bir
- ✅ Temizlik: Her gün saat 02:00'de

## 📊 Sistem Durumu

### Status Endpoint

```bash
GET /api/v1/ai-learning/status
```

Response:
```json
{
  "success": true,
  "data": {
    "scheduler": {
      "running": true,
      "lastAnalysis": "2025-01-20T10:00:00Z",
      "nextAnalysis": "2025-01-20T16:00:00Z"
    },
    "patterns": {
      "telefon_title": 15,
      "telefon_description": 12,
      "emlak_title": 8
    },
    "cache": {
      "enabled": true,
      "ttl": "24 hours"
    }
  }
}
```

## 🎯 Manuel Tetikleme

### Analiz Tetikle

```bash
POST /api/v1/ai-learning/trigger-analysis
```

Başarılı ilanları analiz eder ve pattern'ları öğrenir.

### Temizlik Tetikle

```bash
POST /api/v1/ai-learning/trigger-cleanup
```

Eski ve düşük kaliteli pattern'ları temizler.

### Kategori Pattern'larını Görüntüle

```bash
GET /api/v1/ai-learning/patterns/{category}
```

Örnek:
```bash
GET /api/v1/ai-learning/patterns/telefon
```

## 🔍 Öğrenme Süreci

### Otomatik Öğrenme

1. **Scheduler** her 6 saatte bir çalışır
2. Son 7 günün **aktif ilanlarını** analiz eder
3. **Başarı skoru 60+** olan ilanları öğrenir
4. Pattern'ları **normalize eder** ve **veritabanına kaydeder**
5. **Redis cache'i günceller**

### Başarı Skoru Hesaplama

| Metrik | Puan |
|--------|------|
| Views > 100 | 40 |
| Views > 50 | 30 |
| Views > 20 | 20 |
| Views > 10 | 10 |
| Responses > 10 | 40 |
| Responses > 5 | 30 |
| < 7 gün | 20 |
| < 30 gün | 10 |

**Minimum**: 60/100

## 📈 Pattern Kullanımı

AI öneri sistemi otomatik olarak öğrenilmiş pattern'ları kullanır:

1. **Title Suggestions**: En yüksek skorlu pattern'ları kullanır
2. **Description Hints**: En başarılı açıklama kalıplarını kullanır
3. **Fallback**: Pattern yoksa real-time analiz yapar

## 🧹 Temizlik

Otomatik temizlik her gün saat 02:00'de çalışır:

- ❌ 90 günden eski pattern'lar
- ❌ Başarı oranı < %30
- ❌ Kullanım sayısı < 3

## 🐛 Sorun Giderme

### Pattern'lar Öğrenilmiyor

1. **Veritabanı kontrolü**:
```sql
SELECT COUNT(*) FROM ai_learned_patterns;
```

2. **Scheduler durumu**:
```bash
GET /api/v1/ai-learning/status
```

3. **Manuel tetikleme**:
```bash
POST /api/v1/ai-learning/trigger-analysis
```

### Redis Cache Sorunları

1. Redis bağlantısını kontrol edin
2. Cache key'lerini kontrol edin:
```bash
redis-cli KEYS "ai:learned:*"
```

### Performans Sorunları

1. **Cache Hit Rate**: %95+ olmalı
2. **Analysis Time**: < 30 saniye (100 ilan için)
3. **Database Queries**: Index'ler kullanılıyor mu?

## 📝 Loglar

Öğrenme işlemleri loglanır:

```
📚 AI Learning Scheduler: Analyzing successful listings...
✅ AI Learning Scheduler: Analysis complete
  totalListings: 100
  learnedCount: 15
  successRate: 15.0%
```

## 🎯 Sonraki Adımlar

1. ✅ Migration çalıştırıldı
2. ✅ Environment variables ayarlandı
3. ✅ Servis başlatıldı
4. ⏳ İlk analiz bekleniyor (5 dakika)
5. ⏳ Pattern'lar öğrenilmeye başlayacak

## 📚 İlgili Dokümantasyon

- [AI Learning System](./AI_LEARNING_SYSTEM.md) - Detaylı sistem dokümantasyonu
- [API Endpoints](./API_ENDPOINTS.md) - API endpoint'leri

