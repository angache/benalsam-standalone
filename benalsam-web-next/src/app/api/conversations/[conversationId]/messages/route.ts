import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/utils/production-logger';
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit';
import { getServerUser } from '@/lib/supabase-server';
import { validateParams, validateQuery, commonSchemas } from '@/lib/api-validation';
import { z } from 'zod';
import { createSuccessResponse, apiErrors } from '@/lib/api-errors';

/**
 * Schema for conversation ID parameter
 */
const conversationIdParamSchema = z.object({
  conversationId: commonSchemas.uuid,
})

/**
 * Schema for messages query parameters
 */
const messagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const rawParams = await params;
    
    // Validate route parameters
    const paramValidation = validateParams(rawParams, conversationIdParamSchema)
    if (!paramValidation.success) {
      return paramValidation.response
    }

    const { conversationId } = paramValidation.data;
    
    // Validate query parameters
    const queryValidation = validateQuery(request, messagesQuerySchema)
    if (!queryValidation.success) {
      return queryValidation.response
    }

    const { limit, offset } = queryValidation.data;
    logger.startTimer('[API] GET /conversations/messages');

    // Check authentication
    const user = await getServerUser();
    if (!user?.id) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    // Rate limiting - 60 requests per minute per user
    const identifier = getClientIdentifier(request, user.id);
    const allowed = await rateLimiters.messaging.check(identifier);
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'conversation-messages' });
      return rateLimitExceeded();
    }

    if (!supabaseAdmin) {
      return apiErrors.internalError(
        'Server configuration error',
        {},
        request.nextUrl.pathname
      )
    }

    // Get total count first
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (countError) {
      logger.warn('[API] Error counting messages (non-critical)', { error: countError.message, conversationId });
    }

    // Fetch messages with pagination - use admin client to bypass RLS
    // Order DESCENDING (newest first) for chat UI
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false }) // Newest first for chat UI
      .range(offset, offset + limit - 1);

    logger.endTimer('[API] GET /conversations/messages');

    if (error) {
      return apiErrors.databaseError(
        'Failed to fetch messages',
        { error: error.message, conversationId },
        request.nextUrl.pathname
      )
    }

    return createSuccessResponse(
      messages || [],
      {
        meta: {
          total: totalCount || 0,
          hasMore: offset + (messages?.length || 0) < (totalCount || 0),
          limit,
          offset,
        }
      }
    )
  } catch (error: unknown) {
    const resolvedParams = await params;
    return apiErrors.internalError(
      'Failed to fetch messages',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        conversationId: resolvedParams.conversationId,
      },
      request.nextUrl.pathname
    )
  }
}

