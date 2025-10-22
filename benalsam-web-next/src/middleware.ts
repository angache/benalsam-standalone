import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Middleware for route protection
 * 
 * Protected routes require authentication
 * Admin routes require admin role
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Check if user is authenticated
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Check admin routes
    if (path.startsWith('/admin')) {
      if (token.role !== 'admin' && token.role !== 'moderator') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // Check 2FA requirement for sensitive routes
    const requires2FA = ['/profile/security', '/settings/billing']
    if (requires2FA.some((route) => path.startsWith(route))) {
      if (token.is_2fa_enabled && !token.twoFactorVerified) {
        return NextResponse.redirect(new URL('/auth/2fa/verify', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

/**
 * Routes that require authentication
 */
export const config = {
  matcher: [
    '/profile/:path*',
    '/settings/:path*',
    '/ilan-olustur/:path*',
    '/mesajlar/:path*',
    '/favoriler/:path*',
    '/admin/:path*',
  ],
}

