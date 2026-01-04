/**
 * Track Search API Route
 * 
 * Tracks user search queries in user_behavior_logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/production-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, source, userId, sessionId } = body

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      )
    }

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
      logger.debug('[API] Track search failed (expected if table not configured)', { error: error.message })
      return NextResponse.json({ success: true }) // Return success anyway
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    logger.error('[API] Track search exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    // Don't fail the request - tracking is optional
    return NextResponse.json({ success: true })
  }
}

