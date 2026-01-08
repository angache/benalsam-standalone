import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { validateParams } from '@/lib/api-validation'
import { z } from 'zod'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'

/**
 * Schema for userId parameter (can be UUID or username)
 */
const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID or username is required'),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Profile pages are public - no auth required
    const user = await getServerUser()
    
    // Rate limiting (use IP if no user)
    const identifier = getClientIdentifier(request, user?.id)
    const allowed = await rateLimiters.standard.check(identifier)
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'profile-get' })
      return rateLimitExceeded()
    }

    const rawParams = await params
    
    // Validate route parameters
    const validation = validateParams(rawParams, userIdParamSchema)
    if (!validation.success) {
      return validation.response
    }

    const { userId } = validation.data
    logger.debug('[PROFILE API] Fetching profile', { userId })

    // Get profile data (try username first, then fallback to ID)
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('username', userId)
      .single()

    logger.debug('[PROFILE API] Username lookup result', { 
      userId, 
      found: !!profile, 
      error: profileError?.code,
      errorMessage: profileError?.message 
    })

    // If username not found, try as UUID
    if (profileError && profileError.code === 'PGRST116') {
      logger.debug('[PROFILE API] Username not found, trying as UUID', { userId })
      const { data: profileById, error: profileByIdError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      logger.debug('[PROFILE API] UUID lookup result', { 
        userId, 
        found: !!profileById, 
        error: profileByIdError?.code,
        errorMessage: profileByIdError?.message 
      })
      
      profile = profileById
      profileError = profileByIdError
    }

    if (profileError || !profile) {
      logger.error('[PROFILE API] Profile not found', { 
        userId, 
        error: profileError?.code,
        errorMessage: profileError?.message,
        triedUsername: true,
        triedUUID: true
      })
      return apiErrors.notFound('Profile', request.nextUrl.pathname)
    }

    logger.debug('[PROFILE API] Found profile', { profileId: profile?.id })

    // Get user's listings
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('user_id', profile?.id)
      // .eq('status', 'active') // TODO: Uncomment after debugging
      .order('created_at', { ascending: false })
      .limit(20)

    if (listingsError) {
      logger.error('[PROFILE API] Listings fetch error', { error: listingsError, userId })
    } else {
      logger.debug('[PROFILE API] Listings fetched', { userId, count: listings?.length })
    }

    // Get user's reviews (use profile.id, not userId)
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('user_reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer:profiles!user_reviews_reviewer_id_fkey(
          id,
          name,
          avatar_url
        )
      `)
      .eq('reviewee_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (reviewsError) {
      logger.error('[PROFILE API] Reviews fetch error', { error: reviewsError, profileId: profile.id })
    }

    // Check if current user is following this profile (only if authenticated)
    let isFollowing = false
    if (user && user.id !== profile.id) {
      const { data: followData } = await supabaseAdmin
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profile.id)
        .single()

      isFollowing = !!followData
    }

    return createSuccessResponse({
      profile,
      listings: listings || [],
      reviews: reviews || [],
      isFollowing
    })

  } catch (error: unknown) {
    return apiErrors.internalError(
      'Failed to fetch profile',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}
