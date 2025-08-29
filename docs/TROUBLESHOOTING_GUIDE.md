# 🔧 Troubleshooting Guide - Benalsam Monorepo

## 📋 **Genel Bakış**

Bu rehber, Benalsam monorepo projesinde karşılaşılabilecek yaygın sorunları ve çözümlerini açıklar.

---

## 🚨 **Emergency Procedures**

### **Critical Issues**
```bash
# Emergency shutdown
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.prod.yml down

# Emergency restart
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.prod.yml up -d

# Emergency rollback
git checkout HEAD~1
docker-compose -f docker-compose.prod.yml up -d
```

### **Service Recovery**
```bash
# Restart specific service
docker-compose -f docker-compose.dev.yml restart admin-backend

# Restart all services
docker-compose -f docker-compose.dev.yml restart

# Force rebuild
docker-compose -f docker-compose.dev.yml build --no-cache
```

---

## 🔍 **Diagnostic Commands**

### **System Health Check**
```bash
# Docker status
docker info
docker version
docker-compose --version

# Container status
docker ps -a
docker-compose -f docker-compose.dev.yml ps

# Resource usage
docker stats --no-stream
docker system df

# Network status
docker network ls
docker network inspect benalsam-infrastructure_benalsam-network
```

### **Service Health Check**
```bash
# Health endpoints
curl -f http://localhost:3002/health
curl -f http://localhost:3003/health
curl -f http://localhost:5173/health

# Service logs
docker-compose -f docker-compose.dev.yml logs admin-backend
docker-compose -f docker-compose.dev.yml logs admin-ui
docker-compose -f docker-compose.dev.yml logs web

# Real-time logs
docker-compose -f docker-compose.dev.yml logs -f
```

### **Network Diagnostics**
```bash
# Port check
netstat -tulpn | grep :3002
netstat -tulpn | grep :3003
netstat -tulpn | grep :5173

# DNS resolution
nslookup admin-backend
nslookup elasticsearch
nslookup redis

# Connectivity test
docker-compose -f docker-compose.dev.yml exec admin-backend ping redis
docker-compose -f docker-compose.dev.yml exec admin-backend curl elasticsearch:9200
```

---

## 🐛 **Common Issues**

### **1. Database Trigger Issues**

#### **Problem: `invalid input syntax for type integer: "UUID"` Error**
**Symptoms:**
- İlan oluşturma sırasında `invalid input syntax for type integer: "UUID"` hatası
- `elasticsearch_sync_queue` tablosunda veri tipi uyumsuzluğu
- `listings_queue_sync` trigger'ı aktifken hata oluşması

**Root Cause:**
- `elasticsearch_sync_queue.record_id` kolonu `integer` tipinde tanımlanmış
- `listings.id` kolonu `uuid` tipinde
- Trigger fonksiyonu UUID değerini integer kolona yazmaya çalışıyor

**Solution:**
```sql
-- 1. Elasticsearch sync queue tablosunu düzelt
ALTER TABLE elasticsearch_sync_queue DROP COLUMN record_id;
ALTER TABLE elasticsearch_sync_queue ADD COLUMN record_id uuid NOT NULL;

-- 2. Trigger fonksiyonunu yeniden oluştur
CREATE OR REPLACE FUNCTION add_to_elasticsearch_queue()
RETURNS TRIGGER AS $$
DECLARE
    record_id UUID;
BEGIN
    -- Record ID'yi belirle
    IF TG_OP = 'DELETE' THEN
        record_id := OLD.id;
    ELSE
        record_id := NEW.id;
    END IF;

    -- Queue'ya ekle
    INSERT INTO elasticsearch_sync_queue (
        table_name,
        operation,
        record_id,
        change_data
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        record_id,
        CASE 
            WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger'ı yeniden etkinleştir
ALTER TABLE listings ENABLE TRIGGER listings_queue_sync;
```

**Prevention:**
- Yeni tablolar oluştururken veri tiplerini dikkatli kontrol et
- Trigger fonksiyonlarında veri tipi uyumluluğunu test et
- UUID ve integer tiplerini karıştırmamaya dikkat et

