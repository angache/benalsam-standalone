/**
 * Listings API Route
 * GET /api/listings - Fetch listings with advanced filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchListingsWithElasticsearch } from '@/services/elasticsearchService'
import { fetchListingsWithFilters } from '@/services/listingService/fetchers'
import { logger } from '@/utils/production-logger'
import { validateQuery, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

/**
 * Schema for listing search/filter query parameters
 */
const listingsQuerySchema = z.object({
  q: z.string().max(200).optional().default(''),
  categories: z.string().optional().transform((val) => {
    if (!val) return []
    return val.split(',').map(Number).filter((n) => !isNaN(n))
  }),
  city: z.string().max(200).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  urgency: z.enum(['very_urgent', 'urgent', 'normal', 'not_urgent']).optional(),
  dateRange: z.enum(['all', 'today', 'week', 'month']).optional().default('all'),
  featured: z.string().transform((val) => val === '1').optional().default(false),
  showcase: z.string().transform((val) => val === '1').optional().default(false),
  urgent: z.string().transform((val) => val === '1').optional().default(false),
  sort: z.enum(['newest', 'oldest', 'price_low', 'price_high', 'popular']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(24),
}).passthrough() // Allow additional query params (like attr_*)

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const validation = validateQuery(request, listingsQuerySchema)
    if (!validation.success) {
      return validation.response
    }

    const params = validation.data

    // Extract filter parameters
    const query = params.q
    const categories = params.categories
    const city = params.city
    const minPrice = params.minPrice
    const maxPrice = params.maxPrice
    const urgency = params.urgency
    const dateRange = params.dateRange
    const featured = params.featured
    const showcase = params.showcase
    const urgent = params.urgent
    const sort = params.sort
    const page = params.page
    const pageSize = params.pageSize
    
    // Parse attributes from query params
    const attributes: Record<string, string[]> = {}
    const searchParams = request.nextUrl.searchParams
    searchParams.forEach((value, key) => {
      if (key.startsWith('attr_')) {
        const attrKey = key.replace('attr_', '')
        attributes[attrKey] = value.split(',')
      }
    })

    // Map sort to created_at/price sorting
    let sortBy = 'created_at'
    let sortOrder: 'asc' | 'desc' = 'desc'

    if (sort === 'price_low') {
      sortBy = 'budget'
      sortOrder = 'asc'
    } else if (sort === 'price_high') {
      sortBy = 'budget'
      sortOrder = 'desc'
    } else if (sort === 'popular') {
      sortBy = 'views_count'
      sortOrder = 'desc'
    }

    // Build filters object
    const filters = {
      search: query || undefined,
      categoryId: categories[0] || undefined,
      minPrice,
      maxPrice,
      location: city || undefined,
      urgency,
      dateRange,
      featured,
      showcase,
      urgent,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      sortBy,
      sortOrder,
    }

    // Fetch listings
    const result = await fetchListingsWithFilters(
      undefined, // userId - will be extracted from request if needed
      filters,
      { page, limit: pageSize }
    )

    return NextResponse.json({
      success: true,
      listings: result.listings,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    })
  } catch (error: unknown) {
    logger.error('[API] /api/listings error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch listings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

