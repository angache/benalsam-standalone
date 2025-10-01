# ⚡ Quick Implementation Checklist

Yeni bir Firebase Queue sistemi eklemek için hızlı checklist.

---

## 📝 **15 Dakikalık Setup**

### **1. Firebase Path Belirle** ⏱️ 2 dakika

```
Örnek: /image-jobs/, /email-jobs/, /notification-jobs/
```

- [ ] Path adını belirle: `_________________`
- [ ] Job type belirle: `_________________`

---

### **2. Job Interface Tanımla** ⏱️ 3 dakika

```typescript
// src/types/yourJob.ts
export interface YourJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: string;
  authSecret: string;
  retryCount?: number;
  maxRetries?: number;
  
  // YOUR CUSTOM FIELDS
  customField1: string;
  customField2: number;
}
```

- [ ] Interface oluştur
- [ ] Required fields belirle
- [ ] Optional fields ekle

---

### **3. Firebase Rules Ekle** ⏱️ 2 dakika

```json
"your-path": {
  ".read": true,
  "$jobId": {
    ".write": "newData.child('authSecret').val() === 'YOUR-SECRET'",
    ".validate": "newData.hasChildren(['id', 'status', 'timestamp', 'authSecret'])"
  }
}
```

- [ ] Rules JSON'a ekle
- [ ] Firebase Console'dan publish et

---

### **4. Edge Function Oluştur** ⏱️ 5 dakika

```bash
# Klasör oluştur
mkdir -p functions/your-function-name

# Template'i kopyala
cp functions/fcm-notify/index.ts functions/your-function-name/index.ts

# Özelleştir:
# - Firebase path değiştir
# - Input fields değiştir
# - Validation logic ekle
```

- [ ] Function klasörü oluştur
- [ ] Template'i kopyala
- [ ] Özelleştir
- [ ] Deploy et: `supabase functions deploy your-function-name`

---

### **5. Listener Service Ekle** ⏱️ 3 dakika

```bash
# Template'i kopyala
cp src/services/firebaseEventListener.ts src/services/yourJobListener.ts

# Özelleştir:
# - Path değiştir
# - Job processing logic ekle
# - RabbitMQ queue name değiştir
```

- [ ] Listener dosyası oluştur
- [ ] Template'i özelleştir
- [ ] RabbitMQ queue belirle

---

### **6. Main Service'e Ekle** ⏱️ 1 dakika

```typescript
// src/index.ts
import yourJobListener from './services/yourJobListener';

server.listen(PORT, async () => {
  await yourJobListener.startListening();
});

process.on('SIGTERM', () => {
  yourJobListener.stopListening();
});
```

- [ ] Import ekle
- [ ] startListening() çağır
- [ ] stopListening() ekle

---

## 🧪 **Test Checklist** ⏱️ 5 dakika

### **1. Edge Function Test**

```bash
curl -X POST 'https://YOUR-PROJECT.supabase.co/functions/v1/your-function' \
  -H 'Authorization: Bearer YOUR-TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"field1":"value1","field2":"value2"}'
```

- [ ] ✅ Returns 200
- [ ] ✅ Job ID received
- [ ] ✅ authSecret hidden in response

### **2. Realtime Service Test**

```bash
# Service loglarını izle
tail -f logs/combined.log
```

- [ ] ✅ Job detected
- [ ] ✅ Status: pending → processing
- [ ] ✅ RabbitMQ message sent
- [ ] ✅ Status: processing → completed
- [ ] ✅ authSecret sanitized

### **3. Firebase Console Test**

Firebase Console → Realtime Database → Data

- [ ] ✅ Job created in correct path
- [ ] ✅ Status field updated
- [ ] ✅ Timestamps added
- [ ] ✅ authSecret present

### **4. RabbitMQ Test**

```bash
# RabbitMQ Management UI
http://localhost:15672

# Check queue
```

- [ ] ✅ Queue exists
- [ ] ✅ Message received
- [ ] ✅ Message format correct

---

## 📊 **Configuration Matrix**

Farklı use case'ler için hızlı referans:

| Use Case | Firebase Path | Job Type | RabbitMQ Queue | Retry |
|----------|--------------|----------|----------------|-------|
| **Image Processing** | `/image-jobs/` | `image_processing` | `image.processing` | 3x |
| **Email Sending** | `/email-jobs/` | `email_sending` | `email.send` | 5x |
| **Push Notification** | `/notification-jobs/` | `push_notification` | `notification.push` | 3x |
| **Analytics** | `/analytics-jobs/` | `analytics` | `analytics.process` | 1x |
| **Search Indexing** | `/search-jobs/` | `search_indexing` | `elasticsearch.sync` | 3x |
| **Backup** | `/backup-jobs/` | `backup` | `backup.create` | 2x |
| **Report Generation** | `/report-jobs/` | `report_generation` | `report.generate` | 3x |

