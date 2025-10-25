import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerUser } from '@/lib/supabase-server'

/**
 * POST /api/messages/mark-read
 * Mark messages as read in a conversation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS and mark messages as read
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString(),
        status: 'read'
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('Error marking messages as read:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to mark messages as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read'
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

