import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * NextAuth.js API Route Handler
 * 
 * Handles all NextAuth.js authentication routes:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/callback
 * - /api/auth/csrf
 * - /api/auth/session
 * - /api/auth/providers
 */
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

