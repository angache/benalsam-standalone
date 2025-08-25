# 🚀 Infrastructure Setup Scripts

Bu klasör Redis ve Elasticsearch'i sıfırdan kurmak için gerekli script'leri içerir.

## 📁 Dosyalar

- `setup-infrastructure.sh` - Ana setup script'i (Bash)
- `sync-listings-to-es.js` - Supabase'den ES'e veri senkronizasyonu (Node.js)
- `README.md` - Bu dosya

## 🛠️ Kullanım

### 1. Tam Infrastructure Reset

```bash
# Tüm infrastructure'ı sıfırdan kur
npm run infra:reset
```

Bu komut şunları yapar:
- ✅ Environment variables kontrolü
- ✅ Elasticsearch index oluşturma
- ✅ Redis cache temizleme ve yeniden kurma
- ✅ Supabase'den veri senkronizasyonu
- ✅ Test verileri oluşturma
- ✅ Health check

### 2. Sadece Infrastructure Setup

```bash
# Sadece ES ve Redis kurulumu
npm run infra:setup
```

### 3. Sadece Veri Senkronizasyonu

```bash
# Sadece Supabase'den ES'e veri yükleme
npm run infra:sync
```

## 🔧 Gereksinimler

### Environment Variables

`.env` dosyasında şu değişkenler olmalı:

```bash
# Elasticsearch
ELASTICSEARCH_URL=http://your-es-server:9200

# Redis
REDIS_URL=redis://your-redis-server:6379

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Sistem Gereksinimleri

- **Node.js** 18+
- **curl** (ES API çağrıları için)
- **redis-cli** (Redis komutları için)
- **jq** (JSON parsing için)

## 📊 Ne Yapar?

### Elasticsearch Setup
1. **Bağlantı kontrolü** - ES'e erişim kontrolü
2. **Index oluşturma** - `listings` index'i oluşturur
3. **Mapping tanımlama** - Tüm field'ları ve analyzer'ları tanımlar
4. **Alias oluşturma** - `listings_current` alias'ı oluşturur

### Redis Setup
1. **Bağlantı kontrolü** - Redis'e erişim kontrolü
2. **Cache temizleme** - Tüm cache'leri temizler
3. **Cache key'leri oluşturma** - Boş cache key'leri oluşturur

### Veri Senkronizasyonu
1. **Supabase'den veri çekme** - Aktif ilanları çeker
2. **Veri dönüştürme** - ES formatına çevirir
3. **Batch yükleme** - 100'erli gruplar halinde yükler
4. **Hata kontrolü** - Başarısız yüklemeleri raporlar

## 🚨 Yaygın Sorunlar

### 1. "ELASTICSEARCH_URL environment variable tanımlanmamış"
```bash
# .env dosyasını kontrol et
cat .env | grep ELASTICSEARCH_URL
```

### 2. "Elasticsearch'e bağlanılamıyor"
```bash
# ES'in çalışıp çalışmadığını kontrol et
curl $ELASTICSEARCH_URL
```

### 3. "Redis'e bağlanılamıyor"
```bash
# Redis'in çalışıp çalışmadığını kontrol et
redis-cli -u $REDIS_URL ping
```

### 4. "jq command not found"
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL
sudo yum install jq
```

## 📈 Monitoring

### Health Check
Script sonunda otomatik health check yapar:
- ES cluster durumu
- Redis bağlantısı
- Index doküman sayısı

### Logs
Tüm işlemler renkli log'larla raporlanır:
- 🟢 Başarılı işlemler
- 🟡 Uyarılar
- 🔴 Hatalar

## 🔄 Otomatik Çalıştırma

### Cron Job (Opsiyonel)
```bash
# Her gün gece 2'de senkronizasyon
0 2 * * * cd /path/to/benalsam-admin-backend && npm run infra:sync
```

### CI/CD Pipeline
```yaml
# GitHub Actions örneği
- name: Sync Data
  run: |
    cd benalsam-admin-backend
    npm run infra:sync
```

## 📝 Notlar

- Script'ler **idempotent**'tir - birden fazla çalıştırılabilir
- **Batch processing** kullanır - büyük veri setleri için optimize edilmiştir
- **Error handling** içerir - hataları yakalar ve raporlar
- **Progress tracking** yapar - ilerlemeyi gösterir

## 🆘 Yardım

Sorun yaşarsan:
1. Environment variables'ları kontrol et
2. Network bağlantılarını kontrol et
3. Log'ları incele
4. Gerekirse manuel olarak adım adım çalıştır
