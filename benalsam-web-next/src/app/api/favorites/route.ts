import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { validateBody, validateQuery, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'

/**
 * Schema for adding a favorite
 */
const addFavoriteSchema = z.object({
  listingId: commonSchemas.uuid,
})

// Add favorite
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    
    if (!user?.id) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    // Validate request body
    const validation = await validateBody(request, addFavoriteSchema)
    if (!validation.success) {
      return validation.response
    }

    const { listingId } = validation.data
    
    logger.debug('[API] POST /api/favorites', { userId: user.id, listingId })

    logger.debug('[API] Inserting favorite', { userId: user.id, listingId })

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
        return createSuccessResponse({ already_favorited: true, message: 'Zaten favorilerinizde' })
      }
      
      return apiErrors.databaseError(
        'Favori eklenirken bir hata oluştu',
        { error: error.message, userId: user.id, listingId },
        request.nextUrl.pathname
      )
    }

    return createSuccessResponse(data)
  } catch (error: unknown) {
    return apiErrors.internalError(
      'Favori eklenirken bir hata oluştu',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}

/**
 * Schema for removing a favorite (query params)
 */
const removeFavoriteSchema = z.object({
  listingId: commonSchemas.uuid,
})

// Remove favorite
export async function DELETE(request: NextRequest) {
  try {
    const user = await getServerUser()

    if (!user?.id) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    // Validate query parameters
    const validation = validateQuery(request, removeFavoriteSchema)
    if (!validation.success) {
      return validation.response
    }

    const { listingId } = validation.data

    const { error } = await supabaseAdmin
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId)

    if (error) {
      return apiErrors.databaseError(
        'Favori silinirken bir hata oluştu',
        { error: error.message, userId: user.id, listingId },
        request.nextUrl.pathname
      )
    }

    return createSuccessResponse({ message: 'Favori başarıyla silindi' })
  } catch (error: unknown) {
    return apiErrors.internalError(
      'Favori silinirken bir hata oluştu',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}

