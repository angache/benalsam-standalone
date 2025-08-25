#!/bin/bash

# 🚀 BENALSAM INFRASTRUCTURE SETUP SCRIPT
# Redis ve Elasticsearch'i sıfırdan kurar

set -e  # Hata durumunda dur

echo "🏗️ Benalsam Infrastructure Setup başlıyor..."

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log fonksiyonu
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Environment variables kontrolü
check_env() {
    log "🔍 Environment variables kontrol ediliyor..."
    
    if [ -z "$ELASTICSEARCH_URL" ]; then
        error "ELASTICSEARCH_URL environment variable tanımlanmamış!"
    fi
    
    if [ -z "$REDIS_URL" ]; then
        error "REDIS_URL environment variable tanımlanmamış!"
    fi
    
    if [ -z "$SUPABASE_URL" ]; then
        error "SUPABASE_URL environment variable tanımlanmamış!"
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        error "SUPABASE_SERVICE_ROLE_KEY environment variable tanımlanmamış!"
    fi
    
    log "✅ Environment variables tamam"
}

# Elasticsearch kurulumu
setup_elasticsearch() {
    log "🔍 Elasticsearch kurulumu başlıyor..."
    
    # ES bağlantı kontrolü
    if ! curl -s "$ELASTICSEARCH_URL" > /dev/null; then
        error "Elasticsearch'e bağlanılamıyor: $ELASTICSEARCH_URL"
    fi
    
    # Listings index'ini oluştur
    log "📝 Listings index oluşturuluyor..."
    
    curl -X PUT "$ELASTICSEARCH_URL/listings" \
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
                            "filter": ["lowercase", "turkish_stop", "turkish_stemmer"]
                        }
                    },
                    "filter": {
                        "turkish_stop": {
                            "type": "stop",
                            "stopwords": "_turkish_"
                        },
                        "turkish_stemmer": {
                            "type": "stemmer",
                            "language": "turkish"
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "id": { "type": "keyword" },
                    "user_id": { "type": "keyword" },
                    "title": { 
                        "type": "text",
                        "analyzer": "turkish_analyzer",
                        "fields": {
                            "keyword": { "type": "keyword" }
                        }
                    },
                    "description": { 
                        "type": "text",
                        "analyzer": "turkish_analyzer" 
                    },
                    "category": { 
                        "type": "text",
                        "analyzer": "keyword"
                    },
                    "category_id": { "type": "integer" },
                    "category_path": { "type": "integer" },
                    "price": { "type": "float" },
                    "budget": { "type": "float" },
                    "status": { "type": "keyword" },
                    "location": { "type": "keyword" },
                    "created_at": { "type": "date" },
                    "updated_at": { "type": "date" },
                    "is_premium": { "type": "boolean" },
                    "is_featured": { "type": "boolean" },
                    "is_urgent_premium": { "type": "boolean" },
                    "popularity_score": { "type": "float" },
                    "views_count": { "type": "integer" },
                    "favorites_count": { "type": "integer" },
                    "offers_count": { "type": "integer" },
                    "condition": { "type": "keyword" },
                    "features": { "type": "keyword" },
                    "attributes": { "type": "object" },
                    "images": { "type": "keyword" },
                    "main_image_url": { "type": "keyword" },
                    "additional_image_urls": { "type": "keyword" },
                    "contact_preference": { "type": "keyword" },
                    "urgency": { "type": "keyword" },
                    "neighborhood": { "type": "keyword" },
                    "latitude": { "type": "float" },
                    "longitude": { "type": "float" },
                    "geolocation": { "type": "geo_point" },
                    "tags": { "type": "keyword" },
                    "fts": { "type": "text" }
                }
            }
        }'
    
    if [ $? -eq 0 ]; then
        log "✅ Listings index oluşturuldu"
    else
        error "❌ Listings index oluşturulamadı"
    fi
    
    # Index alias oluştur
    log "🏷️ Index alias oluşturuluyor..."
    curl -X PUT "$ELASTICSEARCH_URL/_aliases" \
        -H "Content-Type: application/json" \
        -d '{
            "actions": [
                {
                    "add": {
                        "index": "listings",
                        "alias": "listings_current"
                    }
                }
            ]
        }'
    
    log "✅ Elasticsearch kurulumu tamamlandı"
}

# Redis kurulumu
setup_redis() {
    log "🧠 Redis kurulumu başlıyor..."
    
    # Redis bağlantı kontrolü
    if ! redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
        error "Redis'e bağlanılamıyor: $REDIS_URL"
    fi
    
    # Redis'i temizle
    log "🧹 Redis temizleniyor..."
    redis-cli -u "$REDIS_URL" FLUSHALL
    
    # Cache key'lerini oluştur
    log "🗝️ Cache key'leri oluşturuluyor..."
    
    # Kategori ağacı için boş cache
    redis-cli -u "$REDIS_URL" SET "categories_tree" "[]" EX 1800
    
    # Kategori sayıları için boş cache
    redis-cli -u "$REDIS_URL" SET "category_counts" "{}" EX 1800
    
    # Rate limiting için boş cache'ler
    redis-cli -u "$REDIS_URL" SET "rate_limit:global" "0" EX 900
    
    log "✅ Redis kurulumu tamamlandı"
}

# Supabase'den verileri ES'e yükle
sync_data_from_supabase() {
    log "🔄 Supabase'den veriler ES'e yükleniyor..."
    
    # Node.js script'ini çalıştır
    node scripts/sync-listings-to-es.js
    
    if [ $? -eq 0 ]; then
        log "✅ Veri senkronizasyonu tamamlandı"
    else
        error "❌ Veri senkronizasyonu başarısız"
    fi
}

# Test verileri oluştur
create_test_data() {
    log "🧪 Test verileri oluşturuluyor..."
    
    # Test ilanları oluştur
    curl -X POST "http://localhost:3002/api/v1/health/test-listings/create" \
        -H "Content-Type: application/json" \
        -d '{"count": 50, "includeImages": true}'
    
    if [ $? -eq 0 ]; then
        log "✅ Test verileri oluşturuldu"
    else
        warn "⚠️ Test verileri oluşturulamadı (backend çalışmıyor olabilir)"
    fi
}

# Health check
health_check() {
    log "🏥 Health check yapılıyor..."
    
    # ES health check
    ES_HEALTH=$(curl -s "$ELASTICSEARCH_URL/_cluster/health" | jq -r '.status')
    if [ "$ES_HEALTH" = "green" ] || [ "$ES_HEALTH" = "yellow" ]; then
        log "✅ Elasticsearch sağlıklı: $ES_HEALTH"
    else
        error "❌ Elasticsearch sağlıksız: $ES_HEALTH"
    fi
    
    # Redis health check
    if redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
        log "✅ Redis sağlıklı"
    else
        error "❌ Redis sağlıksız"
    fi
    
    # Index count check
    INDEX_COUNT=$(curl -s "$ELASTICSEARCH_URL/listings/_count" | jq -r '.count')
    log "📊 Listings index'inde $INDEX_COUNT doküman var"
}

# Ana fonksiyon
main() {
    log "🚀 Benalsam Infrastructure Setup başlıyor..."
    
    check_env
    setup_elasticsearch
    setup_redis
    sync_data_from_supabase
    create_test_data
    health_check
    
    log "🎉 Infrastructure setup tamamlandı!"
    log "📝 Sonraki adımlar:"
    log "   1. Backend'i başlat: npm run dev"
    log "   2. Frontend'i başlat: cd ../benalsam-web && npm run dev"
    log "   3. Test et: http://localhost:5173"
}

# Script'i çalıştır
main "$@"
