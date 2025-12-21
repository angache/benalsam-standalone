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
  const sessionInitializedRef = useRef(false)

  // Initialize auth state and listen for changes
  useEffect(() => {
    let isSubscribed = true
    const startTime = Date.now()

    // Simplified initialization: First getSession() (fast, from cookies), then validate with getUser()
    const initializeAuth = async () => {
      try {
        logger.debug('[AuthContext] Starting initialization...', {
          timestamp: new Date().toISOString()
        })
        
        // Step 1: Get session from cookies (fast, reliable)
        const sessionStart = Date.now()
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
        const sessionTime = Date.now() - sessionStart
        
        logger.debug('[AuthContext] getSession() completed', {
          elapsed: `${sessionTime}ms`,
          hasSession: !!initialSession,
          hasError: !!sessionError,
          userId: initialSession?.user?.id,
          errorMessage: sessionError?.message
        })
        
        if (sessionError) {
          logger.error('[AuthContext] Session error', { error: sessionError.message })
        }
        
        // Step 2: If session exists, validate with getUser() for security
        if (initialSession && initialSession.user) {
          const getUserStart = Date.now()
          const { data: { user: validatedUser }, error: userError } = await supabase.auth.getUser()
          const getUserTime = Date.now() - getUserStart
          
          logger.debug('[AuthContext] getUser() validation completed', {
            elapsed: `${getUserTime}ms`,
            hasUser: !!validatedUser,
            hasError: !!userError,
            userId: validatedUser?.id,
            errorMessage: userError?.message
          })
          
          // Only use session if user is validated
          if (validatedUser && !userError && validatedUser.id === initialSession.user.id) {
            // Verify session is still valid
            const now = Math.floor(Date.now() / 1000)
            const expiresAt = initialSession.expires_at || 0
            const isValid = expiresAt > now
            
            if (isValid) {
              logger.debug('[AuthContext] Session valid, setting state', {
                userId: validatedUser.id,
                totalElapsed: `${Date.now() - startTime}ms`
              })
              setSession(initialSession)
              await fetchUserProfile(validatedUser.id)
              sessionInitializedRef.current = true
            } else {
              logger.debug('[AuthContext] Session expired, refreshing...', {
                userId: validatedUser.id,
                expiredBy: `${now - expiresAt}s`
              })
              // Try to refresh
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
              if (refreshedSession && !refreshError) {
                logger.debug('[AuthContext] Session refreshed', { userId: refreshedSession.user.id })
                setSession(refreshedSession)
                await fetchUserProfile(refreshedSession.user.id)
                sessionInitializedRef.current = true
              } else {
                logger.debug('[AuthContext] Could not refresh session', { error: refreshError?.message })
                setSession(null)
              }
            }
          } else {
            logger.debug('[AuthContext] User validation failed, clearing session', {
              error: userError?.message
            })
            setSession(null)
          }
        } else {
          logger.debug('[AuthContext] No session found', {
            totalElapsed: `${Date.now() - startTime}ms`
          })
        }
        
        if (isSubscribed) {
          setLoading(false)
          setInitialized(true)
          logger.debug('[AuthContext] Initialization complete', {
            sessionInitialized: sessionInitializedRef.current,
            totalElapsed: `${Date.now() - startTime}ms`
          })
        }
      } catch (error: any) {
        logger.error('[AuthContext] Initialize error', {
          error: error?.message || String(error),
          stack: error?.stack,
          totalElapsed: `${Date.now() - startTime}ms`
        })
        if (isSubscribed) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    // Start initialization immediately
    initializeAuth().then(() => {
      // Only set up listener after initialization is complete
      // This prevents INITIAL_SESSION event from causing double initialization
      logger.debug('[AuthContext] Setting up onAuthStateChange listener after initialization', {
        timestamp: new Date().toISOString()
      })
    })
    
    // Set up auth state listener for future changes (but ignore INITIAL_SESSION)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        logger.debug('[AuthContext] Auth state change event', {
          event,
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          sessionInitialized: sessionInitializedRef.current,
          isSubscribed
        })
        
        if (!isSubscribed) {
          return
        }

        // Ignore INITIAL_SESSION and SIGNED_IN during initialization
        // These events fire during initial load and cause double initialization
        // We handle initial session in initializeAuth(), so ignore these events until initialization is complete
        if (event === 'INITIAL_SESSION' || (event === 'SIGNED_IN' && !sessionInitializedRef.current)) {
          logger.debug('[AuthContext] Event ignored during initialization', {
            event,
            hasSession: !!currentSession,
            sessionInitialized: sessionInitializedRef.current
          })
          return
        }

        // Handle SIGNED_IN - user just logged in (only after initialization is complete)
        if (event === 'SIGNED_IN' && currentSession && currentSession.user) {
          logger.debug('[AuthContext] User signed in', { userId: currentSession.user.id })
          
          // Validate user with getUser() for security
          const { data: { user: validatedUser }, error: validateError } = await supabase.auth.getUser()
          
          if (validatedUser && !validateError && validatedUser.id === currentSession.user.id) {
            logger.debug('[AuthContext] User validated after sign in', { userId: validatedUser.id })
            // Only update if session actually changed
            setSession(prevSession => {
              if (prevSession?.user?.id === currentSession.user.id) {
                return prevSession // No change, avoid re-render
              }
              return currentSession
            })
            await fetchUserProfile(validatedUser.id)
            sessionInitializedRef.current = true
          } else {
            logger.debug('[AuthContext] User validation failed after sign in', { error: validateError?.message })
            setSession(null)
            setUser(null)
          }
          setLoading(false)
          setInitialized(true)
          return
        }

        // Handle TOKEN_REFRESHED - session token was refreshed
        if (event === 'TOKEN_REFRESHED' && currentSession && currentSession.user) {
          logger.debug('[AuthContext] Token refreshed', { userId: currentSession.user.id })
          
          // Validate user with getUser() for security
          const { data: { user: validatedUser }, error: validateError } = await supabase.auth.getUser()
          
          if (validatedUser && !validateError && validatedUser.id === currentSession.user.id) {
            logger.debug('[AuthContext] User validated after token refresh', { userId: validatedUser.id })
            // Only update if session actually changed (token refresh usually means new expires_at)
            setSession(prevSession => {
              if (prevSession?.expires_at === currentSession.expires_at) {
                return prevSession // No change, avoid re-render
              }
              return currentSession
            })
            // Don't refetch profile on token refresh (it's expensive and not needed)
          } else {
            logger.debug('[AuthContext] User validation failed after token refresh', { error: validateError?.message })
            setSession(null)
            setUser(null)
            sessionInitializedRef.current = false
          }
          return
        }

        // Handle SIGNED_OUT - user logged out
        if (event === 'SIGNED_OUT') {
          logger.debug('[AuthContext] User signed out')
          setSession(null)
          setUser(null)
          sessionInitializedRef.current = false
          setLoading(false)
          setInitialized(true)
          return
        }

        // Handle other events (SIGNED_UP, USER_UPDATED, etc.)
        if (currentSession && currentSession.user) {
          // Validate user with getUser() for security
          const { data: { user: validatedUser }, error: validateError } = await supabase.auth.getUser()
          
          if (validatedUser && !validateError && validatedUser.id === currentSession.user.id) {
            logger.debug('[AuthContext] Session updated', { userId: validatedUser.id, event })
            // Only update if session actually changed
            setSession(prevSession => {
              if (prevSession?.user?.id === currentSession.user.id && 
                  prevSession?.expires_at === currentSession.expires_at) {
                return prevSession // No change, avoid re-render
              }
              return currentSession
            })
            // fetchUserProfile has its own cache check, so it's safe to call
            await fetchUserProfile(validatedUser.id)
            sessionInitializedRef.current = true
          } else {
            logger.debug('[AuthContext] User validation failed, clearing session', { error: validateError?.message })
            setSession(null)
            setUser(null)
            sessionInitializedRef.current = false
          }
        } else {
          logger.debug('[AuthContext] No session in event', { event })
          setSession(null)
          setUser(null)
          sessionInitializedRef.current = false
        }
        
        setLoading(false)
        setInitialized(true)
      }
    )

    // No timeout needed - we already called initializeAuth() immediately above

    return () => {
      isSubscribed = false
      subscription.unsubscribe()
      logger.debug('[AuthContext] Cleanup: unsubscribed from auth state changes')
    }
  }, [])

  // Fetch full user profile from database
  const fetchUserProfile = async (userId: string) => {
    const fetchStart = Date.now()
    
    // Skip if already fetched this user OR if already fetching
    if (fetchedUserIds.current.has(userId)) {
      logger.debug('[AuthContext] Profile already cached, skipping fetch', { 
        userId,
        cachedUserIds: Array.from(fetchedUserIds.current)
      })
      return
    }

    // Mark as being fetched immediately to prevent race condition
    fetchedUserIds.current.add(userId)
    logger.debug('[AuthContext] Starting profile fetch', { 
      userId,
      cachedUserIds: Array.from(fetchedUserIds.current)
    })

    try {
      logger.startTimer('[AuthContext] fetchUserProfile')
      logger.debug('[AuthContext] Fetching user profile from database...', { userId })
      
      const dbStart = Date.now()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      const dbTime = Date.now() - dbStart

      logger.endTimer('[AuthContext] fetchUserProfile')
      logger.debug('[AuthContext] Database query completed', {
        userId,
        elapsed: `${dbTime}ms`,
        hasData: !!data,
        hasError: !!error,
        errorMessage: error?.message
      })

      if (error) {
        logger.error('[AuthContext] Error fetching profile', { 
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          userId,
          totalElapsed: `${Date.now() - fetchStart}ms`
        })
        fetchedUserIds.current.delete(userId) // Remove on error so retry is possible
        return
      }

      if (data) {
        logger.debug('[AuthContext] Profile data received', { 
          userId,
          name: data.name, 
          email: data.email,
          hasAvatar: !!data.avatar_url,
          totalElapsed: `${Date.now() - fetchStart}ms`
        })
        
        const userData = {
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
        } as User
        
        logger.debug('[AuthContext] Setting user state...', { userId })
        setUser(userData)
        logger.debug('[AuthContext] User state updated successfully', { 
          userId,
          userName: userData.name,
          totalElapsed: `${Date.now() - fetchStart}ms`
        })
        
        // Initialize realtime manager for this user
        logger.debug('[AuthContext] Initializing realtime manager...', { userId })
        realtimeManager.initialize(data.id).catch(err => {
          logger.error('[AuthContext] Failed to initialize realtime manager', { 
            error: err?.message || String(err),
            userId 
          })
        })
      } else {
        logger.warn('[AuthContext] Profile data is null', { 
          userId,
          totalElapsed: `${Date.now() - fetchStart}ms`
        })
        fetchedUserIds.current.delete(userId)
      }
    } catch (error: any) {
      logger.error('[AuthContext] Error fetching user profile', { 
        error: error?.message || String(error),
        stack: error?.stack,
        userId,
        totalElapsed: `${Date.now() - fetchStart}ms`
      })
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

