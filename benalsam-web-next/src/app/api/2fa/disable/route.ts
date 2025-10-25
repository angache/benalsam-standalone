import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'

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
    const { error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: session.user.email,
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
      console.error('2FA disable error:', error)
      return NextResponse.json(
        { success: false, error: '2FA devre dışı bırakılamadı' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '2FA başarıyla devre dışı bırakıldı',
    })
  } catch (error: any) {
    console.error('2FA disable error:', error)
    return NextResponse.json(
      { success: false, error: '2FA devre dışı bırakma sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}

