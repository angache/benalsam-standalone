/**
 * Doping Expiration Check API Route
 * 
 * Checks and expires doping features that have passed their expiration date.
 * This endpoint can be called manually or by a scheduled task (cron job).
 * 
 * POST /api/doping/check-expiration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'
import { getServerUser } from '@/lib/supabase-server'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'

/**
 * Check and expire doping features
 * 
 * This function:
 * 1. Finds listings with expired doping features
 * 2. Disables expired features
 * 3. Sends notifications to users
 * 4. Returns statistics
 */
async function checkAndExpireDopings() {
  const supabaseAdmin = getSupabaseAdmin()
  const now = new Date().toISOString()
  const stats = {
    expiredShowcase: 0,
    expiredUrgent: 0,
    expiredFeatured: 0,
    notificationsSent: 0,
    errors: 0,
  }

  try {
    // Find listings with expired showcase doping
    const { data: expiredShowcase, error: showcaseError } = await supabaseAdmin
      .from('listings')
      .select('id, user_id, title, showcase_expires_at')
      .eq('is_showcase', true)
      .not('showcase_expires_at', 'is', null)
      .lt('showcase_expires_at', now)

    if (showcaseError) {
      logger.error('[Doping Expiration] Error fetching expired showcase', { error: showcaseError })
      stats.errors++
    } else if (expiredShowcase && expiredShowcase.length > 0) {
      logger.debug('[Doping Expiration] Found expired showcase dopings', { count: expiredShowcase.length })
      
      for (const listing of expiredShowcase) {
        try {
          // Disable showcase doping
          const { error: updateError } = await supabaseAdmin
            .from('listings')
            .update({
              is_showcase: false,
              showcase_expires_at: null,
              updated_at: now,
            })
            .eq('id', listing.id)

          if (updateError) {
            logger.error('[Doping Expiration] Error disabling showcase', { listingId: listing.id, error: updateError })
            stats.errors++
            continue
          }

          stats.expiredShowcase++

          // Send notification to user
          await sendExpirationNotification(listing.user_id, listing.id, listing.title, 'showcase')
          stats.notificationsSent++
        } catch (error) {
          logger.error('[Doping Expiration] Error processing showcase expiration', { listingId: listing.id, error })
          stats.errors++
        }
      }
    }

    // Find listings with expired urgent doping
    const { data: expiredUrgent, error: urgentError } = await supabaseAdmin
      .from('listings')
      .select('id, user_id, title, urgent_expires_at')
      .eq('is_urgent_premium', true)
      .not('urgent_expires_at', 'is', null)
      .lt('urgent_expires_at', now)

    if (urgentError) {
      logger.error('[Doping Expiration] Error fetching expired urgent', { error: urgentError })
      stats.errors++
    } else if (expiredUrgent && expiredUrgent.length > 0) {
      logger.debug('[Doping Expiration] Found expired urgent dopings', { count: expiredUrgent.length })
      
      for (const listing of expiredUrgent) {
        try {
          // Disable urgent doping
          const { error: updateError } = await supabaseAdmin
            .from('listings')
            .update({
              is_urgent_premium: false,
              urgent_expires_at: null,
              updated_at: now,
            })
            .eq('id', listing.id)

          if (updateError) {
            logger.error('[Doping Expiration] Error disabling urgent', { listingId: listing.id, error: updateError })
            stats.errors++
            continue
          }

          stats.expiredUrgent++

          // Send notification to user
          await sendExpirationNotification(listing.user_id, listing.id, listing.title, 'urgent')
          stats.notificationsSent++
        } catch (error) {
          logger.error('[Doping Expiration] Error processing urgent expiration', { listingId: listing.id, error })
          stats.errors++
        }
      }
    }

    // Find listings with expired featured doping
    const { data: expiredFeatured, error: featuredError } = await supabaseAdmin
      .from('listings')
      .select('id, user_id, title, featured_expires_at')
      .eq('is_featured', true)
      .not('featured_expires_at', 'is', null)
      .lt('featured_expires_at', now)

    if (featuredError) {
      logger.error('[Doping Expiration] Error fetching expired featured', { error: featuredError })
      stats.errors++
    } else if (expiredFeatured && expiredFeatured.length > 0) {
      logger.debug('[Doping Expiration] Found expired featured dopings', { count: expiredFeatured.length })
      
      for (const listing of expiredFeatured) {
        try {
          // Disable featured doping
          const { error: updateError } = await supabaseAdmin
            .from('listings')
            .update({
              is_featured: false,
              featured_expires_at: null,
              updated_at: now,
            })
            .eq('id', listing.id)

          if (updateError) {
            logger.error('[Doping Expiration] Error disabling featured', { listingId: listing.id, error: updateError })
            stats.errors++
            continue
          }

          stats.expiredFeatured++

          // Send notification to user
          await sendExpirationNotification(listing.user_id, listing.id, listing.title, 'featured')
          stats.notificationsSent++
        } catch (error) {
          logger.error('[Doping Expiration] Error processing featured expiration', { listingId: listing.id, error })
          stats.errors++
        }
      }
    }

    return stats
  } catch (error) {
    logger.error('[Doping Expiration] Error checking expirations', { error })
    throw error
  }
}

