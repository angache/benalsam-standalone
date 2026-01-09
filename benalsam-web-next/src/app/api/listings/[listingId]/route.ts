import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'
import { validateParams, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'

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
      return apiErrors.notFound('İlan', request.nextUrl.pathname)
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
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
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
      return apiErrors.forbidden('Bu ilanı silme yetkiniz yok', request.nextUrl.pathname)
    }

    // Delete the listing
    const { error: deleteError } = await supabaseAdmin
      .from('listings')
      .delete()
      .eq('id', listingId)

    if (deleteError) {
      return apiErrors.databaseError(
        'İlan silinirken bir hata oluştu',
        { error: deleteError, listingId, userId: user.id },
        request.nextUrl.pathname
      )
    }

    logger.debug('[API] Listing deleted successfully', { listingId, userId: user.id })
    return createSuccessResponse({ message: 'İlan başarıyla silindi' })
  } catch (error: unknown) {
    return apiErrors.internalError(
      'İlan silinirken bir hata oluştu',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        listingId,
      },
      request.nextUrl.pathname
    )
  }
}

// PATCH /api/listings/[listingId] - Update listing status or other fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  let listingId: string | undefined
  
  try {
    const user = await getServerUser()

    if (!user?.id) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    const rawParams = await params
    
    // Validate route parameters
    const validation = validateParams(rawParams, listingIdParamSchema)
    if (!validation.success) {
      return validation.response
    }

    listingId = validation.data.listingId
    
    // Parse request body
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch (parseError) {
      logger.error('[API] Failed to parse request body', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        listingId,
      })
      return apiErrors.badRequest(
        'Geçersiz istek gövdesi',
        { reason: 'Request body must be valid JSON' },
        request.nextUrl.pathname
      )
    }

    logger.debug('[API] Updating listing', { listingId, userId: user.id, updateFields: Object.keys(body) })

    // Verify listing ownership
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('user_id')
      .eq('id', listingId)
      .single()

    if (fetchError || !listing) {
      logger.warn('[API] Listing not found', { listingId, fetchError })
      return apiErrors.notFound('İlan', request.nextUrl.pathname)
    }

    if (listing.user_id !== user.id) {
      logger.warn('[API] Unauthorized listing update attempt', { listingId, userId: user.id, ownerId: listing.user_id })
      return apiErrors.forbidden('Bu ilanı güncelleme yetkiniz yok', request.nextUrl.pathname)
    }

    // Prepare update payload (exclude sensitive fields)
    const updatePayload: Record<string, unknown> = {
      ...body,
      updated_at: new Date().toISOString()
    }

    // Remove fields that shouldn't be updated directly
    delete updatePayload.user_id
    delete updatePayload.id
    delete updatePayload.created_at

    // Update the listing
    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update(updatePayload)
      .eq('id', listingId)

    if (updateError) {
      logger.error('[API] Database error updating listing', {
        error: updateError,
        listingId,
        userId: user.id,
        updatePayload,
      })
      return apiErrors.databaseError(
        'İlan güncellenirken bir hata oluştu',
        { error: updateError, listingId, userId: user.id },
        request.nextUrl.pathname
      )
    }

    logger.debug('[API] Listing updated successfully', { listingId, userId: user.id })
    return createSuccessResponse({ message: 'İlan başarıyla güncellendi' })
  } catch (error: unknown) {
    logger.error('[API] Error updating listing', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      listingId,
    })
    return apiErrors.internalError(
      'İlan güncellenirken bir hata oluştu',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        listingId: listingId || 'unknown',
      },
      request.nextUrl.pathname
    )
  }
}

