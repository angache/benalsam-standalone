/**
 * AI Suggestions API Route
 * 
 * Provides intelligent search suggestions based on:
 * - User search history (user_behavior_logs)
 * - Trending searches
 * - Popular keywords
 * - Category-based suggestions
 */

import { logger } from '@/utils/production-logger'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/production-logger'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const categoryId = searchParams.get('categoryId')

    // Create Supabase client for server-side
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const suggestions: any[] = []

    // 1. Trending suggestions from user_behavior_logs (if available)
    // Since table might be empty/not configured, this is optional
    if (!query || query.length < 2) {
      try {
        const { data: trendingData, error } = await supabase
          .from('user_behavior_logs')
          .select('search_query')
          .eq('action', 'search')
          .not('search_query', 'is', null)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(100)

        if (!error && trendingData && trendingData.length > 0) {
          const searchCounts = new Map<string, number>()
          trendingData.forEach((log: any) => {
            const q = log.search_query?.trim()
            if (q) searchCounts.set(q, (searchCounts.get(q) || 0) + 1)
          })

          Array.from(searchCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([text, count]) => {
              suggestions.push({
                id: `trending-${text}`,
                text,
                type: 'trending',
                score: Math.min(count / 10, 1),
                metadata: { searchCount: count }
              })
            })
        }
      } catch (err) {
        // Silent fail - table might not exist or be configured yet
      }
    }

    // 2. Query-based suggestions (if query provided)
    if (query && query.length >= 2) {
      // Fetch matching listings titles
      const { data: listings } = await supabase
        .from('listings')
        .select('title')
        .ilike('title', `%${query}%`)
        .eq('status', 'active')
        .limit(10)

      listings?.forEach((listing: any, index: number) => {
        suggestions.push({
          id: `listing-${index}`,
          text: listing.title,
          type: 'search',
          score: 0.8,
        })
      })

      // Add AI-generated variations
      suggestions.push(
        {
          id: `ai-1-${query}`,
          text: `${query} satın al`,
          type: 'ai',
          score: 0.7,
        },
        {
          id: `ai-2-${query}`,
          text: `${query} fiyatları`,
          type: 'ai',
          score: 0.6,
        },
        {
          id: `ai-3-${query}`,
          text: `İkinci el ${query}`,
          type: 'ai',
          score: 0.6,
        }
      )
    }

    // 3. Category-based suggestions
    if (categoryId) {
      const { data: categoryData } = await supabase
        .from('category_ai_suggestions')
        .select('*')
        .eq('category_id', parseInt(categoryId))
        .eq('is_approved', true)
        .order('confidence_score', { ascending: false })
        .limit(5)

      categoryData?.forEach((cat: any) => {
        const suggestionTexts = cat.suggestion_data?.suggestions || []
        suggestionTexts.forEach((text: string, index: number) => {
          suggestions.push({
            id: `category-${categoryId}-${index}`,
            text,
            type: 'category',
            score: cat.confidence_score || 0.5,
            category: { id: categoryId }
          })
        })
      })
    }

    // 4. Popular suggestions - Use most viewed/searched listings
    if (suggestions.length < 5) {
      try {
        // Get most popular listing titles (by view count)
        const { data: popularListings } = await supabase
          .from('listings')
          .select('title, view_count')
          .eq('status', 'active')
          .order('view_count', { ascending: false })
          .limit(5)

        if (popularListings && popularListings.length > 0) {
          popularListings.forEach((item: any, index: number) => {
            suggestions.push({
              id: `popular-listing-${index}`,
              text: item.title,
              type: 'popular',
              score: Math.min((item.view_count || 0) / 100, 0.9),
              metadata: { viewCount: item.view_count }
            })
          })
        } else {
          // Hardcoded fallback if no listings
          const fallbackKeywords = [
            { text: 'iPhone 13 Pro', type: 'popular', score: 0.9 },
            { text: 'Kiralık Daire İstanbul', type: 'popular', score: 0.85 },
            { text: 'MacBook Air M2', type: 'popular', score: 0.8 },
            { text: 'PlayStation 5', type: 'popular', score: 0.75 },
            { text: 'Sahibinden Araba', type: 'popular', score: 0.7 },
          ]

          fallbackKeywords.forEach((keyword, index) => {
            suggestions.push({
              id: `popular-fallback-${index}`,
              ...keyword
            })
          })
        }
      } catch (err) {
        logger.debug('[API] Popular suggestions not available, using fallback')
        // Hardcoded fallback
        const fallbackKeywords = [
          { text: 'iPhone 13 Pro', type: 'popular', score: 0.9 },
          { text: 'Kiralık Daire İstanbul', type: 'popular', score: 0.85 },
          { text: 'MacBook Air M2', type: 'popular', score: 0.8 },
        ]
        fallbackKeywords.forEach((keyword, index) => {
          suggestions.push({
            id: `popular-fallback-${index}`,
            ...keyword
          })
        })
      }
    }

    // Remove duplicates and sort by score
    const uniqueSuggestions = suggestions
      .filter((s, index, self) => index === self.findIndex(t => t.text === s.text))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        suggestions: uniqueSuggestions,
        total: uniqueSuggestions.length,
        query,
        categoryId,
      }
    })

  } catch (error: unknown) {
    logger.error('[API] AI Suggestions error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch AI suggestions',
      },
      { status: 500 }
    )
  }
}

