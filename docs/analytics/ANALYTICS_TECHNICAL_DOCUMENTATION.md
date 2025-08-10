# 🔧 Analytics Sistemi Teknik Dokümantasyonu

## 📋 **Genel Bakış**

Bu dokümantasyon, Benalsam Analytics sisteminin teknik implementasyonunu ve API kullanımını açıklar.

---

## 🏗️ **Sistem Mimarisi**

### **Teknoloji Stack:**
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: Elasticsearch
- **Monitoring**: Custom Analytics Services
- **Frontend**: React + TypeScript
- **Deployment**: PM2 + Docker

### **Servis Yapısı:**
```
📁 packages/admin-backend/src/
├── 📁 services/
│   ├── 📄 performanceMonitoringService.ts
│   ├── 📄 userJourneyService.ts
│   └── 📄 analyticsAlertsService.ts
├── 📁 routes/
│   ├── 📄 performance.ts
│   ├── 📄 userJourney.ts
│   └── 📄 analyticsAlerts.ts
└── 📁 middleware/
    └── 📄 performanceMonitoring.ts
```

---

## 🔧 **Phase 1: Performance Monitoring**

### **API Endpoints:**

#### **1. Performance Dashboard**
```http
GET /api/v1/performance/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "system": {
      "cpu_usage": 24.85,
      "memory_usage": 99.86,
      "uptime": 746007,
      "load_average": [3.14, 7.06, 8.78]
    },
    "elasticsearch": {
      "cluster_health": "green",
      "query_response_time": 306.39,
      "document_count": 1250,
      "index_count": 15
    },
    "api": {
      "avg_response_time": 150,
      "total_requests": 12500,
      "error_rate": 0.5
    },
    "alerts": {
      "active_count": 2,
      "critical_count": 1,
      "warning_count": 1
    }
  }
}
```

#### **2. System Metrics**
```http
GET /api/v1/performance/system
Authorization: Bearer <token>
```

#### **3. Elasticsearch Metrics**
```http
GET /api/v1/performance/elasticsearch
Authorization: Bearer <token>
```

#### **4. API Metrics**
```http
GET /api/v1/performance/api
Authorization: Bearer <token>
```

#### **5. Performance Alerts**
```http
GET /api/v1/performance/alerts
Authorization: Bearer <token>
```

#### **6. Check Alerts**
```http
POST /api/v1/performance/alerts/check
Authorization: Bearer <token>
```

---

## 🛤️ **Phase 2: User Journey Tracking**

### **API Endpoints:**

#### **1. Initialize User Journey**
```http
POST /api/v1/user-journey/initialize
Authorization: Bearer <token>
```

#### **2. Track Journey Event**
```http
POST /api/v1/user-journey/track-event
Content-Type: application/json

{
  "user_id": "user_123",
  "session_id": "session_456",
  "event_type": "page_view",
  "event_data": {
    "page_name": "Home",
    "time_spent": 30,
    "scroll_depth": 75
  },
  "device_info": {
    "platform": "web",
    "version": "1.0.0"
  },
  "user_profile": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### **3. Journey Analysis**
```http
GET /api/v1/user-journey/analysis?days=7
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_journeys": 1250,
    "conversion_rate": 25.5,
    "average_duration": 180,
    "drop_off_points": [
      {
        "page_name": "Search",
        "drop_off_count": 375,
        "drop_off_rate": 30.0,
        "common_reasons": ["No results", "Slow loading"]
      }
    ],
    "popular_paths": [
      {
        "path": ["Home", "Search", "Listing", "Contact"],
        "frequency": 375,
        "conversion_rate": 25.0,
        "average_duration": 180
      }
    ],
    "user_segments": [
      {
        "segment_name": "New Users",
        "user_count": 500,
        "conversion_rate": 15.0,
        "average_engagement": 65
      }
    ]
  }
}
```

#### **4. Journey Optimization**
```http
GET /api/v1/user-journey/optimization?days=7
Authorization: Bearer <token>
```

#### **5. User Journey Dashboard**
```http
GET /api/v1/user-journey/dashboard?days=7
Authorization: Bearer <token>
```

---

## 🚨 **Phase 3: Analytics Alerts**

### **API Endpoints:**

#### **1. Initialize Analytics Alerts**
```http
POST /api/v1/analytics-alerts/initialize
Authorization: Bearer <token>
```

#### **2. Create Alert Rule**
```http
POST /api/v1/analytics-alerts/rules
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "High Memory Usage",
  "description": "Alert when memory usage exceeds 85%",
  "metric_type": "system",
  "metric_name": "memory_usage",
  "condition": "gt",
  "threshold": 85,
  "severity": "critical",
  "enabled": true,
  "notification_channels": ["channel_123"],
  "cooldown_minutes": 5
}
```

#### **3. Get Alert Rules**
```http
GET /api/v1/analytics-alerts/rules
Authorization: Bearer <token>
```

#### **4. Create Notification Channel**
```http
POST /api/v1/analytics-alerts/channels
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Admin Email",
  "type": "email",
  "config": {
    "email": {
      "to": ["admin@benalsam.com"],
      "from": "alerts@benalsam.com",
      "subject_template": "[ALERT] {severity} - {rule_name}"
    }
  },
  "enabled": true
}
```

#### **5. Get Notification Channels**
```http
GET /api/v1/analytics-alerts/channels
Authorization: Bearer <token>
```

#### **6. Check Alerts**
```http
POST /api/v1/analytics-alerts/check
Authorization: Bearer <token>
Content-Type: application/json

