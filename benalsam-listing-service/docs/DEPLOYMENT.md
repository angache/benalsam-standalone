# 🚀 Benalsam Listing Service - Deployment Guide

## 📋 Overview

This guide covers the complete deployment process for the Benalsam Listing Service, including local development, staging, and production environments.

## 🛠️ Prerequisites

### **System Requirements**
- Node.js 18+ 
- npm 8+
- Docker (optional)
- PM2 (for production)
- Redis 6+
- RabbitMQ 3.8+
- Supabase account

### **Dependencies**
- Redis server
- RabbitMQ server
- Supabase project
- Cloudinary account (for image uploads)

## 🏠 Local Development

### **1. Environment Setup**
```bash
# Clone repository
git clone https://github.com/benalsam/benalsam-standalone.git
cd benalsam-standalone/benalsam-listing-service

# Install dependencies
npm install

# Copy environment file
cp env.example .env
```

### **2. Environment Configuration**
```bash
# .env file
PORT=3008
API_VERSION=v1
NODE_ENV=development

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3003

# Job Processing
JOB_PROCESSING_ENABLED=true
JOB_RETRY_ATTEMPTS=3
JOB_RETRY_DELAY=5000
```

### **3. Start Dependencies**
```bash
# Start Redis
redis-server

# Start RabbitMQ
rabbitmq-server

# Or with Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### **4. Start Service**
```bash
# Development mode
npm run dev

# Build and start
npm run build
npm start
```

### **5. Verify Deployment**
```bash
# Health check
curl http://localhost:3008/api/v1/health

# Test listing creation
curl -X POST http://localhost:3008/api/v1/listings \
  -H "x-user-id: test-user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Listing",
    "description": "Test Description",
    "category": "Electronics",
    "budget": 1000,
    "acceptTerms": true
  }'
```

## 🐳 Docker Deployment

### **1. Dockerfile**
```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S listing-service -u 1001

# Change ownership
RUN chown -R listing-service:nodejs /app
USER listing-service

# Expose port
EXPOSE 3008

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3008/api/v1/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
```

### **2. Docker Compose**
```yaml
version: '3.8'

services:
  listing-service:
    build: .
    ports:
      - "3008:3008"
    environment:
      - NODE_ENV=production
      - PORT=3008
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://rabbitmq:5672
      - CORS_ORIGIN=${CORS_ORIGIN}
      - JOB_PROCESSING_ENABLED=true
    depends_on:
      - redis
      - rabbitmq
    restart: unless-stopped
    networks:
      - benalsam-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - benalsam-network

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=admin123
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    restart: unless-stopped
    networks:
      - benalsam-network

volumes:
  redis_data:
  rabbitmq_data:

networks:
  benalsam-network:
    driver: bridge
```

### **3. Build and Deploy**
```bash
# Build image
docker build -t benalsam-listing-service .

# Run with docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f listing-service

# Scale service
docker-compose up -d --scale listing-service=3
```

## 🏭 Production Deployment

### **1. PM2 Configuration**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'listing-service',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3008
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3008,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      REDIS_URL: process.env.REDIS_URL,
      RABBITMQ_URL: process.env.RABBITMQ_URL,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      JOB_PROCESSING_ENABLED: 'true'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### **2. Production Scripts**
```bash
#!/bin/bash
# deploy.sh

# Build application
npm run build

# Install PM2 globally
npm install -g pm2

# Stop existing processes
pm2 stop listing-service || true

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup

# Show status
pm2 status
```

### **3. Nginx Configuration**
```nginx
# /etc/nginx/sites-available/listing-service
upstream listing_service {
    server 127.0.0.1:3008;
    server 127.0.0.1:3009;
    server 127.0.0.1:3010;
}

server {
    listen 80;
    server_name listing.benalsam.com;

    location / {
        proxy_pass http://listing_service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://listing_service/api/v1/health;
        access_log off;
    }
}
```

### **4. SSL Configuration**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d listing.benalsam.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Environment-Specific Configurations

### **Development**
```bash
NODE_ENV=development
PORT=3008
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000,http://localhost:3003
```

### **Staging**
```bash
NODE_ENV=staging
PORT=3008
LOG_LEVEL=info
CORS_ORIGIN=https://staging.benalsam.com
```

### **Production**
```bash
NODE_ENV=production
PORT=3008
LOG_LEVEL=warn
CORS_ORIGIN=https://benalsam.com,https://admin.benalsam.com
```

## 📊 Monitoring Setup

### **1. Health Check Endpoints**
```bash
# Basic health
curl http://localhost:3008/api/v1/health

