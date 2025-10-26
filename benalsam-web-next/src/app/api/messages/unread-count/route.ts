import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/utils/production-logger';
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

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
      logger.error('[API] Error fetching conversations', { error: convError, userId });
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ count: 0 });
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
      logger.error('[API] Error counting unread messages', { error: countError, userId });
      return NextResponse.json(
        { error: 'Failed to count unread messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    logger.error('[API] unread-count error', { error, userId: request.url });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

