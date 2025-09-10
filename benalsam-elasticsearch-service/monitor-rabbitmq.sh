#!/bin/bash

# RabbitMQ Queue Monitoring Script
# Usage: ./monitor-rabbitmq.sh

echo "🔍 RabbitMQ Queue Monitor"
echo "========================="

while true; do
    echo "$(date '+%H:%M:%S') - Checking queues..."
    
    # Check elasticsearch.sync queue
    SYNC_QUEUE=$(curl -s -u benalsam:benalsam123 "http://localhost:15672/api/queues/%2F/elasticsearch.sync" | jq '{messages: .messages, consumers: .consumers, state: .state}')
    
    # Check elasticsearch.sync.dlq queue
    DLQ_QUEUE=$(curl -s -u benalsam:benalsam123 "http://localhost:15672/api/queues/%2F/elasticsearch.sync.dlq" | jq '{messages: .messages, consumers: .consumers, state: .state}')
    
    echo "📥 elasticsearch.sync: $SYNC_QUEUE"
    echo "💀 elasticsearch.sync.dlq: $DLQ_QUEUE"
    echo "---"
    
    sleep 2
done
