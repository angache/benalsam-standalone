import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
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

    const { data: listings, error } = await supabaseAdmin
      .from('listings')
      .select(`
        *,
        offers:offers(count),
        favorites:user_favorites(count)
      `)
      .eq('user_id', user.id)
      .order('is_urgent_premium', { ascending: false, nullsLast: true })
      .order('is_featured', { ascending: false, nullsLast: true })
      .order('is_showcase', { ascending: false, nullsLast: true })
      .order('upped_at', { ascending: false, nullsLast: true })
      .order('created_at', { ascending: false })

    if (error) {
      return apiErrors.databaseError(
        'Failed to fetch listings',
        { error: error.message, userId: user.id },
        request.nextUrl.pathname
      )
    }

    // Process listings to include counts
    const processedListings = listings?.map((listing: any) => ({
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

