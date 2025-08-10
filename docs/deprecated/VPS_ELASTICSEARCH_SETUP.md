# VPS Elasticsearch & Redis Konfigürasyonu - Benalsam Projesi

## 🎯 VPS Kullanım Stratejisi

### **Mevcut Durum:**
- ✅ VPS'de Redis çalışıyor
- ✅ VPS'de Elasticsearch çalışıyor
- 🎯 Benalsam projesi için konfigürasyon

## 🔧 VPS Konfigürasyon Kontrolü

### **1. Elasticsearch Durum Kontrolü**
```bash
# Elasticsearch health check
curl -X GET "http://YOUR_VPS_IP:9200/_cluster/health?pretty"

# Elasticsearch version
curl -X GET "http://YOUR_VPS_IP:9200"

# Elasticsearch indices
curl -X GET "http://YOUR_VPS_IP:9200/_cat/indices?v"
```

### **2. Redis Durum Kontrolü**
```bash
# Redis connection test
redis-cli -h YOUR_VPS_IP -p 6379 ping

# Redis info
redis-cli -h YOUR_VPS_IP -p 6379 info

# Redis memory usage
redis-cli -h YOUR_VPS_IP -p 6379 info memory
```

### **3. Network Connectivity Test**
```bash
# Port kontrolü
telnet YOUR_VPS_IP 9200  # Elasticsearch
telnet YOUR_VPS_IP 6379  # Redis

# Firewall kontrolü
sudo ufw status
```

## 🏗️ Benalsam için Konfigürasyon

### **1. Elasticsearch Index Oluşturma**
```bash
# Benalsam listings index'i oluştur
curl -X PUT "http://YOUR_VPS_IP:9200/benalsam_listings" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
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
    },
    "mappings": {
      "properties": {
        "id": { "type": "keyword" },
        "title": {
          "type": "text",
          "analyzer": "turkish_analyzer",
          "fields": {
            "keyword": { "type": "keyword" },
            "suggest": { "type": "completion" }
          }
        },
        "description": {
          "type": "text",
          "analyzer": "turkish_analyzer"
        },
        "category": {
          "type": "keyword",
          "fields": {
            "text": { "type": "text", "analyzer": "turkish_analyzer" }
          }
        },
        "budget": { "type": "float" },
        "location": {
          "type": "geo_point",
          "fields": {
            "text": { "type": "text", "analyzer": "turkish_analyzer" }
          }
        },
        "urgency": { "type": "keyword" },
        "attributes": { "type": "object" },
        "user_id": { "type": "keyword" },
        "status": { "type": "keyword" },
        "created_at": { "type": "date" },
        "popularity_score": { "type": "integer" },
        "is_premium": { "type": "boolean" },
        "tags": { "type": "keyword" }
      }
    }
  }'
```

### **2. Redis Konfigürasyonu**
```bash
# Redis'te Benalsam için namespace oluştur
redis-cli -h YOUR_VPS_IP -p 6379

# Test key ekle
SET benalsam:test "Hello Benalsam"
GET benalsam:test

# Queue için key pattern
LPUSH benalsam:elasticsearch_sync_queue "test_message"
LLEN benalsam:elasticsearch_sync_queue
```

## 🔐 Güvenlik Konfigürasyonu

### **1. Elasticsearch Güvenlik**
```bash
# Elasticsearch config dosyası
sudo nano /etc/elasticsearch/elasticsearch.yml

# Güvenlik ayarları
xpack.security.enabled: false  # Development için
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node

# Elasticsearch restart
sudo systemctl restart elasticsearch
```

### **2. Redis Güvenlik**
```bash
# Redis config dosyası
sudo nano /etc/redis/redis.conf

# Güvenlik ayarları
bind 0.0.0.0
port 6379
# requirepass YOUR_PASSWORD  # Opsiyonel

# Redis restart
sudo systemctl restart redis
```

### **3. Firewall Konfigürasyonu**
```bash
# UFW firewall ayarları
sudo ufw allow 9200/tcp  # Elasticsearch
sudo ufw allow 6379/tcp  # Redis
sudo ufw reload
```

## 📊 Environment Variables

