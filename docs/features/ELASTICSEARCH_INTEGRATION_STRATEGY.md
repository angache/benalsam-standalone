# Elasticsearch Entegrasyon Stratejisi - Benalsam Projesi

## 🎯 Genel Yaklaşım

### **Hibrit Sistem Mimarisi**
```
┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │  Elasticsearch  │
│   (Primary DB)  │    │  (Search Index) │
└─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│           Application Layer             │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ CRUD Ops    │  │ Search Ops      │  │
│  │ (Supabase)  │  │ (Elasticsearch) │  │
│  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
```

**Temel Prensipler:**
- **Supabase**: Ana veritabanı (CRUD işlemleri)
- **Elasticsearch**: Sadece arama ve analitik
- **Senkronizasyon**: Real-time, otomatik
- **Fallback**: Elasticsearch down olduğunda Supabase'e dönüş

## 🔄 Veri Akış Süreci

### 1. İlan Oluşturma Süreci
```
Kullanıcı İlan Oluşturur
         │
         ▼
┌─────────────────┐
│  Supabase'e     │ ← Ana veri kaydı
│  Kaydet         │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Trigger        │ ← Otomatik tetikleme
│  Tetiklenir     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Message Queue  │ ← Asenkron işlem
│  (Redis/Rabbit) │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Indexer        │ ← Elasticsearch'e ekle
│  Service        │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Elasticsearch  │ ← Arama için hazır
│  Index          │
└─────────────────┘
```

### 2. İlan Güncelleme Süreci
```
Kullanıcı İlanı Günceller
         │
         ▼
┌─────────────────┐
│  Supabase'de    │ ← Ana veri güncelleme
│  Güncelle       │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Trigger        │ ← Otomatik tetikleme
│  Tetiklenir     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Message Queue  │ ← Asenkron işlem
│  (Redis/Rabbit) │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Indexer        │ ← Elasticsearch'te güncelle
│  Service        │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Elasticsearch  │ ← Güncel veri
│  Index          │
└─────────────────┘
```

### 3. İlan Silme/Deaktif Etme Süreci
```
Kullanıcı İlanı Deaktif Eder
         │
         ▼
┌─────────────────┐
│  Supabase'de    │ ← Status = 'inactive'
│  Status Güncelle│
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Trigger        │ ← Otomatik tetikleme
│  Tetiklenir     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Message Queue  │ ← Asenkron işlem
│  (Redis/Rabbit) │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Indexer        │ ← Elasticsearch'ten kaldır
│  Service        │   (veya status güncelle)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Elasticsearch  │ ← Arama sonuçlarından çıkar
│  Index          │
└─────────────────┘
```

## 🏗️ Teknik Implementasyon

### 1. PostgreSQL Triggers
```sql
-- Trigger function for Elasticsearch sync
CREATE OR REPLACE FUNCTION sync_to_elasticsearch()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  -- Build payload based on operation type
  CASE TG_OP
    WHEN 'INSERT' THEN
      payload := jsonb_build_object(
        'operation', 'INSERT',
        'table', TG_TABLE_NAME,
        'record_id', NEW.id,
        'data', to_jsonb(NEW)
      );
    WHEN 'UPDATE' THEN
      payload := jsonb_build_object(
        'operation', 'UPDATE',
        'table', TG_TABLE_NAME,
        'record_id', NEW.id,
        'old_data', to_jsonb(OLD),
        'new_data', to_jsonb(NEW)
      );
    WHEN 'DELETE' THEN
      payload := jsonb_build_object(
        'operation', 'DELETE',
        'table', TG_TABLE_NAME,
        'record_id', OLD.id,
        'data', to_jsonb(OLD)
      );
  END CASE;
  
  -- Send to message queue via pg_notify
  PERFORM pg_notify('elasticsearch_sync', payload::text);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for listings table
CREATE TRIGGER listings_elasticsearch_sync
  AFTER INSERT OR UPDATE OR DELETE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION sync_to_elasticsearch();

-- Create triggers for other relevant tables
CREATE TRIGGER profiles_elasticsearch_sync
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_to_elasticsearch();
```

