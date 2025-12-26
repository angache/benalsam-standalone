/**
 * Profile Settings Page
 * 
 * Edit user profile information
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getServerUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProfileSettingsClient from './ProfileSettingsClient'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Profil Ayarları | BenAlsam',
  description: 'Kişisel bilgilerinizi düzenleyin',
}

export default async function ProfileSettingsPage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/auth/login?redirect=/ayarlar/profil')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profil Ayarları</h1>
        <p className="text-muted-foreground">Kişisel bilgilerinizi düzenleyin</p>
      </div>

      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileSettingsClient userId={user.id} />
      </Suspense>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

