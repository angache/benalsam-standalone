import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Fetch conversations where user is participant
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:profiles!conversations_user1_id_fkey(id, name, avatar_url),
        user2:profiles!conversations_user2_id_fkey(id, name, avatar_url),
        listing:listings!conversations_listing_id_fkey(id, title),
        messages(content, created_at, sender_id, is_read)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversations:', convError);
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
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
