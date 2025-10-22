'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  require2FA?: boolean
}

/**
 * Protected Route Component
 * Wraps content that requires authentication or specific roles
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  require2FA = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Check authentication
      if (requireAuth && !isAuthenticated) {
        router.push('/auth/login')
        return
      }

      // Check admin role
      if (requireAdmin && user?.role !== 'admin' && user?.role !== 'moderator') {
        router.push('/')
        return
      }

      // Check 2FA
      if (require2FA && user?.is_2fa_enabled) {
        // TODO: Check if 2FA is verified in current session
        // For now, we'll skip this check
      }
    }
  }, [isAuthenticated, isLoading, user, requireAuth, requireAdmin, require2FA, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Don't render children until authentication is checked
  if (requireAuth && !isAuthenticated) {
    return null
  }

  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'moderator') {
    return null
  }

  return <>{children}</>
}

