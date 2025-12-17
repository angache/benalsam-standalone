'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function RedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to correct URL
    router.replace('/aldigim-teklifler')
  }, [router])

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-background p-4 text-center">
      <LoadingSpinner size="xl" />
      <p className="text-muted-foreground mt-4">Yönlendiriliyor...</p>
    </div>
  )
}

