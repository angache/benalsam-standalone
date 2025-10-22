'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { LoginCredentials, User } from '@/types/auth'
import { supabase } from '@/lib/supabase'

/**
 * Custom hook for authentication
 * Provides easy access to session, login, logout, and user data
 */
export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<User | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Fetch full user profile when session exists
  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user?.id && !profile) {
        setProfileLoading(true)
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (error) {
            console.error('Error fetching profile:', error)
          } else if (data) {
            setProfile({
              ...session.user,
              // Additional profile data
              rating: data.rating,
              total_ratings: data.total_ratings,
              trust_score: data.trust_score,
              is_premium: data.is_premium,
              premium_expires_at: data.premium_expires_at,
              bio: data.bio,
              province: data.province,
              district: data.district,
            } as User)
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
        } finally {
          setProfileLoading(false)
        }
      }
    }

    fetchProfile()
  }, [session?.user?.id])

  const login = async (credentials: LoginCredentials) => {
    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      if (result?.ok) {
        // Session will be updated automatically by NextAuth
        // Check if user requires 2FA will be handled by the callback
        return { success: true }
      }

      return { success: false, error: 'Giriş yapılırken bir hata oluştu' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    setProfile(null)
    await signOut({ redirect: true, callbackUrl: '/auth/login' })
  }

  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading' || profileLoading
  const user = profile || session?.user

  return {
    session,
    user,
    profile,
    isAuthenticated,
    isLoading,
    login,
    logout,
    update,
    status,
  }
}

