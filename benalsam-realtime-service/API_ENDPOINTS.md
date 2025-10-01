# Realtime Service API Endpoints

## Base URL
```
Development: http://localhost:3007/api/v1
Production: https://realtime.benalsam.com/api/v1
```

## Authentication
All endpoints require authentication via `Authorization` header:
```bash
Authorization: Bearer <token>
```

## Endpoints

### Health Check
```http
GET /api/v1/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-20T10:00:00.000Z",
    "service": "realtime-service",
    "version": "1.0.0",
    "uptime": 123.456,
    "memory": {
      "rss": 12345678,
      "heapTotal": 12345678,
      "heapUsed": 12345678,
      "external": 12345678
    },
    "environment": "development"
  }
}
```

## Event Processing
*Coming soon - Event-based queue processing endpoints*

## Firebase Integration
*Coming soon - Firebase Realtime Database integration endpoints*
