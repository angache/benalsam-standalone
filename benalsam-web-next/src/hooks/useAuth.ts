'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import type { LoginCredentials, User } from '@/types/auth'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

/**
 * Custom hook for Supabase authentication
 * Provides easy access to session, login, logout, and user data
 */
export function useAuth() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Initialize auth state and listen for changes
  useEffect(() => {
    let isSubscribed = true

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔐 [useAuth] Initializing...')
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('🔐 [useAuth] Error getting session:', error)
        }

        if (isSubscribed) {
          if (initialSession) {
            console.log('🔐 [useAuth] Initial session found:', { userId: initialSession.user.id })
            setSession(initialSession)
            await fetchUserProfile(initialSession.user.id)
          } else {
            console.log('🔐 [useAuth] No initial session')
          }
          setLoading(false)
          setInitialized(true)
        }
      } catch (error) {
        console.error('🔐 [useAuth] Initialize error:', error)
        if (isSubscribed) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔐 [useAuth] Auth state change:', event, { hasSession: !!currentSession })
        
        if (!isSubscribed) return

        setSession(currentSession)
        
        if (currentSession?.user) {
          console.log('🔐 [useAuth] User logged in:', { userId: currentSession.user.id })
          await fetchUserProfile(currentSession.user.id)
        } else {
          console.log('🔐 [useAuth] User logged out')
          setUser(null)
        }
        
        setLoading(false)
        setInitialized(true)
      }
    )

    return () => {
      isSubscribed = false
      subscription.unsubscribe()
    }
  }, [])

  // Fetch full user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          name: data.name || 'Kullanıcı',
          avatar_url: data.avatar_url,
          rating: data.rating,
          total_ratings: data.total_ratings,
          rating_sum: data.rating_sum,
          trust_score: data.trust_score,
          is_premium: data.is_premium,
          premium_expires_at: data.premium_expires_at,
          bio: data.bio,
          province: data.province,
          district: data.district,
          created_at: data.created_at,
          updated_at: data.updated_at,
        } as User)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.session) {
        console.log('✅ Login successful:', { userId: data.user.id })
        
        // Check if 2FA is required (stored in user metadata)
        const requires2FA = data.user.user_metadata?.requires_2fa || false
        
        return { 
          success: true, 
          requires2FA,
          user: data.user 
        }
      }

      return { success: false, error: 'Giriş yapılırken bir hata oluştu' }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      router.push('/auth/login')
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setLoading(false)
    }
  }

  const isAuthenticated = !!session && !!user
  const isLoading = loading

  return {
    session,
    user,
    isAuthenticated,
    isLoading,
    initialized,
    login,
    logout,
  }
}
