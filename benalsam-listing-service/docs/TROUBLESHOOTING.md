# 🔧 Benalsam Listing Service - Troubleshooting Guide

## 📋 Overview

This guide helps diagnose and resolve common issues with the Benalsam Listing Service. It covers service startup, connectivity, performance, and error resolution.

## 🚨 Quick Diagnostics

### **Service Status Check**
```bash
# Check if service is running
curl http://localhost:3008/api/v1/health

# Check detailed health
curl http://localhost:3008/api/v1/health/detailed

# Check PM2 status
pm2 status listing-service

# Check Docker status
docker ps | grep listing-service
```

### **Port Availability**
```bash
# Check if port 3008 is available
lsof -i :3008

# Check if port is in use
netstat -tulpn | grep :3008
```

## 🔍 Common Issues

### **1. Service Won't Start**

#### **Symptoms:**
- Service fails to start
- Port already in use error
- Environment variable errors

#### **Diagnosis:**
```bash
# Check port availability
lsof -i :3008

# Check environment variables
env | grep -E "(SUPABASE|REDIS|RABBITMQ)"

# Check logs
pm2 logs listing-service
# or
docker logs listing-service
```

#### **Solutions:**
```bash
# Kill process using port 3008
sudo kill -9 $(lsof -t -i:3008)

# Check environment file
cat .env

# Verify required environment variables
echo $SUPABASE_URL
echo $REDIS_URL
echo $RABBITMQ_URL

# Restart service
pm2 restart listing-service
# or
docker-compose restart listing-service
```

### **2. Database Connection Issues**

#### **Symptoms:**
- Database health check fails
- Connection timeout errors
- Authentication errors

#### **Diagnosis:**
```bash
# Test database health
curl http://localhost:3008/api/v1/health/database

# Check Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Test Supabase connection
curl -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/"
```

#### **Solutions:**
```bash
# Verify Supabase credentials
# Check Supabase dashboard for correct values

# Test with correct credentials
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# Restart service
pm2 restart listing-service
```

### **3. Redis Connection Issues**

#### **Symptoms:**
- Redis health check fails
- Cache operations fail
- Connection refused errors

#### **Diagnosis:**
```bash
# Test Redis health
curl http://localhost:3008/api/v1/health/redis

# Check Redis status
redis-cli ping

# Check Redis configuration
echo $REDIS_URL
```

#### **Solutions:**
```bash
# Start Redis server
redis-server

# Or with Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Test Redis connection
redis-cli ping

# Restart service
pm2 restart listing-service
```

### **4. RabbitMQ Connection Issues**

#### **Symptoms:**
- RabbitMQ health check fails
- Job processing stops
- Connection timeout errors

#### **Diagnosis:**
```bash
# Test RabbitMQ health
curl http://localhost:3008/api/v1/health/rabbitmq

# Check RabbitMQ status
rabbitmqctl status

# Check RabbitMQ management UI
# http://localhost:15672 (admin/guest)
```

#### **Solutions:**
```bash
# Start RabbitMQ server
rabbitmq-server

# Or with Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Check RabbitMQ status
rabbitmqctl status

# Restart service
pm2 restart listing-service
```

### **5. Job Processing Issues**

#### **Symptoms:**
- Jobs stuck in pending status
- Job processing stops
- High job failure rate
- **NEW**: Listing created but not visible in "My Listings" page

#### **Diagnosis:**
```bash
# Check job metrics
curl http://localhost:3008/api/v1/jobs/metrics

# Check job processor health
curl http://localhost:3008/api/v1/health/jobs

# Check specific job status
curl -H "x-user-id: USER_ID" http://localhost:3008/api/v1/listings/jobs/JOB_ID

# Check job queue
# RabbitMQ Management UI: http://localhost:15672
```

#### **Solutions:**
```bash
# Restart job processor
pm2 restart listing-service

# Check job processing enabled
echo $JOB_PROCESSING_ENABLED

# Clear stuck jobs (if needed)
# Access RabbitMQ Management UI and purge queues
```

#### **Listing Not Visible After Creation (Fixed 2025-01-XX)**

**Problem**: Listing is created with `PENDING_APPROVAL` status but doesn't appear in "My Listings" page.

**Root Causes**:
1. Frontend status handler doesn't recognize `PENDING_APPROVAL` status
2. Job polling checks wrong endpoint (Upload Service instead of Listing Service)

**Solution**:
1. **Status Handling**: Frontend now normalizes status to lowercase and handles `pending_approval` correctly
2. **Job Polling**: Updated to check Listing Service endpoint first (`/api/v1/listings/jobs/:jobId`), then fallback to Upload Service

**Verification**:
```bash
# Check if listing exists in database
# Query Supabase listings table with status = 'pending_approval'

# Check job status
curl -H "x-user-id: USER_ID" http://localhost:3008/api/v1/listings/jobs/JOB_ID

# Expected response:
{
  "success": true,
  "data": {
    "jobId": "...",
    "status": "completed",
    "result": {
      "listingId": "...",
      "listing": { ... }
    }
  }
}
```

### **6. Performance Issues**

#### **Symptoms:**
- Slow response times
- High memory usage
- High CPU usage

#### **Diagnosis:**
```bash
# Check system resources
htop

# Check PM2 metrics
pm2 monit

# Check memory usage
free -h

# Check disk usage
df -h
```

#### **Solutions:**
```bash
# Restart service to clear memory
pm2 restart listing-service

# Scale horizontally
pm2 scale listing-service 2

# Increase memory limit
pm2 restart listing-service --max-memory-restart 2G

# Optimize database queries
# Check slow query log
```

### **7. Authentication Issues**

#### **Symptoms:**
- 401 Unauthorized errors
- Authentication middleware errors
- User ID validation failures

