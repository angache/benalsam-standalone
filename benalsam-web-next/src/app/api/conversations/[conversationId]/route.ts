import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;

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

    if (convError) {
      console.error('Error fetching conversation:', convError);
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
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