### 2. Message Queue (Redis)
```typescript
// services/messageQueueService.ts
import Redis from 'ioredis';

export class MessageQueueService {
  private redis: Redis;
  private subscriber: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.subscriber = new Redis(process.env.REDIS_URL);
  }
  
  async startListening() {
    // Listen to PostgreSQL notifications
    this.subscriber.subscribe('elasticsearch_sync', (err) => {
      if (err) {
        console.error('❌ Redis subscription error:', err);
        return;
      }
      console.log('✅ Listening to elasticsearch_sync channel');
    });
    
    this.subscriber.on('message', async (channel, message) => {
      try {
        const event = JSON.parse(message);
        await this.processSyncEvent(event);
      } catch (error) {
        console.error('❌ Message processing error:', error);
      }
    });
  }
  
  private async processSyncEvent(event: any) {
    const { operation, table, record_id, data } = event;
    
    // Add to processing queue with retry mechanism
    await this.redis.lpush('elasticsearch_sync_queue', JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
      retry_count: 0
    }));
  }
  
  async processQueue() {
    while (true) {
      try {
        const message = await this.redis.brpop('elasticsearch_sync_queue', 1);
        if (message) {
          const event = JSON.parse(message[1]);
          await this.handleSyncEvent(event);
        }
      } catch (error) {
        console.error('❌ Queue processing error:', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  private async handleSyncEvent(event: any) {
    const { operation, table, record_id, data, retry_count } = event;
    
    try {
      switch (operation) {
        case 'INSERT':
        case 'UPDATE':
          await this.syncToElasticsearch(table, record_id, data);
          break;
        case 'DELETE':
          await this.deleteFromElasticsearch(table, record_id);
          break;
      }
    } catch (error) {
      console.error(`❌ Sync failed for ${operation} ${record_id}:`, error);
      
      // Retry mechanism (max 3 attempts)
      if (retry_count < 3) {
        await this.redis.lpush('elasticsearch_sync_queue', JSON.stringify({
          ...event,
          retry_count: retry_count + 1,
          timestamp: new Date().toISOString()
        }));
      } else {
        // Log failed sync for manual intervention
        await this.logFailedSync(event, error);
      }
    }
  }
  
  private async syncToElasticsearch(table: string, recordId: string, data: any) {
    const elasticsearchService = new ElasticsearchService();
    
    switch (table) {
      case 'listings':
        await elasticsearchService.indexListing(data);
        break;
      case 'profiles':
        await elasticsearchService.updateUserInListings(data);
        break;
      default:
        console.warn(`⚠️ Unknown table for sync: ${table}`);
    }
  }
  
  private async deleteFromElasticsearch(table: string, recordId: string) {
    const elasticsearchService = new ElasticsearchService();
    
    switch (table) {
      case 'listings':
        await elasticsearchService.deleteListing(recordId);
        break;
      default:
        console.warn(`⚠️ Unknown table for delete: ${table}`);
    }
  }
  
  private async logFailedSync(event: any, error: any) {
    await this.redis.lpush('failed_syncs', JSON.stringify({
      event,
      error: error.message,
      timestamp: new Date().toISOString()
    }));
  }
}
```

