# 🔍 VPS URL Routing Açıklaması

## Nginx Routing Mantığı

Nginx'te şu rewrite kuralı var:

```nginx
location /api/v1/categories/ {
    rewrite ^/api/v1/categories/(.*)$ /api/v1/$1 break;
    proxy_pass http://categories_service;
}
```

**Bu ne demek?**
- Request: `https://api.benalsam.com/api/v1/categories/XXX`
- Nginx rewrite: `/api/v1/categories/XXX` → `/api/v1/XXX`
- Proxy: `http://categories_service/api/v1/XXX`

## Doğru URL Yapısı

### Categories Service için:

**VPS:**
- baseURL: `https://api.benalsam.com/api/v1/categories`
- endpoint: `/categories`
- Final URL: `https://api.benalsam.com/api/v1/categories/categories`
- Nginx rewrite: `/api/v1/categories/categories` → `/api/v1/categories` ✅

**Local:**
- baseURL: `http://localhost:3015/api/v1`
- endpoint: `/categories`
- Final URL: `http://localhost:3015/api/v1/categories` ✅

---

## Sorun ve Çözüm

**Sorun:** 
- baseURL: `https://api.benalsam.com/api/v1/categories`
- endpoint: `/api/v1/categories`
- Final URL: `https://api.benalsam.com/api/v1/categories/api/v1/categories` ❌
- Nginx rewrite: `/api/v1/categories/api/v1/categories` → `/api/v1/api/v1/categories` ❌

**Çözüm:**
- baseURL: `https://api.benalsam.com/api/v1/categories`
- endpoint: `/categories` (sadece endpoint path'i, base path değil)
- Final URL: `https://api.benalsam.com/api/v1/categories/categories` ✅
- Nginx rewrite: `/api/v1/categories/categories` → `/api/v1/categories` ✅

---

## Tüm Servisler için Doğru Yapı

### Categories Service
- VPS baseURL: `https://api.benalsam.com/api/v1/categories`
- Local baseURL: `http://localhost:3015/api/v1`
- Endpoint: `/categories`, `/categories/tree`, `/categories/{id}`, etc.

### Search Service
- VPS baseURL: `https://api.benalsam.com/api/v1/search`
- Local baseURL: `http://localhost:3016/api/v1`
- Endpoint: `/search/listings`, `/search/stats`, etc.

### Upload Service
- VPS baseURL: `https://api.benalsam.com/api/v1/upload`
- Local baseURL: `http://localhost:3007/api/v1`
- Endpoint: `/upload/listings`, `/upload/images`, etc.

### Listing Service
- VPS baseURL: `https://api.benalsam.com/api/v1/listings`
- Local baseURL: `http://localhost:3008/api/v1`
- Endpoint: `/listings`, `/listings/{id}`, etc.

---

## Özet

**Kural:** baseURL zaten `/api/v1/{service}` içeriyor, endpoint path'inde sadece servis endpoint'ini kullan (base path'i tekrar etme).

