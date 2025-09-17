// Error Types for Listing Service
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  SERVICE_ERROR = 'SERVICE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  QUOTA_EXCEEDED_ERROR = 'QUOTA_EXCEEDED_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface BaseError {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, any>;
  correlationId?: string;
}

export class ListingError extends Error implements BaseError {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;
  public readonly correlationId?: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    correlationId?: string
  ) {
    super(message);
    this.name = 'ListingError';
    this.code = code;
    this.severity = severity;
    this.timestamp = new Date();
    this.context = context;
    this.correlationId = correlationId;
  }
}

export class ValidationError extends ListingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.VALIDATION_ERROR, ErrorSeverity.LOW, context);
    this.name = 'ValidationError';
  }
}

export class UploadError extends ListingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.UPLOAD_ERROR, ErrorSeverity.MEDIUM, context);
    this.name = 'UploadError';
  }
}

export class ServiceError extends ListingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.SERVICE_ERROR, ErrorSeverity.HIGH, context);
    this.name = 'ServiceError';
  }
}

export class NetworkError extends ListingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.NETWORK_ERROR, ErrorSeverity.HIGH, context);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends ListingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.AUTHENTICATION_ERROR, ErrorSeverity.HIGH, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ListingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.AUTHORIZATION_ERROR, ErrorSeverity.HIGH, context);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends ListingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.RATE_LIMIT_ERROR, ErrorSeverity.MEDIUM, context);
    this.name = 'RateLimitError';
  }
}

export class QuotaExceededError extends ListingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.QUOTA_EXCEEDED_ERROR, ErrorSeverity.HIGH, context);
    this.name = 'QuotaExceededError';
  }
}

// Error Response Interface
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    severity: ErrorSeverity;
    timestamp: string;
    context?: Record<string, any>;
    correlationId?: string;
  };
}

// Success Response Interface
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}
