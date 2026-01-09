/**
 * Payment Provider Interface
 * 
 * Abstract interface for payment providers (Stripe, İyzico, Mock)
 * Allows easy switching between providers
 */

import type {
  PaymentRequest,
  PaymentIntent,
  PaymentResult,
  SubscriptionRequest,
  SubscriptionResult,
  WebhookEvent,
  PaymentStatus,
} from './types'

export interface IPaymentProvider {
  /**
   * Create a payment intent for one-time payment
   */
  createPaymentIntent(request: PaymentRequest): Promise<PaymentIntent>

  /**
   * Verify payment status
   */
  verifyPayment(paymentIntentId: string): Promise<PaymentResult>

  /**
   * Create a subscription
   */
  createSubscription(request: SubscriptionRequest): Promise<SubscriptionResult>

  /**
   * Cancel a subscription
   */
  cancelSubscription(subscriptionId: string): Promise<void>

  /**
   * Get subscription status
   */
  getSubscriptionStatus(subscriptionId: string): Promise<PaymentStatus>

  /**
   * Process webhook event from payment provider
   */
  processWebhook(event: WebhookEvent): Promise<void>

  /**
   * Refund a payment
   */
  refundPayment(paymentId: string, amount?: number): Promise<PaymentResult>
}

