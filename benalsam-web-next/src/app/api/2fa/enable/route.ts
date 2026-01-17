import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'
import { rateLimiters, getClientIdentifier, rateLimitExceeded } from '@/lib/rate-limit'

/**
 * POST /api/2fa/enable
 * Enable 2FA for user (after successful setup and verification)
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
      logger.warn('[API] Rate limit exceeded', { identifier, endpoint: '2fa-enable' })
      return rateLimitExceeded()
    }

    // Update user to enable 2FA
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_2fa_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      return apiErrors.databaseError(
        '2FA aktifleştirilemedi',
        { error: (error as { message?: string })?.message || String(error), userId: user.id },
        request.nextUrl.pathname
      )
    }

    logger.debug('[API] 2FA enabled successfully', { userId: user.id })
    return createSuccessResponse({ message: '2FA başarıyla aktifleştirildi' })
  } catch (error: unknown) {
    return apiErrors.internalError(
      '2FA aktifleştirme sırasında bir hata oluştu',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}

