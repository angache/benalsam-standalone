import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for browser (uses cookies for SSR compatibility)
 * This ensures session is available in both client and server
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

