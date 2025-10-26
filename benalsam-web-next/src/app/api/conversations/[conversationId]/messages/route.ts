import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/utils/production-logger';
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit';
import { getServerUser } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    logger.startTimer('[API] GET /conversations/messages');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Rate limiting - 60 requests per minute per user
    const user = await getServerUser();
    const identifier = getClientIdentifier(request, user?.id);
    const allowed = await rateLimiters.messaging.check(identifier);
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'conversation-messages' });
      return rateLimitExceeded();
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Fetch messages - use admin client to bypass RLS
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    logger.endTimer('[API] GET /conversations/messages');

    if (error) {
      logger.error('[API] Error fetching messages', { error, conversationId });
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: messages || []
    });
  } catch (error) {
    logger.error('[API] conversation-messages error', { error, params });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

