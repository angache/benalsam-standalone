import * as prometheus from 'prom-client';
import logger from '../config/logger';

/**
 * Prometheus Metrics Service
 * Production-ready monitoring for RabbitMQ operations
 */
export class MetricsService {
  private static instance: MetricsService;
  
  // Message Processing Metrics
  public readonly messageProcessedTotal: prometheus.Counter<string>;
  public readonly messageProcessingDuration: prometheus.Histogram<string>;
  public readonly messageProcessingErrors: prometheus.Counter<string>;
  
  // Queue Metrics
  public readonly queueDepth: prometheus.Gauge<string>;
  public readonly queueMessagesTotal: prometheus.Counter<string>;
  
  // Connection Metrics
  public readonly connectionStatus: prometheus.Gauge<string>;
  public readonly connectionErrors: prometheus.Counter<string>;
  public readonly reconnectionAttempts: prometheus.Counter<string>;
  
  // DLQ Metrics
  public readonly dlqMessagesTotal: prometheus.Counter<string>;
  public readonly dlqDepth: prometheus.Gauge<string>;
  
  // Performance Metrics
  public readonly messageRetries: prometheus.Counter<string>;
  public readonly inFlightMessages: prometheus.Gauge<string>;
  public readonly processingLatency: prometheus.Histogram<string>;

