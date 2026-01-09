/**
 * Payment Service
 * 
 * Main payment service that routes to the appropriate payment provider
 * (Mock, Stripe, or İyzico) based on configuration
 */

import { MockPaymentProvider } from './providers/mockProvider'
import { StripePaymentProvider } from './providers/stripeProvider'
import { IyzicoPaymentProvider } from './providers/iyzicoProvider'
import type { IPaymentProvider } from './IPaymentProvider'
import type { PaymentProvider } from './types'
import { logger } from '@/utils/production-logger'

/**
 * Get the configured payment provider
 * 
 * Priority:
 * 1. PAYMENT_PROVIDER env variable (if set)
 * 2. Mock provider (development default)
 */
function getPaymentProvider(): IPaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase() as PaymentProvider

  logger.debug('[PaymentService] Initializing payment provider', { provider })

  switch (provider) {
    case 'stripe':
      return new StripePaymentProvider()
    case 'iyzico':
      return new IyzicoPaymentProvider()
    case 'mock':
    default:
      logger.info('[PaymentService] Using Mock Payment Provider (development mode)')
      return new MockPaymentProvider()
  }
}

// Singleton payment provider instance
let paymentProvider: IPaymentProvider | null = null

/**
 * Get or create payment provider instance
 */
export function getPaymentService(): IPaymentProvider {
  if (!paymentProvider) {
    paymentProvider = getPaymentProvider()
  }
  return paymentProvider
}

/**
 * Reset payment provider (useful for testing)
 */
export function resetPaymentService(): void {
  paymentProvider = null
}

// Re-export types and interfaces
export * from './types'
export * from './IPaymentProvider'
export { MockPaymentProvider, StripePaymentProvider, IyzicoPaymentProvider }

