import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'

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

    // Fetch favorites with full listing details
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
        { error: error.message, userId: user.id },
        request.nextUrl.pathname
      )
    }

    // Process favorites to include full listing data
    const favoriteListings = favorites?.map((fav: {
      listing_id: string
      created_at: string
      listings: {
        profiles?: {
          id: string
          name: string
          avatar_url?: string
          rating?: number
          total_ratings?: number
          rating_sum?: number
        }
        [key: string]: unknown
      }
    }) => {
      const listing = fav.listings
      if (!listing) return null

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

