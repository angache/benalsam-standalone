import type { DefaultSession, DefaultUser } from 'next-auth'
import type { JWT as DefaultJWT } from 'next-auth/jwt'

/**
 * Extended User type with additional fields
 */
export interface User extends DefaultUser {
  id: string
  email: string
  name: string
  role: 'user' | 'admin' | 'moderator'
  is_2fa_enabled: boolean
  phone?: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
  
  // Profile additional fields
  bio?: string | null
  rating?: number | null
  total_ratings?: number
  trust_score?: number | null
  is_premium?: boolean
  premium_expires_at?: string | null
  province?: string | null
  district?: string | null
  neighborhood?: string | null
  listings_count?: number
  followers_count?: number
  following_count?: number
}

/**
 * Extended Session type
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: User
    accessToken?: string
    error?: string
  }

  interface User extends DefaultUser {
    id: string
    email: string
    name: string
    role: 'user' | 'admin' | 'moderator'
    is_2fa_enabled: boolean
    phone?: string | null
    avatar_url?: string | null
  }
}

/**
 * Extended JWT type
 */
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    email: string
    name: string
    role: 'user' | 'admin' | 'moderator'
    is_2fa_enabled: boolean
    phone?: string | null
    avatar_url?: string | null
    accessToken?: string
    error?: string
  }
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

/**
 * Login response from Supabase
 */
export interface LoginResponse {
  success: boolean
  user?: User
  accessToken?: string
  requires2FA?: boolean
  error?: string
  message?: string
}

/**
 * 2FA Verification
 */
export interface TwoFactorVerification {
  userId: string
  code: string
}

/**
 * 2FA Setup
 */
export interface TwoFactorSetup {
  secret: string
  qrCode: string
  backupCodes: string[]
}

/**
 * Register credentials
 */
export interface RegisterCredentials {
  name: string
  email: string
  password: string
  passwordConfirm: string
  acceptTerms: boolean
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string
}

/**
 * Password reset
 */
export interface PasswordReset {
  token: string
  password: string
  passwordConfirm: string
}

