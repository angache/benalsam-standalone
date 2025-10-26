import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const startTime = performance.now();
    const { conversationId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    console.log('📞 [API] GET /conversations/[conversationId]/messages', { conversationId, limit });

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Fetch messages - use admin client to bypass RLS
    const queryStart = performance.now();
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    console.log(`⏱️ [API] Supabase query took ${(performance.now() - queryStart).toFixed(0)}ms`, { count: messages?.length || 0 });

    if (error) {
      console.error('❌ [API] Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    console.log(`✅ [API] Total request took ${(performance.now() - startTime).toFixed(0)}ms`);

    return NextResponse.json({
      success: true,
      data: messages || []
    });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

