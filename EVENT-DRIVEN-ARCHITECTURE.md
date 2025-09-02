# Event-Driven Architecture Documentation

## Overview
Benalsam uses an event-driven architecture for handling asynchronous operations, particularly for Elasticsearch synchronization and listing status changes. This document describes the architecture, components, and flow of the system.

## Architecture Components

### 1. Message Broker (RabbitMQ)
- **Host**: localhost:5672 (development)
- **Management UI**: http://localhost:15672
- **Credentials**: 
  - Username: benalsam
  - Password: benalsam123

#### Exchanges
1. `benalsam.listings` (topic)
   - Handles all listing-related events
   - Routing patterns:
     - `listing.insert`: New listing events
     - `listing.update`: Listing update events
     - `listing.delete`: Listing deletion events
     - `listing.status.*`: Listing status change events

2. `benalsam.system` (topic)
   - Handles system-level events
   - Routing patterns:
     - `health.*`: Health check events

#### Queues
1. `elasticsearch.sync`
   - Bound to: `benalsam.listings`
   - Routing key: `listing.#`
   - Purpose: Elasticsearch synchronization

2. `listing.status.changes`
   - Bound to: `benalsam.listings`
   - Routing key: `listing.status.#`
   - Purpose: Status change notifications

3. `system.health`
   - Bound to: `benalsam.system`
   - Routing key: `health.#`
   - Purpose: System health monitoring

### 2. Admin Backend (Publisher)
- **Role**: Publishes events to RabbitMQ
- **Components**:
  - `DatabaseTriggerBridge`: Monitors database changes
  - `RabbitMQService`: Handles RabbitMQ connections and publishing

#### Job Status Flow
1. `pending`: Initial state when job is created by trigger
2. `processing`: When DatabaseTriggerBridge starts processing
3. `sent`: After successfully publishing to RabbitMQ
4. `completed`: When consumer confirms processing
5. `failed`: If any error occurs

#### Database Trigger
```sql
CREATE OR REPLACE FUNCTION add_to_sync_queue()
RETURNS TRIGGER AS $$
-- See 003_update_elasticsearch_trigger.sql for full implementation
$$;
```

### 3. Elasticsearch Service (Consumer) [Coming Soon]
- **Role**: Consumes events and updates Elasticsearch
- **Responsibilities**:
  - Listen to `elasticsearch.sync` queue
  - Process listing operations
  - Update job statuses
  - Handle errors and retries

## Message Flow

### 1. Listing Status Change
```mermaid
sequenceDiagram
    participant Admin
    participant Backend
    participant DB
    participant RabbitMQ
    participant ES Service
    participant Elasticsearch

    Admin->>Backend: Change listing status
    Backend->>DB: Update listing
    DB->>DB: Trigger fires
    DB->>DB: Create job (pending)
    Backend->>DB: Mark job processing
    Backend->>RabbitMQ: Publish messages
    Backend->>DB: Mark job sent
    RabbitMQ->>ES Service: Consume message
    ES Service->>Elasticsearch: Update index
    ES Service->>DB: Mark job completed
```

### 2. Error Handling
```mermaid
sequenceDiagram
    participant Backend
    participant RabbitMQ
    participant ES Service
    participant DB

    Backend->>RabbitMQ: Publish fails
    Backend->>DB: Mark job failed
    Note over Backend,DB: Retry via DatabaseTriggerBridge

    RabbitMQ->>ES Service: Consume message
    ES Service->>ES Service: Process fails
    ES Service->>DB: Mark job failed
    Note over ES Service,DB: Retry via ES Service
```

## Configuration

### Environment Variables
```env
# RabbitMQ
RABBITMQ_URL=amqp://benalsam:benalsam123@localhost:5672

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# Database
DATABASE_URL=postgres://...
```

### Health Checks
1. RabbitMQ Connection: `GET /api/v1/health/rabbitmq`
2. Database Trigger: `GET /api/v1/health/database-trigger-bridge`
3. Elasticsearch Service: `GET /api/v1/health/elasticsearch-service` (coming soon)

## Development Setup

1. Start Event System:
```bash
cd event-system
docker-compose -f docker-compose.dev.yml up -d
```

2. Start Admin Backend:
```bash
cd benalsam-admin-backend
npm run dev
```

3. Start Elasticsearch Service (coming soon):
```bash
cd benalsam-elasticsearch-service
npm run dev
```

## Monitoring

### RabbitMQ Management UI
- URL: http://localhost:15672
- Features:
  - Queue monitoring
  - Message rates
  - Connection status
  - Exchange bindings

### Job Status Monitoring
```sql
-- Monitor job statuses
SELECT status, count(*) 
FROM elasticsearch_sync_queue 
GROUP BY status;

-- Monitor processing times
SELECT 
    status,
    avg(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time
FROM elasticsearch_sync_queue 
GROUP BY status;
```

## Error Handling

### Common Error Scenarios
1. RabbitMQ Connection Lost
   - Automatic reconnection with exponential backoff
   - Jobs remain in current state
   - Processing resumes on reconnection

2. Message Publishing Fails
   - Job marked as failed
   - Error logged with details
   - Automatic retry via DatabaseTriggerBridge

3. Consumer Processing Fails
   - Job marked as failed
   - Error logged with details
   - Retry mechanism in ES Service (coming soon)

## Best Practices

1. Message Publishing
   - Always include messageId
   - Use appropriate routing keys
   - Include necessary metadata

2. Error Handling
   - Log detailed error information
   - Implement retry with backoff
   - Preserve failed messages

3. Monitoring
   - Regular health checks
   - Monitor queue depths
   - Track processing times

## Future Improvements

1. Circuit Breaker
   - Prevent overwhelming services
   - Handle degraded states gracefully

2. Dead Letter Exchange
   - Handle unprocessable messages
   - Provide manual intervention mechanism

3. Message Schema Validation
   - Ensure message format consistency
   - Prevent invalid messages

4. Enhanced Monitoring
   - Prometheus metrics
   - Grafana dashboards
   - Alert rules
