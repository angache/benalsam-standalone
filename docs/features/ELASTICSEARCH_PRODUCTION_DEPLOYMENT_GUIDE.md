# 🚀 Elasticsearch Production Deployment Guide

## 📋 **GENEL BAKIŞ**

Bu dokümantasyon, Benalsam Admin Panel'in Elasticsearch entegrasyonu ile production deployment sürecini detaylandırır. 7 fazdan oluşan bu süreç, development'dan production'a geçiş için gerekli tüm adımları kapsar.

### 🎯 **Hedefler**
- Production-ready Elasticsearch entegrasyonu
- Zero-downtime deployment capability
- Comprehensive monitoring ve logging
- Automated CI/CD pipeline
- Robust backup ve restore strategy

### 📊 **Teknoloji Stack**
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Database**: PostgreSQL (Supabase)
- **Search Engine**: Elasticsearch
- **Cache**: Redis
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Custom health checks + Winston logging

---

## 🏗️ **MİMARİ YAPISI**

### **Monorepo Structure**
```
benalsam-monorepo/
├── packages/
│   ├── shared-types/          # Shared TypeScript types
│   ├── admin-backend/         # Admin panel backend
│   └── admin-ui/             # Admin panel frontend
├── scripts/                  # Deployment & backup scripts
├── .github/workflows/        # CI/CD pipelines
└── docs/                    # Documentation
```

### **Service Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin UI      │    │  Admin Backend  │    │   Elasticsearch │
│   (React)       │◄──►│   (Express)     │◄──►│   (Search)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   (Supabase)    │
                       └─────────────────┘
```

---

## 📚 **FAZ 1: SHARED-TYPES ELASTICSEARCH SERVICE**

### **Amaç**
Elasticsearch işlemleri için merkezi, type-safe service oluşturmak.

### **Implementasyon**
- **File**: `packages/shared-types/src/services/elasticsearchService.ts`
- **Features**:
  - Type-safe Elasticsearch client
  - Turkish language analyzer
  - Index management (create, delete, update)
  - Document operations (index, update, delete, search)
  - Bulk operations
  - Health monitoring

### **Key Methods**
```typescript
// Connection test
await elasticsearchService.testConnection()

// Index management
await elasticsearchService.createIndex(mapping)
await elasticsearchService.deleteIndex()

// Document operations
await elasticsearchService.indexDocument(id, document)
await elasticsearchService.search(searchQuery)
await elasticsearchService.bulkIndex(documents)

