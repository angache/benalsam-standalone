import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import speakeasy from 'speakeasy'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/2fa/verify
 * Verify 2FA code during login or setup
 */
export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json()

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Kod gereklidir' },
        { status: 400 }
      )
    }

    // Get user session or use provided userId (for login flow)
    const user = await getServerUser()
    const targetUserId = userId || user?.id

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 401 }
      )
    }

    // Get user from database (profiles table)
    // Using existing column names: totp_secret, backup_codes
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, totp_secret, backup_codes, is_2fa_enabled')
      .eq('id', targetUserId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Check if it's a backup code
    if (user.backup_codes && user.backup_codes.includes(code)) {
      // Remove used backup code
      const updatedCodes = user.backup_codes.filter((c: string) => c !== code)
      
      await supabaseAdmin
        .from('profiles')
        .update({
          backup_codes: updatedCodes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId)

      return NextResponse.json({
        success: true,
        message: 'Backup kod doğrulandı',
        remainingBackupCodes: updatedCodes.length,
      })
    }

    // Use totp_secret from existing schema
    const secret = user.totp_secret

    if (!secret) {
      return NextResponse.json(
        { success: false, error: '2FA yapılandırması bulunamadı' },
        { status: 400 }
      )
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 steps of time drift
    })

    if (!verified) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz kod' },
        { status: 401 }
      )
    }

    // If 2FA is not enabled yet, enable it now (after successful verification)
    if (!user.is_2fa_enabled) {
      await supabaseAdmin
        .from('profiles')
        .update({
          is_2fa_enabled: true,
          last_2fa_used: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId)

      return NextResponse.json({
        success: true,
        message: '2FA başarıyla aktifleştirildi',
        setup: true,
      })
    }

    // Update last 2FA usage
    await supabaseAdmin
      .from('profiles')
      .update({
        last_2fa_used: new Date().toISOString(),
      })
      .eq('id', targetUserId)

    return NextResponse.json({
      success: true,
      message: 'Kod doğrulandı',
    })
  } catch (error: any) {
    console.error('2FA verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Kod doğrulama sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}