### 3. Elasticsearch Service
```typescript
// services/elasticsearchService.ts
import { Client } from '@elastic/elasticsearch';

export class ElasticsearchService {
  private client: Client;
  
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });
  }
  
  async indexListing(listing: any) {
    try {
      const transformedData = this.transformListingForElasticsearch(listing);
      
      await this.client.index({
        index: 'listings',
        id: listing.id,
        body: transformedData
      });
      
      console.log(`✅ Indexed listing: ${listing.id}`);
    } catch (error) {
      console.error(`❌ Failed to index listing ${listing.id}:`, error);
      throw error;
    }
  }
  
  async updateListing(listingId: string, updates: any) {
    try {
      await this.client.update({
        index: 'listings',
        id: listingId,
        body: {
          doc: this.transformListingForElasticsearch(updates)
        }
      });
      
      console.log(`✅ Updated listing: ${listingId}`);
    } catch (error) {
      console.error(`❌ Failed to update listing ${listingId}:`, error);
      throw error;
    }
  }
  
  async deleteListing(listingId: string) {
    try {
      await this.client.delete({
        index: 'listings',
        id: listingId
      });
      
      console.log(`✅ Deleted listing: ${listingId}`);
    } catch (error) {
      console.error(`❌ Failed to delete listing ${listingId}:`, error);
      throw error;
    }
  }
  
  async updateUserInListings(userData: any) {
    try {
      // Update all listings for this user
      await this.client.updateByQuery({
        index: 'listings',
        body: {
          query: {
            term: { user_id: userData.id }
          },
          script: {
            source: `
              ctx._source.user_name = params.user_name;
              ctx._source.user_avatar_url = params.user_avatar_url;
              ctx._source.user_rating = params.user_rating;
            `,
            params: {
              user_name: userData.name,
              user_avatar_url: userData.avatar_url,
              user_rating: userData.rating
            }
          }
        }
      });
      
      console.log(`✅ Updated user data in listings: ${userData.id}`);
    } catch (error) {
      console.error(`❌ Failed to update user data: ${userData.id}`, error);
      throw error;
    }
  }
  
  private transformListingForElasticsearch(listing: any) {
    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      budget: listing.budget,
      location: listing.geolocation ? {
        lat: listing.geolocation.coordinates[1],
        lon: listing.geolocation.coordinates[0]
      } : null,
      location_text: listing.location,
      urgency: listing.urgency,
      attributes: listing.attributes,
      user_id: listing.user_id,
      user_name: listing.user?.name,
      user_avatar_url: listing.user?.avatar_url,
      user_rating: listing.user?.rating,
      status: listing.status,
      created_at: listing.created_at,
      updated_at: listing.updated_at,
      expires_at: listing.expires_at,
      popularity_score: listing.popularity_score || 0,
      is_premium: listing.is_premium || false,
      is_featured: listing.is_featured || false,
      is_urgent_premium: listing.is_urgent_premium || false,
      tags: listing.tags || [],
      condition: listing.condition,
      views_count: listing.views_count || 0,
      offers_count: listing.offers_count || 0,
      favorites_count: listing.favorites_count || 0
    };
  }
}
```

### 4. Search Service (Fallback Logic)
```typescript
// services/searchService.ts
export class SearchService {
  private elasticsearchService: ElasticsearchService;
  private supabaseService: SupabaseService;
  
  constructor() {
    this.elasticsearchService = new ElasticsearchService();
    this.supabaseService = new SupabaseService();
  }
  
  async searchListings(params: SearchParams): Promise<SearchResponse> {
    try {
      // Try Elasticsearch first
      const elasticsearchResults = await this.elasticsearchService.search(params);
      
      // Log successful Elasticsearch search
      await this.logSearchMetrics('elasticsearch', params, elasticsearchResults);
      
      return elasticsearchResults;
      
    } catch (error) {
      console.warn('⚠️ Elasticsearch search failed, falling back to Supabase:', error);
      
      try {
        // Fallback to Supabase
        const supabaseResults = await this.supabaseService.search(params);
        
        // Log fallback search
        await this.logSearchMetrics('supabase_fallback', params, supabaseResults);
        
        return supabaseResults;
        
      } catch (fallbackError) {
        console.error('❌ Both Elasticsearch and Supabase search failed:', fallbackError);
        throw new Error('Search service unavailable');
      }
    }
  }
  
  private async logSearchMetrics(engine: string, params: any, results: any) {
    await fetch('/api/analytics/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine,
        query: params.query,
        filters: params.filters,
        resultCount: results.total,
        responseTime: results.responseTime,
        timestamp: new Date().toISOString()
      })
    });
  }
}
```

## 📊 Senkronizasyon Durumları