  private constructor() {
    // Initialize Prometheus registry
    prometheus.collectDefaultMetrics({
      prefix: 'benalsam_queue_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });

    // Message Processing Metrics
    this.messageProcessedTotal = new prometheus.Counter({
      name: 'benalsam_queue_messages_processed_total',
      help: 'Total number of messages processed',
      labelNames: ['queue', 'status', 'operation'],
      registers: [prometheus.register]
    });

    this.messageProcessingDuration = new prometheus.Histogram({
      name: 'benalsam_queue_message_processing_duration_seconds',
      help: 'Message processing duration in seconds',
      labelNames: ['queue', 'operation'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [prometheus.register]
    });

    this.messageProcessingErrors = new prometheus.Counter({
      name: 'benalsam_queue_message_processing_errors_total',
      help: 'Total number of message processing errors',
      labelNames: ['queue', 'error_type', 'operation'],
      registers: [prometheus.register]
    });

    // Queue Metrics
    this.queueDepth = new prometheus.Gauge({
      name: 'benalsam_queue_depth',
      help: 'Current queue depth (number of messages)',
      labelNames: ['queue'],
      registers: [prometheus.register]
    });

    this.queueMessagesTotal = new prometheus.Counter({
      name: 'benalsam_queue_messages_total',
      help: 'Total number of messages in queue',
      labelNames: ['queue', 'action'], // action: published, consumed, requeued
      registers: [prometheus.register]
    });

    // Connection Metrics
    this.connectionStatus = new prometheus.Gauge({
      name: 'benalsam_queue_connection_status',
      help: 'RabbitMQ connection status (1=connected, 0=disconnected)',
      registers: [prometheus.register]
    });

    this.connectionErrors = new prometheus.Counter({
      name: 'benalsam_queue_connection_errors_total',
      help: 'Total number of connection errors',
      labelNames: ['error_type'],
      registers: [prometheus.register]
    });

    this.reconnectionAttempts = new prometheus.Counter({
      name: 'benalsam_queue_reconnection_attempts_total',
      help: 'Total number of reconnection attempts',
      labelNames: ['status'], // status: success, failed
      registers: [prometheus.register]
    });

    // DLQ Metrics
    this.dlqMessagesTotal = new prometheus.Counter({
      name: 'benalsam_queue_dlq_messages_total',
      help: 'Total number of messages sent to DLQ',
      labelNames: ['original_queue', 'reason'],
      registers: [prometheus.register]
    });

    this.dlqDepth = new prometheus.Gauge({
      name: 'benalsam_queue_dlq_depth',
      help: 'Current DLQ depth (number of messages)',
      registers: [prometheus.register]
    });

    // Performance Metrics
    this.messageRetries = new prometheus.Counter({
      name: 'benalsam_queue_message_retries_total',
      help: 'Total number of message retries',
      labelNames: ['queue', 'retry_count'],
      registers: [prometheus.register]
    });

    this.inFlightMessages = new prometheus.Gauge({
      name: 'benalsam_queue_in_flight_messages',
      help: 'Current number of in-flight messages',
      labelNames: ['queue'],
      registers: [prometheus.register]
    });

    this.processingLatency = new prometheus.Histogram({
      name: 'benalsam_queue_processing_latency_seconds',
      help: 'Message processing latency',
      labelNames: ['queue', 'operation'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [prometheus.register]
    });

    logger.info('✅ Prometheus metrics initialized');
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  // Message Processing Metrics
  public recordMessageProcessed(queue: string, status: 'success' | 'failed', operation: string): void {
    this.messageProcessedTotal.inc({ queue, status, operation });
  }

  public recordMessageProcessingDuration(queue: string, operation: string, duration: number): void {
    this.messageProcessingDuration.observe({ queue, operation }, duration);
  }

  public recordMessageProcessingError(queue: string, errorType: string, operation: string): void {
    this.messageProcessingErrors.inc({ queue, error_type: errorType, operation });
  }

  // Queue Metrics
  public setQueueDepth(queue: string, depth: number): void {
    this.queueDepth.set({ queue }, depth);
  }

  public recordQueueMessage(queue: string, action: 'published' | 'consumed' | 'requeued'): void {
    this.queueMessagesTotal.inc({ queue, action });
  }

  // Connection Metrics
  public setConnectionStatus(connected: boolean): void {
    this.connectionStatus.set(connected ? 1 : 0);
  }

  public recordConnectionError(errorType: string): void {
    this.connectionErrors.inc({ error_type: errorType });
  }

  public recordReconnectionAttempt(status: 'success' | 'failed'): void {
    this.reconnectionAttempts.inc({ status });
  }

  // DLQ Metrics
  public recordDLQMessage(originalQueue: string, reason: string): void {
    this.dlqMessagesTotal.inc({ original_queue: originalQueue, reason });
  }

  public setDLQDepth(depth: number): void {
    this.dlqDepth.set(depth);
  }

  // Performance Metrics
  public recordMessageRetry(queue: string, retryCount: number): void {
    this.messageRetries.inc({ queue, retry_count: retryCount.toString() });
  }

  public setInFlightMessages(queue: string, count: number): void {
    this.inFlightMessages.set({ queue }, count);
  }

  public recordProcessingLatency(queue: string, operation: string, latency: number): void {
    this.processingLatency.observe({ queue, operation }, latency);
  }

  // Utility Methods
  public async getMetrics(): Promise<string> {
    return prometheus.register.metrics();
  }

  public getMetricsContentType(): string {
    return prometheus.register.contentType;
  }

  public resetMetrics(): void {
    prometheus.register.clear();
    logger.info('🔄 Prometheus metrics reset');
  }

  // Health Check with Metrics
  public async getHealthMetrics(): Promise<{
    totalMessagesProcessed: number;
    totalErrors: number;
    connectionStatus: number;
    inFlightMessages: number;
    dlqDepth: number;
  }> {
    const metrics = await prometheus.register.getMetricsAsJSON();
    
    let totalMessagesProcessed = 0;
    let totalErrors = 0;
    let connectionStatus = 0;
    let inFlightMessages = 0;
    let dlqDepth = 0;

    for (const metric of metrics) {
      if (metric.name === 'benalsam_queue_messages_processed_total') {
        totalMessagesProcessed = metric.values.reduce((sum: number, val: any) => sum + val.value, 0);
      }
      if (metric.name === 'benalsam_queue_message_processing_errors_total') {
        totalErrors = metric.values.reduce((sum: number, val: any) => sum + val.value, 0);
      }
      if (metric.name === 'benalsam_queue_connection_status') {
        connectionStatus = metric.values[0]?.value || 0;
      }
      if (metric.name === 'benalsam_queue_in_flight_messages') {
        inFlightMessages = metric.values.reduce((sum: number, val: any) => sum + val.value, 0);
      }
      if (metric.name === 'benalsam_queue_dlq_depth') {
        dlqDepth = metric.values[0]?.value || 0;
      }
    }

    return {
      totalMessagesProcessed,
      totalErrors,
      connectionStatus,
      inFlightMessages,
      dlqDepth
    };
  }
}

// Export singleton instance
export const metricsService = MetricsService.getInstance();