# Detailed health
curl http://localhost:3008/api/v1/health/detailed

# Component health
curl http://localhost:3008/api/v1/health/database
curl http://localhost:3008/api/v1/health/redis
curl http://localhost:3008/api/v1/health/rabbitmq
curl http://localhost:3008/api/v1/health/jobs
```

### **2. Log Monitoring**
```bash
# PM2 logs
pm2 logs listing-service

# Docker logs
docker logs -f listing-service

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### **3. Metrics Collection**
```bash
# Job metrics
curl http://localhost:3008/api/v1/jobs/metrics

# System metrics
pm2 monit

# Resource usage
htop
```

## 🔄 CI/CD Pipeline

### **1. GitHub Actions**
```yaml
# .github/workflows/deploy.yml
name: Deploy Listing Service

on:
  push:
    branches: [main]
    paths: ['benalsam-listing-service/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: benalsam-listing-service/package-lock.json
    
    - name: Install dependencies
      run: |
        cd benalsam-listing-service
        npm ci
    
    - name: Run tests
      run: |
        cd benalsam-listing-service
        npm test
    
    - name: Build application
      run: |
        cd benalsam-listing-service
        npm run build
    
    - name: Deploy to production
      run: |
        # Add deployment commands here
        echo "Deploying to production..."
```

### **2. Docker Registry**
```bash
# Build and push to registry
docker build -t benalsam/listing-service:latest .
docker push benalsam/listing-service:latest

# Deploy from registry
docker pull benalsam/listing-service:latest
docker run -d --name listing-service benalsam/listing-service:latest
```

## 🚨 Troubleshooting

### **Common Issues**

#### **Service Won't Start**
```bash
# Check port availability
lsof -i :3008

# Check environment variables
env | grep SUPABASE

# Check logs
pm2 logs listing-service
```

#### **Database Connection Issues**
```bash
# Test database connection
curl http://localhost:3008/api/v1/health/database

# Check Supabase status
curl https://api.supabase.com/v1/projects/{project-id}/health
```

#### **Redis Connection Issues**
```bash
# Test Redis connection
curl http://localhost:3008/api/v1/health/redis

# Check Redis status
redis-cli ping
```

#### **RabbitMQ Connection Issues**
```bash
# Test RabbitMQ connection
curl http://localhost:3008/api/v1/health/rabbitmq

# Check RabbitMQ status
rabbitmqctl status
```

### **Performance Issues**
```bash
# Check memory usage
pm2 monit

# Check CPU usage
top -p $(pgrep -f listing-service)

# Check disk usage
df -h

# Check network connections
netstat -tulpn | grep :3008
```

### **Log Analysis**
```bash
# Search for errors
grep -i error /var/log/pm2/listing-service-error.log

# Search for specific patterns
grep "job.*failed" /var/log/pm2/listing-service-out.log

# Monitor real-time logs
tail -f /var/log/pm2/listing-service-combined.log
```

## 🔄 Backup and Recovery

### **Database Backup**
```bash
# Supabase backup (handled by Supabase)
# Manual backup via API
curl -X POST "https://api.supabase.com/v1/projects/{project-id}/backups" \
  -H "Authorization: Bearer {service-role-key}"
```

### **Configuration Backup**
```bash
# Backup environment files
cp .env .env.backup

# Backup PM2 configuration
pm2 save

# Backup Nginx configuration
cp /etc/nginx/sites-available/listing-service /backup/
```

### **Recovery Process**
```bash
# Restore from backup
cp .env.backup .env

# Restart services
pm2 restart listing-service

# Verify health
curl http://localhost:3008/api/v1/health
```

## 📈 Scaling

### **Horizontal Scaling**
```bash
# Scale PM2 instances
pm2 scale listing-service 4

# Scale Docker containers
docker-compose up -d --scale listing-service=4

# Load balancer configuration
# Update Nginx upstream configuration
```

### **Vertical Scaling**
```bash
# Increase memory limit
pm2 restart listing-service --max-memory-restart 2G

# Increase Node.js heap size
export NODE_OPTIONS="--max-old-space-size=2048"
```

## 🔒 Security

### **Firewall Configuration**
```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 3008  # Service port (if needed)
ufw enable
```

### **SSL/TLS**
```bash
# Generate SSL certificate
certbot --nginx -d listing.benalsam.com

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Environment Security**
```bash
# Secure environment files
chmod 600 .env
chown root:root .env

# Use secrets management
# Consider using HashiCorp Vault or AWS Secrets Manager
```

---

**Benalsam Listing Service Deployment** - Complete deployment guide for all environments
