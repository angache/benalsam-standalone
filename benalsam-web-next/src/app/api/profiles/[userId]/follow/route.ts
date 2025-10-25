import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    const currentUserId = user.id

    // Can't follow yourself
    if (currentUserId === userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Check if already following
    const { data: existingFollow } = await supabaseAdmin
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .single()

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following' }, { status: 400 })
    }

    // Create follow relationship
    const { error: followError } = await supabaseAdmin
      .from('follows')
      .insert({
        follower_id: currentUserId,
        following_id: userId,
        created_at: new Date().toISOString()
      })

    if (followError) {
      console.error('Follow error:', followError)
      return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'User followed successfully' })

  } catch (error) {
    console.error('Follow API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    const currentUserId = user.id

    // Remove follow relationship
    const { error: unfollowError } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)

    if (unfollowError) {
      console.error('Unfollow error:', unfollowError)
      return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'User unfollowed successfully' })

  } catch (error) {
    console.error('Unfollow API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
