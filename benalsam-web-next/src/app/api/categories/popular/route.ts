/**
 * Popular Categories API Route
 * 
 * Returns popular categories sorted by listing count
 */

import { NextRequest, NextResponse } from 'next/server'
import { categoryService } from '@/services/categoryService'
import { logger } from '@/utils/production-logger'
import { validateQuery } from '@/lib/api-validation'
import { z } from 'zod'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'

/**
 * Schema for popular categories query parameters
 */
const popularCategoriesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
})

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const validation = validateQuery(request, popularCategoriesQuerySchema)
    if (!validation.success) {
      return validation.response
    }

    const { limit } = validation.data

    const categories = await categoryService.getPopularCategories(limit)

    return createSuccessResponse(categories)
  } catch (error: unknown) {
    return apiErrors.internalError(
      'Failed to fetch popular categories',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}

