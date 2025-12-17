import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/utils/production-logger';
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit';
import { getServerUser } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    logger.startTimer('[API] GET /conversations/[conversationId]');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Rate limiting - Check user or IP
    const user = await getServerUser();
    const identifier = getClientIdentifier(request, user?.id);
    const allowed = await rateLimiters.messaging.check(identifier);
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'conversation-detail' });
      return rateLimitExceeded();
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
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
      logger.error('[API] Error fetching conversation', { error: convError, conversationId });
      return NextResponse.json(
        { error: 'Failed to fetch conversation details' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    const resolvedParams = await params;
    logger.error('[API] conversation-detail error', { error, conversationId: resolvedParams.conversationId });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

