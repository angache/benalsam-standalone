/**
 * Track Search API Route
 * 
 * Tracks user search queries in user_behavior_logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/production-logger'
import { validateBody } from '@/lib/api-validation'
import { z } from 'zod'
import { createSuccessResponse } from '@/lib/api-errors'

/**
 * Schema for track search request body
 */
const trackSearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(500, 'Query too long'),
  source: z.string().optional(),
  userId: z.string().uuid().optional().nullable(),
  sessionId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateBody(request, trackSearchSchema)
    if (!validation.success) {
      return validation.response
    }

    const { query, source, userId, sessionId } = validation.data

    // Create Supabase client for server-side
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Insert into user_behavior_logs
    const { error } = await supabase
      .from('user_behavior_logs')
      .insert({
        user_id: userId || null,
        session_id: sessionId || crypto.randomUUID(),
        action: 'search',
        search_query: query,
        filters: source ? { source } : null,
      })

    if (error) {
      // Silent fail - table might not exist or RLS might block
      logger.debug('[API] Track search failed (expected if table not configured)', { error: (error as { message?: string })?.message || String(error) })
      return createSuccessResponse({ tracked: false }) // Return success anyway
    }

    return createSuccessResponse({ tracked: true })

  } catch (error: unknown) {
    logger.error('[API] Track search exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    // Don't fail the request - tracking is optional
    return createSuccessResponse({ tracked: false })
  }
}

