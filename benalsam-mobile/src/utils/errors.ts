import { ApiResponse } from '../types';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): ApiResponse<null> {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details
      }
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, details?: any) {
    super('AUTHENTICATION_ERROR', message, details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, details?: any) {
    super('AUTHORIZATION_ERROR', message, details);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: any) {
    super('NETWORK_ERROR', message, details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super('DATABASE_ERROR', message, details);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super('NOT_FOUND_ERROR', message, details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

// Error handler utility functions
export const handleError = (error: unknown): ApiResponse<any> => {
  if (error instanceof AppError) {
    return error.toJSON();
  }

  if (error instanceof Error) {
    return new AppError('UNKNOWN_ERROR', error.message, { originalError: error }).toJSON();
  }

  return new AppError('UNKNOWN_ERROR', 'An unknown error occurred', { originalError: error }).toJSON();
};

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

// Error messages
export const ErrorMessages = {
  VALIDATION: {
    REQUIRED_FIELD: (field: string) => `${field} is required`,
    INVALID_FORMAT: (field: string) => `${field} format is invalid`,
    MIN_LENGTH: (field: string, length: number) => `${field} must be at least ${length} characters`,
    MAX_LENGTH: (field: string, length: number) => `${field} must be at most ${length} characters`,
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    SESSION_EXPIRED: 'Your session has expired, please login again',
  },
  NETWORK: {
    CONNECTION_ERROR: 'Unable to connect to the server',
    TIMEOUT: 'Request timed out',
    SERVER_ERROR: 'Server error occurred',
  },
  DATABASE: {
    QUERY_FAILED: 'Database query failed',
    CONNECTION_ERROR: 'Database connection error',
  },
  GENERAL: {
    NOT_FOUND: (resource: string) => `${resource} not found`,
    ALREADY_EXISTS: (resource: string) => `${resource} already exists`,
    OPERATION_FAILED: (operation: string) => `Failed to ${operation}`,
  },
}; 