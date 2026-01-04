import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'
import { validateParams, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

/**
 * Schema for listing ID parameter
 */
const listingIdParamSchema = z.object({
  listingId: commonSchemas.uuid,
})

// GET /api/listings/[listingId] - Get listing details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const rawParams = await params
    
    // Validate route parameters
    const validation = validateParams(rawParams, listingIdParamSchema)
    if (!validation.success) {
      return validation.response
    }

    const { listingId } = validation.data
    
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

    const rawParams = await params
    
    // Validate route parameters
    const validation = validateParams(rawParams, listingIdParamSchema)
    if (!validation.success) {
      return validation.response
    }

    const { listingId } = validation.data

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
      logger.error('[API] Error deleting listing', { error: deleteError, listingId, userId: user.id })
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      )
    }

    logger.debug('[API] Listing deleted successfully', { listingId, userId: user.id })
    return NextResponse.json(
      { success: true, message: 'Listing deleted successfully' },
      { status: 200 }
    )
  } catch (error: unknown) {
    logger.error('[API] Delete listing exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      listingId
    })
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

    const rawParams = await params
    
    // Validate route parameters
    const validation = validateParams(rawParams, listingIdParamSchema)
    if (!validation.success) {
      return validation.response
    }

    const { listingId } = validation.data
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
      logger.error('[API] Error updating listing', { error: updateError, listingId, userId: user.id })
      return NextResponse.json(
        { error: 'Failed to update listing' },
        { status: 500 }
      )
    }

    logger.debug('[API] Listing updated successfully', { listingId, userId: user.id })
    return NextResponse.json(
      { success: true, message: 'Listing updated successfully' },
      { status: 200 }
    )
  } catch (error: unknown) {
    logger.error('[API] Update listing exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      listingId
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

