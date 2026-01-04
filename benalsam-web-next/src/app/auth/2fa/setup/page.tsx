'use client'

/**
 * 2FA Setup Page
 * 
 * Setup two-factor authentication for user account
 */

import { Suspense } from 'react'
import TwoFactorSetupClient from './TwoFactorSetupClient'
import { Loader2 } from 'lucide-react'

export default function TwoFactorSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      }
    >
      <TwoFactorSetupClient />
    </Suspense>
  )
}

