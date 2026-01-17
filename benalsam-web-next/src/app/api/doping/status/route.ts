/**
 * Doping Status API Route
 * 
 * Returns the current status of doping features for a listing.
 * 
 * GET /api/doping/status?listingId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { validateQuery, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'
import { getServerUser } from '@/lib/supabase-server'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'

/**
 * Schema for doping status query parameters
 */
const dopingStatusQuerySchema = z.object({
  listingId: commonSchemas.uuid,
})

/**
 * GET /api/doping/status
 * 
 * Returns the current status of doping features for a listing.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser()

    if (!user?.id) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id)
    const allowed = await rateLimiters.messaging.check(identifier)
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'doping-status' })
      return rateLimitExceeded()
    }

    // Validate query parameters
    const validation = validateQuery(request, dopingStatusQuerySchema)
    if (!validation.success) {
      return validation.response
    }

    const { listingId } = validation.data

    // Fetch listing with doping fields
    const supabaseAdmin = getSupabaseAdmin()
    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .select('id, user_id, title, is_showcase, is_urgent_premium, is_featured, showcase_expires_at, urgent_expires_at, featured_expires_at, upped_at')
      .eq('id', listingId)
      .single()

    if (error || !listing) {
      return apiErrors.notFound('İlan', request.nextUrl.pathname)
    }

    // Verify ownership
    if (listing.user_id !== user.id) {
      return apiErrors.forbidden('Bu ilanın doping durumunu görüntüleme yetkiniz yok', request.nextUrl.pathname)
    }

    const now = new Date()
    const status = {
      showcase: {
        active: listing.is_showcase || false,
        expiresAt: listing.showcase_expires_at,
        expired: listing.showcase_expires_at ? new Date(listing.showcase_expires_at) < now : false,
        daysRemaining: listing.showcase_expires_at 
          ? Math.max(0, Math.ceil((new Date(listing.showcase_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : null,
      },
      urgent: {
        active: listing.is_urgent_premium || false,
        expiresAt: listing.urgent_expires_at,
        expired: listing.urgent_expires_at ? new Date(listing.urgent_expires_at) < now : false,
        daysRemaining: listing.urgent_expires_at 
          ? Math.max(0, Math.ceil((new Date(listing.urgent_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : null,
      },
      featured: {
        active: listing.is_featured || false,
        expiresAt: listing.featured_expires_at,
        expired: listing.featured_expires_at ? new Date(listing.featured_expires_at) < now : false,
        daysRemaining: listing.featured_expires_at 
          ? Math.max(0, Math.ceil((new Date(listing.featured_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : null,
      },
      upToDate: {
        active: !!listing.upped_at,
        uppedAt: listing.upped_at,
      },
    }

    logger.debug('[Doping Status] Status fetched', { listingId, userId: user.id })

    return createSuccessResponse({
      listingId,
      listingTitle: listing.title,
      status,
    })
  } catch (error: unknown) {
    logger.error('[Doping Status] Error fetching status', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return apiErrors.internalError(
      'Doping durumu alınırken bir hata oluştu',
      {
        error: error instanceof Error ? error.message : String(error),
      },
      request.nextUrl.pathname
    )
  }
}

