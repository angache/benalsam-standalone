# 🎨 Implementation Templates

Yeni queue sistemlerini hızlıca implement etmek için copy-paste ready template'ler.

---

## 📋 **Template Index**

1. [Job Type Interface](#1-job-type-interface)
2. [Firebase Security Rules](#2-firebase-security-rules)
3. [Edge Function](#3-edge-function)
4. [Event Listener Service](#4-event-listener-service)
5. [RabbitMQ Message Format](#5-rabbitmq-message-format)
6. [Environment Variables](#6-environment-variables)
7. [API Documentation](#7-api-documentation)

---

## 1️⃣ **Job Type Interface**

### **Template:**

```typescript
// src/types/[jobType]Job.ts
export type [JobType]Status = 'pending' | 'processing' | 'completed' | 'failed';

export type [JobType]Action = 
  | 'action1' 
  | 'action2' 
  | 'action3';

export interface [JobType]Job {
  // Core fields (REQUIRED - DO NOT CHANGE)
  id: string;
  status: [JobType]Status;
  timestamp: string;
  authSecret: string;
  retryCount?: number;
  maxRetries?: number;
  
  // Timestamps (OPTIONAL)
  processedAt?: string;
  queuedAt?: string;
  completedAt?: string;
  failedAt?: string;
  
  // Error handling (OPTIONAL)
  error?: string;
  
  // Source (REQUIRED)
  source: 'supabase' | 'firebase_realtime' | 'admin' | 'system' | 'api';
  
  // YOUR CUSTOM FIELDS (ADD HERE)
  customField1: string;
  customField2: number;
  customField3?: boolean;
}
```

### **Real Examples:**

#### **Image Processing:**
```typescript
export interface ImageJob {
  id: string;
  status: JobStatus;
  timestamp: string;
  authSecret: string;
  retryCount?: number;
  maxRetries?: number;
  
  // Image-specific
  imageId: string;
  operation: 'resize' | 'compress' | 'watermark' | 'convert';
  inputUrl: string;
  outputUrl?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpg' | 'png' | 'webp';
}
```

#### **Email Sending:**
```typescript
export interface EmailJob {
  id: string;
  status: JobStatus;
  timestamp: string;
  authSecret: string;
  
  // Email-specific
  emailId: string;
  recipientEmail: string;
  recipientName?: string;
  templateId: string;
  subject: string;
  variables: Record<string, any>;
  attachments?: string[];
  scheduledAt?: string;
}
```

#### **Push Notification:**
```typescript
export interface NotificationJob {
  id: string;
  status: JobStatus;
  timestamp: string;
  authSecret: string;
  
  // Notification-specific
  notificationId: string;
  userId: string;
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high';
  badge?: number;
  sound?: string;
}
```

---

## 2️⃣ **Firebase Security Rules**

### **Template:**

```json
{
  "rules": {
    "[YOUR-PATH]": {
      ".read": true,
      "$jobId": {
        ".write": "newData.child('authSecret').val() === '[YOUR-AUTH-SECRET]'",
        ".validate": "newData.hasChildren(['id', 'status', 'timestamp', 'authSecret', 'FIELD1', 'FIELD2'])",
        
        "id": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "status": {
          ".validate": "newData.isString() && (newData.val() === 'pending' || newData.val() === 'processing' || newData.val() === 'completed' || newData.val() === 'failed')"
        },
        "timestamp": {
          ".validate": "newData.isString()"
        },
        "authSecret": {
          ".validate": "newData.isString() && newData.val() === '[YOUR-AUTH-SECRET]'"
        },
        
        "FIELD1": {
          ".validate": "newData.isString()"
        },
        "FIELD2": {
          ".validate": "newData.isNumber()"
        },
        
        "processedAt": {
          ".validate": "!newData.exists() || newData.isString()"
        },
        "completedAt": {
          ".validate": "!newData.exists() || newData.isString()"
        },
        "failedAt": {
          ".validate": "!newData.exists() || newData.isString()"
        },
        "queuedAt": {
          ".validate": "!newData.exists() || newData.isString()"
        },
        "retryCount": {
          ".validate": "!newData.exists() || newData.isNumber()"
        },
        "maxRetries": {
          ".validate": "!newData.exists() || newData.isNumber()"
        },
        "error": {
          ".validate": "!newData.exists() || newData.isString()"
        }
      }
    }
  }
}
```

---

## 3️⃣ **Edge Function**

### **Template:**

```typescript
// functions/[YOUR-FUNCTION]/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_DATABASE_URL = Deno.env.get('FIREBASE_DATABASE_URL') || 
  "https://benalsam-2025-default-rtdb.europe-west1.firebasedatabase.app";

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 100;
  const key = ip;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
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
    // 1. Authentication
    const authHeader = req.headers.get('authorization');
    const expectedToken = Deno.env.get('BEARER_SECRET');
    
    if (!authHeader || !expectedToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== expectedToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid authentication token'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    console.log("✅ Authentication successful");

    // 2. Rate Limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded'
      }), {
        status: 429,
        headers: corsHeaders
      });
    }

    // 3. Parse Input
    const { FIELD1, FIELD2, FIELD3 } = await req.json();
    
    // 4. Input Validation
    if (!FIELD1 || !FIELD2) {
      return new Response(JSON.stringify({
        success: false,
        error: 'FIELD1 and FIELD2 are required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 5. Create Job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const firebaseAuthSecret = Deno.env.get('FIREBASE_AUTH_SECRET');
    
    if (!firebaseAuthSecret) {
      throw new Error('FIREBASE_AUTH_SECRET is not set');
    }
    
    const requestBody = {
      id: jobId,
      FIELD1,
      FIELD2,
      FIELD3,
      status: 'pending',
      timestamp: new Date().toISOString(),
      source: 'api',
      authSecret: firebaseAuthSecret,
      retryCount: 0,
      maxRetries: 3
    };
    
    // 6. Write to Firebase
    const requestUrl = `${FIREBASE_DATABASE_URL}/[YOUR-PATH]/${jobId}.json`;
    
    console.log("📤 Writing to Firebase:", {
      url: requestUrl,
      jobId
    });
    
    const response = await fetch(requestUrl, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Firebase error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      throw new Error(`Firebase error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Job created:", jobId);

    // 7. Sanitize Response
    const { authSecret, ...safeResult } = result;

    return new Response(JSON.stringify({
      success: true,
      jobId,
      FIELD1,
      FIELD2,
      status: 'pending',
      result: safeResult
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
```

---

## 4️⃣ **Event Listener Service**

### **Template:**

```typescript
// src/services/[jobType]Listener.ts
import { FirebaseService } from './firebaseService';
import rabbitmqService from './rabbitmqService';
import logger from '../config/logger';

export class [JobType]Listener {
  private firebaseService: FirebaseService;
  private isListening: boolean = false;
  private cleanupFunction: (() => void) | null = null;
  private readonly FIREBASE_PATH = '[YOUR-PATH]';
  private readonly RABBITMQ_QUEUE = '[YOUR-QUEUE]';

  constructor() {
    this.firebaseService = new FirebaseService();
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      logger.warn('⚠️ [JobType] listener already running');
      return;
    }

    try {
      await rabbitmqService.connect();

      this.cleanupFunction = this.firebaseService.listenToChanges(
        this.FIREBASE_PATH,
        (data) => this.handleJobs(data)
      );

      this.isListening = true;
      logger.info(`✅ [JobType] listener started (path: ${this.FIREBASE_PATH})`);

    } catch (error) {
      logger.error('❌ Failed to start [JobType] listener:', error);
      throw error;
    }
  }

  private async handleJobs(data: any): Promise<void> {
    try {
      if (!data) return;

      Object.entries(data).forEach(async ([jobId, jobData]: [string, any]) => {
        await this.processJob(jobId, jobData);
      });

    } catch (error) {
      logger.error('❌ Error handling jobs:', error);
    }
  }

  private async processJob(jobId: string, jobData: any): Promise<void> {
    try {
      // Idempotency check
      if (jobData.status === 'completed') {
        logger.info(`⏭️ [JobType] job already completed: ${jobId}`);
        return;
      }

      if (jobData.status === 'processing') {
        logger.info(`⏭️ [JobType] job already processing: ${jobId}`);
        return;
      }

      // Sanitize authSecret
      const { authSecret, ...safeJobData } = jobData;
      
      logger.info(`📨 Processing [JobType] job: ${jobId}`, safeJobData);

      // Update to processing
      await this.updateJobStatus(jobId, 'processing', {
        processedAt: new Date().toISOString()
      });

      // Create RabbitMQ message
      const message = {
        id: jobId,
        type: '[YOUR-JOB-TYPE]',
        action: '[YOUR-ACTION]',
        timestamp: new Date().toISOString(),
        source: safeJobData.source || 'unknown',
        data: {
          // YOUR CUSTOM DATA MAPPING
          field1: safeJobData.field1,
          field2: safeJobData.field2,
        }
      };

      // Send to RabbitMQ
      await rabbitmqService.sendMessage(this.RABBITMQ_QUEUE, message);

      // Update to completed
      await this.updateJobStatus(jobId, 'completed', {
        completedAt: new Date().toISOString(),
        queuedAt: new Date().toISOString()
      });

      logger.info(`✅ [JobType] job processed: ${jobId}`);

    } catch (error) {
      logger.error(`❌ Error processing [JobType] job ${jobId}:`, error);
      
      // Update to failed
      await this.updateJobStatus(jobId, 'failed', {
        failedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: (jobData.retryCount || 0) + 1
      });
      
      // Retry logic
      const maxRetries = jobData.maxRetries || 3;
      const currentRetries = (jobData.retryCount || 0) + 1;
      
      if (currentRetries < maxRetries) {
        logger.info(`🔄 Scheduling retry ${currentRetries}/${maxRetries} for [JobType] job: ${jobId}`);
        setTimeout(async () => {
          await this.updateJobStatus(jobId, 'pending', {
            retryCount: currentRetries
          });
        }, 5000);
      } else {
        logger.error(`❌ Max retries (${maxRetries}) reached for [JobType] job: ${jobId}`);
      }
    }
  }

  private async updateJobStatus(
    jobId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    additionalData: Record<string, any> = {}
  ): Promise<void> {
    try {
      const updates = {
        status,
        ...additionalData
      };
      
      await this.firebaseService.updateJob(jobId, updates, this.FIREBASE_PATH);
      logger.info(`🔄 [JobType] job status updated: ${jobId} → ${status}`);
    } catch (error) {
      logger.error(`❌ Error updating [JobType] job status for ${jobId}:`, error);
      throw error;
    }
  }

  stopListening(): void {
    if (this.cleanupFunction) {
      this.cleanupFunction();
      this.cleanupFunction = null;
    }
    this.isListening = false;
    logger.info('🔇 [JobType] listener stopped');
  }

  isListeningToJobs(): boolean {
    return this.isListening;
  }
}

export default new [JobType]Listener();
```

---

## 5️⃣ **RabbitMQ Message Format**

### **Template:**

```typescript
interface RabbitMQMessage {
  id: string;              // Job ID
  type: string;            // Job type (e.g., 'image_processing')
  action: string;          // Specific action (e.g., 'resize')
  timestamp: string;       // ISO timestamp
  source: string;          // Source system
  priority?: number;       // Optional priority (1-10)
  data: {
    // YOUR CUSTOM DATA
    [key: string]: any;
  };
}
```

### **Examples:**

```typescript
// Image Processing
{
  id: "job_1759314795415_gz80u8rp3",
  type: "image_processing",
  action: "resize",
  timestamp: "2025-10-01T10:33:15.000Z",
  source: "api",
  data: {
    imageId: "img_123",
    inputUrl: "https://...",
    width: 800,
    height: 600,
    quality: 85
  }
}

// Email Sending
{
  id: "job_xxx",
  type: "email_sending",
  action: "send",
  timestamp: "2025-10-01T10:33:15.000Z",
  source: "api",
  priority: 8,
  data: {
    emailId: "email_123",
    recipientEmail: "user@example.com",
    templateId: "welcome-email",
    variables: {
      name: "John Doe",
      activationLink: "https://..."
    }
  }
}

// Push Notification
{
  id: "job_xxx",
  type: "push_notification",
  action: "send",
  timestamp: "2025-10-01T10:33:15.000Z",
  source: "system",
  priority: 9,
  data: {
    userId: "user_123",
    fcmToken: "fcm_token_xxx",
    title: "New Message",
    body: "You have a new message",
    data: {
      messageId: "msg_123",
      senderId: "user_456"
    }
  }
}
```

---

## 6️⃣ **Environment Variables**

### **Template:**

```bash
# =============================================================================
# [YOUR QUEUE NAME] CONFIGURATION
# =============================================================================

# Firebase Configuration
FIREBASE_DATABASE_URL=https://benalsam-2025-default-rtdb.europe-west1.firebasedatabase.app
FIREBASE_PROJECT_ID=benalsam-2025
FIREBASE_[YOUR_PATH]_PATH=[your-path]

# Edge Function Configuration
[YOUR_FUNCTION]_BEARER_SECRET=your-super-secret-bearer-token-here
[YOUR_FUNCTION]_AUTH_SECRET=your-firebase-auth-secret-here

# RabbitMQ Configuration
RABBITMQ_[YOUR_QUEUE]_NAME=[your-queue-name]
RABBITMQ_[YOUR_QUEUE]_ROUTING_KEY=[your-routing-key]

# Cleanup Configuration
[YOUR_QUEUE]_CLEANUP_ENABLED=true
[YOUR_QUEUE]_RETENTION_DAYS=7
[YOUR_QUEUE]_CLEANUP_SCHEDULE=0 2 * * *

# Retry Configuration
[YOUR_QUEUE]_MAX_RETRIES=3
[YOUR_QUEUE]_RETRY_DELAY_MS=5000
```

---

## 7️⃣ **API Documentation**

### **Template:**

```markdown
## POST /functions/v1/[your-function-name]

Create a new [job type] job in Firebase queue.

### Authentication

**Required:** Bearer token in Authorization header

```bash
Authorization: Bearer YOUR-BEARER-TOKEN
```

### Request Body

```json
{
  "field1": "string (required)",
  "field2": "number (required)",
  "field3": "boolean (optional)",
  "field4": {
    "nested": "object (optional)"
  }
}
```

### Response

**Success (200):**

```json
{
  "success": true,
  "jobId": "job_1759314795415_gz80u8rp3",
  "field1": "value1",
  "field2": 123,
  "status": "pending",
  "timestamp": "2025-10-01T10:33:15.000Z"
}
```

**Error (4xx/5xx):**

```json
{
  "success": false,
  "error": "Error message"
}
```

### Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

### Example

```bash
curl -X POST 'https://dnwreckpeenhbdtapmxr.supabase.co/functions/v1/[your-function]' \
  -H 'Authorization: Bearer YOUR-TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "field1": "value1",
    "field2": 123
  }'
```

### Rate Limits

- 100 requests per 15 minutes per IP
- Exponential backoff recommended

### Job Lifecycle

1. **Created** - Status: `pending`
2. **Processing** - Status: `processing`
3. **Completed** - Status: `completed`
4. **Failed** - Status: `failed` (with retry)

### Monitoring

Check job status in Firebase Console:
```
Firebase Console → Realtime Database → [your-path]
```
```

---

## 🎯 **Quick Copy-Paste Workflow**

### **Step 1: Copy Templates**
```bash
# 1. Job Type
cp docs/templates/job-type.template.ts src/types/yourJob.ts

# 2. Edge Function
cp -r functions/fcm-notify functions/your-function

# 3. Listener Service
cp src/services/firebaseEventListener.ts src/services/yourJobListener.ts
```

### **Step 2: Find & Replace**

Tüm template dosyalarında şunları değiştir:

```
[YOUR-PATH]         → your-actual-path
[YOUR-FUNCTION]     → your-function-name
[JobType]           → YourJobType
[YOUR-JOB-TYPE]     → your_job_type
[YOUR-QUEUE]        → your.queue.name
[YOUR-AUTH-SECRET]  → your-actual-secret
FIELD1, FIELD2      → your-actual-fields
```

### **Step 3: Customize Logic**

- Input validation rules
- RabbitMQ message format
- Error handling
- Retry strategy
- Cleanup policy

### **Step 4: Deploy & Test**

```bash
# Deploy Edge Function
supabase functions deploy your-function

# Deploy Firebase Rules
firebase deploy --only database

# Start service
npm run dev

# Test
curl -X POST 'https://YOUR-PROJECT.supabase.co/functions/v1/your-function' \
  -H 'Authorization: Bearer YOUR-TOKEN' \
  -d '{"field1":"test"}'
```

---

**🎯 Template'leri kopyala, özelleştir, deploy et - 15 dakikada hazır!**

