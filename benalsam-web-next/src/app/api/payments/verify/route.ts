/**
 * Verify Payment API Route
 * 
 * Verifies the status of a payment intent
 * 
 * POST /api/payments/verify
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { getPaymentService } from '@/services/paymentService'
import { validateBody } from '@/lib/api-validation'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'
import { z } from 'zod'
import { logger } from '@/utils/production-logger'

/**
 * Verify Payment Request Schema
 */
const verifyPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()

    if (!user?.id) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id)
    const allowed = await rateLimiters.standard.check(identifier)
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: 'payment-verify' })
      return rateLimitExceeded()
    }

    // Validate request body
    const validation = await validateBody(request, verifyPaymentSchema)
    if (!validation.success) {
      return validation.response
    }

    const { paymentIntentId } = validation.data

    logger.debug('[Payment API] Verifying payment', { 
      userId: user.id, 
      paymentIntentId 
    })

    // Get payment service
    const paymentService = getPaymentService()

    // Verify payment
    const paymentResult = await paymentService.verifyPayment(paymentIntentId)

    logger.debug('[Payment API] Payment verified', { 
      paymentIntentId, 
      status: paymentResult.status 
    })

    return createSuccessResponse({
      payment: paymentResult,
    })

  } catch (error: unknown) {
    logger.error('[Payment API] Error verifying payment', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return apiErrors.internalError(
      'Ödeme doğrulanırken bir hata oluştu',
      {
        error: error instanceof Error ? error.message : String(error),
      },
      request.nextUrl.pathname
    )
  }
}

