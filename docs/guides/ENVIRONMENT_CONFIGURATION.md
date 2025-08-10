# 🔧 Environment Configuration Guide

> **Son Güncelleme:** 2025-01-09  
> **Versiyon:** 1.0.0

Bu dokümantasyon Benalsam projesinin environment configuration'ını açıklar.

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Environment Dosyaları](#environment-dosyaları)
3. [Required Variables](#required-variables)
4. [Configuration Examples](#configuration-examples)
5. [Validation](#validation)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Genel Bakış

Benalsam projesi 3 farklı environment kullanır:
- **Development** (localhost)
- **Production** (VPS)
- **Testing** (CI/CD)

### **Environment Types:**

| Environment | File | Purpose |
|-------------|------|---------|
| Development | `.env` | Local development |
| Production | `.env.production` | VPS deployment |
| Testing | `.env.test` | CI/CD testing |

---

## 📁 Environment Dosyaları

### **1. .env (Development)**
```bash
# Local development için
cp env.local.example .env
```

### **2. .env.production (VPS)**
```bash
# VPS deployment için
cp env.production.example .env.production
```

### **3. .env.test (Testing)**
```bash
# CI/CD testing için
cp env.test.example .env.test
```

---

## 🔑 Required Variables

### **Core Configuration**
```bash
NODE_ENV=development|production|test
PORT=3002
```

### **Database (Supabase)**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Authentication (JWT)**
```bash
JWT_SECRET=your-super-secret-jwt-key-minimum-64-characters-long
JWT_EXPIRES_IN=24h
```

### **CORS Configuration**
```bash
# Development
CORS_ORIGIN=http://localhost:3003,http://localhost:5173

# Production
CORS_ORIGIN=http://209.227.228.96:3003,http://209.227.228.96:5173,http://benalsam.com:3003,http://benalsam.com:5173
```

### **External Services**
```bash
REDIS_HOST=localhost
ELASTICSEARCH_URL=http://localhost:9200
```

### **Frontend Variables (Vite)**
```bash
# Development
VITE_API_URL=http://localhost:3002/api/v1
VITE_ELASTICSEARCH_URL=http://localhost:9200

# Production
VITE_API_URL=http://209.227.228.96:3002/api/v1
VITE_ELASTICSEARCH_URL=http://209.227.228.96:9200
```

---

## 📝 Configuration Examples

### **Development (.env)**
```bash
# Core
NODE_ENV=development
PORT=3002

# Supabase
SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-64-characters-long-for-development-only
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3003,http://localhost:5173

# Services
REDIS_HOST=localhost
ELASTICSEARCH_URL=http://localhost:9200

# Frontend
VITE_API_URL=http://localhost:3002/api/v1
VITE_ELASTICSEARCH_URL=http://localhost:9200
```

### **Production (.env.production)**
```bash
# Core
NODE_ENV=production
PORT=3002

# Supabase
SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-64-characters-long-for-production
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://209.227.228.96:3003,http://209.227.228.96:5173,http://benalsam.com:3003,http://benalsam.com:5173

# Services
REDIS_HOST=localhost
ELASTICSEARCH_URL=http://209.227.228.96:9200

# Frontend
VITE_API_URL=http://209.227.228.96:3002/api/v1
VITE_ELASTICSEARCH_URL=http://209.227.228.96:9200
```

---

## ✅ Validation

### **Validation Script Kullanımı**
```bash
# Config validation
./scripts/validate-config.sh

# Expected output:
# ✅ All validations passed! 🎉
```

### **Manual Validation**
```bash
# Check if .env exists
ls -la .env

# Check required variables
grep -E "^(NODE_ENV|PORT|SUPABASE_URL|JWT_SECRET)=" .env

# Check JWT secret length
JWT_SECRET=$(grep JWT_SECRET .env | cut -d'=' -f2)
echo "JWT_SECRET length: ${#JWT_SECRET}"
```

---

## 🔧 Troubleshooting

### **Common Issues**

#### **1. Missing .env File**
```bash
# Error: .env file not found
# Solution:
cp env.local.example .env
```

#### **2. JWT Secret Too Short**
```bash
# Error: JWT_SECRET might be too short
# Solution: Generate a longer secret
openssl rand -base64 64
```

#### **3. CORS Errors**
```bash
# Error: CORS policy blocked
# Solution: Add origin to CORS_ORIGIN
CORS_ORIGIN=http://localhost:3003,http://localhost:5173,http://your-domain.com
```

#### **4. API URL Issues**
```bash
# Error: API URL malformed
# Solution: Check VITE_API_URL format
VITE_API_URL=http://localhost:3002/api/v1  # ✅ Correct
VITE_API_URL=localhost:3002/api/v1         # ❌ Missing protocol
```

### **Debug Commands**
```bash
# Check environment variables
env | grep -E "(NODE_ENV|PORT|SUPABASE|JWT|CORS|VITE)"

# Check if services are running
curl http://localhost:3002/health
curl http://localhost:9200

# Check CORS headers
curl -H "Origin: http://localhost:3003" -v http://localhost:3002/api/v1/health
```

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Environment Variables Best Practices](https://12factor.net/config)

---

## 🔄 Update History

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-09 | 1.0.0 | Initial documentation |
| 2025-01-09 | 1.1.0 | Added validation script |
| 2025-01-09 | 1.2.0 | Added troubleshooting section | 