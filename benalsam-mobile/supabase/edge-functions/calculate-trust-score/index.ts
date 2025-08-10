import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
};

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { user_id } = await req.json()
    if (!user_id) {
      throw new Error('user_id is required')
    }

    // Profil ve istatistikleri çek
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      throw new Error('User profile not found')
    }

    let { data: stats } = await supabase
      .from('user_statistics')
      .select('accepted_offers, avg_response_time_hours')
      .eq('user_id', user_id)
      .maybeSingle()

    if (!stats) {
      await supabase.from('user_statistics').insert({
        user_id,
        accepted_offers: 0,
        avg_response_time_hours: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      stats = { accepted_offers: 0, avg_response_time_hours: 0 }
    }

    const profileWithStats = { ...profile, user_statistics: stats }

    // Breakdown hesapla
    const listingsData = await calculateListingsScore(supabase, user_id);
    const breakdown = {
      profile_completeness: calculateProfileCompleteness(profileWithStats),
      email_verification: 100, // Şimdilik hep 100
      phone_verification: profile.phone_verified ? 100 : 0,
      listings: listingsData.score,
      listings_count: listingsData.count,
      completed_trades: calculateCompletedTradesScore(profileWithStats),
      reviews: 0, // Şimdilik 0
      response_time: calculateResponseTimeScore(profileWithStats),
      account_age: calculateAccountAgeScore(profileWithStats),
      social_links: calculateSocialLinksScore(profileWithStats),
      premium_status: profile.is_premium ? 100 : 0,
    }

    const totalScoreRaw = Object.entries(breakdown).reduce((total, [key, score]) => {
      const weight = TRUST_SCORE_WEIGHTS[key as keyof typeof TRUST_SCORE_WEIGHTS] ?? 0;
      return total + score * weight / 100;
    }, 0)
    const totalScore = isNaN(totalScoreRaw) ? 0 : Math.round(totalScoreRaw || 0)

    // Trust level hesapla
    const level = getTrustLevel(totalScore)

    return new Response(
      JSON.stringify({ 
        breakdown, 
        totalScore,
        level 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

const getTrustLevel = (score: number): 'bronze' | 'silver' | 'gold' | 'platinum' => {
  if (score >= 86) return 'platinum'
  if (score >= 61) return 'gold'
  if (score >= 31) return 'silver'
  return 'bronze'
}

const calculateProfileCompleteness = (profile: any): number => {
  let score = 0
  if (profile.first_name?.trim()) score += 10
  if (profile.last_name?.trim()) score += 10
  if (profile.bio?.trim()) score += 10
  if (profile.avatar_url) score += 10
  if (profile.province && profile.district) score += 30
  else if (profile.province) score += 15
  if (profile.phone_number) score += 15
  if (profile.birth_date) score += 15
  return Math.min(score, 100)
}

const calculateListingsScore = async (supabase: any, userId: string): Promise<{ score: number; count: number }> => {
  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')
  
  const countNum = count || 0
  if (countNum === 0) return { score: 0, count: 0 }
  if (countNum <= 2) return { score: 50, count: countNum }
  if (countNum <= 5) return { score: 75, count: countNum }
  if (countNum <= 10) return { score: 90, count: countNum }
  return { score: 100, count: countNum }
}

const calculateCompletedTradesScore = (profile: any): number => {
  const tradesCount = profile.user_statistics?.accepted_offers || 0
  if (tradesCount === 0) return 0
  if (tradesCount <= 2) return 40
  if (tradesCount <= 5) return 70
  if (tradesCount <= 10) return 85
  if (tradesCount <= 20) return 95
  return 100
}

const calculateResponseTimeScore = (profile: any): number => {
  const avgResponseTime = profile.user_statistics?.avg_response_time_hours || 0
  if (avgResponseTime === 0) return 50
  if (avgResponseTime <= 2) return 100
  if (avgResponseTime <= 6) return 90
  if (avgResponseTime <= 12) return 80
  if (avgResponseTime <= 24) return 70
  if (avgResponseTime <= 48) return 50
  return 30
}

const calculateAccountAgeScore = (profile: any): number => {
  const createdAt = new Date(profile.created_at)
  const now = new Date()
  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysSinceCreation <= 7) return 20
  if (daysSinceCreation <= 30) return 40
  if (daysSinceCreation <= 90) return 60
  if (daysSinceCreation <= 180) return 80
  if (daysSinceCreation <= 365) return 90
  return 100
}

const calculateSocialLinksScore = (profile: any): number => {
  const socialLinks = profile.social_links || {}
  const filledLinks = Object.values(socialLinks).filter((link: any) => link && link.trim() !== '').length
  
  if (filledLinks === 0) return 0
  if (filledLinks <= 2) return 50
  if (filledLinks <= 4) return 80
  return 100
} 