// Health monitoring
await elasticsearchService.getHealth()
await elasticsearchService.getIndexStats()
```

### **Turkish Analyzer Configuration**
```json
{
  "analyzer": {
    "turkish_analyzer": {
      "type": "custom",
      "tokenizer": "standard",
      "filter": [
        "lowercase",
        "turkish_stop",
        "turkish_stemmer",
        "asciifolding"
      ]
    }
  }
}
```

---

## 🔧 **FAZ 2: ADMIN-BACKEND ELASTICSEARCH ENTEGRASYONU**

### **Amaç**
Admin backend'e Elasticsearch entegrasyonu eklemek ve admin-specific işlemleri implement etmek.

### **Implementasyon**
- **File**: `packages/admin-backend/src/services/elasticsearchService.ts`
- **Features**:
  - Admin-specific Elasticsearch operations
  - Index management for admin panel
  - Bulk operations for data migration
  - Health monitoring integration

### **Key Features**
```typescript
// Admin-specific methods
await adminElasticsearchService.clearIndex()
await adminElasticsearchService.reindexAll()
await adminElasticsearchService.getAdminStats()
```

### **Integration Points**
- Database triggers for real-time indexing
- Redis message queue for async operations
- Health check endpoints
- Monitoring dashboard

---

## 🔄 **FAZ 3: POSTGRESQL TRIGGERLARI VE REDIS MESSAGE QUEUE**

### **Amaç**
Database değişikliklerini real-time olarak Elasticsearch'e yansıtmak.

### **Implementasyon**
- **Database Triggers**: PostgreSQL trigger functions
- **Message Queue**: Redis pub/sub system
- **Async Processing**: Background job processing

### **Trigger Functions**
```sql
-- Listing insert trigger
CREATE OR REPLACE FUNCTION trigger_listing_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('elasticsearch_channel', 
    json_build_object(
      'action', 'index',
      'table', 'listings',
      'id', NEW.id
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### **Redis Message Processing**
```typescript
// Subscribe to database changes
redis.subscribe('elasticsearch_channel', (message) => {
  const { action, table, id } = JSON.parse(message)
  handleElasticsearchUpdate(action, table, id)
})
```

---

## 🎨 **FAZ 4: ADMIN UI INTEGRATION**

### **Amaç**
Admin panel'de Elasticsearch işlemlerini yönetmek için UI eklemek.

### **Implementasyon**
- **Search Interface**: Advanced search with filters
- **Index Management**: Create, delete, reindex operations
- **Health Monitoring**: Real-time status dashboard
- **Statistics**: Index stats and performance metrics

### **Key Components**
```typescript
// Search component with filters
<ElasticsearchSearch
  onSearch={handleSearch}
  filters={searchFilters}
  results={searchResults}
/>

// Index management
<IndexManagement
  onReindex={handleReindex}
  onDelete={handleDelete}
  status={indexStatus}
/>

// Health monitoring
<HealthDashboard
  elasticsearch={elasticsearchHealth}
  database={databaseHealth}
  redis={redisHealth}
/>
```

---

## 🚀 **FAZ 5: PRODUCTION DEPLOYMENT**

### **Amaç**
Production environment'da güvenli ve scalable deployment sağlamak.

### **Docker Configuration**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  admin-backend:
    build:
      context: .
      dockerfile: packages/admin-backend/Dockerfile
    environment:
      - NODE_ENV=production
      - ELASTICSEARCH_URL=http://elasticsearch:9200
    ports:
      - "3002:3002"
    depends_on:
      - elasticsearch
      - redis

  admin-ui:
    build:
      context: .
      dockerfile: packages/admin-ui/Dockerfile
    ports:
      - "3001:80"
    depends_on:
      - admin-backend

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
```

### **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/benalsam-admin
server {
    listen 80;
    server_name admin.benalsam.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.benalsam.com;
    
    ssl_certificate /etc/letsencrypt/live/admin.benalsam.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.benalsam.com/privkey.pem;
    
    # Admin UI
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Admin Backend API
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### **Environment Configuration**
```bash
# .env.production
NODE_ENV=production
ELASTICSEARCH_URL=http://elasticsearch:9200
REDIS_URL=redis://redis:6379
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

---

## 🔍 **FAZ 6: MONITORING VE OPTIMIZATION**

### **Amaç**
Production environment'da comprehensive monitoring ve optimization sağlamak.

### **Health Check Endpoints**
```typescript
// GET /api/v1/health
{
  "status": "healthy",
  "timestamp": "2025-07-19T08:54:21.070Z",
  "uptime": 10.934633714,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "elasticsearch": "healthy"
  }
}

// GET /api/v1/health/detailed
{
  "status": "healthy",
  "timestamp": "2025-07-19T08:54:37.498Z",
  "uptime": 27.352134471,
  "memory": {
    "rss": 404754432,
    "heapTotal": 337895424,
    "heapUsed": 310566328
  },
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 270,
      "details": {
        "connection": "active",
        "queryTime": "270ms"
      }
    }
  }
}
```

### **Monitoring Endpoints**
```typescript
// GET /api/v1/monitoring/metrics
{
  "timestamp": "2025-07-19T08:55:01.960Z",
  "system": {
    "uptime": 51.858902941,
    "memory": {
      "rss": 354336768,
      "heapTotal": 289763328,
      "heapUsed": 282475416
    },
    "cpu": {
      "user": 20413186,
      "system": 4255949
    }
  },
  "services": {
    "elasticsearch": {
      "status": "healthy",
      "responseTime": 211,
      "indices": 1,
      "documents": 1500
    }
  }
}
```

### **Error Handling Middleware**
```typescript
// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});
```

### **Structured Logging**
```typescript
// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

---

## 🔄 **FAZ 7: CI/CD PIPELINE**

### **Amaç**
Automated testing, building ve deployment pipeline kurmak.

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy-admin.yml
name: 🚀 Deploy Admin Panel

on:
  push:
    branches: [ main ]
    paths:
      - 'packages/admin-backend/**'
      - 'packages/admin-ui/**'
      - 'packages/shared-types/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4
      - name: 🧪 Run tests
        run: |
          npm ci
          npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: 🐳 Build Docker images
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/benalsam-admin-backend:latest
            ${{ secrets.DOCKER_USERNAME }}/benalsam-admin-ui:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: 🚀 Deploy to VPS
        run: |
          ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} << 'EOF'
            cd /opt/benalsam-admin
            git pull origin main
            docker-compose -f docker-compose.prod.yml up -d --force-recreate
            sleep 30
            curl -f http://localhost:3002/api/v1/health
          EOF
```

### **Backup Strategy**
```bash
#!/bin/bash
# scripts/backup.sh

# PostgreSQL backup
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U postgres benalsam > "$BACKUP_DIR/postgres_$DATE.sql"

# Elasticsearch backup
docker-compose -f docker-compose.prod.yml exec -T elasticsearch \
  curl -X PUT "localhost:9200/_snapshot/backup_repo/snapshot_$DATE?wait_for_completion=true" \
  -H 'Content-Type: application/json' -d '{"indices": "*"}'

# Configuration backup
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
  --exclude='node_modules' --exclude='.git' \
  /opt/benalsam-admin
```

### **Restore Process**
```bash
#!/bin/bash
# scripts/restore.sh

# Validate backup
validate_backup "$backup_id"

# Restore PostgreSQL
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d benalsam < "$BACKUP_DIR/postgres_$backup_id.sql"

# Restore Elasticsearch
docker-compose -f docker-compose.prod.yml exec -T elasticsearch \
  curl -X POST "localhost:9200/_snapshot/backup_repo/snapshot_$backup_id/_restore?wait_for_completion=true" \
  -H 'Content-Type: application/json' -d '{"indices": "*"}'

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 **PERFORMANCE OPTIMIZATION**

### **Elasticsearch Optimization**
```json
// Index settings optimization
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "refresh_interval": "30s",
    "index.max_result_window": 10000
  }
}
```

### **Query Optimization**
```typescript
// Optimized search query
const optimizedQuery = {
  query: {
    bool: {
      must: [
        { match: { title: { query: searchTerm, boost: 2 } } },
        { match: { description: searchTerm } }
      ],
      filter: [
        { term: { status: 'active' } },
        { range: { created_at: { gte: 'now-30d' } } }
      ]
    }
  },
  sort: [
    { _score: { order: 'desc' } },
    { created_at: { order: 'desc' } }
  ],
  size: 20,
  from: offset
};
```

### **Caching Strategy**
```typescript
// Redis caching for search results
const cacheKey = `search:${JSON.stringify(searchParams)}`;
const cachedResults = await redis.get(cacheKey);

