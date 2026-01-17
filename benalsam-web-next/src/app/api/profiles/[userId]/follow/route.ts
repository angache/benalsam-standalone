import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { validateParams, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'

/**
 * Schema for userId parameter
 */
const userIdParamSchema = z.object({
  userId: commonSchemas.uuid,
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getServerUser()
    if (!user) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id)
    const allowed = await rateLimiters.standard.check(identifier)
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'follow-post' })
      return rateLimitExceeded()
    }

    const rawParams = await params
    
    // Validate route parameters
    const validation = validateParams(rawParams, userIdParamSchema)
    if (!validation.success) {
      return validation.response
    }

    const { userId } = validation.data
    const currentUserId = user.id

    // Can't follow yourself
    if (currentUserId === userId) {
      return apiErrors.validationError(
        'Cannot follow yourself',
        { currentUserId, userId },
        request.nextUrl.pathname
      )
    }

    // Check if already following
    const supabaseAdmin = getSupabaseAdmin()
    const { data: existingFollow } = await supabaseAdmin
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .single()

    if (existingFollow) {
      return apiErrors.duplicateEntry('Follow relationship', request.nextUrl.pathname)
    }

    // Create follow relationship
    const { error: followError } = await supabaseAdmin
      .from('follows')
      .insert({
        follower_id: currentUserId,
        following_id: userId,
        created_at: new Date().toISOString()
      })

    if (followError) {
      return apiErrors.databaseError(
        'Failed to follow user',
        { error: followError.message, followerId: currentUserId, followingId: userId },
        request.nextUrl.pathname
      )
    }

    logger.debug('[API] User followed successfully', { followerId: currentUserId, followingId: userId })
    return createSuccessResponse({ message: 'User followed successfully' })

  } catch (error: unknown) {
    return apiErrors.internalError(
      'Failed to follow user',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getServerUser()
    if (!user) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id)
    const allowed = await rateLimiters.standard.check(identifier)
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'follow-delete' })
      return rateLimitExceeded()
    }

    const rawParams = await params
    
    // Validate route parameters
    const validation = validateParams(rawParams, userIdParamSchema)
    if (!validation.success) {
      return validation.response
    }

    const { userId } = validation.data
    const currentUserId = user.id

    // Remove follow relationship
    const supabaseAdmin = getSupabaseAdmin()
    const { error: unfollowError } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)

    if (unfollowError) {
      return apiErrors.databaseError(
        'Failed to unfollow user',
        { error: unfollowError.message, followerId: currentUserId, followingId: userId },
        request.nextUrl.pathname
      )
    }

    logger.debug('[API] User unfollowed successfully', { followerId: currentUserId, followingId: userId })
    return createSuccessResponse({ message: 'User unfollowed successfully' })

  } catch (error: unknown) {
    return apiErrors.internalError(
      'Failed to unfollow user',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}