### 1. Normal Durum
```
Supabase ←→ Elasticsearch (Real-time sync)
     │              │
     ▼              ▼
  CRUD Ops      Search Ops
```

### 2. Elasticsearch Down
```
Supabase ←→ Supabase (Fallback search)
     │
     ▼
  CRUD Ops + Search Ops
```

### 3. Sync Lag Durumu
```
Supabase ←→ Queue ←→ Elasticsearch
     │              │
     ▼              ▼
  CRUD Ops      Delayed Sync
```

## 🔧 Monitoring ve Alerting

### 1. Sync Health Check
```typescript
// services/syncHealthService.ts
export class SyncHealthService {
  async checkSyncHealth() {
    const health = {
      elasticsearch: false,
      queue: false,
      lag: 0,
      failed_syncs: 0
    };
    
    try {
      // Check Elasticsearch
      const esResponse = await fetch(`${process.env.ELASTICSEARCH_URL}/_cluster/health`);
      health.elasticsearch = esResponse.ok;
      
      // Check queue length
      const queueLength = await this.redis.llen('elasticsearch_sync_queue');
      health.queue = queueLength < 1000; // Alert if queue too long
      
      // Check failed syncs
      const failedCount = await this.redis.llen('failed_syncs');
      health.failed_syncs = failedCount;
      
      // Check sync lag
      const lastSync = await this.getLastSyncTime();
      health.lag = Date.now() - lastSync;
      
      return health;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return health;
    }
  }
  
  async sendAlerts(health: any) {
    if (!health.elasticsearch) {
      await this.sendAlert('Elasticsearch is down');
    }
    
    if (!health.queue) {
      await this.sendAlert('Sync queue is too long');
    }
    
    if (health.failed_syncs > 10) {
      await this.sendAlert('Too many failed syncs');
    }
    
    if (health.lag > 300000) { // 5 minutes
      await this.sendAlert('Sync lag detected');
    }
  }
}
```

### 2. Dashboard Metrics
```typescript
// services/metricsService.ts
export class MetricsService {
  async getSyncMetrics() {
    return {
      total_synced: await this.getTotalSynced(),
      sync_rate: await this.getSyncRate(),
      error_rate: await this.getErrorRate(),
      avg_sync_time: await this.getAvgSyncTime(),
      queue_length: await this.getQueueLength()
    };
  }
  
  async getSearchMetrics() {
    return {
      elasticsearch_searches: await this.getElasticsearchSearches(),
      fallback_searches: await this.getFallbackSearches(),
      avg_response_time: await this.getAvgResponseTime(),
      search_success_rate: await this.getSearchSuccessRate()
    };
  }
}
```

## 🚀 Deployment Stratejisi

### 1. Phase 1: Parallel System
```
Week 1-2: Elasticsearch kurulumu + initial sync
Week 3: API development + testing
Week 4: Frontend integration + A/B testing
```

### 2. Phase 2: Gradual Migration
```
Week 5: 10% traffic to Elasticsearch
Week 6: 50% traffic to Elasticsearch
Week 7: 100% traffic to Elasticsearch
Week 8: Monitor and optimize
```

### 3. Phase 3: Full Migration
```
Week 9: Remove Supabase search fallback
Week 10: Optimize and monitor
```

## 📋 Checklist

### Pre-deployment
- [ ] Elasticsearch cluster kurulumu
- [ ] Redis/RabbitMQ kurulumu
- [ ] PostgreSQL triggers oluşturma
- [ ] Initial data migration
- [ ] Sync service development
- [ ] Fallback logic implementation
- [ ] Monitoring setup

### Deployment
- [ ] Elasticsearch production deployment
- [ ] Message queue production deployment
- [ ] Sync service production deployment
- [ ] API endpoints production deployment
- [ ] Frontend integration
- [ ] A/B testing setup

### Post-deployment
- [ ] Sync health monitoring
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] User feedback collection
- [ ] Optimization based on metrics

---

*Bu strateji ile Elasticsearch'i güvenli ve aşamalı olarak entegre edebilirsiniz.* 