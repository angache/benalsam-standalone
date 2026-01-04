import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { createSuccessResponse } from '@/lib/api-errors'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'

/**
 * Schema for favorite check request body
 */
const favoriteCheckSchema = z.object({
  listingIds: z.array(commonSchemas.uuid).min(1, 'At least one listing ID is required').max(100, 'Too many listing IDs'),
})

// Check favorite status for multiple listings
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()

    if (!user?.id) {
      // Return empty object for unauthenticated users (not an error)
      return createSuccessResponse({ data: {} })
    }

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id)
    const allowed = await rateLimiters.standard.check(identifier)
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'favorites-check' })
      return rateLimitExceeded()
    }

    // Validate request body
    const validation = await validateBody(request, favoriteCheckSchema)
    if (!validation.success) {
      return validation.response
    }

    const { listingIds } = validation.data

    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .select('listing_id')
      .eq('user_id', user.id)
      .in('listing_id', listingIds)

    if (error) {
      logger.warn('[API] Favorite check error (non-critical)', { error: error.message, userId: user.id })
      // Return empty instead of error (non-critical operation)
      return createSuccessResponse({ data: {} })
    }

    const favoritedMap: { [key: string]: boolean } = {}
    data?.forEach(fav => {
      favoritedMap[fav.listing_id] = true
    })

    logger.debug('[API] Favorite check', { userId: user.id, count: data?.length, total: listingIds.length })

    return createSuccessResponse({ data: favoritedMap })
  } catch (error: unknown) {
    logger.error('[API] Favorite check exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    // Return empty instead of error (non-critical operation)
    return createSuccessResponse({ data: {} })
  }
}



