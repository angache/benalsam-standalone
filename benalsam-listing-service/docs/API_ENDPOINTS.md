# 📚 Benalsam Listing Service - API Endpoints

## 📋 Overview

Complete API documentation for the Benalsam Listing Service. All endpoints require authentication via `x-user-id` header unless otherwise specified.

**Base URL**: `http://localhost:3008/api/v1`

## 🔐 Authentication

Most endpoints require authentication via header:
```
x-user-id: {user-id}
```

## 📦 Listings Endpoints

### GET `/listings`
Get all listings with filters

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `category` (string, optional)
- `status` (string, optional)
- `search` (string, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

### GET `/listings/:id`
Get listing by ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "...",
    "description": "...",
    ...
  }
}
```

### POST `/listings`
Create new listing

**Body:**
```json
{
  "title": "iPhone 13 Pro Max Arıyorum",
  "description": "...",
  "category": "telefon",
  "budget": 25000,
  ...
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "...",
    "status": "pending"
  }
}
```

### PUT `/listings/:id`
Update listing

### DELETE `/listings/:id`
Delete listing

## 🤖 AI Suggestions Endpoints

### POST `/listings/ai/suggest-title`
Suggest listing titles

**Body:**
```json
{
  "category": "telefon",
  "categoryId": "...",
  "attributes": {
    "brand": "iPhone",
    "model": "13 Pro Max"
  },
  "userInput": "iPhone 13 Pro Max 256GB arıyorum",
  "currentTitle": ""
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "title": "iPhone 13 Pro Max 256GB Arıyorum",
      "score": 95,
      "reason": "Kullanıcı girdisinden çıkarılan bilgilere göre oluşturuldu"
    },
    ...
  ]
}
```

### POST `/listings/ai/suggest-description`
Suggest listing description

**Body:**
```json
{
  "category": "telefon",
  "categoryId": "...",
  "attributes": {...},
  "userInput": "...",
  "currentDescription": ""
}
```

**Response:**
```json
{
  "success": true,
  "data": "Merhaba, iPhone 13 Pro Max arıyorum. En az 256GB depolama kapasitesi olmalı..."
}
```

### POST `/listings/ai/suggest-attributes`
Suggest attributes from user input

**Body:**
```json
{
  "category": "telefon",
  "userInput": "iPhone 13 Pro Max 256GB siyah renk arıyorum"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "key": "brand",
      "value": "iPhone",
      "confidence": 0.9,
      "reason": "Metinden 'iPhone' markası tespit edildi"
    },
    ...
  ]
}
```

### POST `/listings/ai/suggest-price`
Suggest price range (deprecated - not used in UI)

### POST `/listings/ai/suggest-completion`
Suggest completion for incomplete listings

## 📚 AI Learning Admin Endpoints

### GET `/ai-learning/status`
Get AI learning system status

**Response:**
```json
{
  "success": true,
  "data": {
    "scheduler": {
      "running": true,
      "lastAnalysis": "2025-01-20T10:00:00Z",
      "nextAnalysis": "2025-01-20T16:00:00Z"
    },
    "patterns": {
      "telefon_title": 15,
      "telefon_description": 12,
      "emlak_title": 8
    },
    "cache": {
      "enabled": true,
      "ttl": "24 hours"
    }
  }
}
```

### POST `/ai-learning/trigger-analysis`
Manually trigger analysis of successful listings

**Response:**
```json
{
  "success": true,
  "message": "Analysis triggered successfully"
}
```

### POST `/ai-learning/trigger-cleanup`
Manually trigger cleanup of old patterns

**Response:**
```json
{
  "success": true,
  "message": "Cleanup triggered successfully"
}
```

### GET `/ai-learning/patterns/:category`
Get learned patterns for a category

**Path Parameters:**
- `category` (string) - Category name (e.g., "telefon", "emlak")

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "telefon",
    "titlePatterns": [
      {
        "pattern": "{brand} {model} {storage} Arıyorum",
        "score": 85,
        "usageCount": 15,
        "successRate": 86.67,
        "lastUsed": "2025-01-20T10:00:00Z"
      },
      ...
    ],
    "descriptionHints": [
      {
        "pattern": "Merhaba, {brand} {model} arıyorum.",
        "score": 80,
        "usageCount": 12,
        "successRate": 83.33,
        "lastUsed": "2025-01-20T09:00:00Z"
      },
      ...
    ],
    "lastUpdated": "2025-01-20T10:00:00Z"
  }
}
```

## 🔧 Jobs Endpoints

### GET `/jobs/:id`
Get job status

### GET `/jobs/:id/status`
Get job status (alternative)

### DELETE `/jobs/:id`
Cancel job

### GET `/jobs/metrics`
Get job processing metrics

## ❤️ Health Endpoints

### GET `/health`
Basic health check

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:00:00Z"
}
```

### GET `/health/detailed`
Detailed health check

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "rabbitmq": "healthy"
  },
  "timestamp": "2025-01-20T10:00:00Z"
}
```

## 📊 Metrics Endpoints

### GET `/metrics`
Get service metrics

## 🔗 Related Documentation

- [AI Learning System](./AI_LEARNING_SYSTEM.md) - AI learning system details
- [AI Learning Setup](./AI_LEARNING_SETUP.md) - Setup guide
- [Architecture](./ARCHITECTURE.md) - Service architecture
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

