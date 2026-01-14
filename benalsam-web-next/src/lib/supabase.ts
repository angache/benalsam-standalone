/**
 * Browser Supabase client (uses cookies for SSR)
 */
export { supabase } from './supabase-browser'

/**
 * Admin Supabase client (server-side only with service role)
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const supabaseAdmin: SupabaseClient | null = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY
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
  : null // On client side, this should never be used

/**
 * Get supabaseAdmin with null check
 * Throws error if supabaseAdmin is null (should only happen in client-side or missing env)
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error('supabaseAdmin is not available. This should only be used server-side with SUPABASE_SERVICE_ROLE_KEY set.')
  }
  return supabaseAdmin
}
