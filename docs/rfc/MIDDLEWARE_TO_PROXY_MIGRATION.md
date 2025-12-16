# RFC: Next.js 16 Middleware → Proxy Migration

**Status**: 🟡 Draft  
**Date**: 2025-01-XX  
**Author**: CTO Team  
**Priority**: High (Security & Future-Proofing)

---

## 📋 Executive Summary

Next.js 16 has deprecated the `middleware.ts` file convention in favor of a new `proxy` pattern. This RFC outlines the migration strategy to ensure security, maintainability, and compatibility with Next.js 16+.

**Current State**: Using `middleware.ts` for route protection with Supabase Auth  
**Target State**: Migrate to Next.js 16 `proxy` pattern while maintaining all security features

---

## 🎯 Objectives

1. **Security**: Maintain all existing route protection and authentication checks
2. **Performance**: Ensure no performance degradation during migration
3. **Compatibility**: Support Next.js 16+ features and future-proof the codebase
4. **Maintainability**: Simplify authentication logic and reduce code duplication

---

## 🔍 Current Implementation Analysis

### Current Middleware (`src/middleware.ts`)

**Responsibilities**:
- ✅ Supabase session management (cookie handling)
- ✅ Route protection (protected routes require auth)
- ✅ Auth route redirection (logged-in users redirected from `/auth/*`)
- ✅ Session refresh and cookie updates

**Protected Routes**:
- `/profil`
- `/ayarlar`
- `/ilan-olustur`
- `/mesajlarim`
- `/ilanlarim`
- `/favorilerim`
- `/admin`

**Matcher Pattern**:
```typescript
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
]
```

### Current API Route Protection

API routes use `getServerUser()` helper function:
- ✅ Manual auth check in each route handler
- ✅ Rate limiting integration
- ✅ Error handling per route

**Example**:
```typescript
export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... route logic
}
```

---

## 🏗️ Proposed Solution: Proxy Pattern

### Architecture Overview

Next.js 16 introduces a `proxy` pattern that replaces middleware for route protection. The proxy runs at the edge and can handle authentication, redirects, and request/response modifications.

### Implementation Strategy

#### Phase 1: Create Proxy Configuration

**File**: `src/proxy.ts` (or `src/middleware/proxy.ts`)

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js 16 Proxy Pattern
 * Replaces deprecated middleware.ts for route protection
 */
export async function proxy(req: NextRequest) {
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

  // Route protection logic
  if (!session && isProtectedRoute(path)) {
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(loginUrl)
  }

  // Auth route redirection
  if (session && isAuthRoute(path) && !path.startsWith('/auth/2fa/')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return response
}

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

function isAuthRoute(path: string): boolean {
  return path.startsWith('/auth/')
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

#### Phase 2: Update Next.js Configuration

**File**: `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... existing config ...
  
  // Proxy configuration for Next.js 16+
  experimental: {
    proxy: true, // Enable proxy pattern
  },
  
  // ... rest of config ...
};

export default nextConfig;
```

#### Phase 3: Create Shared Auth Utilities

**File**: `src/lib/auth/proxy-auth.ts`

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Shared authentication utility for proxy and API routes
 */
export async function getSessionFromRequest(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Cookie setting handled by proxy/route handler
        },
        remove(name: string, options: CookieOptions) {
          // Cookie removal handled by proxy/route handler
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}
```

---

## 📊 Migration Plan

### Step 1: Preparation (1-2 hours)
- [ ] Create `src/proxy.ts` with new proxy implementation
- [ ] Create shared auth utilities (`src/lib/auth/proxy-auth.ts`)
- [ ] Update `next.config.ts` with proxy configuration
- [ ] Add feature flag: `NEXT_PUBLIC_USE_PROXY=true`

### Step 2: Testing (2-3 hours)
- [ ] Test protected routes (login required)
- [ ] Test auth routes (redirect when logged in)
- [ ] Test API routes (still work with `getServerUser()`)
- [ ] Test cookie handling and session refresh
- [ ] Test edge cases (2FA routes, callback URLs)

### Step 3: Deployment (1 hour)
- [ ] Deploy to staging environment
- [ ] Monitor logs for errors
- [ ] Verify all routes work correctly
- [ ] Deploy to production

### Step 4: Cleanup (30 minutes)
- [ ] Remove old `middleware.ts` file
- [ ] Update documentation
- [ ] Remove feature flag

---

## ⚠️ Risks & Mitigation

### Risk 1: Session Cookie Handling
**Risk**: Cookie updates might not work correctly in proxy pattern  
**Mitigation**: 
- Test cookie setting/removal thoroughly
- Use Supabase SSR package (already in use)
- Monitor session refresh behavior

### Risk 2: API Route Compatibility
**Risk**: API routes might break if they depend on middleware  
**Mitigation**:
- API routes already use `getServerUser()` (independent of middleware)
- No changes needed for API routes
- Test all API endpoints after migration

### Risk 3: Performance Impact
**Risk**: Proxy might add latency  
**Mitigation**:
- Proxy runs at edge (same as middleware)
- No additional network calls
- Monitor performance metrics

### Risk 4: Route Matching
**Risk**: Matcher pattern might not work correctly  
**Mitigation**:
- Use same matcher pattern as current middleware
- Test all route types (static, dynamic, API)
- Verify edge cases (images, fonts, etc.)

---

## ✅ Success Criteria

1. **Functionality**: All protected routes require authentication
2. **Redirects**: Auth routes redirect logged-in users correctly
3. **Sessions**: Session refresh and cookie handling work correctly
4. **Performance**: No performance degradation (< 50ms overhead)
5. **Compatibility**: Works with Next.js 16+ and future versions
6. **Documentation**: Updated docs reflect new proxy pattern

---

## 📚 References

- [Next.js 16 Proxy Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware#next-steps) (when available)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- Current `src/middleware.ts` implementation
- Next.js 16 Release Notes

---

## 🔄 Rollback Plan

If issues occur:

1. **Immediate**: Revert to `middleware.ts` by:
   - Removing `src/proxy.ts`
   - Restoring `src/middleware.ts`
   - Removing `experimental.proxy` from `next.config.ts`

2. **Gradual**: Use feature flag to toggle between middleware and proxy:
   - `NEXT_PUBLIC_USE_PROXY=false` → use middleware
   - `NEXT_PUBLIC_USE_PROXY=true` → use proxy

---

## 📝 Notes

- **Timeline**: 1-2 days for complete migration
- **Breaking Changes**: None (internal refactoring only)
- **Dependencies**: Next.js 16+, Supabase SSR package (already installed)
- **Testing**: Manual testing + automated tests for critical paths

---

**Next Steps**: 
1. Review and approve this RFC
2. Create implementation branch: `feature/middleware-to-proxy-migration`
3. Begin Phase 1 implementation

