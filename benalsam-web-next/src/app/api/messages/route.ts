import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/utils/production-logger';

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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Fetch conversations where user is participant - use admin client to bypass RLS
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        user1:profiles!conversations_user1_id_fkey(id, name, avatar_url),
        user2:profiles!conversations_user2_id_fkey(id, name, avatar_url),
        listing:listings!conversations_listing_id_fkey(id, title, user_id),
        messages(content, created_at, sender_id, is_read)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (convError) {
      logger.error('[API] Error fetching conversations', { error: convError, userId });
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    // Format conversations with last message
    const formattedConversations = (conversations || []).map(conv => {
      const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;
      const messages = Array.isArray(conv.messages) ? conv.messages : [];
      const lastMessage = messages[messages.length - 1] || null;

      return {
        id: conv.id,
        user1_id: conv.user1_id,
        user2_id: conv.user2_id,
        listing_id: conv.listing_id,
        listing: conv.listing,
        otherUser,
        lastMessage,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        last_message_at: conv.last_message_at,
        unreadCount: messages.filter(m => !m.is_read && m.sender_id !== userId).length
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedConversations
    });
  } catch (error: unknown) {
    logger.error('[API] GET /api/messages error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, senderId, content, messageType = 'text' } = body;

    if (!conversationId || !senderId || !content) {
      return NextResponse.json(
        { error: 'conversationId, senderId, and content are required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify user is participant in conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.user1_id !== senderId && conversation.user2_id !== senderId) {
      return NextResponse.json(
        { error: 'User is not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Insert message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content,
        message_type: messageType,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        sender:profiles!sender_id(id, name, avatar_url)
      `)
      .single();

    if (messageError) {
      logger.error('[API] Error creating message', { error: messageError, conversationId, senderId });
      return NextResponse.json(
        { error: `Failed to send message: ${messageError.message}` },
        { status: 500 }
      );
    }

    // Update conversation's updated_at timestamp
    await supabaseAdmin
      .from('conversations')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return NextResponse.json({
      success: true,
      data: message
    });
  } catch (error: unknown) {
    logger.error('[API] POST /api/messages error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
