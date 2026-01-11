import { getServerUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import PremiumDashboardClient from './PremiumDashboardClient'

export default async function PremiumDashboardPage() {
  const user = await getServerUser()

  if (!user?.id) {
    redirect('/auth/login?redirect=/premium-dashboard')
  }

  return <PremiumDashboardClient />
}

