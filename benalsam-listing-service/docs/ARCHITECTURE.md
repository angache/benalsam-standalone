# 🏗️ Benalsam Listing Service - Architecture Documentation

## 📋 Overview

The Benalsam Listing Service is a microservice designed to handle all listing-related operations in the Benalsam platform. It follows a modern microservice architecture with job-based processing, ensuring scalability and reliability.

## 🎯 Design Principles

### **1. Single Responsibility**
- Dedicated to listing management only
- Clear separation of concerns
- Focused business logic

### **2. Asynchronous Processing**
- Job-based architecture for heavy operations
- Non-blocking API responses
- Background processing for better performance

### **3. Scalability**
- Horizontal scaling capability
- Stateless service design
- Load balancer friendly

### **4. Reliability**
- Comprehensive error handling
- Retry mechanisms
- Health monitoring

## 🏛️ Architecture Components

### **1. API Layer (Express.js)**
```
┌─────────────────────────────────────┐
│           API Layer                 │
├─────────────────────────────────────┤
│ • Express.js Framework              │
│ • Route Handlers                    │
│ • Middleware Stack                  │
│ • Request/Response Processing       │
│ • Authentication & Authorization    │
└─────────────────────────────────────┘
```

**Responsibilities:**
- HTTP request handling
- Input validation
- Authentication
- Rate limiting
- Response formatting

### **2. Business Logic Layer (Services)**
```
┌─────────────────────────────────────┐
│        Business Logic Layer         │
├─────────────────────────────────────┤
│ • ListingService                    │
│ • JobProcessorService               │
│ • UploadService                     │
│ • Validation Logic                  │
│ • Business Rules                    │
└─────────────────────────────────────┘
```

**Responsibilities:**
- Business logic implementation
- Data transformation
- Business rule enforcement
- Service orchestration

### **3. Data Layer**
```
┌─────────────────────────────────────┐
│           Data Layer                │
├─────────────────────────────────────┤
│ • Supabase (Primary Database)       │
│ • Redis (Caching)                   │
│ • RabbitMQ (Message Queue)          │
│ • File Storage (Images)             │
└─────────────────────────────────────┘
```

**Responsibilities:**
- Data persistence
- Caching
- Message queuing
- File storage

### **4. Job Processing System**
```
┌─────────────────────────────────────┐
│        Job Processing System        │
├─────────────────────────────────────┤
│ • Job Queue (RabbitMQ)              │
│ • Job Processor                     │
│ • Retry Logic                       │
│ • Status Tracking                   │
│ • Error Handling                    │
└─────────────────────────────────────┘
```

**Responsibilities:**
- Asynchronous job processing
- Job status tracking
- Retry mechanisms
- Error recovery

## 🔄 Data Flow

### **1. Listing Creation Flow**
```
User Request → API Layer → Validation → Job Creation → Job Queue → Background Processing → Database Update → Response
```

**Detailed Steps:**
1. User sends POST request to create listing
2. API layer validates input and authentication
3. Business logic creates job with listing data
4. Job is queued in RabbitMQ
5. Job processor picks up job
6. Listing is created in database
7. Job status is updated
8. User receives job ID for tracking

### **2. Listing Retrieval Flow**
```
User Request → API Layer → Authentication → Business Logic → Cache Check → Database Query → Response
```

**Detailed Steps:**
1. User sends GET request for listings
2. API layer validates authentication
3. Business logic processes filters
4. Cache is checked for existing data
5. Database query is executed
6. Results are formatted and returned

### **3. Job Status Tracking Flow**
```
User Request → API Layer → Authentication → Job Service → Job Status → Response
```

**Detailed Steps:**
1. User requests job status
2. API layer validates authentication
3. Job service retrieves job details
4. Status information is returned

## 🗄️ Database Schema

### **Listings Table**
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  location VARCHAR(255),
  urgency VARCHAR(20) DEFAULT 'medium',
  images TEXT[],
  main_image_index INTEGER DEFAULT 0,
  auto_republish BOOLEAN DEFAULT false,
  contact_preference VARCHAR(20) DEFAULT 'both',
  accept_terms BOOLEAN NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  is_urgent_premium BOOLEAN DEFAULT false,
  is_showcase BOOLEAN DEFAULT false,
  geolocation JSONB,
  condition TEXT[],
  attributes JSONB,
  duration INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### **Jobs Table**
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  user_id UUID NOT NULL,
  payload JSONB NOT NULL,
  result JSONB,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  trace_id VARCHAR(100)
);
```

## 🔧 Configuration

### **Environment Variables**
```bash
# Server Configuration
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

### **Redis Configuration**
```typescript
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
};
```

