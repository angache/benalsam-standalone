import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getServerUser } from '@/lib/supabase-server'
import { logger } from '@/utils/production-logger'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'
import { validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'

/**
 * Schema for POST /api/messages/mark-read request body
 */
const markReadSchema = z.object({
  conversationId: commonSchemas.uuid,
})

/**
 * POST /api/messages/mark-read
 * Mark messages as read in a conversation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    
    if (!user) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    // Rate limiting - 60 requests per minute per user
    const identifier = getClientIdentifier(request, user.id)
    const allowed = await rateLimiters.messaging.check(identifier)
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'mark-read' })
      return rateLimitExceeded()
    }

    // Validate request body
    const validation = await validateBody(request, markReadSchema)
    if (!validation.success) {
      return validation.response
    }

    const { conversationId } = validation.data

    // Use admin client to bypass RLS and mark messages as read
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString(),
        status: 'read'
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false)

    if (error) {
      return apiErrors.databaseError(
        'Failed to mark messages as read',
        { error: (error as { message?: string })?.message || String(error), conversationId, userId: user.id },
        request.nextUrl.pathname
      )
    }

    return createSuccessResponse({ message: 'Messages marked as read' })
  } catch (error: unknown) {
    return apiErrors.internalError(
      'Failed to mark messages as read',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}

