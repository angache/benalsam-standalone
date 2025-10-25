import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'

// DELETE /api/listings/[listingId] - Delete a listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const user = await getServerUser()

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { listingId } = await params

    // Verify listing ownership
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('user_id')
      .eq('id', listingId)
      .single()

    if (fetchError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this listing' },
        { status: 403 }
      )
    }

    // Delete the listing
    const { error: deleteError } = await supabaseAdmin
      .from('listings')
      .delete()
      .eq('id', listingId)

    if (deleteError) {
      console.error('Error deleting listing:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Listing deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete listing API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/listings/[listingId] - Update listing status or other fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const user = await getServerUser()

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { listingId } = await params
    const body = await request.json()

    // Verify listing ownership
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('user_id')
      .eq('id', listingId)
      .single()

    if (fetchError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this listing' },
        { status: 403 }
      )
    }

    // Update the listing
    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)

    if (updateError) {
      console.error('Error updating listing:', updateError)
      return NextResponse.json(
        { error: 'Failed to update listing' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Listing updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update listing API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