#### **Problem: Frontend `prevListings is not iterable` Error**
**Symptoms:**
- İlan oluşturma sonrası frontend'de `prevListings is not iterable` hatası
- React state güncellemesinde array olmayan değer

**Solution:**
```javascript
// useAppData.jsx - Güvenli state güncelleme
setListings(prevListings => {
  const currentListings = Array.isArray(prevListings) ? prevListings : [];
  return [newFullListing, ...currentListings].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
});
```

### **2. Build Issues**

#### **Problem: Build Fails**
```bash
# Error: Cannot find module
# Solution: Clear cache and rebuild
docker builder prune -f
docker-compose -f docker-compose.dev.yml build --no-cache

# Error: Permission denied
# Solution: Fix permissions
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh

# Error: Out of memory
# Solution: Increase Docker memory
# Docker Desktop > Settings > Resources > Memory: 8GB
```

#### **Problem: Slow Builds**
```bash
# Solution: Optimize cache
docker build --cache-from benalsam/admin-backend:latest .

# Solution: Use buildkit
export DOCKER_BUILDKIT=1
docker-compose -f docker-compose.dev.yml build

# Solution: Parallel builds
docker-compose -f docker-compose.dev.yml build --parallel
```

### **2. Runtime Issues**

#### **Problem: Service Won't Start**
```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs [service-name]

# Check environment
docker-compose -f docker-compose.dev.yml exec [service-name] env

# Check configuration
docker-compose -f docker-compose.dev.yml config

# Restart service
docker-compose -f docker-compose.dev.yml restart [service-name]
```

#### **Problem: Port Already in Use**
```bash
# Find process using port
lsof -i :3002
lsof -i :3003
lsof -i :5173

# Kill process
sudo kill -9 [PID]

# Or stop all containers
docker stop $(docker ps -aq)
```

#### **Problem: Memory Issues**
```bash
# Check memory usage
free -h
docker stats --no-stream

# Increase Docker memory
# Docker Desktop > Settings > Resources > Memory: 8GB

# Restart Docker
sudo systemctl restart docker
```

### **3. Network Issues**

#### **Problem: Service Communication Fails**
```bash
# Check network
docker network ls
docker network inspect benalsam-infrastructure_benalsam-network

# Recreate network
docker-compose -f docker-compose.dev.yml down
docker network prune -f
docker-compose -f docker-compose.dev.yml up -d

# Test connectivity
docker-compose -f docker-compose.dev.yml exec admin-backend ping redis
docker-compose -f docker-compose.dev.yml exec admin-backend curl elasticsearch:9200
```

#### **Problem: DNS Resolution Issues**
```bash
# Check DNS
docker-compose -f docker-compose.dev.yml exec admin-backend nslookup redis
docker-compose -f docker-compose.dev.yml exec admin-backend nslookup elasticsearch

# Fix DNS
docker-compose -f docker-compose.dev.yml down
docker system prune -f
docker-compose -f docker-compose.dev.yml up -d
```

### **4. Data Issues**

#### **Problem: Data Loss**
```bash
# Check volumes
docker volume ls
docker volume inspect benalsam-infrastructure_redis_data

# Backup data
docker run --rm -v benalsam-infrastructure_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .

# Restore data
docker run --rm -v benalsam-infrastructure_redis_data:/data -v $(pwd):/backup alpine tar xzf /backup/redis-backup.tar.gz -C /data
```

#### **Problem: Elasticsearch Issues**
```bash
# Check Elasticsearch health
curl -f http://localhost:9200/_cluster/health

# Restart Elasticsearch
docker-compose -f docker-compose.dev.yml restart elasticsearch

# Check logs
docker-compose -f docker-compose.dev.yml logs elasticsearch

# Reset Elasticsearch
docker-compose -f docker-compose.dev.yml down
docker volume rm benalsam-infrastructure_elasticsearch_data
docker-compose -f docker-compose.dev.yml up -d
```

### **5. Security Issues**

#### **Problem: Security Scan Fails**
```bash
# Run security scan
./scripts/security-scan.sh

# Fix vulnerabilities
npm audit fix
pnpm audit fix

# Update dependencies
pnpm update
```

#### **Problem: Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh

# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker
```

---

## 🔧 **Performance Issues**

### **Slow Application**
```bash
# Check resource usage
docker stats --no-stream
htop