if (cachedResults) {
  return JSON.parse(cachedResults);
}

const results = await elasticsearchService.search(searchQuery);
await redis.setex(cacheKey, 300, JSON.stringify(results)); // 5 minutes cache
```

---

## 🔒 **SECURITY CONSIDERATIONS**

### **Elasticsearch Security**
```yaml
# docker-compose.prod.yml
elasticsearch:
  environment:
    - xpack.security.enabled=true
    - ELASTIC_PASSWORD=secure_password
    - discovery.type=single-node
  volumes:
    - ./elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml
```

### **Network Security**
```nginx
# Nginx security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### **Environment Variables**
```bash
# Sensitive data in environment variables
ELASTICSEARCH_USERNAME=admin
ELASTICSEARCH_PASSWORD=secure_password
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
REDIS_PASSWORD=secure_redis_password
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **1. Elasticsearch Connection Issues**
```bash
# Check Elasticsearch status
curl -X GET "localhost:9200/_cluster/health?pretty"

# Check logs
docker-compose -f docker-compose.prod.yml logs elasticsearch

# Restart Elasticsearch
docker-compose -f docker-compose.prod.yml restart elasticsearch
```

#### **2. Health Check Failures**
```bash
# Check all services
curl -s http://localhost:3002/api/v1/health | jq .

