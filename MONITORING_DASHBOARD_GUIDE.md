# 📊 Benalsam Monitoring Dashboard Kullanım Rehberi

## 🎯 Genel Bakış

Benalsam platformu için kapsamlı monitoring dashboard'u, tüm mikroservislerin sağlık durumunu, performansını ve işletim metriklerini gerçek zamanlı olarak izlemenizi sağlar.

## 🔗 Dashboard Erişimi

### Temel Bilgiler
- **Dashboard URL**: http://localhost:3000/d/194122d0-fbb9-4ed7-a39f-7fa0214b9f3c/benalsam-microservices-monitoring
- **Grafana URL**: http://localhost:3000
- **Kullanıcı Adı**: `admin`
- **Şifre**: `admin123`
- **Prometheus URL**: http://localhost:9090

### İlk Giriş
1. Tarayıcınızda Grafana URL'sini açın
2. Kullanıcı adı ve şifre ile giriş yapın
3. Dashboard'u açın veya doğrudan dashboard URL'sini kullanın

## 🏗️ Mikroservis Mimarisi

### Servis Port Mapping
| Port | Servis | Açıklama |
|------|--------|----------|
| 3002 | Admin Backend | Admin paneli yönetimi, kullanıcı yetkilendirme |
| 3006 | Elasticsearch Service | Arama motoru, ilan indeksleme |
| 3007 | Queue Service | İş kuyruğu, background job processing |
| 3008 | Listing Service | İlan CRUD işlemleri, ilan yönetimi |
| 3012 | Categories Service | Kategori yönetimi, hiyerarşi |
| 3014 | Cache Service | Redis cache, memory cache yönetimi |
| 3015 | Upload Service | Dosya yükleme, resim işleme |
| 3016 | Search Service | Arama API'si, search queries |

### Servis Detayları

#### Admin Backend (3002)
- **Görev**: Admin paneli yönetimi
- **Özellikler**: Kullanıcı yetkilendirme, ilan onay/red, sistem yönetimi
- **Kritik Metrikler**: Response time, error rate, active users

#### Elasticsearch Service (3006)
- **Görev**: Arama motoru
- **Özellikler**: İlan indeksleme, full-text search, filtreleme
- **Kritik Metrikler**: Index size, search latency, query performance

#### Queue Service (3007)
- **Görev**: İş kuyruğu
- **Özellikler**: Background job processing, Elasticsearch sync, email notifications
- **Kritik Metrikler**: Queue length, job processing time, failed jobs

#### Listing Service (3008)
- **Görev**: İlan yönetimi
- **Özellikler**: İlan CRUD, ilan detayları, listeleme
- **Kritik Metrikler**: Request rate, response time, database connections

#### Categories Service (3012)
- **Görev**: Kategori yönetimi
- **Özellikler**: Kategori hiyerarşisi, filtreleme, özellikler
- **Kritik Metrikler**: Cache hit ratio, response time, category tree depth

#### Cache Service (3014)
- **Görev**: Cache yönetimi
- **Özellikler**: Redis cache, memory cache, invalidation
- **Kritik Metrikler**: Cache hit ratio, memory usage, eviction rate

#### Upload Service (3015)
- **Görev**: Dosya yükleme
- **Özellikler**: Resim işleme, file storage, media management
- **Kritik Metrikler**: Upload success rate, file size, processing time

#### Search Service (3016)
- **Görev**: Arama API'si
- **Özellikler**: Search queries, results, optimization
- **Kritik Metrikler**: Search latency, query complexity, result relevance

## 📊 Dashboard Panelleri

### 1. Service Health Overview
**Amaç**: Tüm servislerin sağlık durumunu görsel olarak gösterir

**Gösterilen Bilgiler**:
- Her servisin sağlık durumu (1 = Sağlıklı, 0 = Down)
- Yeşil çubuklar = Aktif trafik
- Kırmızı = Servis down
- Gri = Servis bilinmiyor

**Kullanım**:
- Hızlı sistem durumu kontrolü
- Problemli servisleri tespit etme
- Sistem genel sağlık durumu

### 2. Response Time Monitoring
**Amaç**: Servis yanıt sürelerini izler

**Gösterilen Bilgiler**:
- 95th percentile response time
- Average response time
- Maximum response time
- Response time trendleri

**Kullanım**:
- Performance sorunlarını tespit etme
- Yavaş servisleri belirleme
- SLA compliance kontrolü

### 3. Request Rate Tracking
**Amaç**: Saniye başına istek sayısını izler

**Gösterilen Bilgiler**:
- Requests per second (RPS)
- Traffic patterns
- Peak usage times
- Load distribution

