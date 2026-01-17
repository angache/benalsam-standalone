/**
 * Create Payment Intent API Route
 * 
 * Creates a payment intent for one-time payments (e.g., doping purchases)
 * 
 * POST /api/payments/create-intent
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getPaymentService } from '@/services/paymentService'
import { validateBody, commonSchemas } from '@/lib/api-validation'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'
import { z } from 'zod'
import { logger } from '@/utils/production-logger'

/**
 * Payment Item Schema
 * Note: Using simpler schema structure to avoid Zod 4.x compatibility issues
 */
const paymentItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().int().positive(),
  quantity: z.number().int().positive(),
  metadata: z.record(z.string(), z.string()).optional(),
})

/**
 * Payment Intent Request Schema
 * Note: Using simpler schema structure to avoid Zod 4.x compatibility issues
 */
const createPaymentIntentSchema = z.object({
  amount: z.number().int().positive().min(100), // Minimum 1 TRY (100 kuruş)
  currency: z.enum(['TRY', 'USD', 'EUR']),
  items: z.array(paymentItemSchema).min(1),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Log to console for debugging (server-side)
    console.log('🔍 [Payment API] Request received', { 
      url: request.url,
      method: request.method,
      contentType: request.headers.get('content-type'),
      contentLength: request.headers.get('content-length'),
    })
    
    logger.debug('[Payment API] Request received', { 
      url: request.url,
      method: request.method,
      contentType: request.headers.get('content-type'),
      contentLength: request.headers.get('content-length'),
    })

    const user = await getServerUser()

    if (!user?.id) {
      logger.warn('[Payment API] Unauthorized request', { 
        path: request.nextUrl.pathname 
      })
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    logger.debug('[Payment API] User authenticated', { userId: user.id })

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id)
    logger.debug('[Payment API] Checking rate limit', { identifier })
    
    const allowed = await rateLimiters.strict.check(identifier)
    
    if (!allowed) {
      logger.warn('[Payment API] Rate limit exceeded', { 
        identifier, 
        endpoint: 'payment-create-intent' 
      })
      return rateLimitExceeded()
    }

    logger.debug('[Payment API] Rate limit check passed', { identifier })

    // Validate request body
    logger.debug('[Payment API] Validating request body', {
      contentType: request.headers.get('content-type'),
      hasBody: request.body !== null,
      schemaType: createPaymentIntentSchema?.constructor?.name,
      schemaHasSafeParse: typeof createPaymentIntentSchema?.safeParse === 'function',
    })
    
    // Verify schema is valid before passing to validateBody
    if (!createPaymentIntentSchema || typeof createPaymentIntentSchema.safeParse !== 'function') {
      logger.error('[Payment API] Schema is invalid', {
        schemaType: typeof createPaymentIntentSchema,
        schemaConstructor: createPaymentIntentSchema?.constructor?.name,
        hasSafeParse: typeof createPaymentIntentSchema?.safeParse === 'function',
      })
      return apiErrors.internalError(
        'Validation schema error',
        { reason: 'Payment intent schema is not valid' },
        request.nextUrl.pathname
      )
    }
    
    const validation = await validateBody(request, createPaymentIntentSchema)
    
    if (!validation.success) {
      // Extract validation errors for better logging
      try {
        const validationResponse = await validation.response.clone().json().catch(() => ({}))
        logger.warn('[Payment API] Validation failed', { 
          validationResponse,
          status: validation.response.status,
          statusText: validation.response.statusText,
        })
      } catch (logError) {
        logger.warn('[Payment API] Validation failed (could not parse error response)', { 
          status: validation.response.status,
          statusText: validation.response.statusText,
          logError: logError instanceof Error ? logError.message : String(logError),
        })
      }
      return validation.response
    }

    logger.debug('[Payment API] Validation passed', {
      amount: validation.data.amount,
      currency: validation.data.currency,
      itemsCount: validation.data.items.length,
    })

    // Extract and validate data with defaults
    const validatedData = validation.data
    const amount = validatedData.amount
    const currency = validatedData.currency || 'TRY' // Default to TRY if not provided
    const items = validatedData.items.map(item => ({
      ...item,
      quantity: item.quantity || 1, // Default to 1 if not provided
    }))
    const description = validatedData.description
    const metadata = validatedData.metadata
    const returnUrl = validatedData.returnUrl
    const cancelUrl = validatedData.cancelUrl

    logger.debug('[Payment API] Creating payment intent', { 
      userId: user.id, 
      amount, 
      currency, 
      itemCount: items.length 
    })

    // Get user name from profiles table
    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    // Get payment service (automatically uses mock/stripe/iyzico based on config)
    logger.debug('[Payment API] Getting payment service', { 
      provider: process.env.PAYMENT_PROVIDER || 'mock' 
    })
    
    let paymentService
    try {
      paymentService = getPaymentService()
      logger.debug('[Payment API] Payment service initialized')
    } catch (serviceError) {
      logger.error('[Payment API] Failed to initialize payment service', { 
        error: serviceError instanceof Error ? serviceError.message : String(serviceError),
        stack: serviceError instanceof Error ? serviceError.stack : undefined,
      })
      throw new Error('Payment service initialization failed')
    }

    // Create payment intent
    const paymentRequest = {
      amount,
      currency,
      items,
      customerId: user.id,
      customerEmail: user.email || '',
      customerName: profile?.name || user.user_metadata?.name || undefined,
      description: description || `Payment for ${items.map(i => i.name).join(', ')}`,
      metadata: {
        ...metadata,
        userId: user.id,
        userEmail: user.email || '',
      },
      returnUrl: returnUrl || `${request.nextUrl.origin}/payment/success`,
      cancelUrl: cancelUrl || `${request.nextUrl.origin}/payment/cancel`,
    }

    logger.debug('[Payment API] Creating payment intent', { 
      request: paymentRequest 
    })

    let paymentIntent
    try {
      paymentIntent = await paymentService.createPaymentIntent(paymentRequest)
      logger.debug('[Payment API] Payment intent created successfully', { 
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status 
      })
    } catch (paymentError) {
      logger.error('[Payment API] Failed to create payment intent', { 
        error: paymentError instanceof Error ? paymentError.message : String(paymentError),
        stack: paymentError instanceof Error ? paymentError.stack : undefined,
        request: paymentRequest,
      })
      throw paymentError
    }

    logger.debug('[Payment API] Payment intent created', { 
      paymentIntentId: paymentIntent.id, 
      status: paymentIntent.status 
    })

    return createSuccessResponse({
      paymentIntent,
    })

  } catch (error: unknown) {
    // Better error serialization
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    
    logger.error('[Payment API] Error creating payment intent', { 
      errorName,
      errorMessage,
      errorStack,
      errorString: String(error),
      errorType: error instanceof Error ? 'Error' : typeof error,
      path: request.nextUrl.pathname,
    })

    return apiErrors.internalError(
      'Ödeme hazırlanırken bir hata oluştu',
      {
        error: errorMessage,
        errorName,
        ...(errorStack && { stack: errorStack }),
      },
      request.nextUrl.pathname
    )
  }
}

