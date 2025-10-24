import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    console.log('🔍 [PROFILE API] userId:', userId)

    // Get profile data (try username first, then fallback to ID)
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('username', userId)
      .single()

    // If username not found, try as UUID
    if (profileError && profileError.code === 'PGRST116') {
      const { data: profileById, error: profileByIdError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      profile = profileById
      profileError = profileByIdError
    }

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    console.log('🔍 [PROFILE API] Found profile:', profile?.id)

    // Get user's listings
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('user_id', profile?.id)
      // .eq('status', 'active') // TODO: Uncomment after debugging
      .order('created_at', { ascending: false })
      .limit(20)

    console.log('🔍 [PROFILE API] Listings result:', { count: listings?.length, error: listingsError })

    if (listingsError) {
      console.error('Listings fetch error:', listingsError)
    }

    // Get user's reviews
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('user_reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer:profiles!user_reviews_reviewer_id_fkey(
          id,
          name,
          avatar_url
        )
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (reviewsError) {
      console.error('Reviews fetch error:', reviewsError)
    }

    // Check if current user is following this profile
    let isFollowing = false
    if (session.user.id !== userId) {
      const { data: followData } = await supabaseAdmin
        .from('follows')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
        .single()

      isFollowing = !!followData
    }

    return NextResponse.json({
      profile,
      listings: listings || [],
      reviews: reviews || [],
      isFollowing
    })

  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
