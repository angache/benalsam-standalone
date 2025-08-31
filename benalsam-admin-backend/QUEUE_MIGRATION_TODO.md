# 🚀 Queue Sistemi: Elasticsearch Sync → Bull Migration TODO

## 📋 Genel Bakış
Mevcut `elasticsearch_sync_queue` tablosu ve `QueueProcessorService`'den Bull queue sistemine güvenli geçiş planı.

## 🎯 Hedef
- ✅ Daha güvenilir job processing
- ✅ Built-in retry mekanizması
- ✅ Monitoring dashboard
- ✅ Better error handling
- ✅ Concurrency control

---

## 📝 TODO Listesi

### 🔧 **AŞAMA 1: Hazırlık ve Kurulum**

#### 1.1 Bull Kurulumu
- [ ] `npm install bull` paketini kur
- [ ] `npm install @types/bull` TypeScript types'ını kur
- [ ] Redis connection'ı test et
- [ ] Bull konfigürasyon dosyası oluştur

#### 1.2 Mevcut Sistem Analizi
- [ ] `elasticsearch_sync_queue` tablosundaki job'ları analiz et
- [ ] Mevcut job tiplerini listele (INSERT, UPDATE, DELETE)
- [ ] Job data structure'ını dokümante et
- [ ] Mevcut retry logic'ini analiz et

#### 1.3 Yeni Klasör Yapısı
- [ ] `src/services/bull/` klasörü oluştur
- [ ] `src/services/bull/queues/` klasörü oluştur
- [ ] `src/services/bull/processors/` klasörü oluştur
- [ ] `src/services/bull/monitoring/` klasörü oluştur

---

### 🔄 **AŞAMA 2: Bull Queue Sistemi Geliştirme**

#### 2.1 Temel Bull Konfigürasyonu
- [ ] `src/services/bull/config.ts` - Bull konfigürasyonu
- [ ] `src/services/bull/connection.ts` - Redis connection
- [ ] `src/services/bull/types.ts` - TypeScript types

#### 2.2 Queue Tanımlamaları
- [ ] `src/services/bull/queues/elasticsearchSyncQueue.ts` - Ana queue
- [ ] `src/services/bull/queues/index.ts` - Queue exports
- [ ] Queue konfigürasyonu (retry, delay, priority)

#### 2.3 Job Processor'ları
- [ ] `src/services/bull/processors/inventoryProcessor.ts` - Inventory jobs
- [ ] `src/services/bull/processors/listingProcessor.ts` - Listing jobs
- [ ] `src/services/bull/processors/profileProcessor.ts` - Profile jobs
- [ ] `src/services/bull/processors/categoryProcessor.ts` - Category jobs
- [ ] `src/services/bull/processors/aiSuggestionProcessor.ts` - AI suggestion jobs

#### 2.4 Error Handling
- [ ] Global error handler
- [ ] Job-specific error handling
- [ ] Retry logic konfigürasyonu
- [ ] Dead letter queue setup

---

### 🧪 **AŞAMA 3: Test ve Doğrulama**

#### 3.1 Unit Testler
- [ ] Queue creation testleri
- [ ] Job processing testleri
- [ ] Error handling testleri
- [ ] Retry logic testleri

#### 3.2 Integration Testler
- [ ] Database trigger testleri
- [ ] Elasticsearch sync testleri
- [ ] End-to-end workflow testleri
- [ ] Performance testleri

#### 3.3 Monitoring Setup
- [ ] Bull Board kurulumu
- [ ] Queue metrics collection
- [ ] Job status monitoring
- [ ] Error alerting

---

### 🔄 **AŞAMA 4: Paralel Sistem (Eski + Yeni)**

#### 4.1 Dual Queue Sistemi
- [ ] Eski `QueueProcessorService`'i koru
- [ ] Yeni Bull sistemi paralel çalıştır
- [ ] Job'ları her iki sisteme de gönder
- [ ] Sonuçları karşılaştır

#### 4.2 Database Trigger Güncelleme
- [ ] `add_to_elasticsearch_queue` fonksiyonunu güncelle
- [ ] Hem eski tabloya hem Bull'a job ekle
- [ ] Trigger'ları test et

#### 4.3 Monitoring ve Karşılaştırma
- [ ] Her iki sistemin performansını ölç
- [ ] Job completion rate'lerini karşılaştır
- [ ] Error rate'lerini karşılaştır
- [ ] Processing time'ları karşılaştır

