/**
 * Supabase Client Diagnostics
 * 
 * This utility helps diagnose Supabase client initialization issues
 * Run this in browser console to check Supabase client health
 */

import type { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js'

interface DiagnosticsCheck {
  success?: boolean
  error?: string
  timeout?: boolean
  time?: string
  hasSession?: boolean
  hasError?: boolean
  hasUser?: boolean
  status?: number
  statusText?: string
  exists?: boolean
  hasAuth?: boolean
  hasStorage?: boolean
  hasFrom?: boolean
  hasUrl?: boolean
  hasKey?: boolean
  urlLength?: number
  keyLength?: number
  urlPreview?: string
  hasLocalStorage?: boolean
  hasSessionStorage?: boolean
  cookieCount?: number
  supabaseCookies?: number
}

interface Diagnostics {
  timestamp: string
  checks: {
    env?: DiagnosticsCheck
    client?: DiagnosticsCheck
    getSession?: DiagnosticsCheck
    getUser?: DiagnosticsCheck
    network?: DiagnosticsCheck
    storage?: DiagnosticsCheck
  }
}

type GetSessionResponse = { data: { session: Session | null }, error: AuthError | null }
type GetUserResponse = { data: { user: SupabaseUser | null }, error: AuthError | null }

interface WindowWithDiagnostics extends Window {
  runSupabaseDiagnostics?: typeof runSupabaseDiagnostics
}

export const runSupabaseDiagnostics = async (): Promise<Diagnostics> => {
  const diagnostics: Diagnostics = {
    timestamp: new Date().toISOString(),
    checks: {}
  }

  // Check 1: Environment variables
  diagnostics.checks.env = {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' || 'MISSING'
  }

  // Check 2: Supabase client
  try {
    const { supabase } = await import('@/lib/supabase')
    diagnostics.checks.client = {
      exists: !!supabase,
      hasAuth: !!supabase?.auth,
      hasStorage: !!supabase?.storage,
      hasFrom: !!supabase?.from
    }

    // Check 3: getSession() test
    try {
      const sessionStart = Date.now()
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<GetSessionResponse>((_, reject) => 
          setTimeout(() => reject(new Error('getSession timeout')), 3000)
        )
      ]) as GetSessionResponse
      const sessionTime = Date.now() - sessionStart
      
      diagnostics.checks.getSession = {
        success: true,
        time: `${sessionTime}ms`,
        hasSession: !!sessionResult?.data?.session,
        hasError: !!sessionResult?.error,
        error: sessionResult?.error?.message
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      diagnostics.checks.getSession = {
        success: false,
        error: errorMessage,
        timeout: errorMessage.includes('timeout')
      }
    }

    // Check 4: getUser() test
    try {
      const getUserStart = Date.now()
      const userResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise<GetUserResponse>((_, reject) => 
          setTimeout(() => reject(new Error('getUser timeout')), 3000)
        )
      ]) as GetUserResponse
      const getUserTime = Date.now() - getUserStart
      
      diagnostics.checks.getUser = {
        success: true,
        time: `${getUserTime}ms`,
        hasUser: !!userResult?.data?.user,
        hasError: !!userResult?.error,
        error: userResult?.error?.message
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      diagnostics.checks.getUser = {
        success: false,
        error: errorMessage,
        timeout: errorMessage.includes('timeout')
      }
    }

    // Check 5: Network connectivity
    try {
      const networkStart = Date.now()
      const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      })
      const networkTime = Date.now() - networkStart
      
      diagnostics.checks.network = {
        success: true,
        time: `${networkTime}ms`,
        status: response.status,
        statusText: response.statusText
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      diagnostics.checks.network = {
        success: false,
        error: errorMessage
      }
    }

    // Check 6: Cookies/LocalStorage
    diagnostics.checks.storage = {
      hasLocalStorage: typeof localStorage !== 'undefined',
      hasSessionStorage: typeof sessionStorage !== 'undefined',
      cookieCount: document.cookie.split(';').filter(c => c.trim()).length,
      supabaseCookies: document.cookie.split(';').filter(c => 
        c.includes('sb-') || c.includes('supabase')
      ).length
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    diagnostics.checks.client = {
      exists: false,
      error: errorMessage
    }
  }

  return diagnostics
}

// Make it available globally for console debugging
if (typeof window !== 'undefined') {
  (window as WindowWithDiagnostics).runSupabaseDiagnostics = runSupabaseDiagnostics
}

