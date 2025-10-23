import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { RegisterCredentials } from '@/types/auth'
import { generateUsername, ensureUniqueUsername } from '@/utils/username'

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body: RegisterCredentials = await request.json()

    // Validate input
    if (!body.name || !body.email || !body.password || !body.passwordConfirm) {
      return NextResponse.json(
        { success: false, error: 'Tüm alanlar zorunludur' },
        { status: 400 }
      )
    }

    if (body.password !== body.passwordConfirm) {
      return NextResponse.json(
        { success: false, error: 'Şifreler eşleşmiyor' },
        { status: 400 }
      )
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Şifre en az 8 karakter olmalıdır' },
        { status: 400 }
      )
    }

    if (!body.acceptTerms) {
      return NextResponse.json(
        { success: false, error: 'Kullanım koşullarını kabul etmelisiniz' },
        { status: 400 }
      )
    }

    // Check if user already exists (check in auth.users via Supabase Auth)
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingAuthUser.users.some((u: { email?: string }) => u.email === body.email)

    if (userExists) {
      return NextResponse.json(
        { success: false, error: 'Bu email adresi zaten kullanılıyor' },
        { status: 409 }
      )
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
      console.error('Supabase auth error:', authError)
      return NextResponse.json(
        { success: false, error: 'Kullanıcı oluşturulamadı' },
        { status: 500 }
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
      console.error('Profile creation error:', profileError)
      // Rollback: Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { success: false, error: 'Profil oluşturulamadı' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Kayıt başarılı! Lütfen email adresinizi doğrulayın.',
        user: {
          id: authData.user.id,
          email: body.email,
          name: body.name,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Kayıt yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
}

