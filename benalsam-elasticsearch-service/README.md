# Benalsam Elasticsearch Service

Event-driven microservice for handling Elasticsearch operations in the Benalsam project.

## 🏗️ Architecture

```mermaid
graph TD
    A[Admin Backend] -->|Trigger| B[elasticsearch_sync_queue]
    B -->|Message| C[RabbitMQ]
    C -->|Consume| D[Elasticsearch Service]
    D -->|Update| E[Elasticsearch]
    D -->|Status| B
```

## 🚀 Features

- Real-time Elasticsearch synchronization
- Event-driven architecture with RabbitMQ
- Turkish language support with custom analyzer
- Comprehensive error handling and retry mechanism
- Health monitoring and metrics
- Docker support

## 🔧 Setup

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Access to:
  - Elasticsearch cluster
  - RabbitMQ server
  - Supabase project

### Environment Variables
```env
# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# RabbitMQ
RABBITMQ_URL=amqp://benalsam:benalsam123@localhost:5672
RABBITMQ_QUEUE=elasticsearch.sync
RABBITMQ_EXCHANGE=benalsam.listings
RABBITMQ_DLX=benalsam.listings.dlx

# Supabase
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-service-role-key

# Service
PORT=3003
NODE_ENV=development
LOG_LEVEL=info
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start the service:
```bash
npm run dev  # Development
npm start    # Production
```

### Docker

Run with Docker Compose:
```bash
cd event-system
docker-compose -f docker-compose.dev.yml up -d
```

## 📡 API Endpoints

### Health Checks

- `GET /health`: Basic health check
- `GET /health/detailed`: Detailed health status of all components
- `GET /health/elasticsearch`: Elasticsearch specific health check
- `GET /health/rabbitmq`: RabbitMQ specific health check
- `GET /health/database`: Database and job metrics

## 🔄 Message Flow

### Job Status Flow
1. `pending`: Initial state when job is created
2. `processing`: When service starts processing
3. `sent`: After successfully publishing to RabbitMQ
4. `completed`: When operation is successful
5. `failed`: If any error occurs

### Error Handling
- Automatic retry for temporary failures
- Dead letter exchange for unprocessable messages
- Detailed error logging
- Job status tracking

## 🧪 Testing

Run tests:
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage
npm run test:coverage
```

## 📊 Monitoring

### Metrics Available
- Job processing stats
- Queue depths
- Error rates
- Processing times
- Resource usage

### Health Check Response Example
```json
{
  "healthy": true,
  "status": "healthy",
  "details": {
    "elasticsearch": {
      "connected": true,
      "status": "green",
      "documents": 1000,
      "size": 5242880
    },
    "rabbitmq": {
      "connected": true,
      "consumer": {
        "running": true
      }
    },
    "jobs": {
      "total": 1000,
      "pending": 5,
      "processing": 2,
      "completed": 990,
      "failed": 3,
      "error_rate": 0.003
    }
  }
}
```

## 📝 Logging

Logs are written to:
- Console (development)
- `logs/all.log`: All log levels
- `logs/error.log`: Error logs only

## 🔒 Security

- Non-root Docker user
- Environment variable based configuration
- Input validation
- Rate limiting
- CORS protection
- Helmet security headers

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests
4. Create pull request

## 📄 License

MIT
