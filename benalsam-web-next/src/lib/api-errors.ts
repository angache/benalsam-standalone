/**
 * Standardized API Error Handling
 * 
 * Provides consistent error response format and error codes
 * for all API routes
 */

import { NextResponse } from 'next/server'
import { logger } from '@/utils/production-logger'

/**
 * Standard API Error Codes
 */
export enum ApiErrorCode {
  // Authentication & Authorization (1000-1999)
  UNAUTHORIZED = 'AUTH_001',
  FORBIDDEN = 'AUTH_002',
  TOKEN_EXPIRED = 'AUTH_003',
  TOKEN_INVALID = 'AUTH_004',
  INVALID_CREDENTIALS = 'AUTH_005',
  ACCOUNT_LOCKED = 'AUTH_006',
  
  // Validation Errors (2000-2999)
  VALIDATION_ERROR = 'VAL_001',
  MISSING_REQUIRED_FIELD = 'VAL_002',
  INVALID_FORMAT = 'VAL_003',
  INVALID_RANGE = 'VAL_004',
  DUPLICATE_ENTRY = 'VAL_005',
  
  // Resource Errors (3000-3999)
  NOT_FOUND = 'RES_001',
  ALREADY_EXISTS = 'RES_002',
  RESOURCE_CONFLICT = 'RES_003',
  RESOURCE_LIMIT_EXCEEDED = 'RES_004',
  
  // Server Errors (5000-5999)
  INTERNAL_ERROR = 'SRV_001',
  DATABASE_ERROR = 'SRV_002',
  EXTERNAL_SERVICE_ERROR = 'SRV_003',
  TIMEOUT = 'SRV_004',
  RATE_LIMIT_EXCEEDED = 'SRV_005',
  
  // Business Logic Errors (4000-4999)
  BUSINESS_RULE_VIOLATION = 'BIZ_001',
  INSUFFICIENT_PERMISSIONS = 'BIZ_002',
  OPERATION_NOT_ALLOWED = 'BIZ_003',
}

/**
 * Standard API Error Response
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: ApiErrorCode
    message: string
    details?: Record<string, unknown>
    timestamp: string
    path?: string
  }
}

/**
 * Standard API Success Response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  meta?: {
    page?: number
    pageSize?: number
    total?: number
    [key: string]: unknown
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  options?: {
    details?: Record<string, unknown>
    status?: number
    path?: string
    logError?: boolean
    logContext?: Record<string, unknown>
  }
): NextResponse<ApiErrorResponse> {
  const status = options?.status || getDefaultStatusForCode(code)
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details: options?.details,
      timestamp: new Date().toISOString(),
      path: options?.path,
    },
  }

  // Log error if requested (default: true for server errors)
  if (options?.logError !== false || status >= 500) {
    const logLevel = status >= 500 ? 'error' : 'warn'
    logger[logLevel](`[API] ${code}: ${message}`, {
      code,
      status,
      path: options?.path,
      details: options?.details,
      ...options?.logContext,
    })
  }

  return NextResponse.json(errorResponse, { status })
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    status?: number
    meta?: Record<string, unknown>
  }
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(options?.meta && { meta: options.meta }),
  }

  return NextResponse.json(response, { status: options?.status || 200 })
}

/**
 * Get default HTTP status code for error code
 */
function getDefaultStatusForCode(code: ApiErrorCode): number {
  const codePrefix = code.split('_')[0]
  
  switch (codePrefix) {
    case 'AUTH':
      if (code === ApiErrorCode.UNAUTHORIZED) return 401
      if (code === ApiErrorCode.FORBIDDEN) return 403
      return 401
    case 'VAL':
      return 400
    case 'RES':
      if (code === ApiErrorCode.NOT_FOUND) return 404
      if (code === ApiErrorCode.ALREADY_EXISTS) return 409
      return 400
    case 'BIZ':
      return 400
    case 'SRV':
      if (code === ApiErrorCode.RATE_LIMIT_EXCEEDED) return 429
      return 500
    default:
      return 500
  }
}

/**
 * Common error response helpers
 */
export const apiErrors = {
  unauthorized: (message = 'Unauthorized', path?: string) =>
    createErrorResponse(ApiErrorCode.UNAUTHORIZED, message, { status: 401, path }),
  
  forbidden: (message = 'Forbidden', path?: string) =>
    createErrorResponse(ApiErrorCode.FORBIDDEN, message, { status: 403, path }),
  
  notFound: (resource = 'Resource', path?: string) =>
    createErrorResponse(ApiErrorCode.NOT_FOUND, `${resource} not found`, { status: 404, path }),
  
  validationError: (message: string, details?: Record<string, unknown>, path?: string) =>
    createErrorResponse(ApiErrorCode.VALIDATION_ERROR, message, { 
      status: 400, 
      details, 
      path,
      skipSanitization: true // Validation errors are already user-friendly
    }),
  
  duplicateEntry: (resource: string, path?: string) =>
    createErrorResponse(ApiErrorCode.DUPLICATE_ENTRY, `${resource} already exists`, { status: 409, path }),
  
  internalError: (message = 'Internal server error', details?: Record<string, unknown>, path?: string) =>
    createErrorResponse(ApiErrorCode.INTERNAL_ERROR, message, { status: 500, details, path, logError: true }),
  
  databaseError: (message: string, details?: Record<string, unknown>, path?: string) =>
    createErrorResponse(ApiErrorCode.DATABASE_ERROR, message, { status: 500, details, path, logError: true }),
  
  rateLimitExceeded: (path?: string) =>
    createErrorResponse(ApiErrorCode.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', { status: 429, path }),
  
  timeout: (service: string, path?: string) =>
    createErrorResponse(ApiErrorCode.TIMEOUT, `${service} request timed out`, { status: 504, path, logError: true }),
}

