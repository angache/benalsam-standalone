import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'

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
      logger.error('[API] Follow error', { error: followError, followerId: currentUserId, followingId: userId })
      return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 })
    }

    logger.debug('[API] User followed successfully', { followerId: currentUserId, followingId: userId })
    return NextResponse.json({ success: true, message: 'User followed successfully' })

  } catch (error: unknown) {
    logger.error('[API] Follow exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
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
      logger.error('[API] Unfollow error', { error: unfollowError, followerId: currentUserId, followingId: userId })
      return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 })
    }

    logger.debug('[API] User unfollowed successfully', { followerId: currentUserId, followingId: userId })
    return NextResponse.json({ success: true, message: 'User unfollowed successfully' })

  } catch (error: unknown) {
    logger.error('[API] Unfollow exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
