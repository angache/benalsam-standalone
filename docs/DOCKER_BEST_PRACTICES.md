# 🐳 Docker Best Practices - Benalsam Monorepo

## 📋 **Genel Bakış**

Bu doküman, Benalsam monorepo projesinde uygulanan Docker best practices'lerini açıklar.

---

## 🏗️ **Dockerfile Best Practices**

### **1. Multi-Stage Builds**
```dockerfile
# ✅ Good: Multi-stage build
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM node:20-alpine AS production
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

### **2. Layer Caching Optimization**
```dockerfile
# ✅ Good: Optimized layer caching
# Copy package files first (cache layer)
COPY package.json pnpm-lock.yaml ./
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile

# Copy source code (changes frequently)
COPY . .
```

### **3. Non-Root User**
```dockerfile
# ✅ Good: Non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001
USER appuser
```

### **4. Health Checks**
```dockerfile
# ✅ Good: Health check implementation
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1
```

---

## 🔒 **Security Best Practices**

### **1. Base Image Security**
```dockerfile
# ✅ Good: Use specific version tags
FROM node:20-alpine

# ❌ Bad: Use latest tag
FROM node:latest
```

### **2. Dependency Scanning**
```dockerfile
# ✅ Good: Security scanning stage
FROM aquasec/trivy:latest AS security-scan
COPY --from=builder /app/dist /app/dist
RUN trivy filesystem /app/dist --exit-code 1 --severity HIGH,CRITICAL
```

### **3. Environment Variables**
```dockerfile
# ✅ Good: Use ARG for build-time variables
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# ❌ Bad: Hardcode sensitive data
ENV JWT_SECRET=my-secret-key
```

### **4. Minimal Production Images**
```dockerfile
# ✅ Good: Use minimal base image
FROM node:20-alpine AS production

# ❌ Bad: Use full OS image
FROM ubuntu:latest AS production
```

---

## 📦 **Docker Compose Best Practices**

### **1. Resource Limits**
```yaml
# ✅ Good: Set resource limits
services:
  admin-backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### **2. Health Checks**
```yaml
# ✅ Good: Health check configuration
services:
  admin-backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### **3. Service Dependencies**
```yaml
# ✅ Good: Proper service dependencies
services:
  admin-ui:
    depends_on:
      admin-backend:
        condition: service_healthy
```

### **4. Volume Management**
```yaml
# ✅ Good: Named volumes for persistence
services:
  redis:
    volumes:
      - redis_data:/data

volumes:
  redis_data:
    driver: local
```

---

## 🚀 **Performance Best Practices**

### **1. Build Cache Optimization**
```yaml
# ✅ Good: Use build cache
services:
  admin-backend:
    build:
      cache_from:
        - benalsam/admin-backend:latest
      args:
        BUILDKIT_INLINE_CACHE: 1
```

### **2. Image Size Optimization**
```dockerfile
# ✅ Good: Multi-stage build for smaller images
FROM node:20-alpine AS production
# Only copy necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
```

### **3. Dependency Caching**
```dockerfile
# ✅ Good: Cache dependencies separately
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile
```

### **4. Build Context Optimization**
```dockerfile
# ✅ Good: Use .dockerignore
# .dockerignore
node_modules
.git
.env
*.log
```

---

## 🔧 **Development Best Practices**

### **1. Hot Reload Configuration**
```yaml
# ✅ Good: Volume mounts for development
services:
  admin-backend:
    volumes:
      - ./packages/admin-backend/src:/app/packages/admin-backend/src
      - ./packages/shared-types/src:/app/packages/shared-types/src
```

### **2. Environment Separation**
```yaml
# ✅ Good: Separate compose files
# docker-compose.dev.yml for development
# docker-compose.prod.yml for production
```

### **3. Development Tools**
```yaml
# ✅ Good: Include development tools
services:
  admin-backend:
    environment:
      - NODE_ENV=development
      - DEBUG=*
```

---

## 📊 **Monitoring Best Practices**

### **1. Logging Configuration**
```yaml
# ✅ Good: Structured logging
services:
  admin-backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### **2. Metrics Collection**
```dockerfile
# ✅ Good: Expose metrics endpoint
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/metrics || exit 1
```

