import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { RegisterCredentials } from '@/types/auth'
import { generateUsername, ensureUniqueUsername } from '@/utils/username'
import { logger } from '@/utils/production-logger'
import { validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { createSuccessResponse, apiErrors, ApiErrorCode } from '@/lib/api-errors'

/**
 * Schema for user registration
 */
const registerSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır').max(100, 'Ad en fazla 100 karakter olabilir'),
  email: commonSchemas.email,
  password: commonSchemas.password,
  passwordConfirm: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Kullanım koşullarını kabul etmelisiniz',
  }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Şifreler eşleşmiyor',
  path: ['passwordConfirm'],
})

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateBody(request, registerSchema)
    if (!validation.success) {
      return validation.response
    }

    const body = validation.data

    // Check if user already exists (check in auth.users via Supabase Auth)
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingAuthUser.users.some((u: { email?: string }) => u.email === body.email)

    if (userExists) {
      return apiErrors.duplicateEntry('Bu email adresi', request.nextUrl.pathname)
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: false, // Require email verification
      user_metadata: {
        name: body.name,
      },
    })

    if (authError) {
      return apiErrors.databaseError(
        'Kullanıcı oluşturulamadı',
        { error: authError, email: body.email },
        request.nextUrl.pathname
      )
    }

    // Generate unique username
    const baseUsername = generateUsername(body.name)
    
    // Check for existing usernames to ensure uniqueness
    const { data: existingUsernames } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .not('username', 'is', null)
    
    const usernameList = existingUsernames?.map((p: { username: string | null }) => p.username) || []
    const uniqueUsername = ensureUniqueUsername(baseUsername, usernameList)

    // Create user profile in database (profiles table)
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      name: body.name,
      username: uniqueUsername,
      role: 'user',
      is_2fa_enabled: false,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      // Rollback: Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return apiErrors.databaseError(
        'Profil oluşturulamadı',
        { error: profileError, userId: authData.user.id },
        request.nextUrl.pathname
      )
    }

    return createSuccessResponse(
      {
        message: 'Kayıt başarılı! Lütfen email adresinizi doğrulayın.',
        user: {
          id: authData.user.id,
          email: body.email,
          name: body.name,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    return apiErrors.internalError(
      'Kayıt yapılırken bir hata oluştu',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      request.nextUrl.pathname
    )
  }
}

