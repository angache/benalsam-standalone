import { redirect } from 'next/navigation'

/**
 * Redirect /premium/dashboard to /premium-dashboard
 * This handles legacy URLs or typos
 */
export default function PremiumDashboardRedirect() {
  redirect('/premium-dashboard')
}

