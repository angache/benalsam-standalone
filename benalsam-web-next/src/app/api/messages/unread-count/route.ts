import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/utils/production-logger';
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit';
import { validateQuery, commonSchemas } from '@/lib/api-validation';
import { z } from 'zod';
import { createSuccessResponse, apiErrors } from '@/lib/api-errors';

/**
 * Schema for GET /api/messages/unread-count query parameters
 */
const unreadCountQuerySchema = z.object({
  userId: commonSchemas.uuid,
})

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const validation = validateQuery(request, unreadCountQuerySchema)
    if (!validation.success) {
      return validation.response
    }

    const { userId } = validation.data

    // Rate limiting - 60 requests per minute per user
    const identifier = getClientIdentifier(request, userId);
    const allowed = await rateLimiters.messaging.check(identifier);
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'unread-count' });
      return rateLimitExceeded();
    }

    // Get all conversations where user is participant
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (convError) {
      return apiErrors.databaseError(
        'Failed to fetch conversations',
        { error: convError.message, userId },
        request.nextUrl.pathname
      )
    }

    if (!conversations || conversations.length === 0) {
      return createSuccessResponse({ count: 0 })
    }

    const conversationIds = conversations.map(c => c.id);

    // Count unread messages in these conversations
    const { count, error: countError } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (countError) {
      return apiErrors.databaseError(
        'Failed to count unread messages',
        { error: countError.message, userId },
        request.nextUrl.pathname
      )
    }

    return createSuccessResponse({ count: count || 0 })
  } catch (error: unknown) {
    return apiErrors.internalError(
      'Failed to get unread count',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}

