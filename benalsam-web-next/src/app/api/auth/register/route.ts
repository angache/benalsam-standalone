import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { RegisterCredentials } from '@/types/auth'
import { generateUsername, ensureUniqueUsername } from '@/utils/username'
import { logger } from '@/utils/production-logger'
import { validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { createSuccessResponse, apiErrors, ApiErrorCode } from '@/lib/api-errors'
import { createFreeTrialSubscription, isEligibleForFreeTrial } from '@/services/premiumService/free-trial'

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

    // Get supabaseAdmin (will throw if not available)
    const supabaseAdmin = getSupabaseAdmin()

    // Check if user already exists (check in auth.users via Supabase Auth)
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingAuthUser.users.some((u: { email?: string }) => u.email === body.email)

    if (userExists) {
      return apiErrors.duplicateEntry('Bu email adresi', request.nextUrl.pathname)
    }

    // Create user in Supabase Auth
    logger.debug('[Register] Attempting to create user in Supabase Auth', { 
      email: body.email,
      hasPassword: !!body.password,
      passwordLength: body.password?.length
    })

    // In development, auto-confirm email. In production, require email verification
    const isDevelopment = process.env.NODE_ENV === 'development'
    const requireEmailConfirmation = process.env.REQUIRE_EMAIL_CONFIRMATION === 'true'
    const emailConfirm = !isDevelopment && requireEmailConfirmation ? false : true

    logger.debug('[Register] Creating user with email confirmation settings', {
      email: body.email,
      isDevelopment,
      requireEmailConfirmation,
      emailConfirm,
    })

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: emailConfirm, // Auto-confirm in development, require verification in production
      user_metadata: {
        name: body.name,
      },
    })

    if (authError) {
      logger.error('[Register] Supabase Auth error creating user', {
        error: authError,
        errorCode: authError.code,
        errorMessage: authError.message,
        errorStatus: authError.status,
        email: body.email
      })
      
      return apiErrors.databaseError(
        'Kullanıcı oluşturulamadı',
        { 
          error: authError, 
          errorCode: authError.code,
          errorMessage: authError.message,
          email: body.email 
        },
        request.nextUrl.pathname
      )
    }

    logger.debug('[Register] User created successfully in Supabase Auth', { 
      userId: authData.user.id,
      email: authData.user.email
    })

    // Wait a bit for trigger to create profile (handle_new_user trigger)
    // The trigger automatically creates a profile record, so we just need to update it
    // Retry logic: Check if profile exists, wait if not, then update
    let profileExists = false
    let retries = 0
    const maxRetries = 5
    
    while (!profileExists && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 200)) // 200ms wait
      
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single()
      
      if (existingProfile) {
        profileExists = true
        logger.debug('[Register] Profile found after trigger', { 
          userId: authData.user.id,
          retries 
        })
      } else {
        retries++
        logger.debug('[Register] Profile not found yet, retrying', { 
          userId: authData.user.id,
          retries 
        })
      }
    }

    if (!profileExists) {
      // Profile doesn't exist, trigger might have failed - create it manually
      logger.warn('[Register] Profile not found after trigger, creating manually', { userId: authData.user.id })
      
      // Generate unique username
      const baseUsername = generateUsername(body.name)
      const { data: existingUsernames } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .not('username', 'is', null)
      
      const usernameList = existingUsernames?.map((p: { username: string | null }) => p.username).filter((u): u is string => u !== null) || []
      const uniqueUsername = ensureUniqueUsername(baseUsername, usernameList)
      
      const { error: insertError } = await supabaseAdmin.from('profiles').insert({
        id: authData.user.id,
        name: body.name,
        username: uniqueUsername,
        role: 'user',
        is_2fa_enabled: false,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        logger.error('[Register] Error creating profile manually', {
          error: insertError,
          userId: authData.user.id,
          errorCode: insertError.code,
          errorMessage: insertError.message
        })
        // Rollback: Delete auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return apiErrors.databaseError(
          'Profil oluşturulamadı',
          { error: insertError, userId: authData.user.id },
          request.nextUrl.pathname
        )
      }
      
      logger.debug('[Register] Profile created manually', { userId: authData.user.id })
    } else {
      // Profile exists, update it with username and other details
      // Generate unique username
      const baseUsername = generateUsername(body.name)
      const { data: existingUsernames } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .not('username', 'is', null)
      
      const usernameList = existingUsernames?.map((p: { username: string | null }) => p.username).filter((u): u is string => u !== null) || []
      const uniqueUsername = ensureUniqueUsername(baseUsername, usernameList)

      // Update the profile created by trigger
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          name: body.name,
          username: uniqueUsername,
          is_2fa_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id)

      if (profileError) {
        // Update failed - log but continue (non-critical, profile already exists)
        logger.warn('[Register] Profile exists but update failed, continuing anyway', {
          error: profileError,
          userId: authData.user.id,
          errorCode: profileError.code,
          errorMessage: profileError.message
        })
      } else {
        logger.debug('[Register] Profile updated successfully', { userId: authData.user.id })
      }
    }

    // Create free trial subscription for new users (Corporate Plan - 6 months)
    // Strategy: Unlimited listings + unlimited offers for first 6 months
    // Target: All new users (no time restriction - until manually disabled via ENABLE_FREE_TRIAL env var)
    if (isEligibleForFreeTrial()) {
      logger.debug('[Register] User is eligible for free trial (6 months)', { 
        userId: authData.user.id
      })
      
      // Create free trial subscription asynchronously (don't block registration)
      createFreeTrialSubscription(authData.user.id)
        .then((success) => {
          if (success) {
            logger.info('[Register] Free trial subscription created (6 months)', { userId: authData.user.id })
          } else {
            logger.warn('[Register] Failed to create free trial subscription', { userId: authData.user.id })
          }
        })
        .catch((error) => {
          logger.error('[Register] Error creating free trial subscription', { 
            error, 
            userId: authData.user.id 
          })
        })
    } else {
      logger.debug('[Register] Free trial is disabled', { 
        userId: authData.user.id
      })
    }

    return createSuccessResponse(
      {
        message: 'Kayıt başarılı! Lütfen email adresinizi doğrulayın.',
        user: {
          id: authData.user.id,
          email: body.email,
          name: body.name,
        },
        freeTrialEligible: isEligibleForFreeTrial(),
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

