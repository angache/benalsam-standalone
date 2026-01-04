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
    const body = await request.json()
    const result = schema.safeParse(body)

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

