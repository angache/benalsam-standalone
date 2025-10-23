import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: listings, error } = await supabaseAdmin
      .from('listings')
      .select(`
        *,
        offers:offers(count),
        favorites:user_favorites(count)
      `)
      .eq('user_id', session.user.id)
      .order('is_urgent_premium', { ascending: false, nullsLast: true })
      .order('is_featured', { ascending: false, nullsLast: true })
      .order('is_showcase', { ascending: false, nullsLast: true })
      .order('upped_at', { ascending: false, nullsLast: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching my listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    // Process listings to include counts
    const processedListings = listings?.map((listing: any) => ({
      ...listing,
      offers_count: listing.offers?.[0]?.count || 0,
      favorites_count: listing.favorites?.[0]?.count || 0
    })) || []

    return NextResponse.json({ listings: processedListings }, { status: 200 })
  } catch (error) {
    console.error('My listings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

