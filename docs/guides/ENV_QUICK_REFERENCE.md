# 🔧 Environment Quick Reference

> **Hızlı Başvuru Kartı**

---

## 🚀 Quick Setup

```bash
# 1. Development setup
cp env.local.example .env

# 2. Production setup (VPS)
cp env.production.example .env.production

# 3. Validate configuration
./scripts/validate-config.sh
```

---

## 📋 Required Variables Checklist

### ✅ Core
- [ ] `NODE_ENV=development|production`
- [ ] `PORT=3002`

### ✅ Supabase
- [ ] `SUPABASE_URL=https://your-project.supabase.co`
- [ ] `SUPABASE_ANON_KEY=eyJ...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY=eyJ...`

### ✅ JWT
- [ ] `JWT_SECRET=64+ characters`
- [ ] `JWT_EXPIRES_IN=24h`

### ✅ CORS
- [ ] `CORS_ORIGIN=http://localhost:3003,http://localhost:5173`

### ✅ Services
- [ ] `REDIS_HOST=localhost`
- [ ] `ELASTICSEARCH_URL=http://localhost:9200`

### ✅ Frontend (Vite)
- [ ] `VITE_API_URL=http://localhost:3002/api/v1`
- [ ] `VITE_ELASTICSEARCH_URL=http://localhost:9200`

---

## 🔧 Common Commands

```bash
# Generate JWT secret
openssl rand -base64 64

# Check environment
env | grep -E "(NODE_ENV|PORT|SUPABASE|JWT)"

# Validate config
./scripts/validate-config.sh

# Test API
curl http://localhost:3002/health
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Missing .env | `cp env.local.example .env` |
| JWT too short | `openssl rand -base64 64` |
| CORS error | Add origin to `CORS_ORIGIN` |
| API URL malformed | Include `http://` protocol |

---

## 📞 Support

- **Documentation:** `docs/ENVIRONMENT_CONFIGURATION.md`
- **Validation:** `./scripts/validate-config.sh`
- **Examples:** `env.local.example`, `env.production.example` 