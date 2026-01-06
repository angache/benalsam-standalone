/**
 * Environment Variables Validation
 * Ensures all required environment variables are present
 */

import { logger } from '@/utils/production-logger';

// Helper function to get env var (works in both browser and server)
// Next.js automatically replaces process.env.NEXT_PUBLIC_* at build time
const getEnv = (key: string): string | undefined => {
  // Both client and server can access process.env
  // Next.js only exposes NEXT_PUBLIC_* vars to the client
  return process.env[key]
}

export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY'), // Server-only

  // Admin Backend
  NEXT_PUBLIC_ADMIN_BACKEND_URL: getEnv('NEXT_PUBLIC_ADMIN_BACKEND_URL'),
  ADMIN_BACKEND_JWT_SECRET: getEnv('ADMIN_BACKEND_JWT_SECRET'), // Server-only

  // App
  NEXT_PUBLIC_APP_ENV: getEnv('NEXT_PUBLIC_APP_ENV') || 'development',
} as const

/**
 * Validates required environment variables
 * Throws error if any required variable is missing
 */
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_ADMIN_BACKEND_URL',
  ] as const

  // No additional server-only vars required for now
  const serverRequired = [] as const

  const allRequired = [...required, ...serverRequired]
  const missing = allRequired.filter((key) => !env[key as keyof typeof env])

  if (missing.length > 0) {
    logger.error('[Env] Missing required environment variables', { 
      missing: missing.join(', '),
      message: 'Please check your .env.local file.'
    })
    // Don't throw on client side, just log
    if (typeof window === 'undefined') {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
          'Please check your .env.local file.'
      )
    }
  }
}

// Validate on import (only in Node.js environment, not in browser)
if (typeof window === 'undefined') {
  validateEnv()
}

