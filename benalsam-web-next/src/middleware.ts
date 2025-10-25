import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware for route protection using Supabase Auth
 * 
 * Protected routes require authentication
 * Public routes are accessible without authentication
 */
export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  console.log('🔒 [Middleware]', { 
    path, 
    hasSession: !!session, 
    userId: session?.user?.id,
    isProtected: isProtectedRoute(path) 
  })

  // If no session and trying to access protected route, redirect to login
  if (!session && isProtectedRoute(path)) {
    console.log('🔒 [Middleware] Redirecting to login - no session')
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(loginUrl)
  }

  // If session exists but trying to access auth pages (except 2FA), redirect to home
  if (session && isAuthRoute(path) && !path.startsWith('/auth/2fa/')) {
    console.log('🔒 [Middleware] Redirecting to home - already authenticated')
    return NextResponse.redirect(new URL('/', req.url))
  }

  return response
}

/**
 * Check if route requires authentication
 */
function isProtectedRoute(path: string): boolean {
  const protectedPrefixes = [
    '/profil',
    '/ayarlar',
    '/ilan-olustur',
    '/mesajlarim',
    '/ilanlarim',
    '/favorilerim',
    '/admin',
  ]

  return protectedPrefixes.some((prefix) => path.startsWith(prefix))
}

/**
 * Check if route is an auth page (login, register, etc.)
 */
function isAuthRoute(path: string): boolean {
  return path.startsWith('/auth/')
}

/**
 * Routes that the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