**Kullanım**:
- Trafik yoğunluğunu anlama
- Load balancing kontrolü
- Capacity planning

### 4. Error Rate Monitoring
**Amaç**: Hata oranlarını izler

**Gösterilen Bilgiler**:
- 5xx error rate percentage
- 4xx error rate percentage
- Error trends
- Error distribution by service

**Kullanım**:
- Service reliability kontrolü
- Error pattern analizi
- SLA compliance

### 5. Memory Usage Monitoring
**Amaç**: Bellek kullanımını izler

**Gösterilen Bilgiler**:
- RSS (Resident Set Size)
- Heap memory usage
- External memory usage
- Memory leaks detection

**Kullanım**:
- Memory optimization
- Resource planning
- Performance tuning

### 6. CPU Usage Tracking
**Amaç**: CPU kullanımını izler

**Gösterilen Bilgiler**:
- CPU utilization percentage
- CPU load average
- CPU cores usage
- Performance indicators

**Kullanım**:
- System performance monitoring
- Resource bottleneck detection
- Scaling decisions

### 7. Circuit Breaker Status
**Amaç**: Circuit breaker durumlarını izler

**Gösterilen Bilgiler**:
- Circuit breaker state (CLOSED, OPEN, HALF_OPEN)
- Failure count
- Success rate
- Recovery time

**Kullanım**:
- System resilience monitoring
- Failure detection
- Recovery tracking

### 8. Queue Statistics
**Amaç**: İş kuyruğu istatistiklerini izler

**Gösterilen Bilgiler**:
- Queue length
- Job processing rate
- Failed jobs count
- Processing time

**Kullanım**:
- Queue performance monitoring
- Backlog detection
- Processing efficiency

## 🚨 Alert Sistemi

### Kritik Alert'ler
Bu alert'ler sistemin kritik durumlarını bildirir:

#### ServiceDown
- **Trigger**: Servis health check başarısız
- **Severity**: Critical
- **Action**: Servisi yeniden başlat, log'ları kontrol et

#### CircuitBreakerOpen
- **Trigger**: Circuit breaker açıldı
- **Severity**: Critical
- **Action**: Dependency'leri kontrol et, fallback mekanizmalarını aktif et

#### HighErrorRate
- **Trigger**: Error rate %5'i aştı
- **Severity**: Critical
- **Action**: Application log'larını kontrol et, database connection'ları kontrol et

#### HighResponseTime
- **Trigger**: Response time 2 saniyeyi aştı
- **Severity**: Critical
- **Action**: Performance bottleneck'leri tespit et, resource usage'ı kontrol et

### Uyarı Alert'leri
Bu alert'ler potansiyel sorunları önceden bildirir:

#### HighMemoryUsage
- **Trigger**: Memory usage %80'i aştı
- **Severity**: Warning
- **Action**: Memory leak'leri kontrol et, garbage collection'ı optimize et

#### HighCPUUsage
- **Trigger**: CPU usage %80'i aştı
- **Severity**: Warning
- **Action**: CPU-intensive process'leri kontrol et, scaling düşün

#### QueueBacklog
- **Trigger**: Queue length 100'ü aştı
- **Severity**: Warning
- **Action**: Job processing rate'ini artır, worker'ları scale et

#### HighFailedJobs
- **Trigger**: Failed job rate %10'u aştı
- **Severity**: Warning
- **Action**: Job logic'ini kontrol et, error handling'i iyileştir

## 🔧 Dashboard Kullanım İpuçları

### Zaman Aralığı Seçimi
- **Son 1 saat**: Son değişiklikleri görmek için
- **Son 24 saat**: Günlük trendleri görmek için
- **Son 7 gün**: Haftalık pattern'leri görmek için
- **Custom range**: Özel zaman aralığı seçmek için

### Panel Detaylarına İnme
- **Panel üzerine tıkla**: Detaylı grafik görüntüle
- **Zoom in/out**: Yakınlaştır/Uzaklaştır
- **Export**: PNG, PDF, CSV formatında dışa aktar
- **Share**: Dashboard linkini paylaş

### Dashboard Özelleştirme
- **Panel ekleme**: Yeni metrikler ekle
- **Panel düzenleme**: Mevcut panelleri düzenle
- **Dashboard kaydetme**: Değişiklikleri kaydet
- **Dashboard paylaşma**: Ekip ile paylaş

## 🛠️ Troubleshooting Rehberi

### Servis Down Durumunda
1. **Dashboard'da kırmızı gösterilir**
2. **AlertManager'dan bildirim gelir**
3. **Log'ları kontrol et**:
   ```bash
   # Servis log'larını kontrol et
   docker logs <service-container-name>
   
   # Health check endpoint'ini test et
   curl http://localhost:<port>/api/v1/health
   ```
