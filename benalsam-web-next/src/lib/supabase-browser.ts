import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for browser (uses cookies for SSR compatibility)
 * This ensures session is available in both client and server
 * 
 * Note: In Next.js 16, createBrowserClient automatically handles cookies
 * when used in client components. We use the default cookie handling
 * which is more reliable than manual cookie management.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