### **3. Resource Monitoring**
```yaml
# ✅ Good: Resource monitoring
services:
  admin-backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

---

## 🔄 **CI/CD Best Practices**

### **1. Automated Testing**
```yaml
# ✅ Good: Test in CI/CD pipeline
- name: Run Docker tests
  run: |
    ./scripts/docker-build-test.sh
    ./scripts/docker-compose-test.sh
    ./scripts/integration-test.sh
```

### **2. Security Scanning**
```yaml
# ✅ Good: Security scanning in pipeline
- name: Security scan
  run: |
    ./scripts/security-scan.sh
```

### **3. Image Tagging**
```bash
# ✅ Good: Semantic versioning
docker tag benalsam/admin-backend:latest benalsam/admin-backend:v1.0.0
docker tag benalsam/admin-backend:latest benalsam/admin-backend:latest
```

---

## 🛡️ **Security Hardening**

### **1. Container Security**
```yaml
# ✅ Good: Security options
services:
  admin-backend:
    security_opt:
      - no-new-privileges:true
    read_only: false
    tmpfs:
      - /tmp
      - /var/tmp
```

### **2. Network Security**
```yaml
# ✅ Good: Network isolation
networks:
  benalsam-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.18.0.0/16
```

### **3. Secret Management**
```yaml
# ✅ Good: Use Docker secrets
services:
  admin-backend:
    secrets:
      - jwt_secret
      - supabase_key

secrets:
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  supabase_key:
    file: ./secrets/supabase_key.txt
```

---

## 📚 **Documentation Best Practices**

### **1. Dockerfile Comments**
```dockerfile
# ✅ Good: Clear comments
# Multi-stage Dockerfile for Admin Backend
# Development ve Production için optimize edilmiş

# Base stage - ortak dependencies
FROM node:20-alpine AS base
```

### **2. README Documentation**
```markdown
# ✅ Good: Comprehensive README
## Docker Setup

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Quick Start
```bash
./scripts/docker-dev.sh
```
```

### **3. Environment Documentation**
```bash
# ✅ Good: Environment template
# .env.example
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-jwt-secret
```

---

## 🧪 **Testing Best Practices**

### **1. Automated Testing**
```bash
# ✅ Good: Comprehensive test suite
#!/bin/bash
# Test all Docker components
./scripts/docker-build-test.sh
./scripts/docker-compose-test.sh
./scripts/integration-test.sh
```

### **2. Performance Testing**
```bash
# ✅ Good: Performance monitoring
#!/bin/bash
# Monitor build performance
./scripts/cache-performance.sh
```

### **3. Security Testing**
```bash
# ✅ Good: Security validation
#!/bin/bash
# Security scanning
./scripts/security-scan.sh
```

---

## 🔧 **Maintenance Best Practices**

### **1. Regular Updates**
```bash
# ✅ Good: Regular maintenance
# Daily
docker system prune -f

# Weekly
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml build --no-cache

# Monthly
docker system prune -a
```

### **2. Backup Strategy**
```bash
# ✅ Good: Regular backups
# Backup volumes
docker run --rm -v benalsam-monorepo_redis_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/redis-backup.tar.gz -C /data .
```

### **3. Monitoring**
```bash
# ✅ Good: Health monitoring
# Monitor service health
curl -f http://localhost:3002/health
curl -f http://localhost:3003/health
curl -f http://localhost:5173/health
```

---

## 📋 **Checklist**

### **Pre-Deployment Checklist**
- [ ] Security scan completed
- [ ] Dependencies updated
- [ ] Environment variables secured
- [ ] Health checks implemented
- [ ] Resource limits set
- [ ] Non-root user configured
- [ ] Multi-stage builds implemented
- [ ] Cache optimization applied
- [ ] Documentation updated
- [ ] Tests passing

### **Post-Deployment Checklist**
- [ ] Services healthy
- [ ] Performance acceptable
- [ ] Security validated
- [ ] Monitoring active
- [ ] Logs being collected
- [ ] Backup strategy in place
- [ ] Rollback plan ready
- [ ] Documentation current

---

## 📞 **Resources**

### **Tools**
- **Docker**: Container platform
- **Docker Compose**: Multi-container orchestration
- **Trivy**: Security scanner
- **BuildKit**: Advanced build features

### **Documentation**
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Security Best Practices](./SECURITY_BEST_PRACTICES.md)

---

**Son Güncelleme:** 2025-01-09  
**Versiyon:** 1.0.0  
**Güncelleyen:** AI Assistant  
**Onaylayan:** Development Team 