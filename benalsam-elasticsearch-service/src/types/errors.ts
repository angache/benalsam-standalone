/**
 * Error Management Types
 * Hata yönetimi için tip tanımları
 */

export enum ErrorType {
  // Network & Connection Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  
  // Elasticsearch Errors
  ELASTICSEARCH_UNAVAILABLE = 'ELASTICSEARCH_UNAVAILABLE',
  ELASTICSEARCH_INDEX_NOT_FOUND = 'ELASTICSEARCH_INDEX_NOT_FOUND',
  ELASTICSEARCH_MAPPING_ERROR = 'ELASTICSEARCH_MAPPING_ERROR',
  ELASTICSEARCH_QUERY_ERROR = 'ELASTICSEARCH_QUERY_ERROR',
  ELASTICSEARCH_CLUSTER_ERROR = 'ELASTICSEARCH_CLUSTER_ERROR',
  
  // RabbitMQ Errors
  RABBITMQ_UNAVAILABLE = 'RABBITMQ_UNAVAILABLE',
  RABBITMQ_CONNECTION_LOST = 'RABBITMQ_CONNECTION_LOST',
  RABBITMQ_QUEUE_NOT_FOUND = 'RABBITMQ_QUEUE_NOT_FOUND',
  RABBITMQ_EXCHANGE_NOT_FOUND = 'RABBITMQ_EXCHANGE_NOT_FOUND',
  
  // Database Errors
  DATABASE_UNAVAILABLE = 'DATABASE_UNAVAILABLE',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_CONSTRAINT_ERROR = 'DATABASE_CONSTRAINT_ERROR',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_MESSAGE_FORMAT = 'INVALID_MESSAGE_FORMAT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_DATA_TYPE = 'INVALID_DATA_TYPE',
  
  // Business Logic Errors
  LISTING_NOT_FOUND = 'LISTING_NOT_FOUND',
  LISTING_ALREADY_EXISTS = 'LISTING_ALREADY_EXISTS',
  INVALID_OPERATION = 'INVALID_OPERATION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
  
  // Retry & DLQ Errors
  MAX_RETRIES_EXCEEDED = 'MAX_RETRIES_EXCEEDED',
  DLQ_MESSAGE = 'DLQ_MESSAGE',
  RETRY_FAILED = 'RETRY_FAILED'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ErrorAction {
  RETRY = 'RETRY',
  SKIP = 'SKIP',
  FAIL = 'FAIL',
  DLQ = 'DLQ',
  ALERT = 'ALERT',
  IGNORE = 'IGNORE'
}

export interface ErrorConfig {
  type: ErrorType;
  severity: ErrorSeverity;
  action: ErrorAction;
  retryable: boolean;
  maxRetries?: number;
  retryDelay?: number;
  alertThreshold?: number;
  description: string;
  recoveryStrategy?: string;
}

export interface CustomError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  action: ErrorAction;
  retryable: boolean;
  traceId?: string;
  context?: Record<string, any>;
  timestamp: Date;
  retryCount?: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  retryableErrors: number;
  nonRetryableErrors: number;
  dlqMessages: number;
  alertCount: number;
}

export interface ErrorRecoveryResult {
  success: boolean;
  action: ErrorAction;
  retryCount: number;
  nextRetryAt?: Date;
  dlqMessageId?: string;
  alertSent?: boolean;
}
