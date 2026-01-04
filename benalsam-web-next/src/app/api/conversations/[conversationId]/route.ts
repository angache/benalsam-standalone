import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/utils/production-logger';
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit';
import { getServerUser } from '@/lib/supabase-server';
import { validateParams, commonSchemas } from '@/lib/api-validation';
import { z } from 'zod';
import { createSuccessResponse, apiErrors } from '@/lib/api-errors';

/**
 * Schema for conversation ID parameter
 */
const conversationIdParamSchema = z.object({
  conversationId: commonSchemas.uuid,
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const rawParams = await params;
    
    // Validate route parameters
    const validation = validateParams(rawParams, conversationIdParamSchema)
    if (!validation.success) {
      return validation.response
    }

    const { conversationId } = validation.data;
    logger.startTimer('[API] GET /conversations/[conversationId]');

    // Check authentication
    const user = await getServerUser();
    if (!user?.id) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id);
    const allowed = await rateLimiters.messaging.check(identifier);
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'conversation-detail' });
      return rateLimitExceeded();
    }

    if (!supabaseAdmin) {
      return apiErrors.internalError(
        'Server configuration error',
        {},
        request.nextUrl.pathname
      )
    }

    // Fetch conversation details - use admin client to bypass RLS
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        user1:profiles!conversations_user1_id_fkey (
          id,
          name,
          avatar_url
        ),
        user2:profiles!conversations_user2_id_fkey (
          id,
          name,
          avatar_url
        ),
        listing:listings!conversations_listing_id_fkey (
          id,
          title,
          user_id
        )
      `)
      .eq('id', conversationId)
      .single();

    logger.endTimer('[API] GET /conversations/[conversationId]');

    if (convError) {
      return apiErrors.databaseError(
        'Failed to fetch conversation details',
        { error: convError.message, conversationId },
        request.nextUrl.pathname
      )
    }
    
    return createSuccessResponse(conversation)
  } catch (error: unknown) {
    const resolvedParams = await params;
    return apiErrors.internalError(
      'Failed to fetch conversation',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        conversationId: resolvedParams.conversationId,
      },
      request.nextUrl.pathname
    )
  }
}