4. **Servisi yeniden başlat**:
   ```bash
   # Docker container'ı restart et
   docker restart <service-container-name>
   
   # Veya npm run dev ile restart et
   cd <service-directory>
   npm run dev
   ```

### Yüksek Response Time
1. **Database connection pool kontrol et**
2. **Cache hit ratio kontrol et**
3. **External service latency kontrol et**
4. **Resource usage kontrol et**

### Yüksek Error Rate
1. **Application logs kontrol et**
2. **Database connection kontrol et**
3. **External service status kontrol et**
4. **Circuit breaker durumu kontrol et**

### Memory Leak Tespiti
1. **Memory usage trend'ini izle**
2. **Garbage collection log'larını kontrol et**
3. **Heap dump al ve analiz et**
4. **Memory-intensive operation'ları tespit et**

### CPU Bottleneck Tespiti
1. **CPU usage pattern'ini analiz et**
2. **Process-level CPU usage kontrol et**
3. **I/O wait time kontrol et**
4. **Scaling gereksinimlerini değerlendir**

## 📈 Performance Optimization

### Database Optimization
- Connection pool size'ı optimize et
- Query performance'ı iyileştir
- Index'leri kontrol et
- Slow query log'larını analiz et

### Cache Optimization
- Cache hit ratio'yu artır
- Cache expiration policy'lerini optimize et
- Memory usage'ı kontrol et
- Cache invalidation strategy'lerini iyileştir

### API Optimization
- Response time'ı minimize et
- Request/response size'ını optimize et
- Rate limiting'i uygula
- Compression'ı etkinleştir

### Infrastructure Optimization
- Resource allocation'ı optimize et
- Load balancing'i iyileştir
- Auto-scaling'i etkinleştir
- Monitoring overhead'ini minimize et

## 🔍 Monitoring Best Practices

### Metric Collection
- **Relevant metrics**: Sadece önemli metrikleri topla
- **Sampling rate**: Uygun sampling rate kullan
- **Retention policy**: Uygun retention policy belirle
- **Data quality**: Metric data quality'sini kontrol et

### Alert Management
- **Alert fatigue**: Gereksiz alert'leri önle
- **Alert grouping**: Benzer alert'leri grupla
- **Escalation policy**: Uygun escalation policy belirle
- **Alert testing**: Alert'leri düzenli olarak test et

### Dashboard Design
- **User-centric**: Kullanıcı ihtiyaçlarına odaklan
- **Information hierarchy**: Bilgi hiyerarşisini koru
- **Visual clarity**: Görsel netliği sağla
- **Responsive design**: Responsive tasarım kullan

### Maintenance
- **Regular updates**: Dashboard'u düzenli olarak güncelle
- **Performance monitoring**: Dashboard performance'ını izle
- **User feedback**: Kullanıcı geri bildirimlerini al
- **Documentation**: Dokümantasyonu güncel tut

## 🚀 Gelişmiş Özellikler

### Custom Queries
Prometheus query language (PromQL) kullanarak özel sorgular oluşturabilirsiniz:

```promql
# Service response time 95th percentile
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate by service
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Memory usage percentage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

### Dashboard Variables
Dashboard'da değişkenler kullanarak dinamik filtreleme yapabilirsiniz:

- **Service**: Tüm servisler arasından seçim
- **Time Range**: Zaman aralığı seçimi
- **Environment**: Ortam seçimi (dev, staging, prod)

### Alert Rules
Özel alert kuralları oluşturabilirsiniz:

```yaml
groups:
- name: benalsam-custom-alerts
  rules:
  - alert: CustomHighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Error rate is above 10% for {{ $labels.service }}"
```

## 📚 Ek Kaynaklar

### Dokümantasyon
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)

### Monitoring Tools
- **Grafana**: Dashboard ve visualization
- **Prometheus**: Metrics collection ve storage
- **AlertManager**: Alert management
- **Loki**: Log aggregation
- **Promtail**: Log shipping

### Support
- **Internal Documentation**: `README.md`, `API_DOCUMENTATION.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Monitoring Guide**: `MONITORING_GUIDE.md`

## 🎯 Sonuç

Bu monitoring dashboard'u ile Benalsam platformunun tüm mikroservislerini kapsamlı bir şekilde izleyebilir, performans sorunlarını tespit edebilir ve sistem sağlığını koruyabilirsiniz. Dashboard'u düzenli olarak kontrol ederek proaktif monitoring yapabilir ve sistem güvenilirliğini artırabilirsiniz.

---

**Son Güncelleme**: 2025-01-26  
**Versiyon**: 1.0  
**Hazırlayan**: Benalsam Development Team
