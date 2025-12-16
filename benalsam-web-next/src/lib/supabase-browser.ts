import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for browser (uses cookies for SSR compatibility)
 * This ensures session is available in both client and server
 * 
 * Note: In Next.js 16, createBrowserClient automatically handles cookies
 * when used in client components. The cookie handling below ensures
 * proper session persistence.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        if (typeof document === 'undefined') return []
        return document.cookie.split('; ').map(cookie => {
          const [name, ...rest] = cookie.split('=')
          return { name, value: decodeURIComponent(rest.join('=')) }
        }).filter(c => c.name && c.value)
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return
        cookiesToSet.forEach(({ name, value, options }) => {
          let cookieString = `${name}=${encodeURIComponent(value)}`
          
          if (options?.maxAge) {
            cookieString += `; max-age=${options.maxAge}`
          }
          if (options?.expires) {
            cookieString += `; expires=${options.expires.toUTCString()}`
          }
          cookieString += `; path=${options?.path || '/'}`
          cookieString += `; sameSite=${options?.sameSite || 'lax'}`
          if (options?.secure || window.location.protocol === 'https:') {
            cookieString += '; secure'
          }
          
          document.cookie = cookieString
        })
      },
    },
  }
)

