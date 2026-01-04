import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import speakeasy from 'speakeasy'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

/**
 * Schema for 2FA verification
 */
const verify2FASchema = z.object({
  code: z.string().length(6, 'Kod 6 haneli olmalıdır').regex(/^\d+$/, 'Kod sadece rakamlardan oluşmalıdır'),
  userId: commonSchemas.uuid.optional(),
})

/**
 * POST /api/2fa/verify
 * Verify 2FA code during login or setup
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateBody(request, verify2FASchema)
    if (!validation.success) {
      return validation.response
    }

    const { code, userId } = validation.data

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
    const { data: profile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, totp_secret, backup_codes, is_2fa_enabled')
      .eq('id', targetUserId)
      .single()

    if (userError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Check if it's a backup code
    if (profile.backup_codes && profile.backup_codes.includes(code)) {
      // Remove used backup code
      const updatedCodes = profile.backup_codes.filter((c: string) => c !== code)
      
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
    const secret = profile.totp_secret

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
    if (!profile.is_2fa_enabled) {
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
  } catch (error: unknown) {
    logger.error('[API] 2FA verification error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: targetUserId
    })
    return NextResponse.json(
      { success: false, error: 'Kod doğrulama sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}