### **RabbitMQ Configuration**
```typescript
const rabbitmqConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  username: process.env.RABBITMQ_USERNAME || 'guest',
  password: process.env.RABBITMQ_PASSWORD || 'guest',
  vhost: process.env.RABBITMQ_VHOST || '/',
  heartbeat: 60,
  connectionTimeout: 30000
};
```

## 🔄 Job Processing Architecture

### **Job Types**
1. **LISTING_CREATE_REQUESTED** - Create new listing
2. **LISTING_UPDATE_REQUESTED** - Update existing listing
3. **LISTING_DELETE_REQUESTED** - Delete listing
4. **LISTING_MODERATE_REQUESTED** - Moderate listing

### **Job Lifecycle**
```
Pending → Processing → Completed/Failed
   ↓         ↓            ↓
  Queue   Background   Status Update
```

### **Job Processor**
```typescript
class JobProcessor {
  async processJob(job: Job): Promise<void> {
    try {
      // Update job status to processing
      await this.updateJobStatus(job.id, 'processing');
      
      // Process job based on type
      const result = await this.executeJob(job);
      
      // Update job with result
      await this.updateJobStatus(job.id, 'completed', result);
    } catch (error) {
      // Handle error and retry if needed
      await this.handleJobError(job, error);
    }
  }
}
```

## 📊 Monitoring & Observability

### **Health Checks**
- **Basic Health**: Service status and basic metrics
- **Detailed Health**: Component-level health checks
- **Database Health**: Database connectivity and performance
- **Redis Health**: Cache connectivity and performance
- **RabbitMQ Health**: Message queue connectivity
- **Job Processor Health**: Job processing status

### **Metrics**
- **Job Metrics**: Total, pending, processing, completed, failed jobs
- **Performance Metrics**: Response times, throughput
- **Error Metrics**: Error rates, error types
- **Resource Metrics**: Memory usage, CPU usage

### **Logging**
- **Structured Logging**: JSON format with Winston
- **Request Logging**: All API requests and responses
- **Error Logging**: Detailed error information
- **Performance Logging**: Response times and metrics

## 🔒 Security

### **Authentication**
- **User ID Header**: `x-user-id` header for user identification
- **Middleware**: Authentication middleware for all protected routes
- **Validation**: User ID validation and sanitization

### **Rate Limiting**
- **API Rate Limiting**: 1000 requests per 15 minutes
- **Authentication Rate Limiting**: 5 requests per 15 minutes
- **Job Operations Rate Limiting**: 100 requests per 15 minutes

### **Input Validation**
- **Request Validation**: All input data validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Input sanitization
- **File Upload Validation**: MIME type and size validation

## 🚀 Deployment

### **Docker Configuration**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3008

CMD ["node", "dist/index.js"]
```

### **Docker Compose**
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
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - redis
      - rabbitmq
    restart: unless-stopped
```

### **PM2 Configuration**
```javascript
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
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## 📈 Scaling

### **Horizontal Scaling**
- **Load Balancer**: Distribute requests across multiple instances
- **Stateless Design**: No session state stored in service
- **Shared Resources**: Redis and RabbitMQ for shared state

### **Vertical Scaling**
- **Memory Optimization**: Efficient memory usage
- **CPU Optimization**: Optimized processing algorithms
- **Database Optimization**: Query optimization and indexing

### **Auto-scaling**
- **Metrics-based Scaling**: Scale based on CPU, memory, and request metrics
- **Queue-based Scaling**: Scale based on job queue depth
- **Time-based Scaling**: Scale based on expected load patterns

## 🔧 Troubleshooting

### **Common Issues**

#### **Service Won't Start**
- Check port availability
- Verify environment variables
- Check database connectivity
- Review logs for errors

#### **Job Processing Issues**
- Check RabbitMQ connectivity
- Verify job processor status
- Check job queue depth
- Review job error logs

#### **Database Issues**
- Check Supabase connectivity
- Verify database credentials
- Check query performance
- Review database logs

#### **Cache Issues**
- Check Redis connectivity
- Verify cache configuration
- Check cache memory usage
- Review cache hit rates

### **Debug Commands**
```bash
# Check service status
curl http://localhost:3008/api/v1/health

# Check detailed health
curl http://localhost:3008/api/v1/health/detailed

# Check job metrics
curl http://localhost:3008/api/v1/jobs/metrics

# Check logs
docker logs listing-service

# Check Redis
redis-cli ping

# Check RabbitMQ
rabbitmqctl status
```

## 📚 References

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [Redis Documentation](https://redis.io/docs/)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Winston Logging](https://github.com/winstonjs/winston)

---

**Benalsam Listing Service Architecture** - Scalable microservice for listing management
