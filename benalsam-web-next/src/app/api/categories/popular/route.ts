/**
 * Popular Categories API Route
 * 
 * Returns popular categories sorted by listing count
 */

import { NextRequest, NextResponse } from 'next/server'
import { categoryService } from '@/services/categoryService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    const categories = await categoryService.getPopularCategories(limit)

    return NextResponse.json(categories, { status: 200 })
  } catch (error) {
    console.error('Error fetching popular categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular categories' },
      { status: 500 }
    )
  }
}