#### **Diagnosis:**
```bash
# Test with valid user ID
curl -H "x-user-id: test-user-123" http://localhost:3008/api/v1/listings

# Check authentication middleware
# Review logs for authentication errors
```

#### **Solutions:**
```bash
# Ensure x-user-id header is present
curl -H "x-user-id: valid-user-id" http://localhost:3008/api/v1/listings

# Check user ID format
# Should be a valid UUID or string
```

## 🔧 Debug Mode

### **Enable Debug Logging**
```bash
# Set debug environment variable
export DEBUG=listing-service:*

# Or in .env file
DEBUG=listing-service:*

# Restart service
pm2 restart listing-service
```

### **Verbose Logging**
```bash
# Set log level to debug
export LOG_LEVEL=debug

# Restart service
pm2 restart listing-service

# Check logs
pm2 logs listing-service --lines 100
```

## 📊 Monitoring Commands

### **Health Checks**
```bash
# Basic health
curl -s http://localhost:3008/api/v1/health | jq

# Detailed health
curl -s http://localhost:3008/api/v1/health/detailed | jq

# Component health
curl -s http://localhost:3008/api/v1/health/database | jq
curl -s http://localhost:3008/api/v1/health/redis | jq
curl -s http://localhost:3008/api/v1/health/rabbitmq | jq
curl -s http://localhost:3008/api/v1/health/jobs | jq
```

### **Metrics**
```bash
# Job metrics
curl -s http://localhost:3008/api/v1/jobs/metrics | jq

# System metrics
pm2 show listing-service

# Resource usage
htop -p $(pgrep -f listing-service)
```

### **Logs**
```bash
# PM2 logs
pm2 logs listing-service --lines 50

# Docker logs
docker logs listing-service --tail 50

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🚨 Error Codes

### **HTTP Status Codes**
- **200** - Success
- **202** - Accepted (Job created)
- **400** - Bad Request (Invalid input)
- **401** - Unauthorized (Missing authentication)
- **403** - Forbidden (Access denied)
- **404** - Not Found (Resource not found)
- **429** - Too Many Requests (Rate limit exceeded)
- **500** - Internal Server Error
- **503** - Service Unavailable (Health check failed)

### **Common Error Messages**
```json
{
  "success": false,
  "message": "Missing required fields: title, description, category, budget"
}

{
  "success": false,
  "message": "Authentication required"
}

{
  "success": false,
  "message": "Listing not found"
}

{
  "success": false,
  "message": "Rate limit exceeded"
}
```

## 🔄 Recovery Procedures

### **Service Recovery**
```bash
# Stop service
pm2 stop listing-service

# Clear logs
pm2 flush listing-service

# Restart service
pm2 start listing-service

# Check status
pm2 status listing-service
```

### **Database Recovery**
```bash
# Check database connection
curl http://localhost:3008/api/v1/health/database

# If failed, check Supabase status
# Visit Supabase dashboard

# Restart service after database is available
pm2 restart listing-service
```

### **Cache Recovery**
```bash
# Clear Redis cache
redis-cli FLUSHALL

# Restart Redis
redis-cli SHUTDOWN
redis-server

# Restart service
pm2 restart listing-service
```

### **Message Queue Recovery**
```bash
# Check RabbitMQ status
rabbitmqctl status

# If needed, restart RabbitMQ
rabbitmqctl stop
rabbitmq-server -detached

# Restart service
pm2 restart listing-service
```

## 📈 Performance Optimization

### **Memory Optimization**
```bash
# Check memory usage
pm2 monit

# Restart if memory usage is high
pm2 restart listing-service

# Increase memory limit
pm2 restart listing-service --max-memory-restart 2G
```

### **CPU Optimization**
```bash
# Check CPU usage
top -p $(pgrep -f listing-service)

# Scale horizontally
pm2 scale listing-service 2

# Use cluster mode
pm2 start ecosystem.config.js --env production
```

### **Database Optimization**
```bash
# Check slow queries
# Review database logs

# Add indexes if needed
# Optimize queries
# Use connection pooling
```

## 🔒 Security Issues

### **Authentication Problems**
```bash
# Check authentication middleware
# Verify user ID format
# Check rate limiting

# Test with valid headers
curl -H "x-user-id: valid-user-id" http://localhost:3008/api/v1/listings
```

### **CORS Issues**
```bash
# Check CORS configuration
echo $CORS_ORIGIN

# Test from different origins
curl -H "Origin: http://localhost:3000" http://localhost:3008/api/v1/health
```

### **Rate Limiting**
```bash
# Check rate limit headers
curl -I http://localhost:3008/api/v1/listings

# Look for:
# X-RateLimit-Limit: 1000
# X-RateLimit-Remaining: 999
# X-RateLimit-Reset: 1634567890
```

## 📞 Support

### **Log Collection**
```bash
# Collect logs for support
pm2 logs listing-service --lines 1000 > logs.txt

# Collect system info
uname -a > system-info.txt
node --version >> system-info.txt
npm --version >> system-info.txt
```

### **Health Report**
```bash
# Generate health report
curl -s http://localhost:3008/api/v1/health/detailed > health-report.json

# Include in support request
```

### **Contact Information**
- **GitHub Issues**: [Create an issue](https://github.com/benalsam/benalsam-standalone/issues)
- **Development Team**: Contact via internal channels
- **Documentation**: Check README.md and API_ENDPOINTS.md

## 📚 Additional Resources

### **Documentation**
- [README.md](../README.md) - Service overview
- [API_ENDPOINTS.md](../API_ENDPOINTS.md) - API documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture details
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

### **External Resources**
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [Redis Documentation](https://redis.io/docs/)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)

---

**Benalsam Listing Service Troubleshooting** - Comprehensive issue resolution guide
