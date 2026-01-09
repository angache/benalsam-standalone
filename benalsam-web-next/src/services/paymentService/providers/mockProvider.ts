/**
 * Mock Payment Provider
 * 
 * Development/Testing payment provider that simulates payment processing
 * without requiring actual payment provider accounts
 * 
 * Usage:
 * - Development: Automatically used when PAYMENT_PROVIDER=mock
 * - Testing: Allows testing payment flows without real charges
 */

import type {
  IPaymentProvider,
  PaymentRequest,
  PaymentIntent,
  PaymentResult,
  SubscriptionRequest,
  SubscriptionResult,
  WebhookEvent,
  PaymentStatus,
  PaymentProvider,
} from '../types'
import { logger } from '@/utils/production-logger'

export class MockPaymentProvider implements IPaymentProvider {
  private provider: PaymentProvider = 'mock'
  private payments: Map<string, PaymentIntent> = new Map()
  private subscriptions: Map<string, SubscriptionResult> = new Map()

  /**
   * Create a payment intent (mock - simulates payment processing)
   */
  async createPaymentIntent(request: PaymentRequest): Promise<PaymentIntent> {
    logger.debug('[MockPaymentProvider] Creating payment intent', { amount: request.amount, currency: request.currency })

    // Generate mock payment intent ID
    const id = `mock_pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const intent: PaymentIntent = {
      id,
      clientSecret: `mock_secret_${id}`, // Mock client secret for Stripe-like flow
      status: 'pending',
      amount: request.amount,
      currency: request.currency,
      provider: this.provider,
      metadata: request.metadata,
    }

    // Store for later verification
    this.payments.set(id, intent)

    logger.debug('[MockPaymentProvider] Payment intent created', { id, amount: intent.amount })

    // Simulate async processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    return intent
  }

  /**
   * Verify payment status (mock - simulates payment completion)
   */
  async verifyPayment(paymentIntentId: string): Promise<PaymentResult> {
    logger.debug('[MockPaymentProvider] Verifying payment', { paymentIntentId })

    const intent = this.payments.get(paymentIntentId)

    if (!intent) {
      throw new Error(`Payment intent not found: ${paymentIntentId}`)
    }

    // Simulate payment success (90% success rate for testing)
    const isSuccess = Math.random() > 0.1

    const result: PaymentResult = {
      id: paymentIntentId,
      status: isSuccess ? 'succeeded' : 'failed',
      amount: intent.amount,
      currency: intent.currency,
      provider: this.provider,
      providerTransactionId: `mock_txn_${Date.now()}`,
      paidAt: isSuccess ? new Date().toISOString() : undefined,
      metadata: intent.metadata,
    }

    // Update stored intent
    intent.status = result.status
    this.payments.set(paymentIntentId, intent)

    logger.debug('[MockPaymentProvider] Payment verified', { id: paymentIntentId, status: result.status })

    return result
  }

  /**
   * Simulate payment completion (for testing)
   */
  async simulatePaymentSuccess(paymentIntentId: string): Promise<PaymentResult> {
    logger.debug('[MockPaymentProvider] Simulating payment success', { paymentIntentId })

    const intent = this.payments.get(paymentIntentId)
    if (!intent) {
      throw new Error(`Payment intent not found: ${paymentIntentId}`)
    }

    const result: PaymentResult = {
      id: paymentIntentId,
      status: 'succeeded',
      amount: intent.amount,
      currency: intent.currency,
      provider: this.provider,
      providerTransactionId: `mock_txn_${Date.now()}`,
      paidAt: new Date().toISOString(),
      metadata: intent.metadata,
    }

    intent.status = 'succeeded'
    this.payments.set(paymentIntentId, intent)

    return result
  }

  /**
   * Create a subscription (mock)
   */
  async createSubscription(request: SubscriptionRequest): Promise<SubscriptionResult> {
    logger.debug('[MockPaymentProvider] Creating subscription', { planId: request.planId, customerId: request.customerId })

    const id = `mock_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1) // 1 month subscription

    const subscription: SubscriptionResult = {
      id,
      status: 'succeeded',
      planId: request.planId,
      customerId: request.customerId,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      providerSubscriptionId: `mock_sub_${id}`,
      metadata: request.metadata,
    }

    this.subscriptions.set(id, subscription)

    logger.debug('[MockPaymentProvider] Subscription created', { id, planId: request.planId })

    return subscription
  }

  /**
   * Cancel a subscription (mock)
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    logger.debug('[MockPaymentProvider] Canceling subscription', { subscriptionId })

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`)
    }

    subscription.cancelAtPeriodEnd = true
    this.subscriptions.set(subscriptionId, subscription)

    logger.debug('[MockPaymentProvider] Subscription canceled', { subscriptionId })
  }

  /**
   * Get subscription status (mock)
   */
  async getSubscriptionStatus(subscriptionId: string): Promise<PaymentStatus> {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`)
    }

    // Check if subscription expired
    if (subscription.cancelAtPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date()) {
      return 'canceled'
    }

    return subscription.status
  }

  /**
   * Process webhook (mock - no actual webhook processing)
   */
  async processWebhook(event: WebhookEvent): Promise<void> {
    logger.debug('[MockPaymentProvider] Processing webhook', { type: event.type, id: event.id })
    // Mock provider doesn't process real webhooks
    // In production, this would update payment/subscription status
  }

  /**
   * Refund a payment (mock)
   */
  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResult> {
    logger.debug('[MockPaymentProvider] Refunding payment', { paymentId, amount })

    const intent = this.payments.get(paymentId)
    if (!intent) {
      throw new Error(`Payment intent not found: ${paymentId}`)
    }

    const refundAmount = amount || intent.amount

    const result: PaymentResult = {
      id: paymentId,
      status: 'refunded',
      amount: refundAmount,
      currency: intent.currency,
      provider: this.provider,
      providerTransactionId: `mock_refund_${Date.now()}`,
      metadata: { ...intent.metadata, refundAmount: refundAmount.toString() },
    }

    intent.status = 'refunded'
    this.payments.set(paymentId, intent)

    logger.debug('[MockPaymentProvider] Payment refunded', { paymentId, amount: refundAmount })

    return result
  }
}

