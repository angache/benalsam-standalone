# 🚀 QUEUE ARCHITECTURE REFACTOR - TODO LIST

## 📋 **PROJE ÖZETİ**
Mevcut queue sistemini refactor ederek daha stabil, hızlı ve maintainable hale getirme.

**Hedef:** Database polling → Direct queue creation + Transactional Outbox Pattern

---

## 🎯 **IMPLEMENTATION PLAN**

### **Phase 1: Database & Infrastructure Setup**
- [ ] **1.1** Yeni branch oluştur: `feature/queue-architecture-refactor`
- [ ] **1.2** Database outbox tablosu oluştur (`listing_status_outbox`)
- [ ] **1.3** Transactional outbox trigger function oluştur
- [ ] **1.4** DLQ (Dead Letter Queue) configuration ekle

### **Phase 2: Queue Service Refactor**
- [ ] **2.1** Queue Service'e outbox worker ekle
- [ ] **2.2** Queue Service'te tek queue endpoint oluştur (`/api/v1/queue/status-change`)
- [ ] **2.3** Message idempotency ve deduplication sistemi ekle
- [ ] **2.4** Eski database trigger bridge kaldır

### **Phase 3: Elasticsearch Service Update**
- [ ] **3.1** Elasticsearch Service'te single queue consumer implement et
- [ ] **3.2** Status-based message handling ekle
- [ ] **3.3** Error handling ve retry logic güncelle

### **Phase 4: Cleanup & Testing**
- [ ] **4.1** Eski database trigger ve queue service polling kaldır
- [ ] **4.2** `elasticsearch_sync_queue` tablosunu kaldır
- [ ] **4.3** Test ve validation yap
- [ ] **4.4** Performance karşılaştırması yap

---

## 📊 **DETAYLI TASK LIST**

### **1. Database Setup**
```sql
-- Outbox tablosu
CREATE TABLE listing_status_outbox (
  id SERIAL PRIMARY KEY,
  listing_id UUID NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  operation VARCHAR(50) NOT NULL,
  change_data JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Trigger function
CREATE OR REPLACE FUNCTION trigger_listing_status_outbox()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO listing_status_outbox (
    listing_id, old_status, new_status, operation, change_data
  ) VALUES (
    NEW.id, OLD.status, NEW.status, TG_OP,
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### **2. Queue Service Changes**
```typescript
// Yeni endpoint
POST /api/v1/queue/status-change
{
  "listingId": "uuid",
  "status": "active",
  "operation": "STATUS_CHANGE",
  "changeData": {...}
}

// Outbox worker
class OutboxWorker {
  async processOutboxEvents(): Promise<void> {
    // Pending events'leri al ve RabbitMQ'ya publish et
  }
}
```

### **3. Elasticsearch Service Changes**
```typescript
// Single queue consumer
const queueName = 'listing.status.changes';

// Message handling
private async handleStatusMessage(msg: ConsumeMessage): Promise<void> {
  const message = JSON.parse(msg.content.toString());
  
  // Idempotency check
  if (await this.isMessageProcessed(message.messageId)) {
    return;
  }
  
  // Process based on status
  await this.processStatusChange(message);
}
```

---

## 🎯 **EXPECTED BENEFITS**

| Metrik | Mevcut | Yeni | İyileştirme |
|--------|--------|------|-------------|
| **Latency** | 5-10 saniye | 100-200ms | %95+ |
| **Database Load** | Yüksek | Düşük | %80+ |
| **Queue Count** | 7+ queue | 1 queue | %85+ |
| **Reliability** | Orta | Yüksek | %40+ |
| **Maintenance** | Yüksek | Düşük | %60+ |

---

## 🚨 **CRITICAL CONSIDERATIONS**

### **1. Queue Patlaması Önlendi**
- ❌ Her status için ayrı queue
- ✅ Tek queue, mesaj body'de status

### **2. Idempotency Sağlandı**
- ✅ Message ID deduplication
- ✅ Version control

### **3. Transactional Consistency**
- ✅ Outbox pattern
- ✅ Atomic operations

### **4. Dead Letter Queue**
- ✅ DLQ configuration
- ✅ Retry mechanism

---

## 📝 **NOTES**

- **Branch:** `feature/queue-architecture-refactor`
- **Priority:** High
- **Estimated Time:** 2-3 days
- **Risk Level:** Medium (parallel implementation)

---

## ✅ **COMPLETION CHECKLIST**

- [ ] All database migrations applied
- [ ] Queue Service refactored
- [ ] Elasticsearch Service updated
- [ ] Old system removed
- [ ] Tests passing
- [ ] Performance validated
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] Production deployment ready

---

**Created:** 27 Eylül 2025  
**Status:** Ready to Start  
**Assignee:** Development Team
