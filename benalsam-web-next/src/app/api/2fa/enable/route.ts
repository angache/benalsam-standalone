import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'

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
      console.error('2FA enable error:', error)
      return NextResponse.json(
        { success: false, error: '2FA aktifleştirilemedi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '2FA başarıyla aktifleştirildi',
    })
  } catch (error: any) {
    console.error('2FA enable error:', error)
    return NextResponse.json(
      { success: false, error: '2FA aktifleştirme sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}

