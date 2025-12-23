/**
 * Supabase Client Diagnostics
 * 
 * This utility helps diagnose Supabase client initialization issues
 * Run this in browser console to check Supabase client health
 */

export const runSupabaseDiagnostics = async () => {
  const diagnostics: any = {
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
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getSession timeout')), 3000)
        )
      ]) as any
      const sessionTime = Date.now() - sessionStart
      
      diagnostics.checks.getSession = {
        success: true,
        time: `${sessionTime}ms`,
        hasSession: !!sessionResult?.data?.session,
        hasError: !!sessionResult?.error,
        error: sessionResult?.error?.message
      }
    } catch (error: any) {
      diagnostics.checks.getSession = {
        success: false,
        error: error?.message || String(error),
        timeout: error?.message?.includes('timeout')
      }
    }

    // Check 4: getUser() test
    try {
      const getUserStart = Date.now()
      const userResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getUser timeout')), 3000)
        )
      ]) as any
      const getUserTime = Date.now() - getUserStart
      
      diagnostics.checks.getUser = {
        success: true,
        time: `${getUserTime}ms`,
        hasUser: !!userResult?.data?.user,
        hasError: !!userResult?.error,
        error: userResult?.error?.message
      }
    } catch (error: any) {
      diagnostics.checks.getUser = {
        success: false,
        error: error?.message || String(error),
        timeout: error?.message?.includes('timeout')
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
    } catch (error: any) {
      diagnostics.checks.network = {
        success: false,
        error: error?.message || String(error)
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

  } catch (error: any) {
    diagnostics.checks.client = {
      exists: false,
      error: error?.message || String(error)
    }
  }

  return diagnostics
}

// Make it available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).runSupabaseDiagnostics = runSupabaseDiagnostics
}