---

### 🚀 **AŞAMA 5: Geçiş ve Deployment**

#### 5.1 Mevcut Job'ları Migrate Et
- [ ] `elasticsearch_sync_queue`'daki pending job'ları Bull'a aktar
- [ ] Processing job'ları handle et
- [ ] Failed job'ları analiz et ve migrate et
- [ ] Migration script'i yaz ve test et

#### 5.2 Sistem Değişiklikleri
- [ ] `QueueProcessorService`'i devre dışı bırak
- [ ] Health check endpoint'ini Bull monitoring ile değiştir
- [ ] Queue stats endpoint'ini güncelle
- [ ] Admin dashboard'u Bull Board ile değiştir

#### 5.3 API Güncellemeleri
- [ ] `/api/v1/elasticsearch/queue/*` endpoint'lerini güncelle
- [ ] Job management endpoint'lerini Bull API ile değiştir
- [ ] Monitoring endpoint'lerini güncelle

---

### 🧹 **AŞAMA 6: Temizlik ve Optimizasyon**

#### 6.1 Eski Sistemi Kaldır
- [ ] `QueueProcessorService`'i sil
- [ ] `elasticsearch_sync_queue` tablosunu archive et
- [ ] Eski trigger'ları kaldır
- [ ] Eski endpoint'leri kaldır

#### 6.2 Performance Optimizasyonu
- [ ] Queue concurrency ayarlarını optimize et
- [ ] Job batching'i implement et
- [ ] Memory usage'ı optimize et
- [ ] Redis connection pooling'i optimize et

#### 6.3 Monitoring ve Alerting
- [ ] Production monitoring setup
- [ ] Error alerting konfigürasyonu
- [ ] Performance metrics collection
- [ ] Dashboard customization

---

## 📊 **Migration Checklist**

### ✅ Hazırlık
- [ ] Bull kurulumu tamamlandı
- [ ] Redis connection test edildi
- [ ] Mevcut sistem analiz edildi
- [ ] Test environment hazırlandı

### ✅ Geliştirme
- [ ] Bull queue sistemi geliştirildi
- [ ] Job processor'ları yazıldı
- [ ] Error handling implement edildi
- [ ] Monitoring setup tamamlandı

### ✅ Test
- [ ] Unit testler geçti
- [ ] Integration testler geçti
- [ ] Performance testler geçti
- [ ] End-to-end testler geçti

### ✅ Deployment
- [ ] Paralel sistem çalışıyor
- [ ] Eski job'lar migrate edildi
- [ ] Yeni sistem aktif
- [ ] Eski sistem kaldırıldı

---

## 🚨 **Risk Mitigation**

### Backup Stratejisi
- [ ] Database backup'ları al
- [ ] Eski queue data'sını archive et
- [ ] Rollback planı hazırla
- [ ] Emergency contact listesi

### Monitoring
- [ ] Her iki sistemin de çalıştığını kontrol et
- [ ] Job completion rate'lerini izle
- [ ] Error rate'lerini izle
- [ ] Performance metrics'leri izle

### Rollback Planı
- [ ] Eski sistemi hızlıca aktif edebilme
- [ ] Database trigger'ları geri yükleme
- [ ] Queue data'sını geri yükleme
- [ ] Service restart prosedürü

---

## 📅 **Tahmini Timeline**

- **Aşama 1**: 1-2 gün
- **Aşama 2**: 3-4 gün
- **Aşama 3**: 2-3 gün
- **Aşama 4**: 2-3 gün
- **Aşama 5**: 1-2 gün
- **Aşama 6**: 1-2 gün

**Toplam**: 10-16 gün

---

## 🎯 **Başarı Kriterleri**

- [ ] Tüm job'lar başarıyla process ediliyor
- [ ] Error rate %1'in altında
- [ ] Job processing time 5 saniyenin altında
- [ ] Monitoring dashboard çalışıyor
- [ ] Retry mekanizması düzgün çalışıyor
- [ ] Eski sistem tamamen kaldırıldı

---

## 📞 **İletişim**

- **Developer**: AI Assistant
- **Reviewer**: Arda Tuna
- **Emergency Contact**: Arda Tuna

---

*Son güncelleme: 2025-08-31*
*Versiyon: 2.0 - Microservice Architecture*
