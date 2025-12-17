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
    let sessionInitialized = false
    const startTime = Date.now()

    // Debug: Check cookie and storage availability (Chrome-specific checks)
    const checkCookies = () => {
      if (typeof window !== 'undefined') {
        const cookies = document.cookie
        const hasSupabaseCookies = cookies.includes('sb-') || cookies.includes('supabase')
        
        // Chrome-specific: Check localStorage for Supabase session
        let localStorageCheck = { hasSupabaseStorage: false, storageKeys: [] as string[] }
        try {
          const storageKeys = Object.keys(localStorage)
          const supabaseKeys = storageKeys.filter(key => 
            key.includes('supabase') || key.includes('sb-') || key.includes('auth')
          )
          localStorageCheck = {
            hasSupabaseStorage: supabaseKeys.length > 0,
            storageKeys: supabaseKeys.slice(0, 5) // First 5 keys for debugging
          }
        } catch (e) {
          // localStorage might be blocked
        }
        
        // Check if Chrome
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
        
        logger.debug('[AuthContext] Cookie and storage check', { 
          browser: isChrome ? 'Chrome' : 'Other',
          hasCookies: cookies.length > 0,
          hasSupabaseCookies,
          cookieCount: cookies.split(';').length,
          cookiePreview: cookies.substring(0, 100),
          ...localStorageCheck
        })
        return hasSupabaseCookies || localStorageCheck.hasSupabaseStorage
      }
      return false
    }

    // Get initial session immediately (don't wait for cookies)
    // Chrome-specific: Multiple attempts with delays
    const initializeAuth = async (retryCount = 0) => {
      try {
        const elapsed = Date.now() - startTime
        const isChrome = typeof window !== 'undefined' && /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
        
        logger.debug('[AuthContext] Initializing...', { 
          retryCount, 
          elapsed: `${elapsed}ms`,
          sessionInitialized,
          isSubscribed,
          browser: isChrome ? 'Chrome' : 'Other',
          hasCookies: checkCookies()
        })
        
        // Chrome-specific: Small delay before first attempt (helps with cookie initialization)
        if (isChrome && retryCount === 0) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
        
        // Use getUser() for security (validates with Supabase Auth server)
        // This is more secure than getSession() which reads from storage
        const getUserStart = Date.now()
        let authenticatedUser = null
        let authenticatedSession = null
        let error = null
        
        try {
          // First try getUser() for authenticated user data
          const userResult = await supabase.auth.getUser()
          authenticatedUser = userResult.data?.user || null
          error = userResult.error || null
          
          // If user is authenticated, get session for token info
          if (authenticatedUser && !error) {
            const sessionResult = await supabase.auth.getSession()
            authenticatedSession = sessionResult.data?.session || null
            // Use session error only if user was not found
            if (!authenticatedSession && !error) {
              error = sessionResult.error || null
            }
          }
        } catch (e: any) {
          error = e
          logger.error('[AuthContext] getUser() exception', { error: e?.message || String(e) })
        }
        
        const getUserTime = Date.now() - getUserStart
        
        logger.debug('[AuthContext] getUser() completed', {
          elapsed: `${getUserTime}ms`,
          hasUser: !!authenticatedUser,
          hasSession: !!authenticatedSession,
          hasError: !!error,
          errorMessage: error?.message,
          userId: authenticatedUser?.id,
          sessionExpiresAt: authenticatedSession?.expires_at,
          sessionExpiresIn: authenticatedSession?.expires_at ? `${Math.floor((authenticatedSession.expires_at * 1000 - Date.now()) / 1000)}s` : 'N/A',
          browser: isChrome ? 'Chrome' : 'Other'
        })
        
        // Use authenticated session if available
        const initialSession = authenticatedSession
        
        // Chrome-specific: If no user and Chrome, try one more time after a delay
        if (!authenticatedUser && !error && isChrome && retryCount === 0) {
          logger.debug('[AuthContext] Chrome: No user on first attempt, retrying after delay...')
          setTimeout(() => {
            if (isSubscribed && !sessionInitialized) {
              initializeAuth(1)
            }
          }, 200)
          return
        }
        
        if (error) {
          logger.error('[AuthContext] Error getting session', { 
            error: error.message,
            errorCode: error.name,
            retryCount,
            elapsed: `${Date.now() - startTime}ms`
          })
          
          // Retry on error (up to 2 times with shorter delays)
          if (retryCount < 2 && isSubscribed) {
            const delay = Math.min(200 * (retryCount + 1), 500) // 200ms, 400ms max
            logger.debug('[AuthContext] Retrying session fetch...', { 
              retryCount: retryCount + 1, 
              delay,
              willRetry: isSubscribed && !sessionInitialized
            })
            setTimeout(() => {
              if (isSubscribed && !sessionInitialized) {
                initializeAuth(retryCount + 1)
              } else {
                logger.debug('[AuthContext] Retry skipped', { 
                  isSubscribed, 
                  sessionInitialized 
                })
              }
            }, delay)
            return
          }
        }

        if (isSubscribed && !sessionInitialized) {
          if (initialSession) {
            // Verify session is still valid
            const now = Math.floor(Date.now() / 1000)
            const expiresAt = initialSession.expires_at || 0
            const isValid = expiresAt > now
            
            logger.debug('[AuthContext] Session validation', {
              userId: initialSession.user.id,
              expiresAt,
              now,
              isValid,
              expiresIn: `${expiresAt - now}s`
            })
            
            if (isValid) {
              logger.debug('[AuthContext] Initial session found and valid', { 
                userId: initialSession.user.id,
                elapsed: `${Date.now() - startTime}ms`
              })
              setSession(initialSession)
              await fetchUserProfile(initialSession.user.id)
              sessionInitialized = true
              logger.debug('[AuthContext] Session initialized successfully', {
                userId: initialSession.user.id,
                totalElapsed: `${Date.now() - startTime}ms`
              })
            } else {
              logger.debug('[AuthContext] Session expired, refreshing...', {
                userId: initialSession.user.id,
                expiredBy: `${now - expiresAt}s`
              })
              // Try to refresh the session
              const refreshStart = Date.now()
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
              const refreshTime = Date.now() - refreshStart
              
              logger.debug('[AuthContext] Refresh attempt completed', {
                elapsed: `${refreshTime}ms`,
                success: !!refreshedSession && !refreshError,
                error: refreshError?.message,
                newUserId: refreshedSession?.user?.id
              })
              
              if (refreshedSession && !refreshError) {
                logger.debug('[AuthContext] Session refreshed successfully', { 
                  userId: refreshedSession.user.id,
                  totalElapsed: `${Date.now() - startTime}ms`
                })
                setSession(refreshedSession)
                await fetchUserProfile(refreshedSession.user.id)
                sessionInitialized = true
              } else {
                logger.debug('[AuthContext] Could not refresh session', { 
                  error: refreshError?.message,
                  totalElapsed: `${Date.now() - startTime}ms`
                })
                setSession(null)
              }
            }
          } else {
            // No fallback needed - we already used getUser() above
            
            logger.debug('[AuthContext] No initial session found', {
              totalElapsed: `${Date.now() - startTime}ms`,
              browser: isChrome ? 'Chrome' : 'Other'
            })
          }
          setLoading(false)
          setInitialized(true)
          logger.debug('[AuthContext] Initialization complete', {
            sessionInitialized,
            totalElapsed: `${Date.now() - startTime}ms`
          })
        } else {
          logger.debug('[AuthContext] Initialization skipped', {
            isSubscribed,
            sessionInitialized,
            totalElapsed: `${Date.now() - startTime}ms`
          })
        }
      } catch (error: any) {
        logger.error('[AuthContext] Initialize error', { 
          error: error?.message || String(error),
          stack: error?.stack,
          retryCount,
          totalElapsed: `${Date.now() - startTime}ms`
        })
        if (isSubscribed && !sessionInitialized) {
          // Retry on exception (up to 2 times)
          if (retryCount < 2) {
            const delay = Math.min(200 * (retryCount + 1), 500)
            logger.debug('[AuthContext] Retrying after exception...', {
              retryCount: retryCount + 1,
              delay,
              willRetry: isSubscribed && !sessionInitialized
            })
            setTimeout(() => {
              if (isSubscribed && !sessionInitialized) {
                initializeAuth(retryCount + 1)
              }
            }, delay)
          } else {
            logger.debug('[AuthContext] Max retries reached, giving up', {
              totalElapsed: `${Date.now() - startTime}ms`
            })
            setLoading(false)
            setInitialized(true)
          }
        }
      }
    }

    // Call getUser() FIRST and immediately (this is the most secure method)
    // Then set up listener for future changes
    logger.debug('[AuthContext] Starting immediate getUser() call', {
      timestamp: new Date().toISOString(),
      hasCookies: checkCookies()
    })
    
    // Call initializeAuth immediately (don't wait for listener)
    initializeAuth()
    
    // Set up auth state listener for FUTURE changes (after initial session is loaded)
    const listenerStartTime = Date.now()
    
    logger.debug('[AuthContext] Setting up onAuthStateChange listener for future changes', {
      timestamp: new Date().toISOString()
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        const elapsed = Date.now() - listenerStartTime
        logger.debug('[AuthContext] Auth state change event', { 
          event, 
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          elapsed: `${elapsed}ms`,
          sessionInitialized,
          isSubscribed
        })
        
        if (!isSubscribed) {
          logger.debug('[AuthContext] Event ignored - not subscribed')
          return
        }

        // Skip INITIAL_SESSION if we already initialized via getUser()
        // This prevents double initialization
        if (event === 'INITIAL_SESSION') {
          logger.debug('[AuthContext] INITIAL_SESSION event received (already handled by getUser())', {
            hasSession: !!currentSession,
            sessionInitialized,
            elapsed: `${elapsed}ms`
          })
          // Only process if we haven't initialized yet (shouldn't happen, but safety check)
          if (!sessionInitialized && currentSession) {
            logger.debug('[AuthContext] Processing INITIAL_SESSION as fallback', {
              userId: currentSession.user?.id
            })
            
            // Validate user with getUser() for security (don't trust event user)
            const { data: { user: validatedUser }, error: validateError } = await supabase.auth.getUser()
            
            if (validatedUser && !validateError) {
              logger.debug('[AuthContext] User validated in INITIAL_SESSION fallback', { userId: validatedUser.id })
              setSession(currentSession)
              await fetchUserProfile(validatedUser.id)
              sessionInitialized = true
              setLoading(false)
              setInitialized(true)
            } else {
              logger.debug('[AuthContext] User validation failed in INITIAL_SESSION', { error: validateError?.message })
              setSession(null)
              setUser(null)
              setLoading(false)
              setInitialized(true)
            }
          }
          return
        }

        // Handle token refresh - validate with getUser() for security
        if (event === 'TOKEN_REFRESHED' && currentSession) {
          logger.debug('[AuthContext] Token refreshed event', { userId: currentSession.user?.id })
          
          // Validate user with getUser() for security (don't trust event user)
          const { data: { user: validatedUser }, error: validateError } = await supabase.auth.getUser()
          
          if (validatedUser && !validateError) {
            logger.debug('[AuthContext] User validated after token refresh', { userId: validatedUser.id })
            setSession(currentSession)
            await fetchUserProfile(validatedUser.id)
          } else {
            logger.debug('[AuthContext] User validation failed after token refresh', { error: validateError?.message })
            // Keep session but don't update user profile
            setSession(currentSession)
          }
          return
        }

        // Handle signed in - validate with getUser() for security
        if (event === 'SIGNED_IN' && currentSession) {
          logger.debug('[AuthContext] User signed in event', { userId: currentSession.user?.id })
          
          // Validate user with getUser() for security (don't trust event user)
          const { data: { user: validatedUser }, error: validateError } = await supabase.auth.getUser()
          
          if (validatedUser && !validateError) {
            logger.debug('[AuthContext] User validated with getUser()', { userId: validatedUser.id })
            setSession(currentSession)
            await fetchUserProfile(validatedUser.id)
            sessionInitialized = true
            setLoading(false)
            setInitialized(true)
          } else {
            logger.debug('[AuthContext] User validation failed', { error: validateError?.message })
            setSession(null)
            setUser(null)
          }
          return
        }

        // Handle signed out
        if (event === 'SIGNED_OUT') {
          logger.debug('[AuthContext] User signed out')
          setSession(null)
          setUser(null)
          sessionInitialized = false
          setLoading(false)
          setInitialized(true)
          return
        }

        // Handle session update - validate with getUser() for security
        setSession(currentSession)
        
        if (currentSession?.user) {
          // Validate user with getUser() for security (don't trust session user)
          const { data: { user: validatedUser }, error: validateError } = await supabase.auth.getUser()
          
          if (validatedUser && !validateError) {
            logger.debug('[AuthContext] User validated with getUser()', { userId: validatedUser.id })
            await fetchUserProfile(validatedUser.id)
            sessionInitialized = true
          } else {
            logger.debug('[AuthContext] User validation failed, clearing session', { error: validateError?.message })
            setSession(null)
            setUser(null)
            sessionInitialized = false
          }
        } else {
          logger.debug('[AuthContext] User logged out')
          setUser(null)
          sessionInitialized = false
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

