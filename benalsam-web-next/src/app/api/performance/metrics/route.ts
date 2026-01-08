import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'
import { logger } from '@/utils/production-logger'
import { z } from 'zod'

// Performance metrics schema
const PerformanceMetricsSchema = z.object({
  route: z.string().min(1),
  timestamp: z.string().datetime(),
  metrics: z.object({
    lcp: z.number().min(0),
    fid: z.number().min(0),
    cls: z.number().min(0),
    ttfb: z.number().min(0),
    fcp: z.number().min(0),
  }),
  score: z.number().min(0).max(100),
  userAgent: z.string().optional(),
  viewport: z.object({
    width: z.number().min(0),
    height: z.number().min(0),
  }).optional(),
})

/**
 * POST /api/performance/metrics
 * Store performance metrics from client-side Web Vitals
 */
export async function POST(request: NextRequest) {
  try {
    // Get user (optional - can track anonymous users too)
    const user = await getServerUser()
    const userId = user?.id || null

    // Parse and validate request body
    const body = await request.json()
    const validatedData = PerformanceMetricsSchema.parse(body)

    // Check if performance tracking is enabled
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_TRACKING === 'true' || 
                      process.env.NODE_ENV === 'development'

    if (!isEnabled) {
      return createSuccessResponse(
        { message: 'Performance tracking disabled' },
        { status: 200 }
      )
    }

    // Store in database (performance_metrics table)
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('performance_metrics')
        .insert({
          user_id: userId,
          route: validatedData.route,
          timestamp: validatedData.timestamp,
          lcp: validatedData.metrics.lcp,
          fid: validatedData.metrics.fid,
          cls: validatedData.metrics.cls,
          ttfb: validatedData.metrics.ttfb,
          fcp: validatedData.metrics.fcp,
          score: validatedData.score,
          user_agent: validatedData.userAgent,
          viewport_width: validatedData.viewport?.width,
          viewport_height: validatedData.viewport?.height,
        })

      if (error) {
        logger.error('[PerformanceMetrics] Database insert error', { error, route: validatedData.route })
        // Don't fail the request if DB insert fails - metrics are non-critical
      }
    }

    // Check for performance alerts (threshold violations)
    const alerts: string[] = []
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      cls: { good: 0.1, poor: 0.25 },
      inp: { good: 200, poor: 500 },
      ttfb: { good: 800, poor: 1800 },
      fcp: { good: 1800, poor: 3000 },
    }

    if (validatedData.metrics.lcp > thresholds.lcp.poor) {
      alerts.push(`LCP is poor: ${validatedData.metrics.lcp}ms (threshold: ${thresholds.lcp.poor}ms)`)
    }
    if (validatedData.metrics.cls > thresholds.cls.poor) {
      alerts.push(`CLS is poor: ${validatedData.metrics.cls} (threshold: ${thresholds.cls.poor})`)
    }
    if (validatedData.metrics.fid > thresholds.inp.poor) {
      alerts.push(`INP is poor: ${validatedData.metrics.fid}ms (threshold: ${thresholds.inp.poor}ms)`)
    }
    if (validatedData.metrics.ttfb > thresholds.ttfb.poor) {
      alerts.push(`TTFB is poor: ${validatedData.metrics.ttfb}ms (threshold: ${thresholds.ttfb.poor}ms)`)
    }
    if (validatedData.metrics.fcp > thresholds.fcp.poor) {
      alerts.push(`FCP is poor: ${validatedData.metrics.fcp}ms (threshold: ${thresholds.fcp.poor}ms)`)
    }

    // Log alerts if any
    if (alerts.length > 0) {
      logger.warn('[PerformanceMetrics] Performance alerts detected', {
        route: validatedData.route,
        alerts,
        metrics: validatedData.metrics,
      })
    }

    return createSuccessResponse({
      message: 'Performance metrics recorded',
      alerts: alerts.length > 0 ? alerts : undefined,
    })

  } catch (error: unknown) {
    logger.error('[PerformanceMetrics] Error processing metrics', { error })
    
    if (error instanceof z.ZodError) {
      return apiErrors.validationError(
        'Invalid performance metrics data',
        error.errors,
        request.nextUrl.pathname
      )
    }

    return apiErrors.internalError(
      'Failed to record performance metrics',
      {
        error: error instanceof Error ? error.message : String(error),
      },
      request.nextUrl.pathname
    )
  }
}

/**
 * GET /api/performance/metrics
 * Retrieve performance metrics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser()
    
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return apiErrors.unauthorized('Admin access required', request.nextUrl.pathname)
    }

    const { searchParams } = new URL(request.url)
    const route = searchParams.get('route')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!supabaseAdmin) {
      return apiErrors.internalError(
        'Database connection unavailable',
        {},
        request.nextUrl.pathname
      )
    }

    let query = supabaseAdmin
      .from('performance_metrics')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (route) {
      query = query.eq('route', route)
    }

    const { data, error, count } = await query

    if (error) {
      logger.error('[PerformanceMetrics] Database query error', { error })
      return apiErrors.internalError(
        'Failed to retrieve performance metrics',
        { error: error.message },
        request.nextUrl.pathname
      )
    }

    return createSuccessResponse({
      metrics: data || [],
      total: count || 0,
      limit,
      offset,
    })

  } catch (error: unknown) {
    logger.error('[PerformanceMetrics] Error retrieving metrics', { error })
    return apiErrors.internalError(
      'Failed to retrieve performance metrics',
      {
        error: error instanceof Error ? error.message : String(error),
      },
      request.nextUrl.pathname
    )
  }
}


