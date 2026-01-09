/**
 * API Route Validation Utilities
 * 
 * Provides Zod-based validation for Next.js API routes
 * with consistent error handling and response formatting
 */

import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/utils/production-logger'

/**
 * Validation error response format
 */
export interface ValidationError {
  field: string
  message: string
  code: string
}

/**
 * Validate request body with Zod schema
 */
export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: NextResponse }> {
  try {
    // Check if request has body
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn('[API] Invalid content-type', {
        contentType,
        path: request.nextUrl.pathname,
      })
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Invalid content-type',
              details: { reason: 'Content-Type must be application/json' },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      }
    }

    // Read and parse request body
    // Note: Next.js request.json() can only be called once
    let body: unknown
    
    try {
      // Directly parse JSON - Next.js handles this efficiently
      body = await request.json()
      
      logger.debug('[API] Request body parsed successfully', {
        path: request.nextUrl.pathname,
        bodyType: typeof body,
        bodyKeys: typeof body === 'object' && body !== null ? Object.keys(body) : 'N/A',
      })
      
      // Validate parsed body
      if (body === undefined || body === null) {
        logger.warn('[API] Parsed body is undefined or null', {
          path: request.nextUrl.pathname,
        })
        return {
          success: false,
          response: NextResponse.json(
            {
              success: false,
              error: {
                code: 'VAL_001',
                message: 'Invalid request body',
                details: { reason: 'Request body cannot be empty' },
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          ),
        }
      }
    } catch (parseError) {
      // Failed to parse JSON
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError)
      const errorStack = parseError instanceof Error ? parseError.stack : undefined
      
      logger.error('[API] Failed to parse request body as JSON', {
        error: errorMessage,
        errorType: parseError instanceof Error ? parseError.constructor.name : typeof parseError,
        errorStack,
        path: request.nextUrl.pathname,
        contentType,
        isSyntaxError: parseError instanceof SyntaxError,
      })
      
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Invalid JSON',
              details: { 
                reason: 'Request body must be valid JSON',
                error: errorMessage,
              },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      }
    }

    // Validate schema is defined
    if (!schema) {
      logger.error('[API] Schema is undefined', {
        path: request.nextUrl.pathname,
      })
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Validation schema error',
              details: { reason: 'Validation schema is not defined' },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        ),
      }
    }

    // Validate body is defined
    if (body === undefined || body === null) {
      logger.error('[API] Body is undefined or null', {
        path: request.nextUrl.pathname,
        bodyType: typeof body,
      })
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Invalid request body',
              details: { reason: 'Request body is undefined or null' },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      }
    }

    // Validate schema is a valid Zod schema
    if (!schema) {
      logger.error('[API] Schema is undefined', {
        path: request.nextUrl.pathname,
      })
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Validation schema error',
              details: { reason: 'Validation schema is not defined' },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        ),
      }
    }

    // Check if schema has the required Zod methods
    const hasSafeParse = typeof schema.safeParse === 'function'
    const hasParse = typeof schema.parse === 'function'
    const schemaType = schema?.constructor?.name || 'unknown'
    
    logger.debug('[API] Validating body with schema', {
      path: request.nextUrl.pathname,
      schemaType,
      hasSafeParse,
      hasParse,
      bodyType: typeof body,
      bodyKeys: typeof body === 'object' && body !== null ? Object.keys(body) : 'N/A',
    })

    if (!hasSafeParse && !hasParse) {
      logger.error('[API] Schema is not a valid Zod schema', {
        path: request.nextUrl.pathname,
        schemaType,
        hasSafeParse,
        hasParse,
        schemaKeys: typeof schema === 'object' && schema !== null ? Object.keys(schema) : 'N/A',
      })
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Validation schema error',
              details: { reason: 'Schema is not a valid Zod schema' },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        ),
      }
    }

    // Use safeParse if available, otherwise use parse with try-catch
    let result
    try {
      if (hasSafeParse) {
        result = schema.safeParse(body)
      } else if (hasParse) {
        // Fallback to parse with try-catch
        try {
          const parsed = schema.parse(body)
          result = { success: true, data: parsed }
        } catch (parseError) {
          result = { 
            success: false, 
            error: parseError instanceof Error ? parseError : new Error(String(parseError))
          }
        }
      } else {
        throw new Error('Schema has neither safeParse nor parse method')
      }
    } catch (parseError) {
      logger.error('[API] Schema validation error', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        errorType: parseError instanceof Error ? parseError.constructor.name : typeof parseError,
        errorStack: parseError instanceof Error ? parseError.stack : undefined,
        path: request.nextUrl.pathname,
        schemaType,
        bodyType: typeof body,
        hasSafeParse,
        hasParse,
      })
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Validation error',
              details: { 
                reason: 'Failed to validate request body',
                error: parseError instanceof Error ? parseError.message : String(parseError),
              },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      }
    }

    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }))

      logger.warn('[API] Validation failed', {
        errors,
        path: request.nextUrl.pathname,
      })

      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Validation failed',
              errors,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    logger.error('[API] JSON parse error', {
      error: error instanceof Error ? error.message : String(error),
      path: request.nextUrl.pathname,
    })

      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Invalid JSON',
              details: { reason: 'Request body must be valid JSON' },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      }
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQuery<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  try {
    const searchParams = request.nextUrl.searchParams
    const query: Record<string, string | string[]> = {}

    // Convert URLSearchParams to object
    searchParams.forEach((value, key) => {
      if (query[key]) {
        // Multiple values for same key
        const existing = query[key]
        query[key] = Array.isArray(existing) ? [...existing, value] : [existing, value]
      } else {
        query[key] = value
      }
    })

    const result = schema.safeParse(query)

    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map((err) => ({
        field: `query.${err.path.join('.')}`,
        message: err.message,
        code: err.code,
      }))

      logger.warn('[API] Query validation failed', {
        errors,
        path: request.nextUrl.pathname,
      })

      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Query validation failed',
              errors,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    logger.error('[API] Query validation error', {
      error: error instanceof Error ? error.message : String(error),
      path: request.nextUrl.pathname,
    })

      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Query validation error',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      }
  }
}

/**
 * Validate route parameters with Zod schema
 */
export function validateParams<T extends z.ZodType>(
  params: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  try {
    const result = schema.safeParse(params)

    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map((err) => ({
        field: `params.${err.path.join('.')}`,
        message: err.message,
        code: err.code,
      }))

      logger.warn('[API] Params validation failed', {
        errors,
      })

      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Invalid route parameters',
              errors,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    logger.error('[API] Params validation error', {
      error: error instanceof Error ? error.message : String(error),
    })

      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Params validation error',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      }
  }
}

/**
 * Common Zod schemas for reuse
 */
export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),

  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(24),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),

  // Search query
  searchQuery: z.string().min(1).max(200).optional(),

  // Email
  email: z.string().email('Invalid email format').max(254),

  // Password (basic validation, can be enhanced)
  password: z.string().min(8, 'Password must be at least 8 characters'),

  // Category ID
  categoryId: z.coerce.number().int().positive().optional(),

  // Price range
  priceRange: z.object({
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
  }),
}

