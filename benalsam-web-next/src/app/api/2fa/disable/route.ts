import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { validateBody } from '@/lib/api-validation'
import { z } from 'zod'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'

/**
 * Schema for disable 2FA request body
 */
const disable2FASchema = z.object({
  password: z.string().min(1, 'Şifre gereklidir'),
})

/**
 * POST /api/2fa/disable
 * Disable 2FA for user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
    }

    // Rate limiting (stricter for 2FA operations)
    const identifier = getClientIdentifier(request, user.id)
    const allowed = await rateLimiters.strict.check(identifier)
    
    if (!allowed) {
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: '2fa-disable' })
      return rateLimitExceeded()
    }

    // Validate request body
    const validation = await validateBody(request, disable2FASchema)
    if (!validation.success) {
      return validation.response
    }

    const { password } = validation.data

    // Verify password before disabling 2FA
    // Get user email from profile
    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const userEmail = profile?.email || user.email

    if (!userEmail) {
      return apiErrors.validationError(
        'Kullanıcı e-postası bulunamadı',
        { userId: user.id },
        request.nextUrl.pathname
      )
    }

    const { error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: userEmail,
      password,
    })

    if (authError) {
      return apiErrors.unauthorized('Geçersiz şifre', request.nextUrl.pathname)
    }

    // Update user to disable 2FA and clear secrets
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_2fa_enabled: false,
        totp_secret: null,
        backup_codes: null,
        last_2fa_used: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      return apiErrors.databaseError(
        '2FA devre dışı bırakılamadı',
        { error: (error as { message?: string })?.message || String(error), userId: user.id },
        request.nextUrl.pathname
      )
    }

    logger.debug('[API] 2FA disabled successfully', { userId: user.id })
    return createSuccessResponse({ message: '2FA başarıyla devre dışı bırakıldı' })
  } catch (error: unknown) {
    return apiErrors.internalError(
      '2FA devre dışı bırakma sırasında bir hata oluştu',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}

