import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import type { Listing } from '@/types'

export interface FollowedCategory {
  category_name: string
  created_at?: string
}

export interface ListingWithUser extends Listing {
  user?: {
    id: string
    name: string
    avatar_url?: string | null
    rating?: number | null
    total_ratings?: number
    rating_sum?: number
  }
  is_favorited: boolean
}

export interface CategoryWithListings {
  category_name: string
  listings: ListingWithUser[]
}

export const followCategory = async (userId: string, categoryName: string) => {
  if (!userId || !categoryName) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('user_followed_categories')
      .insert([{ user_id: userId, category_name: categoryName }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { user_id: userId, category_name: categoryName, already_following: true }
      }
      logger.error('[CategoryFollowService] Error following category', { error })
      return null
    }

    return data
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('[CategoryFollowService] Error following category', { error: errorMessage })
    return null
  }
}

export const unfollowCategory = async (userId: string, categoryName: string): Promise<boolean> => {
  if (!userId || !categoryName) {
    return false
  }

  try {
    const { error } = await supabase
      .from('user_followed_categories')
      .delete()
      .eq('user_id', userId)
      .eq('category_name', categoryName)

    if (error) {
      logger.error('[CategoryFollowService] Error unfollowing category', { error })
      return false
    }

    return true
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('[CategoryFollowService] Error unfollowing category', { error: errorMessage })
    return false
  }
}

export const fetchFollowedCategories = async (userId: string): Promise<FollowedCategory[]> => {
  if (!userId) return []

  try {
    const { data, error } = await supabase
      .from('user_followed_categories')
      .select('category_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('[CategoryFollowService] Error in fetchFollowedCategories', { error })
      return []
    }

    return data || []
  } catch (error) {
    logger.error('[CategoryFollowService] Error in fetchFollowedCategories', { error })
    return []
  }
}

export const fetchListingsForFollowedCategories = async (
  userId: string, 
  limitPerCategory: number = 3, 
  currentUserId: string | null = null
): Promise<CategoryWithListings[]> => {
  if (!userId) return []
  
  try {
    const followedCategories = await fetchFollowedCategories(userId)
    if (!followedCategories || followedCategories.length === 0) {
      return []
    }

    const listingsByCategories = await Promise.all(
      followedCategories.map(async (fc) => {
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('*, profiles (id, name, avatar_url, rating, total_ratings, rating_sum)')
          .ilike('category', `${fc.category_name}%`)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(limitPerCategory)

        if (listingsError) {
          logger.error(`[CategoryFollowService] Error fetching listings for category ${fc.category_name}`, { error: listingsError, categoryName: fc.category_name })
          return { category_name: fc.category_name, listings: [] }
        }
        
        let listingsWithUser: ListingWithUser[] = listingsData?.map((listing: Listing & { profiles?: ListingWithUser['user'] }) => ({
          ...listing,
          user: listing.profiles,
          is_favorited: false
        })) || []

        if (currentUserId && listingsWithUser.length > 0) {
          const listingIds = listingsWithUser.map((l) => l.id)
          const { data: favoriteStatusesData } = await supabase
            .from('user_favorites')
            .select('listing_id')
            .eq('user_id', currentUserId)
            .in('listing_id', listingIds)

          const favoriteStatuses: Record<string, boolean> = {}
          if (favoriteStatusesData) {
            favoriteStatusesData.forEach((fav: { listing_id: string }) => {
              favoriteStatuses[fav.listing_id] = true
            })
          }
          
          listingsWithUser = listingsWithUser.map((l) => ({
            ...l,
            is_favorited: favoriteStatuses[l.id] || false
          }))
        }

        return { category_name: fc.category_name, listings: listingsWithUser }
      })
    )
    return listingsByCategories.filter(cat => cat.listings.length > 0)
  } catch (e) {
    logger.error('[CategoryFollowService] Unexpected error in fetchListingsForFollowedCategories', { error: e })
    return []
  }
}

