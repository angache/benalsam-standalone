/**
 * Security Settings Page
 * 
 * Password change and 2FA settings
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getServerUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SecuritySettingsClient from './SecuritySettingsClient'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Güvenlik Ayarları | BenAlsam',
  description: 'Şifre değiştirme ve 2FA ayarları',
}

export default async function SecuritySettingsPage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/auth/login?redirect=/ayarlar/guvenlik')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Güvenlik Ayarları</h1>
        <p className="text-muted-foreground">Şifre değiştirme ve 2FA ayarlarınızı yönetin</p>
      </div>

      <Suspense fallback={<SecuritySkeleton />}>
        <SecuritySettingsClient userId={user.id} />
      </Suspense>
    </div>
  )
}

function SecuritySkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

