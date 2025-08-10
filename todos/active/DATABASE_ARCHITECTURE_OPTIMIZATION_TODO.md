# 🗄️ **Database Architecture Optimization TODO**

## 📋 **Genel Bakış**

Bu TODO, mevcut Elasticsearch index'lerinin analizi sonucu oluşturulmuştur. Veritabanı uzmanı perspektifinden, hangi verilerin Elasticsearch'te kalması, hangilerinin Supabase'e geçirilmesi gerektiğini belirler.

**Oluşturulma Tarihi:** 2025-07-29  
**Öncelik:** Yüksek  
**Tahmini Süre:** 2-3 hafta  

---

## 🎯 **Hedefler**

### **Ana Hedefler:**
- [ ] Database architecture'ı endüstri standartlarına uygun hale getirmek
- [ ] Polyglot persistence pattern uygulamak
- [ ] Performance ve scalability optimizasyonu
- [ ] Business logic ve analytics data separation

### **Success Metrics:**
- [ ] Query performance %50 iyileşme
- [ ] Storage cost %30 azalma
- [ ] Development velocity %40 artış
- [ ] Data consistency %99.9

---

## 📊 **Mevcut Durum Analizi**

### **Elasticsearch Index'leri (14 adet):**

| Index | Docs | Status | Önerilen Aksiyon | Gerekçe |
|-------|------|--------|------------------|---------|
| `performance_metrics` | 31 | ✅ Green | **ES'te Kal** | Time-series data, real-time analytics |
| `user_behaviors` | 36 | ✅ Green | **ES'te Kal** | Behavioral analytics, complex queries |
| `load_test_results` | 3 | ⚠️ Yellow | **ES'te Kal** | Performance test data, aggregations |
| `analytics_exports` | 2 | ⚠️ Yellow | **ES'te Kal** | Export job tracking, audit trail |
| `alert_rules` | 0 | ⚠️ Yellow | **Supabase'e Geç** | Business logic, CRUD operations |
| `alerts` | 0 | ⚠️ Yellow | **Supabase'e Geç** | Alert lifecycle, user management |
| `notification_channels` | 1 | ⚠️ Yellow | **Supabase'e Geç** | User preferences, configuration |
| `analytics_alerts` | 1 | ⚠️ Yellow | **Supabase'e Geç** | Business rules, configuration |
| `performance_alerts` | 1 | ⚠️ Yellow | **Supabase'e Geç** | Alert configuration |
| `user_journey_events` | 0 | ⚠️ Yellow | **Hybrid** | Events ES, sessions Supabase |
| `user_journeys` | 2 | ⚠️ Yellow | **Supabase'e Geç** | User-centric data |
| `performance_baselines` | 0 | ⚠️ Yellow | **ES'te Kal** | Performance baseline data |
| `benalsam_listings` | 0 | ✅ Green | **ES'te Kal** | Search functionality |
| `journey_analysis` | 0 | ⚠️ Yellow | **ES'te Kal** | Analytics data |

---

## 🏗️ **Önerilen Mimari**

### **Elasticsearch (Analytics & Monitoring):**
```typescript
// Time-series & Analytics Data
const elasticsearchIndexes = [
  'performance_metrics',      // System performance data
  'user_behaviors',          // User interaction patterns
  'load_test_results',       // Performance test data
  'analytics_exports',       // Export job tracking
  'performance_baselines',   // Performance baselines
  'benalsam_listings',       // Search functionality
  'journey_analysis',        // Journey analytics
  'user_journey_events'      // High-volume event data
];
```

