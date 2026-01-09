/**
 * Payment Service Types
 * 
 * Common types for payment processing across different providers
 * (Stripe, İyzico, Mock)
 */

export type PaymentProvider = 'stripe' | 'iyzico' | 'mock'

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded'

export type PaymentMethod = 'card' | 'bank_transfer' | 'digital_wallet'

export type Currency = 'TRY' | 'USD' | 'EUR'

/**
 * Payment Item - Represents a single item in a payment
 */
export interface PaymentItem {
  id: string
  name: string
  description?: string
  amount: number // Amount in cents/kuruş (e.g., 4900 = ₺49.00)
  quantity?: number
  metadata?: Record<string, string>
}

/**
 * Payment Request - Input for creating a payment
 */
export interface PaymentRequest {
  amount: number // Total amount in cents/kuruş
  currency: Currency
  items: PaymentItem[]
  customerId?: string // User ID from our system
  customerEmail: string
  customerName?: string
  description?: string
  metadata?: Record<string, string>
  returnUrl?: string
  cancelUrl?: string
}

/**
 * Payment Intent - Result of creating a payment intent
 */
export interface PaymentIntent {
  id: string
  clientSecret?: string // For Stripe
  checkoutUrl?: string // For İyzico
  status: PaymentStatus
  amount: number
  currency: Currency
  provider: PaymentProvider
  metadata?: Record<string, string>
}

/**
 * Payment Result - Result after payment completion
 */
export interface PaymentResult {
  id: string
  status: PaymentStatus
  amount: number
  currency: Currency
  provider: PaymentProvider
  providerTransactionId?: string
  paidAt?: string
  metadata?: Record<string, string>
}

/**
 * Subscription Plan
 */
export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  description?: string
  amount: number // Monthly amount in cents/kuruş
  currency: Currency
  interval: 'month' | 'year'
  features: string[]
  metadata?: Record<string, string>
}

/**
 * Subscription Request
 */
export interface SubscriptionRequest {
  planId: string
  customerId: string
  customerEmail: string
  customerName?: string
  paymentMethod?: PaymentMethod
  metadata?: Record<string, string>
}

/**
 * Subscription Result
 */
export interface SubscriptionResult {
  id: string
  status: PaymentStatus
  planId: string
  customerId: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  providerSubscriptionId?: string
  metadata?: Record<string, string>
}

/**
 * Webhook Event - For processing webhooks from payment providers
 */
export interface WebhookEvent {
  id: string
  type: string
  provider: PaymentProvider
  data: Record<string, unknown>
  timestamp: string
}

