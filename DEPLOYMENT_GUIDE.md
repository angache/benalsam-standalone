# 🚀 BENALSAM DEPLOYMENT GUIDE

## 📋 Production Deployment Checklist

### **🔧 Pre-Deployment Requirements**

#### **Infrastructure**
- [ ] **VPS/Cloud Server**: Ubuntu 20.04+ / CentOS 8+
- [ ] **Docker**: 20.10+ (for infrastructure services)
- [ ] **Node.js**: 18.x+ (for microservices)
- [ ] **Nginx**: 1.18+ (for reverse proxy)
- [ ] **SSL Certificate**: Let's Encrypt or commercial

#### **External Services**
- [ ] **PostgreSQL**: 13+ (database)
- [ ] **Redis**: 6+ (caching)
- [ ] **Elasticsearch**: 8+ (search)
- [ ] **RabbitMQ**: 3.8+ (message queue)
- [ ] **Cloudinary**: Account setup (image storage)

#### **Environment Variables**
- [ ] **Database URLs**: Production database connections
- [ ] **API Keys**: Cloudinary, external services
- [ ] **JWT Secrets**: Strong, unique secrets
- [ ] **Redis URLs**: Production Redis connections
- [ ] **Elasticsearch URLs**: Production ES connections

---

## 🏗️ Infrastructure Setup

### **1. Server Preparation**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Nginx
sudo apt install nginx -y

# Install PM2 (process manager)
sudo npm install -g pm2
```

### **2. Infrastructure Services (Docker)**

```bash
# Create infrastructure directory
mkdir -p /opt/benalsam/infrastructure
cd /opt/benalsam/infrastructure

# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: benalsam_prod
      POSTGRES_USER: benalsam
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    command: redis-server --requirepass \${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  elasticsearch:
    image: elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - es_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    restart: unless-stopped

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: benalsam
      RABBITMQ_DEFAULT_PASS: \${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: \${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3000:3000"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  es_data:
  rabbitmq_data:
  prometheus_data:
  grafana_data:
EOF

# Create environment file
cat > .env << EOF
DB_PASSWORD=your_strong_db_password
REDIS_PASSWORD=your_strong_redis_password
RABBITMQ_PASSWORD=your_strong_rabbitmq_password
GRAFANA_PASSWORD=your_strong_grafana_password
EOF

# Start infrastructure
docker-compose up -d
```

### **3. Nginx Configuration**

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/benalsam << EOF
upstream admin_backend {
    server 127.0.0.1:3002;
}

upstream elasticsearch_service {
    server 127.0.0.1:3006;
}

upstream upload_service {
    server 127.0.0.1:3007;
}

upstream listing_service {
    server 127.0.0.1:3008;
}

upstream queue_service {
    server 127.0.0.1:3012;
}

upstream backup_service {
    server 127.0.0.1:3013;
}

upstream cache_service {
    server 127.0.0.1:3014;
}

upstream categories_service {
    server 127.0.0.1:3015;
}

upstream search_service {
    server 127.0.0.1:3016;
}

server {
    listen 80;
    server_name your-domain.com;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Admin Backend
    location /api/v1/admin/ {
        proxy_pass http://admin_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Elasticsearch Service
    location /api/v1/elasticsearch/ {
        proxy_pass http://elasticsearch_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Upload Service
    location /api/v1/upload/ {
        proxy_pass http://upload_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 10M;
    }

    # Listing Service
    location /api/v1/listings/ {
        proxy_pass http://listing_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Queue Service
    location /api/v1/queue/ {
        proxy_pass http://queue_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Cache Service
    location /api/v1/cache/ {
        proxy_pass http://cache_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Categories Service
    location /api/v1/categories/ {
        proxy_pass http://categories_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Search Service
    location /api/v1/search/ {
        proxy_pass http://search_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health checks
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# SSL configuration (after obtaining certificate)
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Include the same location blocks as above
    # ... (copy all location blocks from above)
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/benalsam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🚀 Microservices Deployment

### **1. Application Setup**

```bash
# Create application directory
sudo mkdir -p /opt/benalsam/apps
sudo chown $USER:$USER /opt/benalsam/apps
cd /opt/benalsam/apps

# Clone repository
git clone https://github.com/your-org/benalsam-standalone.git
cd benalsam-standalone

# Install dependencies for all services
for service in benalsam-*; do
    echo "Installing dependencies for $service..."
    cd $service && npm install --production && cd ..
done
```

### **2. Environment Configuration**

```bash
# Create production environment files
for service in benalsam-*; do
    if [ -f "$service/.env.example" ]; then
        cp "$service/.env.example" "$service/.env"
        echo "Created .env for $service"
    fi
done
```

### **3. PM2 Configuration**

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'benalsam-admin-backend',
      script: './benalsam-admin-backend/src/index.ts',
      cwd: './benalsam-admin-backend',
      interpreter: 'ts-node',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/var/log/benalsam/admin-backend-error.log',
      out_file: '/var/log/benalsam/admin-backend-out.log',
      log_file: '/var/log/benalsam/admin-backend.log',
      time: true
    },
    {
      name: 'benalsam-elasticsearch-service',
      script: './benalsam-elasticsearch-service/src/index.ts',
      cwd: './benalsam-elasticsearch-service',
      interpreter: 'ts-node',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3006
      },
      error_file: '/var/log/benalsam/elasticsearch-service-error.log',
      out_file: '/var/log/benalsam/elasticsearch-service-out.log',
      log_file: '/var/log/benalsam/elasticsearch-service.log',
      time: true
    },
    {
      name: 'benalsam-upload-service',
      script: './benalsam-upload-service/src/index.ts',
      cwd: './benalsam-upload-service',
      interpreter: 'ts-node',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3007
      },
      error_file: '/var/log/benalsam/upload-service-error.log',
      out_file: '/var/log/benalsam/upload-service-out.log',
      log_file: '/var/log/benalsam/upload-service.log',
      time: true
    },
    {
      name: 'benalsam-listing-service',
      script: './benalsam-listing-service/src/index.ts',
      cwd: './benalsam-listing-service',
      interpreter: 'ts-node',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3008
      },
      error_file: '/var/log/benalsam/listing-service-error.log',
      out_file: '/var/log/benalsam/listing-service-out.log',
      log_file: '/var/log/benalsam/listing-service.log',
      time: true
    },
    {
      name: 'benalsam-queue-service',
      script: './benalsam-queue-service/src/index.ts',
      cwd: './benalsam-queue-service',
      interpreter: 'ts-node',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3012
      },
      error_file: '/var/log/benalsam/queue-service-error.log',
      out_file: '/var/log/benalsam/queue-service-out.log',
      log_file: '/var/log/benalsam/queue-service.log',
      time: true
    },
    {
      name: 'benalsam-cache-service',
      script: './benalsam-cache-service/src/index.ts',
      cwd: './benalsam-cache-service',
      interpreter: 'ts-node',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3014
      },
      error_file: '/var/log/benalsam/cache-service-error.log',
      out_file: '/var/log/benalsam/cache-service-out.log',
      log_file: '/var/log/benalsam/cache-service.log',
      time: true
    },
    {
      name: 'benalsam-categories-service',
      script: './benalsam-categories-service/src/index.ts',
      cwd: './benalsam-categories-service',
      interpreter: 'ts-node',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3015
      },
      error_file: '/var/log/benalsam/categories-service-error.log',
      out_file: '/var/log/benalsam/categories-service-out.log',
      log_file: '/var/log/benalsam/categories-service.log',
      time: true
    },
    {
      name: 'benalsam-search-service',
      script: './benalsam-search-service/src/index.ts',
      cwd: './benalsam-search-service',
      interpreter: 'ts-node',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3016
      },
      error_file: '/var/log/benalsam/search-service-error.log',
      out_file: '/var/log/benalsam/search-service-out.log',
      log_file: '/var/log/benalsam/search-service.log',
      time: true
    }
  ]
};
EOF

# Create log directory
sudo mkdir -p /var/log/benalsam
sudo chown $USER:$USER /var/log/benalsam

# Start all services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

---

## 🔍 Monitoring & Health Checks

### **1. Health Check Script**

```bash
# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash

SERVICES=(
    "http://localhost:3002/api/v1/health"
    "http://localhost:3006/api/v1/health"
    "http://localhost:3007/api/v1/health"
    "http://localhost:3008/api/v1/health"
    "http://localhost:3012/api/v1/health"
    "http://localhost:3013/api/v1/health"
    "http://localhost:3014/api/v1/health"
    "http://localhost:3015/api/v1/health"
    "http://localhost:3016/api/v1/health"
)

echo "🔍 Benalsam Health Check - $(date)"
echo "=================================="

for service in "${SERVICES[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$service")
    if [ "$response" = "200" ]; then
        echo "✅ $service - OK"
    else
        echo "❌ $service - FAILED ($response)"
    fi
done

echo "=================================="
echo "📊 PM2 Status:"
pm2 status
EOF

chmod +x health-check.sh

# Add to crontab for regular health checks
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/benalsam/apps/benalsam-standalone/health-check.sh >> /var/log/benalsam/health-check.log") | crontab -
```

### **2. Log Rotation**

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/benalsam << EOF
/var/log/benalsam/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

---

## 🔒 Security Configuration

### **1. Firewall Setup**

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow monitoring ports (restrict to localhost)
sudo ufw allow from 127.0.0.1 to any port 3000  # Grafana
sudo ufw allow from 127.0.0.1 to any port 9090  # Prometheus
sudo ufw allow from 127.0.0.1 to any port 15672 # RabbitMQ Management

# Enable firewall
sudo ufw enable
```

### **2. SSL Certificate (Let's Encrypt)**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 📊 Performance Monitoring

### **1. Prometheus Configuration**

```bash
# Create Prometheus configuration
cat > /opt/benalsam/infrastructure/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'benalsam-services'
    static_configs:
      - targets: 
        - 'localhost:3002'  # Admin Backend
        - 'localhost:3006'  # Elasticsearch Service
        - 'localhost:3007'  # Upload Service
        - 'localhost:3008'  # Listing Service
        - 'localhost:3012'  # Queue Service
        - 'localhost:3013'  # Backup Service
        - 'localhost:3014'  # Cache Service
        - 'localhost:3015'  # Categories Service
        - 'localhost:3016'  # Search Service
    metrics_path: '/api/v1/metrics'
    scrape_interval: 30s
EOF

# Restart Prometheus
cd /opt/benalsam/infrastructure
docker-compose restart prometheus
```

### **2. Grafana Dashboard Setup**

1. Access Grafana: `http://your-domain.com:3000`
2. Login: `admin` / `your_grafana_password`
3. Add Prometheus data source: `http://prometheus:9090`
4. Import dashboard templates for microservices monitoring

---

## 🚀 Deployment Commands

### **Quick Deployment**

```bash
# 1. Start infrastructure
cd /opt/benalsam/infrastructure
docker-compose up -d

# 2. Start microservices
cd /opt/benalsam/apps/benalsam-standalone
pm2 start ecosystem.config.js

# 3. Check status
pm2 status
./health-check.sh

# 4. View logs
pm2 logs
```

### **Update Deployment**

```bash
# 1. Pull latest changes
cd /opt/benalsam/apps/benalsam-standalone
git pull origin main

# 2. Install dependencies
for service in benalsam-*; do
    cd $service && npm install --production && cd ..
done

# 3. Restart services
pm2 restart all

# 4. Check health
./health-check.sh
```

### **Rollback Deployment**

```bash
# 1. Check PM2 logs for issues
pm2 logs --lines 100

# 2. Restart specific service
pm2 restart benalsam-listing-service

# 3. Full rollback (if needed)
git checkout previous-stable-commit
pm2 restart all
```

---

## 📋 Post-Deployment Checklist

- [ ] All services running (PM2 status)
- [ ] Health checks passing
- [ ] SSL certificate active
- [ ] Monitoring dashboards accessible
- [ ] Log rotation configured
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Performance metrics collected
- [ ] Error tracking active
- [ ] Documentation updated

---

**🎉 Congratulations! Your Benalsam microservices architecture is now production-ready!**

For support and updates, visit: [Benalsam Documentation](https://github.com/your-org/benalsam-standalone)
