'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { LoginCredentials, User } from '@/types/auth'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  session: Session | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  initialized: boolean
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string; requires2FA?: boolean; user?: any }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
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
        console.log('🔐 [AuthContext] Initializing...')
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('🔐 [AuthContext] Error getting session:', error)
        }

        if (isSubscribed) {
          if (initialSession) {
            console.log('🔐 [AuthContext] Initial session found:', { userId: initialSession.user.id })
            setSession(initialSession)
            await fetchUserProfile(initialSession.user.id)
          } else {
            console.log('🔐 [AuthContext] No initial session')
          }
          setLoading(false)
          setInitialized(true)
        }
      } catch (error) {
        console.error('🔐 [AuthContext] Initialize error:', error)
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
        console.log('🔐 [AuthContext] Auth state change:', event, { hasSession: !!currentSession })
        
        if (!isSubscribed) return

        setSession(currentSession)
        
        if (currentSession?.user) {
          console.log('🔐 [AuthContext] User logged in:', { userId: currentSession.user.id })
          await fetchUserProfile(currentSession.user.id)
        } else {
          console.log('🔐 [AuthContext] User logged out')
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
        
        // Check if 2FA is enabled in profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_2fa_enabled')
          .eq('id', data.user.id)
          .single()
        
        console.log('🔍 2FA Check:', { 
          profile, 
          profileError, 
          is_2fa_enabled: profile?.is_2fa_enabled 
        })
        
        const requires2FA = profile?.is_2fa_enabled || false
        
        if (requires2FA) {
          console.log('🔐 2FA required for user:', data.user.id)
        } else {
          console.log('✅ No 2FA required for user:', data.user.id)
        }
        
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
    console.log('🚪 [AuthContext] Logout started')
    setLoading(true)
    
    try {
      // Try to sign out from Supabase with timeout
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      )
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any
      
      if (error) {
        console.error('❌ [AuthContext] Logout error:', error)
      } else {
        console.log('✅ [AuthContext] Supabase signOut successful')
      }
    } catch (error) {
      console.error('❌ [AuthContext] Logout failed or timed out:', error)
    }
    
    // Clear local state immediately (don't wait for Supabase)
    console.log('🧹 [AuthContext] Clearing local state...')
    setUser(null)
    setSession(null)
    setLoading(false)
    
    // Use window.location for hard redirect to clear all client state
    console.log('🔄 [AuthContext] Redirecting to login...')
    window.location.href = '/auth/login'
  }

  const isAuthenticated = !!session && !!user

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAuthenticated,
        isLoading: loading,
        initialized,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

