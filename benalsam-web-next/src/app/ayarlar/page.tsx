/**
 * Settings Page
 * 
 * Main settings page with all user settings sections
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getServerUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Ayarlar | BenAlsam',
  description: 'Hesap ayarlarınızı, bildirim tercihlerinizi ve uygulama ayarlarınızı yönetin',
}

/**
 * Settings Page Server Component
 * Checks authentication and renders client component
 */
export default async function SettingsPage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/auth/login?redirect=/ayarlar')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Ayarlar</h1>
        <p className="text-muted-foreground">
          Hesap ayarlarınızı, bildirim tercihlerinizi ve uygulama ayarlarınızı yönetin
        </p>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsClient />
      </Suspense>
    </div>
  )
}

/**
 * Loading skeleton for settings page
 */
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Email Info Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Skeletons */}
      {[...Array(5)].map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-2">
          <Skeleton className="h-6 w-24 ml-4" />
          <div className="space-y-1">
            {[...Array(3)].map((_, itemIndex) => (
              <Card key={itemIndex}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <Skeleton className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

