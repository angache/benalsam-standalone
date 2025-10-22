import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { supabaseAdmin } from './supabase'
import type { User } from '@/types/auth'

/**
 * Get current user session (server-side)
 * Use this in Server Components and API Routes
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return null
    }

    // Get full user profile from database
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error || !profile) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return {
      id: profile.id,
      email: session.user.email,
      name: profile.name || session.user.name,
      role: profile.role || 'user',
      is_2fa_enabled: profile.is_2fa_enabled || false,
      phone: profile.phone_number,
      avatar_url: profile.avatar_url,
      // Additional profile fields
      rating: profile.rating,
      total_ratings: profile.total_ratings,
      trust_score: profile.trust_score,
      is_premium: profile.is_premium,
      premium_expires_at: profile.premium_expires_at,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    } as User
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Require authentication (server-side)
 * Throws error if user is not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Require specific role (server-side)
 * Throws error if user doesn't have required role
 */
export async function requireRole(role: 'admin' | 'moderator'): Promise<User> {
  const user = await requireAuth()
  
  if (user.role !== role && user.role !== 'admin') {
    throw new Error(`Role '${role}' required`)
  }
  
  return user
}

