# 📚 API Documentation - Benalsam

## 📋 Genel Bakış
Bu döküman, Benalsam Admin Backend API'sinin tüm endpoint'lerini, request/response formatlarını ve kullanım örneklerini detaylandırır.

## 🔗 Base URL
```
Production: https://benalsam.com/api/v1
Development: http://localhost:3002/api/v1
```

## 🔐 Authentication

### JWT Token Format
```typescript
// Request Header
Authorization: Bearer <jwt_token>

// Token Structure
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "admin|user|moderator",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### Login Endpoint
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@benalsam.com",
  "password": "secure_password"
}

// Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "email": "admin@benalsam.com",
      "role": "admin",
      "name": "Admin User"
    }
  }
}
```

## 👥 User Management

### Get Users List
```http
GET /users?page=1&limit=20&search=john&filters[role]=user&filters[status]=active
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "email": "john@example.com",
        "name": "John Doe",
        "role": "user",
        "status": "active",
        "createdAt": "2025-01-15T10:30:00Z",
        "lastLogin": "2025-01-20T14:45:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### Get User by ID
```http
GET /users/:userId
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user",
    "status": "active",
    "profile": {
      "avatar": "https://example.com/avatar.jpg",
      "phone": "+905551234567",
      "location": "Istanbul, Turkey"
    },
    "statistics": {
      "totalListings": 5,
      "totalViews": 1250,
      "memberSince": "2024-06-15"
    },
    "createdAt": "2024-06-15T10:30:00Z",
    "updatedAt": "2025-01-20T14:45:00Z"
  }
}
```

### Update User
```http
PUT /users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "role": "moderator",
  "status": "active",
  "profile": {
    "phone": "+905551234567",
    "location": "Ankara, Turkey"
  }
}

// Response
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Updated",
    "role": "moderator",
    "status": "active",
    "updatedAt": "2025-01-20T15:00:00Z"
  }
}
```

### Delete User
```http
DELETE /users/:userId
Authorization: Bearer <token>

// Response
{
  "success": true,
  "message": "User deleted successfully"
}
```

## 🏷️ Category Management

### Get Categories
```http
GET /categories?page=1&limit=50&parentId=null&active=true
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat_123",
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic devices and gadgets",
        "icon": "📱",
        "parentId": null,
        "level": 1,
        "order": 1,
        "active": true,
        "attributes": [
          {
            "id": "attr_1",
            "name": "Brand",
            "type": "select",
            "options": ["Apple", "Samsung", "Xiaomi"]
          }
        ],
        "children": [
          {
            "id": "cat_124",
            "name": "Smartphones",
            "slug": "smartphones",
            "parentId": "cat_123",
            "level": 2
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "totalPages": 1
    }
  }
}
```

### Create Category
```http
POST /categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Category",
  "description": "Category description",
  "icon": "🏷️",
  "parentId": "cat_123",
  "order": 5,
  "active": true,
  "attributes": [
    {
      "name": "Color",
      "type": "select",
      "options": ["Red", "Blue", "Green"]
    }
  ]
}

// Response
{
  "success": true,
  "data": {
    "id": "cat_new",
    "name": "New Category",
    "slug": "new-category",
    "createdAt": "2025-01-20T15:30:00Z"
  }
}
```

### Update Category
```http
PUT /categories/:categoryId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Category",
  "description": "Updated description",
  "active": false
}

// Response
{
  "success": true,
  "data": {
    "id": "cat_123",
    "name": "Updated Category",
    "updatedAt": "2025-01-20T16:00:00Z"
  }
}
```

## 📋 Listing Management

### Get Listings
```http
GET /listings?page=1&limit=20&status=active&categoryId=cat_123&userId=user_123
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "listing_123",
        "title": "iPhone 13 Pro Max",
        "description": "Excellent condition iPhone",
        "price": 15000,
        "currency": "TRY",
        "status": "active",
        "category": {
          "id": "cat_124",
          "name": "Smartphones"
        },
        "user": {
          "id": "user_123",
          "name": "John Doe"
        },
        "images": [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg"
        ],
        "location": {
          "city": "Istanbul",
          "district": "Kadıköy"
        },
        "views": 1250,
        "favorites": 45,
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-20T14:45:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25
    }
  }
}
```

### Get Listing Details
```http
GET /listings/:listingId
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "id": "listing_123",
    "title": "iPhone 13 Pro Max",
    "description": "Excellent condition iPhone",
    "price": 15000,
    "currency": "TRY",
    "status": "active",
    "category": {
      "id": "cat_124",
      "name": "Smartphones",
      "attributes": [
        {
          "name": "Brand",
          "value": "Apple"
        },
        {
          "name": "Model",
          "value": "iPhone 13 Pro Max"
        }
      ]
    },
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+905551234567"
    },
    "images": [
      {
        "id": "img_1",
        "url": "https://example.com/image1.jpg",
        "isMain": true
      }
    ],
    "location": {
      "city": "Istanbul",
      "district": "Kadıköy",
      "neighborhood": "Fenerbahçe",
      "coordinates": {
        "lat": 40.9862,
        "lng": 29.0306
      }
    },
    "statistics": {
      "views": 1250,
      "favorites": 45,
      "shares": 12
    },
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-20T14:45:00Z"
  }
}
```

### Update Listing Status
```http
PATCH /listings/:listingId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "sold"
}

