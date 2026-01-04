import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'

/**
 * POST /api/2fa/disable
 * Disable 2FA for user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Şifre gereklidir' },
        { status: 400 }
      )
    }

    // Verify password before disabling 2FA
    // Get user email from profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const userEmail = profile?.email || user.email

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı e-postası bulunamadı' },
        { status: 400 }
      )
    }

    const { error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: userEmail,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz şifre' },
        { status: 401 }
      )
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
      logger.error('[API] 2FA disable error', { error, userId: user.id })
      return NextResponse.json(
        { success: false, error: '2FA devre dışı bırakılamadı' },
        { status: 500 }
      )
    }

    logger.debug('[API] 2FA disabled successfully', { userId: user.id })
    return NextResponse.json({
      success: true,
      message: '2FA başarıyla devre dışı bırakıldı',
    })
  } catch (error: unknown) {
    logger.error('[API] 2FA disable exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { success: false, error: '2FA devre dışı bırakma sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}

