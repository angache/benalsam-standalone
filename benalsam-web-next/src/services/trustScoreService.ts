/**
 * Trust Score Service
 * 
 * Calculates and manages user trust scores
 */

import { supabase } from '@/lib/supabase'

const TRUST_SCORE_WEIGHTS = {
  profile_completeness: 15,
  email_verification: 10,
  phone_verification: 10,
  listings: 15,
  completed_trades: 20,
  reviews: 15,
  response_time: 5,
  account_age: 5,
  social_links: 3,
  premium_status: 2,
}

const TRUST_LEVELS = {
  bronze: { min: 0, max: 30 },
  silver: { min: 31, max: 60 },
  gold: { min: 61, max: 85 },
  platinum: { min: 86, max: 100 },
}

export interface TrustScoreBreakdown {
  profile_completeness: number
  email_verification: number
  phone_verification: number
  listings: number
  completed_trades: number
  reviews: number
  response_time: number
  account_age: number
  social_links: number
  premium_status: number
}

export interface TrustScoreCalculation {
  totalScore: number
  breakdown: TrustScoreBreakdown
  level: 'bronze' | 'silver' | 'gold' | 'platinum'
  nextLevelScore: number
  progressToNextLevel: number
}

/**
 * Calculate profile completeness score (0-100)
 */
function calculateProfileCompleteness(profile: any): number {
  let score = 0
  const fields = [
    profile?.full_name || profile?.first_name || profile?.name,
    profile?.bio,
    profile?.avatar_url,
    profile?.location || profile?.province || profile?.district,
    profile?.phone,
  ]
  
  const completedFields = fields.filter(Boolean).length
  score = (completedFields / fields.length) * 100
  
  return Math.round(score)
}

/**
 * Calculate email verification score (0 or 100)
 */
function calculateEmailVerification(profile: any): number {
  // Check if email is verified (from auth.users or profile)
  return profile?.email_confirmed_at || profile?.is_verified ? 100 : 0
}

/**
 * Calculate phone verification score (0 or 100)
 */
function calculatePhoneVerification(profile: any): number {
  return profile?.phone_verified ? 100 : 0
}

/**
 * Calculate listings score based on active listings count
 */
async function calculateListingsScore(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error) {
      console.error('Error counting listings:', error)
      return 0
    }

    const listingsCount = count || 0
    
    // Max score at 10+ listings
    if (listingsCount >= 10) return 100
    return Math.round((listingsCount / 10) * 100)
  } catch (error) {
    console.error('Error calculating listings score:', error)
    return 0
  }
}

/**
 * Calculate completed trades score
 */
function calculateCompletedTradesScore(profile: any): number {
  const completedTrades = profile?.user_statistics?.accepted_offers || 0
  
  // Max score at 20+ trades
  if (completedTrades >= 20) return 100
  return Math.round((completedTrades / 20) * 100)
}

/**
 * Calculate reviews score based on rating and review count
 */
function calculateReviewsScore(profile: any): number {
  const rating = profile?.average_rating || 0
  const reviewCount = profile?.total_reviews || 0
  
  // Weight: 60% rating, 40% count
  const ratingScore = (rating / 5) * 60
  const countScore = Math.min((reviewCount / 10) * 40, 40)
  
  return Math.round(ratingScore + countScore)
}

/**
 * Calculate response time score
 */
function calculateResponseTimeScore(profile: any): number {
  const avgResponseTime = profile?.user_statistics?.avg_response_time_hours || 999
  
  // Lower response time = higher score
  if (avgResponseTime <= 1) return 100
  if (avgResponseTime <= 6) return 75
  if (avgResponseTime <= 24) return 50
  if (avgResponseTime <= 48) return 25
  return 0
}

/**
 * Calculate account age score
 */
