import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'

// GET /api/listings/[listingId] - Get listing details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;
    
    // Rate limiting
    const user = await getServerUser();
    const identifier = getClientIdentifier(request, user?.id);
    const allowed = await rateLimiters.messaging.check(identifier);
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'listing-detail' });
      return rateLimitExceeded();
    }

    logger.info('[API] Fetching listing', { listingId });

    // Fetch listing with user profile
    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .select(`
        *,
        profiles:profiles!listings_user_id_fkey(
          id,
          name,
          avatar_url,
          rating
        )
      `)
      .eq('id', listingId)
      .single();

    if (error || !listing) {
      logger.error('[API] Listing not found', { error, listingId });
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Optionally increment view count (only if user is not the owner)
    if (user?.id && user.id !== listing.user_id) {
      await supabaseAdmin
        .from('listings')
        .update({ 
          view_count: (listing.view_count || 0) + 1 
        })
        .eq('id', listingId);
    }

    logger.info('[API] Listing fetched successfully', { listingId });

    return NextResponse.json({
      success: true,
      data: listing
    });
  } catch (error) {
    logger.error('[API] Get listing error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

