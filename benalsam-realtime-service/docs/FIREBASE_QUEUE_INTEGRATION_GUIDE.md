# 🔥 Firebase Realtime Queue System Integration Guide

Bu guide, Firebase Realtime Database tabanlı event-driven queue sistemini diğer servislere entegre etmek için hazırlanmıştır.

---

## 📋 **İçindekiler**

1. [Sistem Mimarisi](#sistem-mimarisi)
2. [Temel Konseptler](#temel-konseptler)
3. [Entegrasyon Checklist](#entegrasyon-checklist)
4. [Adım Adım Kurulum](#adım-adım-kurulum)
5. [Örnek Use Case'ler](#örnek-use-caselar)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ **Sistem Mimarisi**

### **Genel Mimari**

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATION                          │
│              (Web App / Mobile App / Admin Panel)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    HTTP Request + Bearer Token
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE EDGE FUNCTION                        │
│                                                                 │
│  • Bearer Token Authentication                                  │
│  • Rate Limiting (100 req/15min)                               │
│  • Input Validation                                             │
│  • Initial Status: 'pending'                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    authSecret Validation
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              FIREBASE REALTIME DATABASE                         │
│                                                                 │
│  • Security Rules (authSecret validation)                       │
│  • Real-time Data Storage                                       │
│  • Job Status: pending                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Real-time Event (<1s)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  REALTIME SERVICE                               │
│                                                                 │
│  • Firebase Event Listener                                      │
│  • Job Status Updates                                           │
│  • Idempotency Check                                            │
│  • Retry Mechanism (3 attempts)                                 │
│  • authSecret Sanitization                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Job Message (sanitized)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      RABBITMQ                                   │
│                                                                 │
│  • Message Queue                                                │
│  • Routing by Job Type                                          │
│  • Consumer Services                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               WORKER SERVICES                                   │
│                                                                 │
│  • Elasticsearch Sync                                           │
│  • Image Processing                                             │
│  • Push Notifications                                           │
│  • Analytics                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💡 **Temel Konseptler**

### **1. Job Lifecycle**

Her job şu aşamalardan geçer:

```typescript
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
```

**Lifecycle Flow:**

```
pending → processing → completed
                    ↓ (on error)
                   failed → (retry) → pending
```

### **2. Idempotency**

Aynı job'un birden fazla kez işlenmesini engeller:

```typescript
if (job.status === 'completed' || job.status === 'processing') {
  skip(); // Already processed or processing
}
```

### **3. Retry Mechanism**

Başarısız job'lar otomatik olarak yeniden denir:

```typescript
maxRetries: 3        // Maksimum deneme sayısı
retryDelay: 5000     // Denemeler arası bekleme (ms)
```

### **4. Auto Cleanup**

Eski completed job'lar otomatik silinir:

```typescript
retentionPeriod: 7 days     // Saklama süresi
cleanupSchedule: '0 2 * * *' // Her gün 02:00
```

### **5. Security Layers**

```
Layer 1: Edge Function Bearer Token
Layer 2: Firebase authSecret Validation
Layer 3: Rate Limiting
Layer 4: Input Validation
Layer 5: authSecret Sanitization
```

---

## ✅ **Entegrasyon Checklist**

### **📦 Phase 1: Hazırlık**

- [ ] Use case'i tanımla (örn: image processing, email queue, etc.)
- [ ] Job type'ını belirle (`image_processing`, `email_sending`, etc.)
- [ ] Required fields'ları tanımla
- [ ] RabbitMQ queue name belirle
- [ ] Worker service planla

### **🔐 Phase 2: Güvenlik**

- [ ] Firebase project'e erişim var mı?
- [ ] Service Account credential'ları al
- [ ] Bearer token oluştur (32-byte random)
- [ ] authSecret oluştur (güçlü random string)
- [ ] Supabase secrets'ları ayarla
- [ ] Firebase Security Rules yaz

### **🔥 Phase 3: Firebase Setup**

- [ ] Firebase Realtime Database path oluştur (örn: `/image-jobs/`)
- [ ] Firebase Rules deploy et
- [ ] Test write/read operations
- [ ] Service Account test et

### **⚡ Phase 4: Edge Function**

- [ ] Edge Function klasörü oluştur (`functions/your-function-name/`)
- [ ] `index.ts` dosyası oluştur
- [ ] Authentication logic ekle
- [ ] Input validation ekle
- [ ] Rate limiting ekle
- [ ] Firebase write logic ekle
- [ ] Response sanitization ekle
- [ ] Deploy et (`supabase functions deploy your-function-name`)
- [ ] Test et (curl veya Postman)

### **🎧 Phase 5: Realtime Service**

- [ ] Job type tanımları ekle (`src/types/`)
- [ ] Firebase event listener konfigüre et
- [ ] Job processing logic yaz
- [ ] RabbitMQ integration ekle
- [ ] Status update logic ekle
- [ ] Error handling ekle
- [ ] Retry mechanism ekle
- [ ] Idempotency check ekle
- [ ] Test et

### **🧹 Phase 6: Cleanup & Monitoring**

- [ ] Cleanup scheduler konfigüre et
- [ ] Retention policy belirle (default: 7 days)
- [ ] Manual cleanup endpoint ekle
- [ ] Monitoring/logging ekle
- [ ] Health check endpoint ekle
- [ ] Alert mekanizması kur

### **🧪 Phase 7: Testing**

- [ ] Unit tests yaz
- [ ] Integration tests yaz
- [ ] Security tests yaz
- [ ] Load testing yap
- [ ] Edge case testing
- [ ] Failure scenario testing
- [ ] Retry mechanism test et

### **📚 Phase 8: Documentation**

- [ ] README güncelle
- [ ] API endpoints dokümante et
- [ ] Security policy dokümante et
- [ ] Deployment guide yaz
- [ ] Troubleshooting guide yaz

### **🚀 Phase 9: Deployment**

- [ ] Development environment test et
- [ ] Staging environment test et
- [ ] Production secrets hazırla
- [ ] Production deployment
- [ ] Monitoring aktif et
- [ ] Alert'ler aktif et

### **✅ Phase 10: Post-Deployment**

- [ ] Production test et
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] Usage analytics
- [ ] Cleanup job monitoring
- [ ] Documentation güncelle

---

## 🚀 **Adım Adım Kurulum**

### **Step 1: Yeni Queue Path Oluştur**

Firebase Console'da yeni bir path oluştur:

```
/jobs/              → Generic jobs (mevcut)
/image-jobs/        → Image processing
/email-jobs/        → Email sending
/notification-jobs/ → Push notifications
/analytics-jobs/    → Analytics processing
```

### **Step 2: Job Type Interface Tanımla**

```typescript
// src/types/imageJob.ts
export interface ImageJob {
  id: string;
  imageId: string;
  operation: 'resize' | 'compress' | 'watermark' | 'convert';
  status: JobStatus;
  timestamp: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  retryCount?: number;
  maxRetries?: number;
  error?: string;
  source: string;
  authSecret: string;
  
  // Image-specific fields
  inputUrl: string;
  outputUrl?: string;
  width?: number;
  height?: number;
  quality?: number;
}
```

### **Step 3: Firebase Rules Ekle**

```json
{
  "rules": {
    "image-jobs": {
      ".read": true,
      "$jobId": {
        ".write": "newData.child('authSecret').val() === 'your-auth-secret'",
        ".validate": "newData.hasChildren(['id', 'imageId', 'operation', 'status', 'timestamp', 'authSecret', 'inputUrl'])",
        "status": {
          ".validate": "newData.isString() && (newData.val() === 'pending' || newData.val() === 'processing' || newData.val() === 'completed' || newData.val() === 'failed')"
        },
        "operation": {
          ".validate": "newData.isString() && (newData.val() === 'resize' || newData.val() === 'compress' || newData.val() === 'watermark' || newData.val() === 'convert')"
        },
        "authSecret": {
          ".validate": "newData.isString() && newData.val() === 'your-auth-secret'"
        }
      }
    }
  }
}
```

### **Step 4: Edge Function Oluştur**

```typescript
// functions/process-image/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_DATABASE_URL = "https://your-project.firebasedatabase.app";
const rateLimitStore = new Map();

function checkRateLimit(ip: string): boolean {
  // Rate limiting logic
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 100;
  // ... implementation
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authentication
    const authHeader = req.headers.get('authorization');
    const expectedToken = Deno.env.get('BEARER_SECRET');
    
    if (!authHeader || authHeader.replace('Bearer ', '') !== expectedToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), { status: 401 });
    }

    // 2. Rate Limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded'
      }), { status: 429 });
    }

    // 3. Parse & Validate Input
    const { imageId, operation, inputUrl } = await req.json();
    
    if (!imageId || !operation || !inputUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'imageId, operation, and inputUrl are required'
      }), { status: 400 });
    }

    // 4. Create Job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const authSecret = Deno.env.get('FIREBASE_AUTH_SECRET');
    
    const jobData = {
      id: jobId,
      imageId,
      operation,
      status: 'pending',
      timestamp: new Date().toISOString(),
      source: 'api',
      authSecret,
      inputUrl,
      retryCount: 0,
      maxRetries: 3
    };

    // 5. Write to Firebase
    const response = await fetch(
      `${FIREBASE_DATABASE_URL}/image-jobs/${jobId}.json`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      }
    );

    if (!response.ok) {
      throw new Error(`Firebase write failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // 6. Sanitize Response
    const { authSecret: _, ...safeResult } = result;

    return new Response(JSON.stringify({
      success: true,
      jobId,
      ...safeResult
    }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
});
```

### **Step 5: Realtime Service Listener Ekle**

```typescript
// src/services/imageJobListener.ts
import { FirebaseService } from './firebaseService';
import rabbitmqService from './rabbitmqService';
import logger from '../config/logger';

export class ImageJobListener {
  private firebaseService: FirebaseService;
  private cleanupFunction: (() => void) | null = null;

  constructor() {
    this.firebaseService = new FirebaseService();
  }

  async startListening(): Promise<void> {
    this.cleanupFunction = this.firebaseService.listenToChanges(
      'image-jobs',
      (data) => this.handleImageJobs(data)
    );
    
    logger.info('✅ Image job listener started');
  }

  private async handleImageJobs(data: any): Promise<void> {
    if (!data) return;

    Object.entries(data).forEach(async ([jobId, jobData]: [string, any]) => {
      await this.processImageJob(jobId, jobData);
    });
  }

  private async processImageJob(jobId: string, jobData: any): Promise<void> {
    try {
      // Idempotency check
      if (jobData.status === 'completed') {
        logger.info(`⏭️ Image job already completed: ${jobId}`);
        return;
      }

      if (jobData.status === 'processing') {
        logger.info(`⏭️ Image job already processing: ${jobId}`);
        return;
      }

      // Remove authSecret
      const { authSecret, ...safeJobData } = jobData;
      
      logger.info(`📨 Processing image job: ${jobId}`, safeJobData);

      // Update status to processing
      await this.firebaseService.updateJob(jobId, {
        status: 'processing',
        processedAt: new Date().toISOString()
      }, 'image-jobs');

      // Create RabbitMQ message
      const message = {
        id: jobId,
        type: 'image_processing',
        action: jobData.operation,
        timestamp: new Date().toISOString(),
        data: {
          imageId: jobData.imageId,
          operation: jobData.operation,
          inputUrl: jobData.inputUrl,
          width: jobData.width,
          height: jobData.height,
          quality: jobData.quality
        }
      };

      // Send to RabbitMQ
      await rabbitmqService.sendMessage('image.processing', message);

      // Update status to completed
      await this.firebaseService.updateJob(jobId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        queuedAt: new Date().toISOString()
      }, 'image-jobs');

      logger.info(`✅ Image job processed: ${jobId}`);

    } catch (error) {
      logger.error(`❌ Error processing image job ${jobId}:`, error);

      // Update status to failed
      await this.firebaseService.updateJob(jobId, {
        status: 'failed',
        failedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: (jobData.retryCount || 0) + 1
      }, 'image-jobs');

      // Retry logic
      const maxRetries = jobData.maxRetries || 3;
      const currentRetries = (jobData.retryCount || 0) + 1;

      if (currentRetries < maxRetries) {
        setTimeout(async () => {
          await this.firebaseService.updateJob(jobId, {
            status: 'pending',
            retryCount: currentRetries
          }, 'image-jobs');
        }, 5000);
      }
    }
  }

  stopListening(): void {
    if (this.cleanupFunction) {
      this.cleanupFunction();
      this.cleanupFunction = null;
    }
  }
}

export default new ImageJobListener();
```

### **Step 6: FirebaseService Güncelle**

```typescript
// src/services/firebaseService.ts
async updateJob(
  jobId: string, 
  updates: Record<string, any>,
  path: string = 'jobs'  // Default: jobs, custom: image-jobs, email-jobs, etc.
): Promise<void> {
  try {
    const fullPath = `${path}/${jobId}`;
    await this.updateData(fullPath, updates);
    logger.info(`✅ Job updated: ${jobId}`, { updates, path });
  } catch (error) {
    logger.error(`❌ Job update failed: ${jobId}`, error);
    throw error;
  }
}

async deleteOldJobs(
  olderThanDays: number = 7,
  path: string = 'jobs'
): Promise<number> {
  try {
    const jobs = await this.readData(path);
    if (!jobs) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffTimestamp = cutoffDate.toISOString();

    let deletedCount = 0;

    for (const [jobId, jobData] of Object.entries(jobs)) {
      const job = jobData as any;
      
      if (job.status === 'completed' && 
          job.completedAt && 
          job.completedAt < cutoffTimestamp) {
        await this.deleteData(`${path}/${jobId}`);
        deletedCount++;
      }
    }

    logger.info(`✅ Deleted ${deletedCount} old jobs from ${path}`);
    return deletedCount;
  } catch (error) {
    logger.error(`❌ Delete old jobs failed for ${path}:`, error);
    throw error;
  }
}
```

---

## 🎯 **Örnek Use Case'ler**

### **1. Image Processing Queue**

**Use Case:** Kullanıcı resim yüklediğinde otomatik resize/compress

**Job Type:** `image_processing`

**Required Fields:**
- `imageId`: string
- `operation`: 'resize' | 'compress' | 'watermark'
- `inputUrl`: string
- `width`, `height`, `quality`: number (optional)

**RabbitMQ Queue:** `image.processing`

**Worker:** Image Processing Service

### **2. Email Queue**

**Use Case:** Bulk email gönderimi, welcome emails, notifications

**Job Type:** `email_sending`

**Required Fields:**
- `emailId`: string
- `recipientEmail`: string
- `templateId`: string
- `variables`: object

**RabbitMQ Queue:** `email.send`

**Worker:** Email Service

### **3. Push Notification Queue**

**Use Case:** Listing status değiştiğinde kullanıcıya bildirim

**Job Type:** `push_notification`

**Required Fields:**
- `userId`: string
- `title`: string
- `body`: string
- `data`: object

**RabbitMQ Queue:** `notification.push`

**Worker:** FCM Service

### **4. Analytics Queue**

**Use Case:** User event tracking, analytics data processing

**Job Type:** `analytics`

**Required Fields:**
- `eventType`: string
- `userId`: string
- `metadata`: object

**RabbitMQ Queue:** `analytics.process`

**Worker:** Analytics Service

### **5. Search Indexing Queue**

**Use Case:** Elasticsearch index güncelleme

**Job Type:** `search_indexing`

**Required Fields:**
- `listingId`: string
- `action`: 'create' | 'update' | 'delete'
- `data`: object

**RabbitMQ Queue:** `elasticsearch.sync`

**Worker:** Elasticsearch Sync Service (mevcut)

---

## 🎨 **Best Practices**

### **1. Job Design**

✅ **DO:**
- Job'ları küçük ve atomic tut
- Idempotent job logic yaz
- Retry-safe operations kullan
- Clear error messages
- Comprehensive logging

❌ **DON'T:**
- Çok büyük job'lar oluşturma (max 10MB)
- Infinite retry loops
- Synchronous blocking operations
- Hassas veri loglamak
- Silent failures

### **2. Security**

✅ **DO:**
- Her zaman Bearer token kullan
- authSecret'i sanitize et
- Rate limiting uygula
- Input validation yap
- HTTPS kullan

❌ **DON'T:**
- Hardcoded secrets
- Open endpoints
- Trust user input
- Skip validation
- Log sensitive data

### **3. Performance**

✅ **DO:**
- Batch processing kullan
- Connection pooling
- Efficient queries
- Cache results
- Monitor performance

❌ **DON'T:**
- N+1 queries
- Memory leaks
- Blocking operations
- Infinite loops
- Heavy synchronous processing

### **4. Monitoring**

✅ **DO:**
- Log all job states
- Track success/failure rates
- Monitor queue size
- Set up alerts
- Performance metrics

❌ **DON'T:**
- Silent failures
- Ignore errors
- Skip monitoring
- No alerting
- Blind deployment

---

## 🛠️ **Template Files**

### **Edge Function Template**

```typescript
// functions/YOUR-FUNCTION-NAME/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_DATABASE_URL = "YOUR_FIREBASE_URL";
const rateLimitStore = new Map();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 100;
  
  const current = rateLimitStore.get(ip);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authentication
    const authHeader = req.headers.get('authorization');
    const expectedToken = Deno.env.get('BEARER_SECRET');
    
    if (!authHeader || !expectedToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== expectedToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid authentication token'
      }), { status: 401, headers: corsHeaders });
    }

    // Rate Limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded'
      }), { status: 429, headers: corsHeaders });
    }

    // Parse Input
    const { /* YOUR FIELDS */ } = await req.json();
    
    // Input Validation
    if (!/* YOUR VALIDATION */) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Required fields missing'
      }), { status: 400, headers: corsHeaders });
    }

    // Create Job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const firebaseAuthSecret = Deno.env.get('FIREBASE_AUTH_SECRET');
    
    const requestBody = {
      id: jobId,
      /* YOUR FIELDS */,
      status: 'pending',
      timestamp: new Date().toISOString(),
      source: 'api',
      authSecret: firebaseAuthSecret,
      retryCount: 0,
      maxRetries: 3
    };

    // Write to Firebase
    const requestUrl = `${FIREBASE_DATABASE_URL}/YOUR-PATH/${jobId}.json`;
    const response = await fetch(requestUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Firebase write failed: ${response.statusText}`);
    }

    const result = await response.json();
    const { authSecret, ...safeResult } = result;

    return new Response(JSON.stringify({
      success: true,
      jobId,
      ...safeResult
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: corsHeaders });
  }
});
```

### **Listener Service Template**

```typescript
// src/services/yourJobListener.ts
import { FirebaseService } from './firebaseService';
import rabbitmqService from './rabbitmqService';
import logger from '../config/logger';

export class YourJobListener {
  private firebaseService: FirebaseService;
  private isListening: boolean = false;
  private cleanupFunction: (() => void) | null = null;

  constructor() {
    this.firebaseService = new FirebaseService();
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      logger.warn('⚠️ Job listener already running');
      return;
    }

    await rabbitmqService.connect();

    this.cleanupFunction = this.firebaseService.listenToChanges(
      'YOUR-PATH',
      (data) => this.handleJobs(data)
    );

    this.isListening = true;
    logger.info('✅ Job listener started');
  }

  private async handleJobs(data: any): Promise<void> {
    if (!data) return;

    Object.entries(data).forEach(async ([jobId, jobData]: [string, any]) => {
      await this.processJob(jobId, jobData);
    });
  }

  private async processJob(jobId: string, jobData: any): Promise<void> {
    try {
      // Idempotency check
      if (jobData.status === 'completed') {
        logger.info(`⏭️ Job already completed: ${jobId}`);
        return;
      }

      if (jobData.status === 'processing') {
        logger.info(`⏭️ Job already processing: ${jobId}`);
        return;
      }

      // Sanitize
      const { authSecret, ...safeJobData } = jobData;
      
      logger.info(`📨 Processing job: ${jobId}`, safeJobData);

      // Update to processing
      await this.firebaseService.updateJob(jobId, {
        status: 'processing',
        processedAt: new Date().toISOString()
      }, 'YOUR-PATH');

      // Create message
      const message = {
        id: jobId,
        type: 'YOUR-TYPE',
        action: 'YOUR-ACTION',
        timestamp: new Date().toISOString(),
        data: {
          /* YOUR DATA */
        }
      };

      // Send to RabbitMQ
      await rabbitmqService.sendMessage('YOUR-QUEUE', message);

      // Update to completed
      await this.firebaseService.updateJob(jobId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        queuedAt: new Date().toISOString()
      }, 'YOUR-PATH');

      logger.info(`✅ Job processed: ${jobId}`);

    } catch (error) {
      logger.error(`❌ Error processing job ${jobId}:`, error);

      // Update to failed
      await this.firebaseService.updateJob(jobId, {
        status: 'failed',
        failedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: (jobData.retryCount || 0) + 1
      }, 'YOUR-PATH');

      // Retry logic
      const maxRetries = jobData.maxRetries || 3;
      const currentRetries = (jobData.retryCount || 0) + 1;

      if (currentRetries < maxRetries) {
        logger.info(`🔄 Scheduling retry ${currentRetries}/${maxRetries}`);
        setTimeout(async () => {
          await this.firebaseService.updateJob(jobId, {
            status: 'pending',
            retryCount: currentRetries
          }, 'YOUR-PATH');
        }, 5000);
      }
    }
  }

  stopListening(): void {
    if (this.cleanupFunction) {
      this.cleanupFunction();
      this.cleanupFunction = null;
    }
    this.isListening = false;
    logger.info('🔇 Job listener stopped');
  }
}

export default new YourJobListener();
```

---

## 🧪 **Testing Checklist**

### **Functional Tests**

- [ ] Job creation successful
- [ ] Job status transitions correctly
- [ ] Idempotency works (no duplicate processing)
- [ ] Retry mechanism works
- [ ] Cleanup scheduler works
- [ ] Manual cleanup works

### **Security Tests**

- [ ] Bearer token required
- [ ] Invalid token rejected
- [ ] authSecret validation works
- [ ] Rate limiting works
- [ ] Input validation works
- [ ] authSecret sanitized in logs

### **Performance Tests**

- [ ] Real-time latency <1s
- [ ] Handle 100 concurrent jobs
- [ ] Memory usage stable
- [ ] No memory leaks
- [ ] Efficient Firebase reads/writes

### **Failure Tests**

- [ ] Firebase connection failure
- [ ] RabbitMQ connection failure
- [ ] Invalid job data
- [ ] Max retries reached
- [ ] Cleanup during processing

---

## 📞 **Support & Resources**

### **Documentation**
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [RabbitMQ](https://www.rabbitmq.com/documentation.html)

### **Internal Resources**
- `SECURITY.md` - Security best practices
- `README.md` - Service overview
- `API_ENDPOINTS.md` - API documentation

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-01  
**Maintainer**: Benalsam Platform Team