{
  "metrics": {
    "memory_usage": 99.5,
    "cpu_usage": 25.3,
    "api_response_time": 150
  }
}
```

#### **7. Get Alert Summary**
```http
GET /api/v1/analytics-alerts/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_alerts": 5,
    "active_alerts": 2,
    "resolved_alerts": 2,
    "acknowledged_alerts": 1,
    "alerts_by_severity": {
      "critical": 1,
      "high": 1,
      "medium": 2,
      "low": 1
    },
    "alerts_by_type": {
      "system": 3,
      "api": 1,
      "elasticsearch": 0,
      "business": 1,
      "user_journey": 0
    },
    "recent_alerts": [
      {
        "id": "alert_123",
        "rule_name": "High Memory Usage",
        "severity": "critical",
        "message": "Memory usage exceeded threshold",
        "status": "active",
        "triggered_at": "2025-07-29T10:10:41.361Z"
      }
    ]
  }
}
```

---

## 📊 **Elasticsearch Index Yapıları**

### **1. Performance Metrics Index**
```json
{
  "index": "performance_metrics",
  "mappings": {
    "properties": {
      "timestamp": { "type": "date" },
      "metric_type": { "type": "keyword" },
      "metric_name": { "type": "keyword" },
      "value": { "type": "float" },
      "unit": { "type": "keyword" },
      "tags": { "type": "object", "dynamic": true },
      "metadata": { "type": "object", "dynamic": true }
    }
  }
}
```

### **2. User Journeys Index**
```json
{
  "index": "user_journeys",
  "mappings": {
    "properties": {
      "journey_id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "session_id": { "type": "keyword" },
      "start_time": { "type": "date" },
      "end_time": { "type": "date" },
      "duration": { "type": "long" },
      "conversion_achieved": { "type": "boolean" },
      "engagement_score": { "type": "float" },
      "path_efficiency": { "type": "float" },
      "events": {
        "type": "nested",
        "properties": {
          "event_type": { "type": "keyword" },
          "timestamp": { "type": "date" },
          "page_name": { "type": "keyword" },
          "time_spent": { "type": "long" },
          "scroll_depth": { "type": "float" }
        }
      }
    }
  }
}
```

### **3. Analytics Alerts Index**
```json
{
  "index": "analytics_alerts",
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "rule_id": { "type": "keyword" },
      "rule_name": { "type": "text" },
      "severity": { "type": "keyword" },
      "metric_type": { "type": "keyword" },
      "metric_name": { "type": "keyword" },
      "current_value": { "type": "float" },
      "threshold_value": { "type": "float" },
      "message": { "type": "text" },
      "status": { "type": "keyword" },
      "triggered_at": { "type": "date" },
      "resolved_at": { "type": "date" },
      "acknowledged_at": { "type": "date" },
      "notification_sent": { "type": "boolean" }
    }
  }
}
```

---

## 🔧 **Middleware Kullanımı**

### **Performance Monitoring Middleware**
```typescript
import { performanceMonitoringMiddleware } from '../middleware/performanceMonitoring';

// Tüm API route'larına uygula
app.use(performanceMonitoringMiddleware);
```

### **Frontend Tracking**
```typescript
// React component'inde
useEffect(() => {
  analyticsService.trackPageView({
    page_name: 'Home',
    time_spent: 30,
    scroll_depth: 75
  });
}, []);
```

---

## 🚀 **Deployment**

### **PM2 Configuration**
```javascript
// ecosystem.config.js
{
  name: 'admin-backend',
  script: 'pnpm',
  args: 'run dev',
  env: {
    NODE_ENV: 'development',
    ELASTICSEARCH_URL: 'http://209.227.228.96:9200',
    ELASTICSEARCH_USERNAME: '',
    ELASTICSEARCH_PASSWORD: ''
  }
}
```

### **Environment Variables**
```bash
# .env
ELASTICSEARCH_URL=http://209.227.228.96:9200
ELASTICSEARCH_USERNAME=your_username
ELASTICSEARCH_PASSWORD=your_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 📈 **Monitoring Dashboard**

### **Admin UI Integration**
```typescript
// packages/admin-ui/src/services/api.ts
export const apiService = {
  // Performance Monitoring
  async getPerformanceDashboard(): Promise<any> {
    const response = await apiClient.get('/performance/dashboard');
    return response.data.data!;
  },

  // User Journey Tracking
  async getJourneyDashboard(days: number = 7): Promise<any> {
    const response = await apiClient.get('/user-journey/dashboard', { params: { days } });
    return response.data.data!;
  },

  // Analytics Alerts
  async getAlertSummary(): Promise<any> {
    const response = await apiClient.get('/analytics-alerts/summary');
    return response.data.data!;
  }
};
```

---

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **1. Elasticsearch Connection Error**
```bash
# Check Elasticsearch status
curl -X GET "http://209.227.228.96:9200/_cluster/health"

# Check indexes
curl -X GET "http://209.227.228.96:9200/_cat/indices"
```

#### **2. Performance Issues**
```bash
# Check PM2 logs
pm2 logs admin-backend

# Check system resources
pm2 monit
```

#### **3. Alert Notifications Not Working**
```bash
# Test email configuration
curl -X POST "http://localhost:3002/api/v1/analytics-alerts/test-notification" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"channelId": "channel_123", "testAlert": {}}'
```

---

## 📞 **Support**

### **Development Team:**
- **Backend**: Backend ekibi
- **Frontend**: Frontend ekibi
- **DevOps**: DevOps ekibi

### **Useful Commands:**
```bash
# Build admin-backend
cd packages/admin-backend && pnpm build

# Restart services
pm2 restart ecosystem.config.js --only admin-backend

# Check service status
pm2 status

# View logs
pm2 logs admin-backend
```

---

*Bu dokümantasyon sürekli güncellenmektedir. Son güncelleme: 29 Temmuz 2025* 