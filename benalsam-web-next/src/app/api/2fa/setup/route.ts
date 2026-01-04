import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/2fa/setup
 * Generate 2FA secret and QR code for user
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    // Get user email from profiles table
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const userEmail = profile?.email || user.email || 'user'

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Benalsam (${userEmail})`,
      issuer: 'Benalsam',
      length: 32,
    })

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

    // Generate backup codes (8 codes, 8 characters each)
    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    )

    // Store secret and backup codes (using existing columns)
    // Note: In existing schema, we use totp_secret and backup_codes (JSONB)
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        totp_secret: secret.base32, // Will be activated after verification
        backup_codes: backupCodes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('2FA setup error:', error)
      return NextResponse.json(
        { success: false, error: '2FA kurulumu başarısız oldu' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes,
      },
    })
  } catch (error: any) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { success: false, error: '2FA kurulumu sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}

