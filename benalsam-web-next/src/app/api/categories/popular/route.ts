/**
 * Popular Categories API Route
 * 
 * Returns popular categories sorted by listing count
 */

import { NextRequest, NextResponse } from 'next/server'
import { categoryService } from '@/services/categoryService'
import { logger } from '@/utils/production-logger'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    const categories = await categoryService.getPopularCategories(limit)

    return NextResponse.json(categories, { status: 200 })
  } catch (error: unknown) {
    logger.error('[API] Error fetching popular categories', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to fetch popular categories' },
      { status: 500 }
    )
  }
}