function calculateAccountAgeScore(profile: any): number {
  if (!profile?.created_at) return 0
  
  const accountAgeDays = (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
  
  // Max score at 365+ days
  if (accountAgeDays >= 365) return 100
  return Math.round((accountAgeDays / 365) * 100)
}

/**
 * Calculate social links score
 */
function calculateSocialLinksScore(profile: any): number {
  const socialLinks = profile?.social_links || {}
  const linkCount = Object.keys(socialLinks).filter(key => socialLinks[key]).length
  
  // Max score at 3+ links
  if (linkCount >= 3) return 100
  return Math.round((linkCount / 3) * 100)
}

/**
 * Get trust level from score
 */
function getTrustLevel(score: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (score >= TRUST_LEVELS.platinum.min) return 'platinum'
  if (score >= TRUST_LEVELS.gold.min) return 'gold'
  if (score >= TRUST_LEVELS.silver.min) return 'silver'
  return 'bronze'
}

/**
 * Get next level minimum score
 */
function getNextLevelScore(currentLevel: 'bronze' | 'silver' | 'gold' | 'platinum'): number {
  switch (currentLevel) {
    case 'bronze':
      return TRUST_LEVELS.silver.min
    case 'silver':
      return TRUST_LEVELS.gold.min
    case 'gold':
      return TRUST_LEVELS.platinum.min
    case 'platinum':
      return 100
  }
}

/**
 * Calculate progress to next level (0-100)
 */
function calculateProgressToNextLevel(
  currentScore: number,
  currentLevel: 'bronze' | 'silver' | 'gold' | 'platinum'
): number {
  const nextLevelScore = getNextLevelScore(currentLevel)
  const currentLevelMin = TRUST_LEVELS[currentLevel].min
  
  if (currentLevel === 'platinum') return 100
  
  const levelRange = nextLevelScore - currentLevelMin
  const progress = currentScore - currentLevelMin
  
  return Math.round((progress / levelRange) * 100)
}

/**
 * Calculate trust score for a user
 */
export async function calculateTrustScore(userId: string): Promise<TrustScoreCalculation> {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    // 1. Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error('User profile not found')
    }

    // 2. Fetch user statistics
    let { data: stats } = await supabase
      .from('user_statistics')
      .select('accepted_offers, avg_response_time_hours')
      .eq('user_id', userId)
      .maybeSingle()

    if (!stats) {
      // Initialize statistics if not exists
      const { error: insertError } = await supabase.from('user_statistics').insert({
        user_id: userId,
        accepted_offers: 0,
        avg_response_time_hours: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      
      if (insertError) {
        console.error('Error initializing user statistics:', insertError)
      }
      
      // Try to fetch again
      const { data: newStats } = await supabase
        .from('user_statistics')
        .select('accepted_offers, avg_response_time_hours')
        .eq('user_id', userId)
        .maybeSingle()
      
      stats = newStats || { accepted_offers: 0, avg_response_time_hours: 0 }
    }

    // 3. Combine profile with stats
    const profileWithStats = {
      ...profile,
      user_statistics: stats,
    }

    // 4. Calculate breakdown
    const breakdown: TrustScoreBreakdown = {
      profile_completeness: calculateProfileCompleteness(profileWithStats),
      email_verification: calculateEmailVerification(profileWithStats),
      phone_verification: calculatePhoneVerification(profileWithStats),
      listings: await calculateListingsScore(userId),
      completed_trades: calculateCompletedTradesScore(profileWithStats),
      reviews: calculateReviewsScore(profileWithStats),
      response_time: calculateResponseTimeScore(profileWithStats),
      account_age: calculateAccountAgeScore(profileWithStats),
      social_links: calculateSocialLinksScore(profileWithStats),
      premium_status: profile.is_premium ? 100 : 0,
    }

    // 5. Calculate total score
    const totalScore = Object.entries(breakdown).reduce((total, [key, score]) => {
      const weight = TRUST_SCORE_WEIGHTS[key as keyof typeof TRUST_SCORE_WEIGHTS]
      return total + (score * weight) / 100
    }, 0)

    // 6. Determine trust level
    const level = getTrustLevel(totalScore)
    const nextLevelScore = getNextLevelScore(level)
    const progressToNextLevel = calculateProgressToNextLevel(totalScore, level)

    return {
      totalScore: Math.round(totalScore),
      breakdown,
      level,
      nextLevelScore,
      progressToNextLevel,
    }
  } catch (error: any) {
    console.error('Error calculating trust score:', error)
    throw error
  }
}

/**
 * Update trust score in database
 */
export async function updateTrustScore(userId: string): Promise<TrustScoreCalculation> {
  const calculation = await calculateTrustScore(userId)

  // Update profile with new trust score
  await supabase
    .from('profiles')
    .update({
      trust_score: calculation.totalScore,
      trust_score_breakdown: calculation.breakdown,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  return calculation
}

/**
 * Get trust level description
 */
export function getTrustLevelDescription(level: string): string {
  const descriptions: Record<string, string> = {
    bronze: 'Başlangıç seviyesi. Profilinizi tamamlayarak puanınızı artırabilirsiniz.',
    silver: 'İyi bir başlangıç! Daha fazla ilan ve işlem ile puanınızı artırabilirsiniz.',
    gold: 'Harika! Güvenilir bir kullanıcısınız. Premium üyelik ile daha da ilerleyebilirsiniz.',
    platinum: 'Mükemmel! En güvenilir kullanıcı seviyesindesiniz. Tebrikler!',
  }
  return descriptions[level.toLowerCase()] || descriptions.bronze
}

/**
 * Get trust level color
 */
export function getTrustLevelColor(level: string): string {
  const colors: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  }
  return colors[level.toLowerCase()] || colors.bronze
}