/**
 * Send expiration notification to user
 * 
 * Creates a system notification that can be displayed in the UI.
 * In the future, this can be extended to send:
 * - Push notifications (FCM)
 * - Email notifications
 * - SMS notifications
 */
async function sendExpirationNotification(
  userId: string,
  listingId: string,
  listingTitle: string,
  dopingType: 'showcase' | 'urgent' | 'featured'
): Promise<void> {
  try {
    const dopingNames: Record<string, string> = {
      showcase: 'Kategori Vitrini',
      urgent: 'Acil İlan',
      featured: 'Öne Çıkan İlan',
    }

    const dopingName = dopingNames[dopingType] || dopingType
    const message = `"${listingTitle}" ilanınızın ${dopingName} doping süresi doldu. İlanınız normal görünümüne döndü.`

    // Create notification record in notifications table
    // Note: Using existing schema: recipient_user_id, data jsonb, is_read
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          recipient_user_id: userId,
          type: 'doping_expired',
          data: {
            title: 'Doping Süresi Doldu',
            message: message,
            listingId,
            dopingType,
          },
          is_read: false,
        })

      if (notificationError) {
        // If notifications table doesn't exist, just log it
        logger.warn('[Doping Expiration] Notifications table not available', {
          error: notificationError.message,
          userId,
          listingId,
        })
      } else {
        logger.debug('[Doping Expiration] Notification created', {
          userId,
          listingId,
          dopingType,
        })
      }
    } catch (error) {
      // Don't fail if notifications table doesn't exist
      logger.warn('[Doping Expiration] Failed to create notification', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        listingId,
      })
    }

    logger.info('[Doping Expiration] Notification sent', {
      userId,
      listingId,
      listingTitle,
      dopingType,
      message,
    })

    // TODO: Send push notification via FCM
    // TODO: Send email notification
  } catch (error) {
    logger.error('[Doping Expiration] Error sending notification', {
      userId,
      listingId,
      dopingType,
      error,
    })
    // Don't throw - notification failure shouldn't block expiration
  }
}

/**
 * POST /api/doping/check-expiration
 * 
 * Checks and expires doping features that have passed their expiration date.
 * Can be called manually or by a scheduled task.
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional - can be called by system/cron)
    const user = await getServerUser()
    
    // If user is authenticated, check if they're admin
    // Otherwise, allow system/cron calls (you may want to add API key auth)
    if (user?.id) {
      // Check if user is admin (optional - remove if you want to allow all authenticated users)
      // For now, we'll allow any authenticated user to trigger this
      // In production, you might want to restrict this to admins only
    }

    logger.info('[Doping Expiration] Starting expiration check', {
      triggeredBy: user?.id || 'system',
    })

    const stats = await checkAndExpireDopings()

    logger.info('[Doping Expiration] Expiration check completed', stats)

    return createSuccessResponse({
      message: 'Doping expiration check completed',
      stats,
    })
  } catch (error: unknown) {
    logger.error('[Doping Expiration] Error in expiration check', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return apiErrors.internalError(
      'Doping expiration kontrolü sırasında bir hata oluştu',
      {
        error: error instanceof Error ? error.message : String(error),
      },
      request.nextUrl.pathname
    )
  }
}

/**
 * GET /api/doping/check-expiration
 * 
 * Returns statistics about expired dopings without actually expiring them.
 * Useful for monitoring and debugging.
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const now = new Date().toISOString()
    const stats = {
      expiredShowcase: 0,
      expiredUrgent: 0,
      expiredFeatured: 0,
      totalExpired: 0,
    }

    // Count expired showcase
    const { count: showcaseCount } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_showcase', true)
      .not('showcase_expires_at', 'is', null)
      .lt('showcase_expires_at', now)

    stats.expiredShowcase = showcaseCount || 0

    // Count expired urgent
    const { count: urgentCount } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_urgent_premium', true)
      .not('urgent_expires_at', 'is', null)
      .lt('urgent_expires_at', now)

    stats.expiredUrgent = urgentCount || 0

    // Count expired featured
    const { count: featuredCount } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true)
      .not('featured_expires_at', 'is', null)
      .lt('featured_expires_at', now)

    stats.expiredFeatured = featuredCount || 0
    stats.totalExpired = stats.expiredShowcase + stats.expiredUrgent + stats.expiredFeatured

    return createSuccessResponse({
      message: 'Doping expiration statistics',
      stats,
      timestamp: now,
    })
  } catch (error: unknown) {
    logger.error('[Doping Expiration] Error getting expiration stats', {
      error: error instanceof Error ? error.message : String(error),
    })

    return apiErrors.internalError(
      'Doping expiration istatistikleri alınırken bir hata oluştu',
      {
        error: error instanceof Error ? error.message : String(error),
      },
      request.nextUrl.pathname
    )
  }
}

