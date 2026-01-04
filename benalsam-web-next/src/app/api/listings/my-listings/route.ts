import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser()

    if (!user?.id) {
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
      .eq('user_id', user.id)
      .order('is_urgent_premium', { ascending: false, nullsLast: true })
      .order('is_featured', { ascending: false, nullsLast: true })
      .order('is_showcase', { ascending: false, nullsLast: true })
      .order('upped_at', { ascending: false, nullsLast: true })
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('[API] Error fetching my listings', { error, userId: user.id })
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
  } catch (error: unknown) {
    logger.error('[API] My listings exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

