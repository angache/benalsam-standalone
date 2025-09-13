/**
 * Error Configuration
 * Hata tipleri ve davranışları için konfigürasyon
 */

import { ErrorType, ErrorSeverity, ErrorAction, ErrorConfig } from '../types/errors';

export const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  // Network & Connection Errors
  [ErrorType.NETWORK_ERROR]: {
    type: ErrorType.NETWORK_ERROR,
    severity: ErrorSeverity.HIGH,
    action: ErrorAction.RETRY,
    retryable: true,
    maxRetries: 3,
    retryDelay: 1000,
    alertThreshold: 5,
    description: 'Network connection error',
    recoveryStrategy: 'Exponential backoff with jitter'
  },
  
  [ErrorType.CONNECTION_TIMEOUT]: {
    type: ErrorType.CONNECTION_TIMEOUT,
    severity: ErrorSeverity.HIGH,
    action: ErrorAction.RETRY,
    retryable: true,
    maxRetries: 3,
    retryDelay: 2000,
    alertThreshold: 3,
    description: 'Connection timeout error',
    recoveryStrategy: 'Increase timeout and retry'
  },
  
  [ErrorType.CONNECTION_REFUSED]: {
    type: ErrorType.CONNECTION_REFUSED,
    severity: ErrorSeverity.CRITICAL,
    action: ErrorAction.ALERT,
    retryable: true,
    maxRetries: 5,
    retryDelay: 5000,
    alertThreshold: 1,
    description: 'Connection refused by target service',
    recoveryStrategy: 'Check service availability and retry'
  },
  
  // Elasticsearch Errors
  [ErrorType.ELASTICSEARCH_UNAVAILABLE]: {
    type: ErrorType.ELASTICSEARCH_UNAVAILABLE,
    severity: ErrorSeverity.CRITICAL,
    action: ErrorAction.ALERT,
    retryable: true,
    maxRetries: 5,
    retryDelay: 3000,
    alertThreshold: 1,
    description: 'Elasticsearch service unavailable',
    recoveryStrategy: 'Check cluster health and retry'
  },
  
  [ErrorType.ELASTICSEARCH_INDEX_NOT_FOUND]: {
    type: ErrorType.ELASTICSEARCH_INDEX_NOT_FOUND,
    severity: ErrorSeverity.HIGH,
    action: ErrorAction.RETRY,
    retryable: true,
    maxRetries: 2,
    retryDelay: 1000,
    alertThreshold: 3,
    description: 'Elasticsearch index not found',
    recoveryStrategy: 'Create index and retry'
  },
  
  [ErrorType.ELASTICSEARCH_MAPPING_ERROR]: {
    type: ErrorType.ELASTICSEARCH_MAPPING_ERROR,
    severity: ErrorSeverity.HIGH,
    action: ErrorAction.ALERT,
    retryable: false,
    alertThreshold: 1,
    description: 'Elasticsearch mapping error',
    recoveryStrategy: 'Update mapping configuration'
  },
  
  [ErrorType.ELASTICSEARCH_QUERY_ERROR]: {
    type: ErrorType.ELASTICSEARCH_QUERY_ERROR,
    severity: ErrorSeverity.MEDIUM,
    action: ErrorAction.SKIP,
    retryable: false,
    alertThreshold: 5,
    description: 'Elasticsearch query error',
    recoveryStrategy: 'Fix query syntax'
  },
  
  [ErrorType.ELASTICSEARCH_CLUSTER_ERROR]: {
    type: ErrorType.ELASTICSEARCH_CLUSTER_ERROR,
    severity: ErrorSeverity.CRITICAL,
    action: ErrorAction.ALERT,
    retryable: true,
    maxRetries: 3,
    retryDelay: 5000,
    alertThreshold: 1,
    description: 'Elasticsearch cluster error',
    recoveryStrategy: 'Check cluster status and retry'
  },
  
  // RabbitMQ Errors
  [ErrorType.RABBITMQ_UNAVAILABLE]: {
    type: ErrorType.RABBITMQ_UNAVAILABLE,
    severity: ErrorSeverity.CRITICAL,
    action: ErrorAction.ALERT,
    retryable: true,
    maxRetries: 5,
    retryDelay: 3000,
    alertThreshold: 1,
    description: 'RabbitMQ service unavailable',
    recoveryStrategy: 'Check RabbitMQ status and retry'
  },
  
  [ErrorType.RABBITMQ_CONNECTION_LOST]: {
    type: ErrorType.RABBITMQ_CONNECTION_LOST,
    severity: ErrorSeverity.HIGH,
    action: ErrorAction.RETRY,
    retryable: true,
    maxRetries: 3,
    retryDelay: 2000,
    alertThreshold: 3,
    description: 'RabbitMQ connection lost',
    recoveryStrategy: 'Reconnect and retry'
  },
  
  [ErrorType.RABBITMQ_QUEUE_NOT_FOUND]: {
    type: ErrorType.RABBITMQ_QUEUE_NOT_FOUND,
    severity: ErrorSeverity.HIGH,
    action: ErrorAction.ALERT,
    retryable: false,
    alertThreshold: 1,
    description: 'RabbitMQ queue not found',
    recoveryStrategy: 'Create queue and retry'
  },
  
  [ErrorType.RABBITMQ_EXCHANGE_NOT_FOUND]: {
    type: ErrorType.RABBITMQ_EXCHANGE_NOT_FOUND,
    severity: ErrorSeverity.HIGH,
    action: ErrorAction.ALERT,
    retryable: false,
    alertThreshold: 1,
    description: 'RabbitMQ exchange not found',
    recoveryStrategy: 'Create exchange and retry'
  },
  
  // Database Errors
  [ErrorType.DATABASE_UNAVAILABLE]: {
    type: ErrorType.DATABASE_UNAVAILABLE,
    severity: ErrorSeverity.CRITICAL,
    action: ErrorAction.ALERT,
    retryable: true,
    maxRetries: 5,
    retryDelay: 3000,
    alertThreshold: 1,
    description: 'Database service unavailable',
    recoveryStrategy: 'Check database status and retry'
  },
  
  [ErrorType.DATABASE_CONNECTION_ERROR]: {
    type: ErrorType.DATABASE_CONNECTION_ERROR,
    severity: ErrorSeverity.HIGH,
    action: ErrorAction.RETRY,
    retryable: true,
    maxRetries: 3,
    retryDelay: 2000,
    alertThreshold: 3,
    description: 'Database connection error',
    recoveryStrategy: 'Reconnect and retry'
  },
  
  [ErrorType.DATABASE_QUERY_ERROR]: {
    type: ErrorType.DATABASE_QUERY_ERROR,
    severity: ErrorSeverity.MEDIUM,
    action: ErrorAction.SKIP,
    retryable: false,
    alertThreshold: 5,
    description: 'Database query error',
    recoveryStrategy: 'Fix query syntax'
  },
  
  [ErrorType.DATABASE_CONSTRAINT_ERROR]: {
    type: ErrorType.DATABASE_CONSTRAINT_ERROR,
    severity: ErrorSeverity.MEDIUM,
    action: ErrorAction.SKIP,
    retryable: false,
    alertThreshold: 3,
    description: 'Database constraint violation',
    recoveryStrategy: 'Fix data constraints'
  },
  
  // Validation Errors
  [ErrorType.VALIDATION_ERROR]: {
    type: ErrorType.VALIDATION_ERROR,
    severity: ErrorSeverity.LOW,
    action: ErrorAction.SKIP,
    retryable: false,
    alertThreshold: 10,
    description: 'Data validation error',
    recoveryStrategy: 'Fix data format'
  },
  
  [ErrorType.INVALID_MESSAGE_FORMAT]: {
    type: ErrorType.INVALID_MESSAGE_FORMAT,
    severity: ErrorSeverity.MEDIUM,
    action: ErrorAction.SKIP,
    retryable: false,
    alertThreshold: 5,
    description: 'Invalid message format',
    recoveryStrategy: 'Fix message structure'
  },
  
  [ErrorType.MISSING_REQUIRED_FIELD]: {
    type: ErrorType.MISSING_REQUIRED_FIELD,
    severity: ErrorSeverity.MEDIUM,
    action: ErrorAction.SKIP,
    retryable: false,
    alertThreshold: 5,
    description: 'Missing required field',
    recoveryStrategy: 'Add missing field'
  },
  
  [ErrorType.INVALID_DATA_TYPE]: {
    type: ErrorType.INVALID_DATA_TYPE,
    severity: ErrorSeverity.MEDIUM,
    action: ErrorAction.SKIP,
    retryable: false,
    alertThreshold: 5,
    description: 'Invalid data type',
    recoveryStrategy: 'Fix data type'
  },
  
  // Business Logic Errors
  [ErrorType.LISTING_NOT_FOUND]: {
    type: ErrorType.LISTING_NOT_FOUND,
    severity: ErrorSeverity.MEDIUM,
    action: ErrorAction.SKIP,
    retryable: false,
    alertThreshold: 5,
    description: 'Listing not found',
    recoveryStrategy: 'Check listing existence'
  },
  
  [ErrorType.LISTING_ALREADY_EXISTS]: {
    type: ErrorType.LISTING_ALREADY_EXISTS,
    severity: ErrorSeverity.LOW,
    action: ErrorAction.SKIP,
    retryable: false,
    alertThreshold: 10,
    description: 'Listing already exists',
    recoveryStrategy: 'Update existing listing'
  },
  
  [ErrorType.INVALID_OPERATION]: {
    type: ErrorType.INVALID_OPERATION,
    severity: ErrorSeverity.MEDIUM,
    action: ErrorAction.SKIP,
    retryable: false,
    alertThreshold: 5,
    description: 'Invalid operation',
    recoveryStrategy: 'Fix operation type'
  },
  
  [ErrorType.PERMISSION_DENIED]: {
    type: ErrorType.PERMISSION_DENIED,
    severity: ErrorSeverity.HIGH,
    action: ErrorAction.ALERT,
    retryable: false,
    alertThreshold: 1,
    description: 'Permission denied',
    recoveryStrategy: 'Check permissions'
  },
  
  // System Errors
  [ErrorType.INTERNAL_ERROR]: {
    type: ErrorType.INTERNAL_ERROR,
    severity: ErrorSeverity.CRITICAL,
    action: ErrorAction.ALERT,
    retryable: true,
    maxRetries: 2,
    retryDelay: 5000,
    alertThreshold: 1,
    description: 'Internal system error',
    recoveryStrategy: 'Check system logs and retry'
  },
  
  [ErrorType.OUT_OF_MEMORY]: {
    type: ErrorType.OUT_OF_MEMORY,
    severity: ErrorSeverity.CRITICAL,
    action: ErrorAction.ALERT,
    retryable: false,
    alertThreshold: 1,
    description: 'Out of memory error',
    recoveryStrategy: 'Increase memory allocation'
  },
  
  [ErrorType.RATE_LIMIT_EXCEEDED]: {
    type: ErrorType.RATE_LIMIT_EXCEEDED,
    severity: ErrorSeverity.MEDIUM,
    action: ErrorAction.RETRY,
    retryable: true,
    maxRetries: 3,
    retryDelay: 10000,
    alertThreshold: 5,
    description: 'Rate limit exceeded',
    recoveryStrategy: 'Wait and retry'
  },
  
  [ErrorType.CIRCUIT_BREAKER_OPEN]: {
    type: ErrorType.CIRCUIT_BREAKER_OPEN,
    severity: ErrorSeverity.HIGH,
    action: ErrorAction.RETRY,
    retryable: true,
    maxRetries: 1,
    retryDelay: 30000,
    alertThreshold: 1,
    description: 'Circuit breaker is open',
    recoveryStrategy: 'Wait for circuit breaker to close'
  },
  
  // Retry & DLQ Errors
  [ErrorType.MAX_RETRIES_EXCEEDED]: {
    type: ErrorType.MAX_RETRIES_EXCEEDED,
    severity: ErrorSeverity.HIGH,
    action: ErrorAction.DLQ,
    retryable: false,
    alertThreshold: 1,
    description: 'Maximum retries exceeded',
    recoveryStrategy: 'Send to Dead Letter Queue'
  },
  
  [ErrorType.DLQ_MESSAGE]: {
    type: ErrorType.DLQ_MESSAGE,
    severity: ErrorSeverity.HIGH,
    action: ErrorAction.ALERT,
    retryable: false,
    alertThreshold: 1,
    description: 'Message sent to Dead Letter Queue',
    recoveryStrategy: 'Manual intervention required'
  },
  
  [ErrorType.RETRY_FAILED]: {
    type: ErrorType.RETRY_FAILED,
    severity: ErrorSeverity.HIGH,
    action: ErrorAction.DLQ,
    retryable: false,
    alertThreshold: 1,
    description: 'Retry operation failed',
    recoveryStrategy: 'Send to Dead Letter Queue'
  }
};

export const getErrorConfig = (errorType: ErrorType): ErrorConfig => {
  return ERROR_CONFIGS[errorType] || ERROR_CONFIGS[ErrorType.INTERNAL_ERROR];
};

export const isRetryableError = (errorType: ErrorType): boolean => {
  return getErrorConfig(errorType).retryable;
};

export const shouldAlert = (errorType: ErrorType, count: number): boolean => {
  const config = getErrorConfig(errorType);
  return count >= (config.alertThreshold || 1);
};
