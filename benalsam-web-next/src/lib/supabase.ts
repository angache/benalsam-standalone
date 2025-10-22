import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client for browser (uses anon key)
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false, // We use NextAuth.js for session management
      autoRefreshToken: false,
    },
  }
)

/**
 * Supabase admin client for server-side operations (uses service role key)
 * ⚠️ ONLY use this in API routes or server components!
 * This will only work on the server side where SUPABASE_SERVICE_ROLE_KEY is available
 */
export const supabaseAdmin = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
  : null as any // On client side, this should never be used