// Response
{
  "success": true,
  "data": {
    "id": "listing_123",
    "status": "sold",
    "updatedAt": "2025-01-20T16:30:00Z"
  }
}
```

## 🛡️ Admin Management

### Get Admin Users
```http
GET /admin-management/users?page=1&limit=10&search=&filters[role]=admin&filters[status]=active
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "admins": [
      {
        "id": "admin_123",
        "email": "admin@benalsam.com",
        "name": "Super Admin",
        "role": "super_admin",
        "permissions": [
          "user_management",
          "category_management",
          "listing_management",
          "system_settings"
        ],
        "lastLogin": "2025-01-20T14:45:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### Create Admin User
```http
POST /admin-management/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newadmin@benalsam.com",
  "name": "New Admin",
  "role": "admin",
  "permissions": [
    "user_management",
    "listing_management"
  ]
}

// Response
{
  "success": true,
  "data": {
    "id": "admin_new",
    "email": "newadmin@benalsam.com",
    "name": "New Admin",
    "role": "admin",
    "createdAt": "2025-01-20T17:00:00Z"
  }
}
```

## 📊 Analytics & Statistics

### Get Dashboard Statistics
```http
GET /analytics/dashboard
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 15420,
      "totalListings": 45680,
      "activeListings": 23450,
      "totalViews": 1250000,
      "totalRevenue": 450000
    },
    "recentActivity": {
      "newUsers": 125,
      "newListings": 89,
      "soldItems": 45
    },
    "charts": {
      "userGrowth": [
        { "date": "2025-01-15", "users": 15000 },
        { "date": "2025-01-16", "users": 15100 }
      ],
      "listingGrowth": [
        { "date": "2025-01-15", "listings": 45000 },
        { "date": "2025-01-16", "listings": 45200 }
      ]
    }
  }
}
```

### Get Category Statistics
```http
GET /analytics/categories/:categoryId
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "category": {
      "id": "cat_124",
      "name": "Smartphones"
    },
    "statistics": {
      "totalListings": 1250,
      "activeListings": 890,
      "totalViews": 45000,
      "averagePrice": 8500,
      "topBrands": [
        { "brand": "Apple", "count": 450 },
        { "brand": "Samsung", "count": 320 }
      ]
    }
  }
}
```

## 🔍 Search & Filter

### Search Listings
```http
GET /search/listings?q=iphone&category=smartphones&priceMin=5000&priceMax=20000&location=istanbul&sort=price_asc
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "listings": [...],
    "filters": {
      "categories": [
        { "id": "cat_124", "name": "Smartphones", "count": 1250 }
      ],
      "priceRanges": [
        { "min": 0, "max": 5000, "count": 450 },
        { "min": 5000, "max": 10000, "count": 600 }
      ],
      "locations": [
        { "city": "Istanbul", "count": 800 },
        { "city": "Ankara", "count": 200 }
      ]
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1250,
      "totalPages": 63
    }
  }
}
```

## 🚨 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common Error Codes
- `AUTHENTICATION_ERROR`: Token geçersiz veya eksik
- `AUTHORIZATION_ERROR`: Yetki yetersiz
- `VALIDATION_ERROR`: Input validation hatası
- `NOT_FOUND`: Kaynak bulunamadı
- `DUPLICATE_ENTRY`: Zaten mevcut kayıt
- `INTERNAL_ERROR`: Sunucu hatası

## 📝 Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Limits by Endpoint
- **Authentication:** 5 requests/minute
- **User Management:** 100 requests/minute
- **Listing Management:** 200 requests/minute
- **Analytics:** 50 requests/minute

## 🔄 WebSocket Events

### Connection
```javascript
// WebSocket bağlantısı
const ws = new WebSocket('wss://benalsam.com/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'jwt_token'
}));
```

### Event Types
```javascript
// Real-time notifications
{
  "type": "notification",
  "data": {
    "id": "notif_123",
    "title": "New listing",
    "message": "New iPhone listing added",
    "timestamp": "2025-01-20T17:30:00Z"
  }
}

// User activity
{
  "type": "user_activity",
  "data": {
    "userId": "user_123",
    "action": "login",
    "timestamp": "2025-01-20T17:30:00Z"
  }
}
```

## 📚 SDK Examples

### JavaScript/TypeScript
```typescript
import { BenalsamAPI } from '@benalsam/api-client';

const api = new BenalsamAPI({
  baseURL: 'https://benalsam.com/api/v1',
  token: 'your_jwt_token'
});

// Get users
const users = await api.users.list({
  page: 1,
  limit: 20,
  search: 'john'
});

// Create listing
const listing = await api.listings.create({
  title: 'iPhone 13 Pro Max',
  description: 'Excellent condition',
  price: 15000,
  categoryId: 'cat_124'
});
```

### cURL Examples
```bash
# Login
curl -X POST https://benalsam.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@benalsam.com","password":"password"}'

# Get users
curl -X GET https://benalsam.com/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create category
curl -X POST https://benalsam.com/api/v1/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Category","description":"Description"}'
```

---

**Son Güncelleme:** 22 Temmuz 2025  
**Versiyon:** 1.0  
**API Version:** v1  
**Status:** Production Ready ✅ 