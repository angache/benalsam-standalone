import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'

/**
 * POST /api/2fa/enable
 * Enable 2FA for user (after successful setup and verification)
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

    // Update user to enable 2FA
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_2fa_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      logger.error('[API] 2FA enable error', { error, userId: user.id })
      return NextResponse.json(
        { success: false, error: '2FA aktifleştirilemedi' },
        { status: 500 }
      )
    }

    logger.debug('[API] 2FA enabled successfully', { userId: user.id })
    return NextResponse.json({
      success: true,
      message: '2FA başarıyla aktifleştirildi',
    })
  } catch (error: unknown) {
    logger.error('[API] 2FA enable exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { success: false, error: '2FA aktifleştirme sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}