---

## 🎯 **Common Patterns**

### **Pattern 1: Simple Queue**

**Use When:** Basic job processing, no special requirements

**Example:** Email sending, simple notifications

**Setup Time:** ~15 minutes

### **Pattern 2: Batch Processing**

**Use When:** Need to process multiple items together

**Example:** Bulk email, mass updates

**Setup Time:** ~30 minutes

**Extra:**
```typescript
interface BatchJob extends BaseJob {
  batchSize: number;
  items: string[];
  processedCount: number;
}
```

### **Pattern 3: Priority Queue**

**Use When:** Some jobs need higher priority

**Example:** VIP user requests, critical updates

**Setup Time:** ~45 minutes

**Extra:**
```typescript
interface PriorityJob extends BaseJob {
  priority: 'low' | 'normal' | 'high' | 'urgent';
  priorityScore: number;
}
```

### **Pattern 4: Scheduled Jobs**

**Use When:** Jobs need to run at specific time

**Example:** Scheduled reports, timed notifications

**Setup Time:** ~30 minutes

**Extra:**
```typescript
interface ScheduledJob extends BaseJob {
  scheduledAt: string;
  executeAt: string;
  timezone: string;
}
```

---

## 🚨 **Common Pitfalls**

### **❌ Pitfall 1: Forgetting authSecret Sanitization**

```typescript
// ❌ BAD
logger.info('Processing job:', jobData);  // authSecret leaked!

// ✅ GOOD
const { authSecret, ...safeData } = jobData;
logger.info('Processing job:', safeData);
```

### **❌ Pitfall 2: No Idempotency Check**

```typescript
// ❌ BAD
async processJob(jobId, jobData) {
  await sendToQueue(jobData);  // May process twice!
}

// ✅ GOOD
async processJob(jobId, jobData) {
  if (jobData.status === 'completed') return;
  await sendToQueue(jobData);
}
```

### **❌ Pitfall 3: Missing Error Handling**

```typescript
// ❌ BAD
await sendToQueue(message);  // No error handling!

// ✅ GOOD
try {
  await sendToQueue(message);
  await updateStatus('completed');
} catch (error) {
  await updateStatus('failed', { error: error.message });
  await scheduleRetry();
}
```

### **❌ Pitfall 4: Hardcoded Values**

```typescript
// ❌ BAD
const authSecret = 'my-secret-123';

// ✅ GOOD
const authSecret = Deno.env.get('FIREBASE_AUTH_SECRET');
```

---

## 📈 **Scaling Considerations**

### **Small Scale (< 1000 jobs/day)**

- ✅ Single Realtime Service instance
- ✅ Memory-based rate limiting
- ✅ Local logging
- ✅ Daily cleanup

### **Medium Scale (1000 - 10000 jobs/day)**

- ✅ Multiple Realtime Service instances
- ✅ Redis-based rate limiting
- ✅ Centralized logging (ELK stack)
- ✅ Hourly cleanup
- ✅ Monitoring & alerts

### **Large Scale (> 10000 jobs/day)**

- ✅ Auto-scaling service instances
- ✅ Redis cluster
- ✅ Distributed logging
- ✅ Real-time cleanup
- ✅ Advanced monitoring
- ✅ Load balancing
- ✅ Circuit breakers

---

## 🎓 **Learning Resources**

### **Video Tutorials** (To Be Created)
- [ ] Firebase Queue Setup (15 min)
- [ ] Edge Function Development (20 min)
- [ ] Realtime Service Configuration (25 min)
- [ ] Security Best Practices (30 min)

### **Code Examples**
- ✅ Basic Queue: `examples/basic-queue/`
- ✅ Batch Processing: `examples/batch-processing/`
- ✅ Priority Queue: `examples/priority-queue/`
- ✅ Scheduled Jobs: `examples/scheduled-jobs/`

---

## 🎯 **Quick Start Commands**

```bash
# 1. Setup new queue (run from project root)
npm run create-queue -- --name=image-processing --path=image-jobs

# 2. Generate Edge Function
npm run generate-function -- --name=process-image --queue=image-jobs

# 3. Generate Listener Service
npm run generate-listener -- --name=imageJobListener --path=image-jobs

# 4. Deploy Edge Function
cd functions/process-image && supabase functions deploy process-image

# 5. Test
curl -X POST 'https://YOUR-PROJECT.supabase.co/functions/v1/process-image' \
  -H 'Authorization: Bearer YOUR-TOKEN' \
  -d '{"imageId":"123"}'

# 6. Monitor
tail -f logs/combined.log | grep image-jobs
```

---

**🚀 Bu checklist ile yeni queue sistemleri 15 dakikada kurabilirsin!**

