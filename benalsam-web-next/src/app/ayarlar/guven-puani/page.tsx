/**
 * Trust Score Page
 * 
 * Display and manage user trust score
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getServerUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TrustScoreClient from './TrustScoreClient'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Güven Puanı | BenAlsam',
  description: 'Güvenilirlik puanınızı görün ve artırın',
}

export default async function TrustScorePage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/auth/login?redirect=/ayarlar/guven-puani')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Güven Puanı</h1>
        <p className="text-muted-foreground">Güvenilirlik puanınızı görün ve artırın</p>
      </div>

      <Suspense fallback={<TrustScoreSkeleton />}>
        <TrustScoreClient userId={user.id} />
      </Suspense>
    </div>
  )
}

function TrustScoreSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

