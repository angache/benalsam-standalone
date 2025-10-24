import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Check favorite status for multiple listings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { data: {} }, // Return empty object for unauthenticated users
        { status: 200 }
      )
    }

    const { listingIds } = await request.json()

    if (!listingIds || !Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json(
        { data: {} },
        { status: 200 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .select('listing_id')
      .eq('user_id', session.user.id)
      .in('listing_id', listingIds)

    if (error) {
      console.error('❌ [API] Favorite check error:', error)
      return NextResponse.json(
        { data: {} },
        { status: 200 } // Return empty instead of error
      )
    }

    const favoritedMap: { [key: string]: boolean } = {}
    data?.forEach(fav => {
      favoritedMap[fav.listing_id] = true
    })

    console.log('✅ [API] Favorite check:', { userId: session.user.id, count: data?.length, total: listingIds.length })

    return NextResponse.json({ data: favoritedMap })
  } catch (error: unknown) {
    console.error('❌ [API] Favorite check exception:', error)
    return NextResponse.json(
      { data: {} },
      { status: 200 }
    )
  }
}



