/**
 * Listings API Route
 * GET /api/listings - Fetch listings with advanced filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchListingsWithElasticsearch } from '@/services/elasticsearchService'
import { fetchListingsWithFilters } from '@/services/listingService/fetchers'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Extract filter parameters
    const query = searchParams.get('q') || ''
    const categories = searchParams.get('categories')?.split(',').map(Number) || []
    const city = searchParams.get('city') || undefined
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
    const urgency = searchParams.get('urgency') || undefined
    const dateRange = searchParams.get('dateRange') || 'all'
    const featured = searchParams.get('featured') === '1'
    const showcase = searchParams.get('showcase') === '1'
    const urgent = searchParams.get('urgent') === '1'
    const sort = searchParams.get('sort') || 'newest'
    const page = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('pageSize')) || 24
    
    // 🆕 Parse attributes from query params
    // Format: ?attributes=brand:Samsung,Apple&attributes=color:Siyah
    const attributes: Record<string, string[]> = {}
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
  } catch (error) {
    console.error('❌ [API] /api/listings error:', error)
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

