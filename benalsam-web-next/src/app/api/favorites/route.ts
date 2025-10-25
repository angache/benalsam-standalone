import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'

// Add favorite
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('🔍 [API] POST /api/favorites - Session:', session?.user?.id)
    
    if (!session?.user?.id) {
      console.log('❌ [API] No session found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { listingId } = await request.json()
    
    console.log('🔍 [API] Listing ID:', listingId)

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID required' },
        { status: 400 }
      )
    }

    console.log('📝 [API] Inserting favorite:', { user_id: user.id, listing_id: listingId })

    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .insert([{ 
        user_id: user.id, 
        listing_id: listingId 
      }])
      .select()
      .single()

    if (error) {
      // Already exists
      if (error.code === '23505') {
        return NextResponse.json(
          { message: 'Already favorited', already_favorited: true },
          { status: 200 }
        )
      }
      
      console.error('❌ [API] Favorite add error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data, success: true })
  } catch (error: any) {
    console.error('❌ [API] Favorite add exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Remove favorite
export async function DELETE(request: NextRequest) {
  try {
    const user = await getServerUser()

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId)

    if (error) {
      console.error('❌ [API] Favorite remove error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ [API] Favorite remove exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

