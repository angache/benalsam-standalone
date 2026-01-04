import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { createSuccessResponse, apiErrors } from '@/lib/api-errors'

/**
 * POST /api/2fa/setup
 * Generate 2FA secret and QR code for user
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getServerUser()
    if (!user?.id) {
      return apiErrors.unauthorized('Oturum açmanız gerekiyor', request.nextUrl.pathname)
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
      return apiErrors.databaseError(
        '2FA kurulumu başarısız oldu',
        { error: error.message, userId: user.id },
        request.nextUrl.pathname
      )
    }

    return createSuccessResponse({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes,
    })
  } catch (error: unknown) {
    return apiErrors.internalError(
      '2FA kurulumu sırasında bir hata oluştu',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}

