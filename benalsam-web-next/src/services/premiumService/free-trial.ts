/**
 * Free Trial Service
 * Handles free trial subscriptions for new users
 * 
 * Strategy: Corporate Plan - 6 months free for all new users
 * Target: All new users (no time restriction - until manually changed)
 * Premium Feature: Unlimited listings + unlimited offers
 * Target Customers: Oto galeriler, emlakçılar, inşaat firmaları
 * 
 * Note: To disable free trial for new users, set ENABLE_FREE_TRIAL=false in environment variables
 */

import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'

/**
 * Check if free trial is enabled
 * Controlled by environment variable or default to true
 */
export const isFreeTrialEnabled = (): boolean => {
  // Environment variable ile kontrol edilebilir
  // Varsayılan: true (aktif)
  const envValue = process.env.ENABLE_FREE_TRIAL
  if (envValue === 'false' || envValue === '0') {
    return false
  }
  return true // Default: enabled
}

/**
 * Check if user is eligible for free trial
 * Eligibility: All new users (no time restriction)
 */
export const isEligibleForFreeTrial = (): boolean => {
  // Kısıtlama yok, tüm yeni kayıtlar için geçerli
  return isFreeTrialEnabled()
}

/**
 * Create free trial subscription for new user
 * Corporate Plan - 6 months (180 days) free
 */
export const createFreeTrialSubscription = async (userId: string): Promise<boolean> => {
  if (!userId) {
    logger.error('[FreeTrial] User ID is required')
    return false
  }

  if (!isFreeTrialEnabled()) {
    logger.debug('[FreeTrial] Free trial is disabled', { userId })
    return false
  }

  try {
    logger.debug('[FreeTrial] Creating free trial subscription', { userId })

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('premium_subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      logger.debug('[FreeTrial] User already has an active subscription', { userId })
      return false // Don't create duplicate subscription
    }

    // Get Corporate Plan
    const { data: corporatePlan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('id, name, slug')
      .eq('slug', 'corporate')
      .eq('is_active', true)
      .single()

    if (planError || !corporatePlan) {
      logger.error('[FreeTrial] Corporate plan not found', { error: planError, userId })
      return false
    }

    // Calculate expiration date: 6 months (180 days) from now
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 6) // 6 ay = 180 gün

    // Create free trial subscription
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('premium_subscriptions')
      .insert({
        user_id: userId,
        plan_id: corporatePlan.id,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        payment_method: 'free_trial', // Mark as free trial
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (subscriptionError) {
      logger.error('[FreeTrial] Error creating free trial subscription', { 
        error: subscriptionError, 
        userId,
        planId: corporatePlan.id 
      })
      return false
    }

    logger.info('[FreeTrial] Free trial subscription created successfully (6 months)', {
      userId,
      subscriptionId: subscription.id,
      planId: corporatePlan.id,
      expiresAt: expiresAt.toISOString(),
      durationDays: 180
    })

    return true
  } catch (error) {
    logger.error('[FreeTrial] Unexpected error creating free trial subscription', { 
      error, 
      userId 
    })
    return false
  }
}