# Check detailed health
curl -s http://localhost:3002/api/v1/health/detailed | jq .

# Check specific service
curl -s http://localhost:3002/api/v1/health/elasticsearch | jq .
```

#### **3. Backup/Restore Issues**
```bash
# List available backups
/opt/benalsam-admin/scripts/restore.sh list

# Validate backup
/opt/benalsam-admin/scripts/restore.sh validate <backup_id>

# Restore from backup
/opt/benalsam-admin/scripts/restore.sh restore <backup_id>
```

#### **4. Performance Issues**
```bash
# Check Elasticsearch performance
curl -X GET "localhost:9200/_cat/indices?v"

# Check system resources
docker stats

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### **Monitoring Commands**
```bash
# Check system metrics
curl -s http://localhost:3002/api/v1/monitoring/metrics | jq .

# Check service status
curl -s http://localhost:3002/api/v1/monitoring/status | jq .

# Check error logs
tail -f /var/log/benalsam-backup.log
```

---

## 📈 **MONITORING DASHBOARD**

### **Key Metrics to Monitor**
1. **System Health**
   - CPU usage
   - Memory usage
   - Disk space
   - Network I/O

2. **Application Health**
   - API response times
   - Error rates
   - Request volume
   - Service uptime

3. **Elasticsearch Metrics**
   - Index size
   - Document count
   - Query performance
   - Cluster health

4. **Database Metrics**
   - Connection count
   - Query performance
   - Lock wait time
   - Cache hit ratio

### **Alerting Rules**
```yaml
# Example alerting configuration
alerts:
  - name: "High CPU Usage"
    condition: "cpu_usage > 80%"
    duration: "5m"
    action: "email,slack"
  
  - name: "Elasticsearch Health Degraded"
    condition: "elasticsearch_status != 'healthy'"
    duration: "1m"
    action: "email,slack"
  
  - name: "Backup Failed"
    condition: "backup_status == 'failed'"
    duration: "1h"
    action: "email,slack"
```

---

## 🎯 **BEST PRACTICES**

### **Development**
1. **Type Safety**: Always use TypeScript for type safety
2. **Error Handling**: Implement comprehensive error handling
3. **Logging**: Use structured logging with appropriate levels
4. **Testing**: Write unit and integration tests
5. **Documentation**: Keep documentation up to date

### **Production**
1. **Monitoring**: Implement comprehensive monitoring
2. **Backup**: Regular automated backups
3. **Security**: Follow security best practices
4. **Performance**: Monitor and optimize performance
5. **Scalability**: Design for horizontal scaling

### **Deployment**
1. **Zero-downtime**: Use blue-green deployment
2. **Rollback**: Always have rollback capability
3. **Health Checks**: Implement proper health checks
4. **Environment**: Use environment-specific configurations
5. **Automation**: Automate deployment process

---

## 📚 **RESOURCES**

### **Documentation**
- [Elasticsearch Official Documentation](https://www.elastic.co/guide/index.html)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nginx Documentation](https://nginx.org/en/docs/)

### **Tools**
- [Elasticsearch Head](https://github.com/mobz/elasticsearch-head) - Elasticsearch management UI
- [Kibana](https://www.elastic.co/kibana) - Elasticsearch visualization
- [Redis Commander](https://github.com/joeferner/redis-commander) - Redis management UI

### **Monitoring**
- [Prometheus](https://prometheus.io/) - Metrics collection
- [Grafana](https://grafana.com/) - Metrics visualization
- [Sentry](https://sentry.io/) - Error tracking

---

## 📞 **SUPPORT**

### **Contact Information**
- **Technical Lead**: [Your Name]
- **Email**: [your.email@company.com]
- **Slack**: #benalsam-admin

### **Emergency Contacts**
- **DevOps**: [DevOps Contact]
- **Database Admin**: [DB Admin Contact]
- **Infrastructure**: [Infrastructure Contact]

### **Escalation Process**
1. **Level 1**: On-call engineer (24/7)
2. **Level 2**: Senior engineer (business hours)
3. **Level 3**: Technical lead (critical issues)

---

*Bu dokümantasyon sürekli güncellenmektedir. Son güncelleme: 2025-07-19* 