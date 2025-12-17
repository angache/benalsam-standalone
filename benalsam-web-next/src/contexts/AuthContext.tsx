'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { LoginCredentials, User } from '@/types/auth'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { logger } from '@/utils/production-logger'
import { realtimeManager } from '@/lib/realtime-manager'

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
  const fetchedUserIds = useRef<Set<string>>(new Set())

  // Initialize auth state and listen for changes
  useEffect(() => {
    let isSubscribed = true

    // Get initial session with retry mechanism
    const initializeAuth = async (retryCount = 0) => {
      try {
        logger.debug('[AuthContext] Initializing...', { retryCount })
        
        // Retry up to 3 times with exponential backoff
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          logger.error('[AuthContext] Error getting session', { error, retryCount })
          
          // Retry on error (up to 3 times)
          if (retryCount < 3 && isSubscribed) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
            logger.debug('[AuthContext] Retrying session fetch...', { retryCount: retryCount + 1, delay })
            setTimeout(() => {
              if (isSubscribed) {
                initializeAuth(retryCount + 1)
              }
            }, delay)
            return
          }
        }

        if (isSubscribed) {
          if (initialSession) {
            // Verify session is still valid
            const now = Math.floor(Date.now() / 1000)
            const expiresAt = initialSession.expires_at || 0
            
            if (expiresAt > now) {
              logger.debug('[AuthContext] Initial session found', { userId: initialSession.user.id })
              setSession(initialSession)
              await fetchUserProfile(initialSession.user.id)
            } else {
              logger.debug('[AuthContext] Session expired, refreshing...')
              // Try to refresh the session
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
              if (refreshedSession && !refreshError) {
                logger.debug('[AuthContext] Session refreshed', { userId: refreshedSession.user.id })
                setSession(refreshedSession)
                await fetchUserProfile(refreshedSession.user.id)
              } else {
                logger.debug('[AuthContext] Could not refresh session', { error: refreshError })
                setSession(null)
              }
            }
          } else {
            logger.debug('[AuthContext] No initial session')
          }
          setLoading(false)
          setInitialized(true)
        }
      } catch (error) {
        logger.error('[AuthContext] Initialize error', { error, retryCount })
        if (isSubscribed) {
          // Retry on exception (up to 3 times)
          if (retryCount < 3) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
            setTimeout(() => {
              if (isSubscribed) {
                initializeAuth(retryCount + 1)
              }
            }, delay)
          } else {
            setLoading(false)
            setInitialized(true)
          }
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        logger.debug('[AuthContext] Auth state change', { event, hasSession: !!currentSession })
        
        if (!isSubscribed) return

        // Handle token refresh
        if (event === 'TOKEN_REFRESHED' && currentSession) {
          logger.debug('[AuthContext] Token refreshed', { userId: currentSession.user.id })
          setSession(currentSession)
          if (currentSession.user) {
            await fetchUserProfile(currentSession.user.id)
          }
          return
        }

        // Handle signed in
        if (event === 'SIGNED_IN' && currentSession) {
          logger.debug('[AuthContext] User signed in', { userId: currentSession.user.id })
          setSession(currentSession)
          await fetchUserProfile(currentSession.user.id)
          setLoading(false)
          setInitialized(true)
          return
        }

        // Handle signed out
        if (event === 'SIGNED_OUT') {
          logger.debug('[AuthContext] User signed out')
          setSession(null)
          setUser(null)
          setLoading(false)
          setInitialized(true)
          return
        }

        // Handle session update
        setSession(currentSession)
        
        if (currentSession?.user) {
          logger.debug('[AuthContext] User logged in', { userId: currentSession.user.id })
          await fetchUserProfile(currentSession.user.id)
        } else {
          logger.debug('[AuthContext] User logged out')
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
    // Skip if already fetched this user OR if already fetching
    if (fetchedUserIds.current.has(userId)) {
      logger.debug('[AuthContext] Profile already cached, skipping fetch', { userId })
      return
    }

    // Mark as being fetched immediately to prevent race condition
    fetchedUserIds.current.add(userId)

    try {
      logger.startTimer('[AuthContext] fetchUserProfile')
      logger.debug('[AuthContext] Fetching user profile...', { userId })
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      logger.endTimer('[AuthContext] fetchUserProfile')

      if (error) {
        logger.error('[AuthContext] Error fetching profile', { error, userId })
        fetchedUserIds.current.delete(userId) // Remove on error so retry is possible
        return
      }

      if (data) {
        logger.debug('[AuthContext] Profile loaded', { name: data.name, email: data.email })
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
        logger.debug('[AuthContext] User state updated')
        
        // Initialize realtime manager for this user
        realtimeManager.initialize(data.id).catch(err => {
          logger.error('[AuthContext] Failed to initialize realtime manager', { error: err })
        })
      } else {
        logger.warn('[AuthContext] Profile data is null', { userId })
        fetchedUserIds.current.delete(userId)
      }
    } catch (error) {
      logger.error('[AuthContext] Error fetching user profile', { error, userId })
      fetchedUserIds.current.delete(userId)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true)
      logger.info('[AuthContext] Login attempt started', { email: credentials.email })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        logger.error('[AuthContext] Login error from Supabase', { 
          error: error.message, 
          code: error.name,
          status: error.status 
        })
        return { success: false, error: error.message }
      }

      if (data.session) {
        logger.info('[AuthContext] Login successful', { userId: data.user.id })
        
        // Immediately set session to ensure it's available
        setSession(data.session)
        
        // Verify session is set correctly
        const { data: { session: verifySession } } = await supabase.auth.getSession()
        if (!verifySession) {
          logger.warn('[AuthContext] Session not persisted after login, retrying...')
          // Wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 200))
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          if (retrySession) {
            setSession(retrySession)
            logger.info('[AuthContext] Session verified after retry')
          } else {
            logger.error('[AuthContext] Session still not available after retry')
          }
        }
        
        // Check if 2FA is enabled in profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_2fa_enabled')
          .eq('id', data.user.id)
          .single()
        
        if (profileError) {
          logger.error('[AuthContext] Error fetching profile for 2FA check', { 
            error: profileError.message,
            userId: data.user.id 
          })
        }
        
        logger.debug('[AuthContext] 2FA Check', { 
          profile, 
          profileError, 
          is_2fa_enabled: profile?.is_2fa_enabled 
        })
        
        const requires2FA = profile?.is_2fa_enabled || false
        
        if (requires2FA) {
          logger.info('[AuthContext] 2FA required for user', { userId: data.user.id })
        } else {
          logger.debug('[AuthContext] No 2FA required for user', { userId: data.user.id })
          // Fetch full profile if no 2FA
          await fetchUserProfile(data.user.id)
        }
        
        return { 
          success: true, 
          requires2FA,
          user: data.user 
        }
      }

      logger.warn('[AuthContext] Login successful but no session returned')
      return { success: false, error: 'Giriş yapılırken bir hata oluştu' }
    } catch (error: any) {
      logger.error('[AuthContext] Login exception', { error: error.message, stack: error.stack })
      return { success: false, error: error.message || 'Giriş yapılırken bir hata oluştu' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    logger.info('[AuthContext] Logout started')
    setLoading(true)
    
    try {
      // Try to sign out from Supabase with timeout
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      )
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any
      
      if (error) {
        logger.error('[AuthContext] Logout error', { error })
      } else {
        logger.info('[AuthContext] Supabase signOut successful')
      }
    } catch (error) {
      logger.error('[AuthContext] Logout failed or timed out', { error })
    }
    
    // Disconnect realtime manager
    await realtimeManager.disconnect()
    
    // Clear local state immediately (don't wait for Supabase)
    logger.debug('[AuthContext] Clearing local state...')
    setUser(null)
    setSession(null)
    setLoading(false)
    
    // Use window.location for hard redirect to clear all client state
    logger.debug('[AuthContext] Redirecting to login...')
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

