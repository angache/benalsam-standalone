# 🚀 Benalsam Backup Service API Endpoints

**Base URL:** `http://localhost:3013/api/v1`

---

## 📊 Health Check

### `GET /health`
Servisin genel sağlık durumunu kontrol eder.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-21T09:27:35.683Z",
    "service": "backup-service",
    "version": "1.0.0",
    "uptime": 10.734117958,
    "memory": { /* ... */ },
    "environment": "development"
  }
}
```

---

## 💾 Backup Management

### `POST /backup/create`
Yeni bir backup oluşturur.

**Request Body:**
```json
{
  "description": "Test Backup",
  "tags": ["test", "demo"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "backup_1758446863262_zu55qfqsy",
    "timestamp": "2025-09-21T09:27:43.262Z",
    "size": 1024,
    "type": "full",
    "status": "completed",
    "description": "Test Backup",
    "tags": ["test", "demo"]
  },
  "message": "Backup created successfully"
}
```

### `GET /backup/list`
Tüm backup'ları listeler.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "backup_1758446863262_zu55qfqsy",
      "timestamp": "2025-09-21T09:27:43.262Z",
      "size": 1024,
      "type": "full",
      "status": "completed",
      "description": "Test Backup",
      "tags": ["test", "demo"]
    }
  ],
  "count": 1
}
```

### `GET /backup/:id`
Belirli bir backup'ın detaylarını getirir.

**Path Parameters:**
- `id`: Backup ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "backup_1758446863262_zu55qfqsy",
    "timestamp": "2025-09-21T09:27:43.262Z",
    "size": 1024,
    "type": "full",
    "status": "completed",
    "description": "Test Backup",
    "tags": ["test", "demo"]
  }
}
```

### `POST /backup/:id/restore`
Backup'ı geri yükler.

**Path Parameters:**
- `id`: Backup ID

**Request Body:**
```json
{
  "dryRun": false,
  "includeEdgeFunctions": true,
  "includeMigrations": true,
  "backupBeforeRestore": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Backup restored successfully"
}
```

### `DELETE /backup/:id`
Backup'ı siler.

**Path Parameters:**
- `id`: Backup ID

**Response:**
```json
{
  "success": true,
  "message": "Backup deleted successfully"
}
```

---

## ⏰ Scheduling Management

### `POST /scheduling/create`
Yeni bir backup schedule oluşturur.

**Request Body:**
```json
{
  "name": "Daily Backup",
  "description": "Daily backup schedule",
  "cronExpression": "0 2 * * *",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Daily Backup",
    "description": "Daily backup schedule",
    "cronExpression": "0 2 * * *",
    "enabled": true,
    "id": "schedule_1758446954289_nf54x50q6",
    "createdAt": "2025-09-21T09:29:14.289Z",
    "updatedAt": "2025-09-21T09:29:14.289Z"
  },
  "message": "Backup schedule created successfully"
}
```

### `GET /scheduling/list`
Tüm schedule'ları listeler.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Daily Backup",
      "description": "Daily backup schedule",
      "cronExpression": "0 2 * * *",
      "enabled": true,
      "id": "schedule_1758446954289_nf54x50q6",
      "createdAt": "2025-09-21T09:29:14.289Z",
      "updatedAt": "2025-09-21T09:29:14.289Z"
    }
  ],
  "count": 1
}
```

### `GET /scheduling/:id`
Belirli bir schedule'ın detaylarını getirir.

**Path Parameters:**
- `id`: Schedule ID

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Daily Backup",
    "description": "Daily backup schedule",
    "cronExpression": "0 2 * * *",
    "enabled": true,
    "id": "schedule_1758446954289_nf54x50q6",
    "createdAt": "2025-09-21T09:29:14.289Z",
    "updatedAt": "2025-09-21T09:29:14.289Z"
  }
}
```

### `PUT /scheduling/:id`
Schedule'ı günceller.

**Path Parameters:**
- `id`: Schedule ID

**Request Body:**
```json
{
  "name": "Updated Daily Backup",
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Updated Daily Backup",
    "description": "Daily backup schedule",
    "cronExpression": "0 2 * * *",
    "enabled": false,
    "id": "schedule_1758446954289_nf54x50q6",
    "createdAt": "2025-09-21T09:29:14.289Z",
    "updatedAt": "2025-09-21T09:29:15.123Z"
  },
  "message": "Schedule updated successfully"
}
```

### `DELETE /scheduling/:id`
Schedule'ı siler.

**Path Parameters:**
- `id`: Schedule ID

**Response:**
```json
{
  "success": true,
  "message": "Schedule deleted successfully"
}
```

### `POST /scheduling/:id/trigger`
Schedule'ı manuel olarak tetikler.

**Path Parameters:**
- `id`: Schedule ID

**Response:**
```json
{
  "success": true,
  "message": "Schedule triggered successfully"
}
```

### `GET /scheduling/:id/status`
Schedule'ın durumunu kontrol eder.

**Path Parameters:**
- `id`: Schedule ID

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "lastRun": "2025-09-21T09:30:00.000Z",
    "nextRun": "2025-09-22T02:00:00.000Z"
  }
}
```

---

## 🔧 Cron Expression Examples

- `0 2 * * *` - Her gün saat 02:00'da
- `0 */6 * * *` - Her 6 saatte bir
- `0 0 * * 0` - Her Pazar günü saat 00:00'da
- `0 0 1 * *` - Her ayın 1'inde saat 00:00'da
- `*/15 * * * *` - Her 15 dakikada bir

---

## 📝 Error Responses

Tüm endpoint'ler hata durumunda aşağıdaki formatı kullanır:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing parameters)
- `404` - Not Found
- `500` - Internal Server Error