### **Supabase (Business Logic & User Data):**
```sql
-- Business & User Management Tables
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('performance', 'error', 'business', 'security')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  condition JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  metric TEXT,
  value NUMERIC,
  threshold NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_by UUID REFERENCES auth.users(id),
  metadata JSONB
);

CREATE TABLE notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push', 'webhook')),
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- seconds
  conversion_achieved BOOLEAN DEFAULT false,
  conversion_value NUMERIC,
  drop_off_point TEXT,
  drop_off_reason TEXT,
  engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
  path_efficiency INTEGER CHECK (path_efficiency >= 0 AND path_efficiency <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📋 **Migration Plan**

### **Phase 1: Supabase Schema Design (Week 1)**
- [ ] **Task 1.1:** Supabase migration dosyalarını oluştur
  - [ ] `alert_rules` table migration
  - [ ] `alerts` table migration
  - [ ] `notification_channels` table migration
  - [ ] `user_journeys` table migration
- [ ] **Task 1.2:** RLS (Row Level Security) policies oluştur
  - [ ] Alert rules access policies
  - [ ] Alerts access policies
  - [ ] User data access policies
- [ ] **Task 1.3:** Database triggers ve functions oluştur
  - [ ] `updated_at` trigger
  - [ ] Alert status change triggers
  - [ ] User journey calculation functions

### **Phase 2: Backend Service Migration (Week 2)**
- [ ] **Task 2.1:** Alert Service'i Supabase'e migrate et
  - [ ] `AlertService` refactor
  - [ ] Supabase client integration
  - [ ] Transaction handling
- [ ] **Task 2.2:** User Journey Service'i hybrid yap
  - [ ] Events ES'te kal
  - [ ] Sessions Supabase'e geç
  - [ ] Data sync mechanism
- [ ] **Task 2.3:** API routes güncelle
  - [ ] Alert routes Supabase integration
  - [ ] User journey routes hybrid approach
  - [ ] Error handling improvements

### **Phase 3: Frontend Integration (Week 3)**
- [ ] **Task 3.1:** Admin UI güncelle
  - [ ] Alert System Dashboard Supabase integration
  - [ ] User Journey Dashboard hybrid approach
  - [ ] Real-time updates
- [ ] **Task 3.2:** API service güncelle
  - [ ] Supabase client methods
  - [ ] Hybrid data fetching
  - [ ] Error handling
- [ ] **Task 3.3:** Testing ve validation
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] Performance tests

### **Phase 4: Data Migration ve Cleanup (Week 4)**
- [ ] **Task 4.1:** Data migration scripts
  - [ ] ES'ten Supabase'e data migration
  - [ ] Data validation scripts
  - [ ] Rollback procedures
- [ ] **Task 4.2:** Elasticsearch cleanup
  - [ ] Unused indexes sil
  - [ ] Index optimization
  - [ ] Storage cleanup
- [ ] **Task 4.3:** Performance monitoring
  - [ ] Query performance monitoring
  - [ ] Storage cost monitoring
  - [ ] Error rate monitoring

---

## 🔧 **Technical Implementation**

### **1. Supabase Migration Files**
```sql
-- migrations/001_create_alert_tables.sql
-- migrations/002_create_user_journey_tables.sql
-- migrations/003_create_notification_tables.sql
-- migrations/004_create_rls_policies.sql
-- migrations/005_create_triggers.sql
```

### **2. Backend Service Updates**
```typescript
// services/alertService.ts - Supabase integration
// services/userJourneyService.ts - Hybrid approach
// services/notificationService.ts - New service
```

### **3. API Route Updates**
```typescript
// routes/alerts.ts - Supabase integration
// routes/userJourney.ts - Hybrid approach
// routes/notifications.ts - New routes
```

### **4. Frontend Updates**
```typescript
// pages/AlertSystemPage.tsx - Supabase integration
// pages/UserJourneyPage.tsx - Hybrid approach
// services/api.ts - Updated methods
```

---

## 📊 **Success Metrics**

### **Performance Metrics:**
- [ ] Query response time < 100ms (95th percentile)
- [ ] Database connection pool utilization < 80%
- [ ] Elasticsearch cluster health = Green
- [ ] Supabase connection success rate > 99.9%

### **Cost Metrics:**
- [ ] Storage cost reduction > 30%
- [ ] Query cost optimization > 40%
- [ ] Infrastructure cost reduction > 25%

### **Development Metrics:**
- [ ] Code complexity reduction > 20%
- [ ] Bug rate reduction > 50%
- [ ] Development velocity increase > 40%

---

## 🚨 **Risk Assessment**

### **High Risk:**
- [ ] **Data Loss Risk:** Migration sırasında veri kaybı
  - **Mitigation:** Comprehensive backup strategy, rollback procedures
- [ ] **Downtime Risk:** Migration sırasında servis kesintisi
  - **Mitigation:** Blue-green deployment, gradual migration

### **Medium Risk:**
- [ ] **Performance Risk:** Yeni mimarinin performans sorunları
  - **Mitigation:** Performance testing, monitoring
- [ ] **Integration Risk:** Supabase-ES sync sorunları
  - **Mitigation:** Comprehensive testing, error handling

### **Low Risk:**
- [ ] **Learning Curve:** Yeni teknoloji öğrenme süresi
  - **Mitigation:** Documentation, training

---

## 📚 **References**

### **Endüstri Standartları:**
- **Netflix:** Microservices with polyglot persistence
- **Uber:** Real-time analytics with PostgreSQL + Elasticsearch
- **Airbnb:** Search analytics with hybrid approach

### **Technical Resources:**
- [Supabase Documentation](https://supabase.com/docs)
- [Elasticsearch Best Practices](https://www.elastic.co/guide/en/elasticsearch/reference/current/best-practices.html)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance.html)

---

## ✅ **Completion Checklist**

### **Pre-Migration:**
- [ ] Backup strategy implemented
- [ ] Rollback procedures documented
- [ ] Performance baseline established
- [ ] Team training completed

### **Migration:**
- [ ] Phase 1 completed
- [ ] Phase 2 completed
- [ ] Phase 3 completed
- [ ] Phase 4 completed

### **Post-Migration:**
- [ ] Performance validation passed
- [ ] Data integrity verified
- [ ] Monitoring alerts configured
- [ ] Documentation updated

---

**Son Güncelleme:** 2025-07-29  
**Durum:** Planlanıyor  
**Sorumlu:** Development Team 