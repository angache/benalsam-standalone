import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser()

    if (!user?.id) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id)
    const allowed = await rateLimiters.standard.check(identifier)
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'my-listings' })
      return rateLimitExceeded()
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: listings, error } = await supabaseAdmin
      .from('listings')
      .select(`
        *,
        offers:offers(count),
        favorites:user_favorites(count)
      `)
      .eq('user_id', user.id)
      .order('is_urgent_premium', { ascending: false })
      .order('is_featured', { ascending: false })
      .order('is_showcase', { ascending: false })
      .order('upped_at', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return apiErrors.databaseError(
        'Failed to fetch listings',
        { error: error instanceof Error ? error.message : String(error), userId: user.id },
        request.nextUrl.pathname
      )
    }

    // Process listings to include counts
    interface ListingWithCounts {
      offers?: Array<{ count: number }>
      favorites?: Array<{ count: number }>
      [key: string]: unknown
    }
    const processedListings = listings?.map((listing: ListingWithCounts) => ({
      ...listing,
      offers_count: listing.offers?.[0]?.count || 0,
      favorites_count: listing.favorites?.[0]?.count || 0
    })) || []

    return createSuccessResponse({ listings: processedListings })
  } catch (error: unknown) {
    return apiErrors.internalError(
      'Failed to fetch listings',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}

