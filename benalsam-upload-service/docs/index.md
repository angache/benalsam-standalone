# 📚 Upload Service Documentation

Welcome to the Upload Service documentation! This microservice handles all image upload operations, processing, and Cloudinary integration for the Benalsam platform.

## 📋 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start Service**
   ```bash
   npm run dev
   ```

4. **Health Check**
   ```bash
   curl http://localhost:3007/api/v1/health
   ```

## 📖 Documentation Sections

### **Core Documentation**
- [README](../README.md) - Complete service overview
- [API Endpoints](API_ENDPOINTS.md) - Detailed API documentation
- [Changelog](CHANGELOG.md) - Version history

### **Technical Documentation**
- [Job System](job-system.md) - Background job processing
- [Cloudinary Integration](cloudinary.md) - Image storage and processing
- [Monitoring](monitoring.md) - Health checks and metrics

## 🚀 Features

- ✅ **Image Upload**: Single and multiple image upload
- ✅ **Cloudinary Integration**: Professional image processing
- ✅ **Job System**: Asynchronous processing
- ✅ **Rate Limiting**: Request throttling
- ✅ **Quota Management**: User-based limits
- ✅ **Health Monitoring**: Comprehensive health checks
- ✅ **Error Handling**: Robust error management
- ✅ **Validation**: Input validation and sanitization

## 🔧 API Endpoints

### **Health & Monitoring**
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health check
- `GET /api/v1/health/database` - Database health
- `GET /api/v1/health/redis` - Redis health
- `GET /api/v1/health/rabbitmq` - RabbitMQ health
- `GET /api/v1/health/jobs` - Job processor health

### **Upload Operations**
- `POST /api/v1/upload/listings` - Upload listing images
- `POST /api/v1/upload/inventory` - Upload inventory images
- `POST /api/v1/upload/single` - Upload single image

### **Job Management**
- `GET /api/v1/jobs/metrics` - Job metrics
- `GET /api/v1/jobs/:id` - Get job details
- `DELETE /api/v1/jobs/:id` - Cancel job
- `GET /api/v1/jobs/:id/status` - Get job status

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test
npm test -- --grep "health"
```

## 📊 Monitoring

- **Health Checks**: Multiple health endpoints
- **Prometheus Metrics**: Custom metrics collection
- **Grafana Dashboards**: Visual monitoring
- **Alertmanager**: Alert management
- **Structured Logging**: Winston logging

## 🔗 Related Services

- [Admin Backend](../../benalsam-admin-backend/) - Admin operations
- [Elasticsearch Service](../../benalsam-elasticsearch-service/) - Search and indexing
- [Listing Service](../../benalsam-listing-service/) - Listing management

## 📞 Support

For questions or issues:
1. Check the [API documentation](API_ENDPOINTS.md)
2. Review the [troubleshooting guide](monitoring.md#troubleshooting)
3. Check service logs
4. Contact the development team

---

**Last Updated**: 15 Eylül 2025, 10:30  
**Version**: 1.0.0
