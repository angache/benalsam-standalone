import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'

/**
 * GET /api/favorites/list
 * Get all favorite listings for the current user
 */
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
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'favorites-list' })
      return rateLimitExceeded()
    }

    // Fetch favorites with full listing details
    const supabaseAdmin = getSupabaseAdmin()
    const { data: favorites, error } = await supabaseAdmin
      .from('user_favorites')
      .select(`
        listing_id,
        created_at,
        listings (
          *,
          profiles:profiles!listings_user_id_fkey (
            id,
            name,
            avatar_url,
            rating,
            total_ratings,
            rating_sum
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return apiErrors.databaseError(
        'Failed to fetch favorites',
        { error: (error as { message?: string })?.message || String(error), userId: user.id },
        request.nextUrl.pathname
      )
    }

    // Process favorites to include full listing data
    // Supabase join returns listings as array, but we expect single object
    const favoriteListings = favorites?.map((fav: any) => {
      // Handle both array and object cases from Supabase
      const listing = Array.isArray(fav.listings) ? fav.listings[0] : fav.listings
      
      if (!listing) {
        return null
      }

      return {
        ...listing,
        user: listing.profiles,
        favorited_at: fav.created_at,
        is_favorited: true,
      }
    }).filter(Boolean) || []

    logger.debug('[API] Fetched favorites', { userId: user.id, count: favoriteListings.length })

    return createSuccessResponse(
      { 
        listings: favoriteListings,
        total: favoriteListings.length 
      }
    )
  } catch (error: unknown) {
    return apiErrors.internalError(
      'Failed to fetch favorites',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}