### **1. Benalsam Backend (.env)**
```env
# Elasticsearch
ELASTICSEARCH_URL=http://YOUR_VPS_IP:9200
ELASTICSEARCH_INDEX=benalsam_listings

# Redis
REDIS_URL=redis://YOUR_VPS_IP:6379
REDIS_PASSWORD=YOUR_PASSWORD  # Eğer varsa

# Sync Configuration
SYNC_ENABLED=true
SYNC_BATCH_SIZE=100
SYNC_INTERVAL=5000
```

### **2. Mobile App (.env)**
```env
# Search API
SEARCH_API_URL=http://YOUR_VPS_IP:3000/api/search
ELASTICSEARCH_ENABLED=true
```

## 🧪 Test Konfigürasyonu

### **1. Elasticsearch Test**
```bash
# Index test
curl -X POST "http://YOUR_VPS_IP:9200/benalsam_listings/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "iPhone 13 Test",
    "description": "Test ilanı",
    "category": "Elektronik > Telefon",
    "budget": 15000,
    "status": "active"
  }'

# Search test
curl -X GET "http://YOUR_VPS_IP:9200/benalsam_listings/_search?q=iPhone"
```

### **2. Redis Test**
```bash
# Connection test
redis-cli -h YOUR_VPS_IP -p 6379 ping

# Queue test
redis-cli -h YOUR_VPS_IP -p 6379 LPUSH benalsam:test_queue "test_message"
redis-cli -h YOUR_VPS_IP -p 6379 RPOP benalsam:test_queue
```

## 📈 Monitoring ve Logging

### **1. Elasticsearch Monitoring**
```bash
# Cluster health
curl -X GET "http://YOUR_VPS_IP:9200/_cluster/health?pretty"

# Index stats
curl -X GET "http://YOUR_VPS_IP:9200/benalsam_listings/_stats?pretty"

# Node stats
curl -X GET "http://YOUR_VPS_IP:9200/_nodes/stats?pretty"
```

### **2. Redis Monitoring**
```bash
# Redis info
redis-cli -h YOUR_VPS_IP -p 6379 info

# Memory usage
redis-cli -h YOUR_VPS_IP -p 6379 info memory

# Connected clients
redis-cli -h YOUR_VPS_IP -p 6379 client list
```

## 🚀 Deployment Checklist

### **Pre-deployment**
- [ ] VPS IP adresi not edildi
- [ ] Elasticsearch health check yapıldı
- [ ] Redis connection test yapıldı
- [ ] Firewall ayarları kontrol edildi
- [ ] Index mapping oluşturuldu
- [ ] Environment variables hazırlandı

### **Deployment**
- [ ] Backend .env dosyası güncellendi
- [ ] Mobile app .env dosyası güncellendi
- [ ] Elasticsearch service başlatıldı
- [ ] Redis service başlatıldı
- [ ] Sync service test edildi

### **Post-deployment**
- [ ] Search API test edildi
- [ ] Sync performance ölçüldü
- [ ] Error logging kontrol edildi
- [ ] Monitoring dashboard kuruldu

## 🔧 Troubleshooting

### **Elasticsearch Sorunları**
```bash
# Service status
sudo systemctl status elasticsearch

# Logs
sudo journalctl -u elasticsearch -f

# Memory usage
free -h
```

### **Redis Sorunları**
```bash
# Service status
sudo systemctl status redis

# Logs
sudo journalctl -u redis -f

# Memory usage
redis-cli -h YOUR_VPS_IP -p 6379 info memory
```

### **Network Sorunları**
```bash
# Port kontrolü
netstat -tlnp | grep :9200
netstat -tlnp | grep :6379

# Firewall kontrolü
sudo ufw status
```

---

## 🎯 Sonuç

VPS kullanımı şu avantajları sağlar:
- ✅ Hızlı başlangıç
- ✅ Production-like environment
- ✅ Gerçek performans testi
- ✅ Maliyet verimliliği

**Önerilen Aksiyon:**
1. VPS IP adresini not edin
2. Elasticsearch ve Redis health check yapın
3. Index mapping oluşturun
4. Environment variables'ları güncelleyin
5. Test deployment yapın

Bu şekilde mevcut altyapınızı maksimum verimle kullanabilirsiniz. 