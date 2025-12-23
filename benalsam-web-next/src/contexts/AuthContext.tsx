'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { LoginCredentials, User } from '@/types/auth'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { logger } from '@/utils/production-logger'
import { realtimeManager } from '@/lib/realtime-manager'
import { runSupabaseDiagnostics } from '@/utils/supabaseDiagnostics'

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
  const initializationCompleteRef = useRef(false)

  // Initialize auth state and listen for changes
  useEffect(() => {
    let isSubscribed = true
    const startTime = Date.now()

    // CRITICAL FIX: Simplified initialization with aggressive timeout handling
    // Both getSession() and getUser() were timing out, blocking the entire app
    // Solution: Use very short timeouts and fail gracefully
    const initializeAuth = async () => {
      try {
        logger.debug('[AuthContext] Starting initialization...', {
          timestamp: new Date().toISOString()
        })
        console.log('🚀 [AuthContext] Starting initialization with timeout protection...')
        
        // Verify Supabase client is available
        if (!supabase || !supabase.auth) {
          console.error('❌ [AuthContext] Supabase client not available!')
          console.error('🔍 [AuthContext] Running diagnostics...')
          try {
            const diagnostics = await runSupabaseDiagnostics()
            console.error('📊 [AuthContext] Diagnostics:', diagnostics)
          } catch (diagError) {
            console.error('❌ [AuthContext] Diagnostics failed:', diagError)
          }
          setLoading(false)
          setInitialized(true)
          initializationCompleteRef.current = true
          return
        }
        
        console.log('✅ [AuthContext] Supabase client verified')
        
        // Step 1: Try getUser() with very short timeout (2 seconds max)
        // If it times out, we assume no user and continue
        const getUserStart = Date.now()
        console.log('🔍 [AuthContext] Attempting getUser() with 2s timeout...')
        
        let validatedUser: any = null
        let userError: any = null
        
        try {
          const getUserPromise = supabase.auth.getUser()
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('getUser timeout after 2s')), 2000)
          )
          
          const getUserResult = await Promise.race([getUserPromise, timeoutPromise]) as any
          
          validatedUser = getUserResult?.data?.user
          userError = getUserResult?.error
          
          console.log('✅ [AuthContext] getUser() completed', {
            elapsed: `${Date.now() - getUserStart}ms`,
            hasUser: !!validatedUser,
            hasError: !!userError
          })
        } catch (error: any) {
          const elapsed = Date.now() - getUserStart
          console.warn(`⚠️ [AuthContext] getUser() timeout or error after ${elapsed}ms:`, error?.message || error)
          // Timeout is not an error - just means no user or slow network
          // Continue with null user
          validatedUser = null
          userError = null // Don't treat timeout as error
        }
        
        const getUserTime = Date.now() - getUserStart
        
        logger.debug('[AuthContext] getUser() completed', {
          elapsed: `${getUserTime}ms`,
          hasUser: !!validatedUser,
          hasError: !!userError,
          userId: validatedUser?.id,
          errorMessage: userError?.message
        })
        console.log('🔍 [AuthContext] getUser() completed', {
          elapsed: `${getUserTime}ms`,
          hasUser: !!validatedUser,
          hasError: !!userError,
          userId: validatedUser?.id
        })
        
        // Step 2: If user exists, get session for full session data
        if (validatedUser && !userError) {
          console.log('✅ [AuthContext] User validated, getting session...')
          
          // Now get session for full session data (but don't wait if it times out)
          try {
            const sessionResult = await Promise.race([
              supabase.auth.getSession(),
              new Promise((resolve) => 
                setTimeout(() => resolve({ data: { session: null }, error: null }), 2000)
              )
            ]) as any
            
            const initialSession = sessionResult?.data?.session
            // Use session if available, otherwise create minimal session from user
            if (initialSession && initialSession.user?.id === validatedUser.id) {
              // Verify session is still valid
              const now = Math.floor(Date.now() / 1000)
              const expiresAt = initialSession.expires_at || 0
              const isValid = expiresAt > now
              
              if (isValid) {
                logger.debug('[AuthContext] Session valid, setting state', {
                  userId: validatedUser.id,
                  totalElapsed: `${Date.now() - startTime}ms`
                })
                console.log('✅ [AuthContext] Session valid, setting state', {
                  userId: validatedUser.id,
                  totalElapsed: `${Date.now() - startTime}ms`
                })
                setSession(initialSession)
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
                } else {
                  logger.debug('[AuthContext] Could not refresh session, using user data', { error: refreshError?.message })
                  // Create minimal session from user data
                  setSession({
                    user: validatedUser,
                    access_token: '',
                    refresh_token: '',
                    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
                    expires_in: 3600,
                    token_type: 'bearer'
                  } as any)
                }
              }
            } else {
              // getSession() timed out or failed, create minimal session from user
              console.log('⚠️ [AuthContext] getSession() timed out, using user data only')
              setSession({
                user: validatedUser,
                access_token: '',
                refresh_token: '',
                expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
                expires_in: 3600,
                token_type: 'bearer'
              } as any)
            }
            
            console.log('📥 [AuthContext] Fetching user profile...', { userId: validatedUser.id })
            try {
              await fetchUserProfile(validatedUser.id)
              console.log('✅ [AuthContext] User profile fetched')
            } catch (profileError) {
              console.error('❌ [AuthContext] Failed to fetch user profile', profileError)
            }
            sessionInitializedRef.current = true
          } catch (sessionError: any) {
            console.error('❌ [AuthContext] Error getting session:', sessionError)
            // Even if session fails, we have user, so create minimal session
            setSession({
              user: validatedUser,
              access_token: '',
              refresh_token: '',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              expires_in: 3600,
              token_type: 'bearer'
            } as any)
            await fetchUserProfile(validatedUser.id)
            sessionInitializedRef.current = true
          }
        } else {
          // No user found (either timeout or actually no user)
          logger.debug('[AuthContext] No user found', {
            totalElapsed: `${Date.now() - startTime}ms`,
            getUserTime: `${getUserTime}ms`
          })
          console.log('ℹ️ [AuthContext] No user found (timeout or not logged in)', {
            totalElapsed: `${Date.now() - startTime}ms`,
            getUserTime: `${getUserTime}ms`
          })
          setSession(null)
          setUser(null)
        }
        
        console.log('🔍 [AuthContext] About to finalize initialization', {
          isSubscribed,
          sessionInitialized: sessionInitializedRef.current
        })
        
        if (isSubscribed) {
          setLoading(false)
          setInitialized(true)
          initializationCompleteRef.current = true
          // Use both logger and console for visibility
          const initLog = {
            sessionInitialized: sessionInitializedRef.current,
            totalElapsed: `${Date.now() - startTime}ms`
          }
          logger.debug('[AuthContext] Initialization complete', initLog)
          console.log('✅ [AuthContext] Initialization complete', initLog)
        } else {
          console.warn('⚠️ [AuthContext] Initialization skipped - component unmounted')
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
          initializationCompleteRef.current = true
        }
      }
    }

    // CRITICAL: Initialize auth FIRST, then set up listener
    // This prevents race conditions where listener fires before initialization completes
    let subscription: { unsubscribe: () => void } | null = null
    
    const setupListener = () => {
      // Set up auth state listener AFTER initialization is complete
      logger.debug('[AuthContext] Setting up onAuthStateChange listener', {
        timestamp: new Date().toISOString(),
        sessionInitialized: sessionInitializedRef.current
      })
      
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
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

          // ALWAYS ignore INITIAL_SESSION - we already handled it in initializeAuth()
          // This event fires when listener is first set up, but we've already initialized
          if (event === 'INITIAL_SESSION') {
            logger.debug('[AuthContext] INITIAL_SESSION ignored (already handled)', {
              hasSession: !!currentSession,
              sessionInitialized: sessionInitializedRef.current
            })
            return
          }

          // Ignore SIGNED_IN if we haven't finished initialization yet
          // This can happen if listener fires before initializeAuth() completes
          if (event === 'SIGNED_IN' && !initializationCompleteRef.current) {
            logger.debug('[AuthContext] SIGNED_IN ignored (initialization not complete)', {
              hasSession: !!currentSession,
              sessionInitialized: sessionInitializedRef.current,
              initializationComplete: initializationCompleteRef.current
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
            initializationCompleteRef.current = true
          } else {
            logger.debug('[AuthContext] User validation failed after sign in', { error: validateError?.message })
            setSession(null)
            setUser(null)
            sessionInitializedRef.current = false
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
      
      return sub
    }
    
    // Start initialization and set up listener after it completes
    initializeAuth()
      .then(() => {
        // Small delay to ensure state is fully set before listener is created
        // This prevents race conditions where listener fires before state is ready
        setTimeout(() => {
          if (isSubscribed) {
            subscription = setupListener()
            const listenerLog = {
              timestamp: new Date().toISOString(),
              sessionInitialized: sessionInitializedRef.current,
              initializationComplete: initializationCompleteRef.current
            }
            logger.debug('[AuthContext] Listener setup complete', listenerLog)
            console.log('✅ [AuthContext] Listener setup complete', listenerLog)
          }
        }, 100)
      })
      .catch((error) => {
        logger.error('[AuthContext] Initialization failed', { 
          error: error?.message || String(error),
          stack: error?.stack
        })
        if (isSubscribed) {
          setLoading(false)
          setInitialized(true)
          initializationCompleteRef.current = true
          // Still set up listener even if initialization failed
          // This ensures we can handle future auth changes
          subscription = setupListener()
        }
      })

    return () => {
      isSubscribed = false
      if (subscription) {
        subscription.unsubscribe()
        logger.debug('[AuthContext] Cleanup: unsubscribed from auth state changes')
      }
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

