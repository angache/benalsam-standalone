import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Add favorite
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { listingId } = await request.json()

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .insert([{ 
        user_id: session.user.id, 
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
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
      .eq('user_id', session.user.id)
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

