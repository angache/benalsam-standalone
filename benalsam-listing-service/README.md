# 🏢 Benalsam Listing Service

**Dedicated microservice for listing management with job system**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/benalsam/benalsam-standalone)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📋 Overview

The Benalsam Listing Service is a dedicated microservice responsible for managing listings in the Benalsam platform. It provides comprehensive CRUD operations, job-based processing, and real-time status tracking for all listing-related operations.

## 🚀 Features

### Core Functionality
- **CRUD Operations**: Create, read, update, delete listings
- **Job System**: Asynchronous processing for all operations
- **Real-time Status**: Track job progress and completion
- **Advanced Filtering**: Search, filter, and sort listings
- **Moderation**: Admin moderation capabilities
- **Health Monitoring**: Comprehensive health checks

### Technical Features
- **TypeScript**: Full type safety
- **Express.js**: Fast and reliable web framework
- **Redis**: Caching and session management
- **RabbitMQ**: Message queuing for job processing
- **Supabase**: Database operations
- **Rate Limiting**: API protection
- **Error Handling**: Comprehensive error management
- **Logging**: Structured logging with Winston

## 🏗️ Architecture

### Service Components
```
Listing Service
├── API Layer (Express.js)
├── Business Logic (Services)
├── Data Layer (Supabase)
├── Cache Layer (Redis)
├── Message Queue (RabbitMQ)
└── Job Processor (Background Jobs)
```

### Job Types
- `LISTING_CREATE_REQUESTED` - Create new listing
- `LISTING_UPDATE_REQUESTED` - Update existing listing
- `LISTING_DELETE_REQUESTED` - Delete listing
- `LISTING_MODERATE_REQUESTED` - Moderate listing

## 📦 Installation

### Prerequisites
- Node.js 18+
- Redis
- RabbitMQ
- Supabase account

### Setup
```bash
# Clone the repository
git clone https://github.com/benalsam/benalsam-standalone.git
cd benalsam-standalone/benalsam-listing-service

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Configure environment variables
# Edit .env file with your settings

# Build the project
npm run build

# Start the service
npm run dev
```

## ⚙️ Configuration

### Environment Variables
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

## 🚀 Usage

### Starting the Service
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start

# With PM2
pm2 start ecosystem.config.js
```

### Health Checks
```bash
# Basic health check
curl http://localhost:3008/api/v1/health

# Detailed health check
curl http://localhost:3008/api/v1/health/detailed

# Component-specific checks
curl http://localhost:3008/api/v1/health/database
curl http://localhost:3008/api/v1/health/redis
curl http://localhost:3008/api/v1/health/rabbitmq
curl http://localhost:3008/api/v1/health/jobs
```

## 📚 API Documentation

### Base URL
```
Development: http://localhost:3008/api/v1
Production: https://listing.benalsam.com/api/v1
```

### Authentication
All endpoints require authentication via `x-user-id` header:
```bash
curl -H "x-user-id: user-123" http://localhost:3008/api/v1/listings
```

### Endpoints

#### Listings
- `GET /listings` - Get all listings with filters
- `GET /listings/:id` - Get single listing
- `POST /listings` - Create new listing
- `PUT /listings/:id` - Update listing
- `DELETE /listings/:id` - Delete listing
- `POST /listings/:id/moderate` - Moderate listing

#### Jobs
- `GET /jobs/metrics` - Get job metrics
- `GET /jobs/:id` - Get job details
- `DELETE /jobs/:id` - Cancel job
- `GET /jobs/:id/status` - Get job status

#### Health
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check
- `GET /health/database` - Database health
- `GET /health/redis` - Redis health
- `GET /health/rabbitmq` - RabbitMQ health
- `GET /health/jobs` - Job processor health

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Examples
```bash
# Test health endpoint
curl http://localhost:3008/api/v1/health

# Test listing creation
curl -X POST http://localhost:3008/api/v1/listings \
  -H "x-user-id: test-user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Listing",
    "description": "Test Description",
    "category": "Electronics",
    "budget": 1000
  }'
```

## 📊 Monitoring

### Metrics
The service provides comprehensive metrics for monitoring:
- Job processing metrics
- API response times
- Error rates
- Memory usage
- Database connection status

### Health Checks
Multiple health check endpoints provide detailed system status:
- Service health
- Database connectivity
- Redis connectivity
- RabbitMQ connectivity
- Job processor status

### Logging
Structured logging with Winston provides:
- Request/response logging
- Error tracking
- Performance metrics
- Debug information

## 🔧 Development

### Project Structure
```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript types
├── utils/           # Utility functions
└── index.ts         # Main application file
```

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Consistent naming conventions

### Adding New Features
1. Create new route in `src/routes/`
2. Add business logic in `src/services/`
3. Update types in `src/types/`
4. Add tests
5. Update documentation

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check if port is available
lsof -i :3008

# Check environment variables
cat .env

# Check logs
npm run dev
```

#### Database Connection Issues
```bash
# Test database connection
curl http://localhost:3008/api/v1/health/database

# Check Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

#### Redis Connection Issues
```bash
# Test Redis connection
curl http://localhost:3008/api/v1/health/redis

# Check Redis status
redis-cli ping
```

#### RabbitMQ Connection Issues
```bash
# Test RabbitMQ connection
curl http://localhost:3008/api/v1/health/rabbitmq

# Check RabbitMQ status
rabbitmqctl status
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Enable specific debug modules
DEBUG=listing-service:* npm run dev
```

## 📈 Performance

### Optimization Tips
- Use Redis caching for frequently accessed data
- Implement pagination for large datasets
- Use job system for heavy operations
- Monitor memory usage
- Optimize database queries

### Scaling
- Horizontal scaling with load balancer
- Redis clustering for cache
- RabbitMQ clustering for message queue
- Database read replicas

## 🔒 Security

### Security Features
- Rate limiting
- Input validation
- Authentication middleware
- CORS protection
- Helmet security headers
- Error sanitization

### Best Practices
- Validate all inputs
- Use parameterized queries
- Implement proper error handling
- Log security events
- Regular security updates

## 📝 Changelog

### v1.0.0 (2025-09-15)
- Initial release
- CRUD operations for listings
- Job system implementation
- Health monitoring
- Comprehensive API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Benalsam Listing Service** - Dedicated microservice for listing management with job system