# Optimize memory
docker-compose -f docker-compose.dev.yml exec redis redis-cli CONFIG SET maxmemory 256mb

# Optimize Elasticsearch
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "indices.memory.index_buffer_size": "30%"
  }
}'
```

### **High CPU Usage**
```bash
# Check CPU usage
docker stats --no-stream
top

# Limit CPU usage
# Add to docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       cpus: '0.5'

# Restart with limits
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### **High Memory Usage**
```bash
# Check memory usage
free -h
docker stats --no-stream

# Optimize memory
# Add to docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 512M

# Restart with limits
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

---

## 🧪 **Testing Issues**

### **Test Failures**
```bash
# Run all tests
./scripts/run-all-tests.sh

# Run specific tests
./scripts/docker-build-test.sh
./scripts/docker-compose-test.sh
./scripts/integration-test.sh

# Debug test failures
docker-compose -f docker-compose.dev.yml logs -f
```

### **Health Check Failures**
```bash
# Check health endpoints
curl -v http://localhost:3002/health
curl -v http://localhost:3003/health
curl -v http://localhost:5173/health

# Check service status
docker-compose -f docker-compose.dev.yml ps

# Restart services
docker-compose -f docker-compose.dev.yml restart
```

---

## 📊 **Monitoring Issues**

### **Log Analysis**
```bash
# View all logs
docker-compose -f docker-compose.dev.yml logs

# Follow logs
docker-compose -f docker-compose.dev.yml logs -f

# Filter logs
docker-compose -f docker-compose.dev.yml logs admin-backend | grep ERROR
docker-compose -f docker-compose.dev.yml logs admin-backend | grep WARN

# Export logs
docker-compose -f docker-compose.dev.yml logs > logs.txt
```

### **Resource Monitoring**
```bash
# Monitor resources
docker stats --no-stream

# Monitor disk usage
df -h
docker system df

# Monitor network
docker network ls
docker network inspect benalsam-infrastructure_benalsam-network
```

---

## 🔄 **Recovery Procedures**

### **Full System Reset**
```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.prod.yml down

# Clean up
docker system prune -a -f
docker volume prune -f
docker network prune -f

# Rebuild everything
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

### **Data Recovery**
```bash
# Backup current state
docker-compose -f docker-compose.dev.yml exec redis redis-cli BGSAVE
docker cp benalsam-infrastructure_redis_1:/data/dump.rdb ./backup/

# Restore from backup
docker cp ./backup/dump.rdb benalsam-infrastructure_redis_1:/data/
docker-compose -f docker-compose.dev.yml restart redis
```

### **Configuration Recovery**
```bash
# Backup configuration
cp .env .env.backup
cp docker-compose.dev.yml docker-compose.dev.yml.backup

# Restore configuration
cp .env.backup .env
cp docker-compose.dev.yml.backup docker-compose.dev.yml

# Restart services
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

---

## 📞 **Support Resources**

### **Documentation**
- [Docker Setup Guide](./DOCKER_SETUP_GUIDE.md)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Security Best Practices](./SECURITY_BEST_PRACTICES.md)

### **External Resources**
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)

### **Contact Information**
- **Technical Issues**: GitHub Issues
- **Emergency**: CTO Direct Line
- **Support**: support@benalsam.com

---

## 📋 **Quick Reference**

### **Common Commands**
```bash
# Start development
./scripts/docker-dev.sh

# Start production
./scripts/docker-prod.sh

# Run tests
./scripts/run-all-tests.sh

# Security scan
./scripts/security-scan.sh

# Performance test
./scripts/cache-performance.sh
```

### **Emergency Commands**
```bash
# Emergency stop
docker-compose -f docker-compose.dev.yml down

# Emergency start
docker-compose -f docker-compose.dev.yml up -d

# Emergency restart
docker-compose -f docker-compose.dev.yml restart

# Emergency rollback
git checkout HEAD~1
docker-compose -f docker-compose.prod.yml up -d
```

---

**Son Güncelleme:** 2025-01-09  
**Versiyon:** 1.0.0  
**Güncelleyen:** AI Assistant  
**Onaylayan:** Support Team 