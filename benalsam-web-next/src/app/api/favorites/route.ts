import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { validateBody, validateQuery, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

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
      logger.warn('[API] POST /api/favorites - No user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
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
        return NextResponse.json(
          { message: 'Already favorited', already_favorited: true },
          { status: 200 }
        )
      }
      
      logger.error('[API] Favorite add error', { error, userId: user.id, listingId })
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data, success: true })
  } catch (error: unknown) {
    logger.error('[API] Favorite add exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
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
      logger.error('[API] Favorite remove error', { error, userId: user.id, listingId })
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('[API] Favorite remove exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

