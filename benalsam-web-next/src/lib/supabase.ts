/**
 * Browser Supabase client (uses cookies for SSR)
 */
export { supabase } from './supabase-browser'

/**
 * Admin Supabase client (server-side only with service role)
 */
import { createClient } from '@supabase/supabase-js'

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
