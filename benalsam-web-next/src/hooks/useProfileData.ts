import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useToast } from './use-toast'

interface Profile {
  id: string
  name: string
  username?: string
  avatar_url?: string
  bio?: string
  province?: string
  district?: string
  neighborhood?: string
  followers_count?: number
  following_count?: number
  trust_score?: number
  profile_views?: number
  is_2fa_enabled?: boolean
  is_premium?: boolean
  created_at?: string
  updated_at?: string
}

interface Listing {
  id: string
  title: string
  description?: string
  price?: number
  currency?: string
  main_image_url?: string
  image_url?: string
  category?: string
  urgency?: string
  status?: string
  is_featured?: boolean
  is_showcase?: boolean
  is_urgent_premium?: boolean
  has_bold_border?: boolean
  created_at?: string
  updated_at?: string
  views_count?: number
  offers_count?: number
  favorites_count?: number
  location?: string
  listings_district?: string
  listings_neighborhood?: string
}

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  reviewer?: {
    id: string
    name: string
    avatar_url?: string
  }
}

interface ProfileData {
  profile: Profile
  listings: Listing[]
  reviews: Review[]
  isFollowing: boolean
}

export function useProfileData(userId: string | undefined, currentUserId: string | undefined) {
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch profile data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<ProfileData>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')
      
      const response = await fetch(`/api/profiles/${userId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch profile')
      }
      return response.json()
    },
    enabled: !!userId && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await fetch(`/api/profiles/${targetUserId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to follow user')
      }
      
      return response.json()
    },
    onSuccess: (data, targetUserId) => {
      // Update the profile data in cache
      queryClient.setQueryData(['profile', targetUserId], (oldData: ProfileData | undefined) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          isFollowing: true,
          profile: {
            ...oldData.profile,
            followers_count: (oldData.profile.followers_count || 0) + 1
          }
        }
      })
      
      // Update current user's following count
      queryClient.setQueryData(['profile', currentUserId], (oldData: ProfileData | undefined) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          profile: {
            ...oldData.profile,
            following_count: (oldData.profile.following_count || 0) + 1
          }
        }
      })
      
      toast({
        title: "Başarılı",
        description: "Kullanıcı takip edildi.",
        variant: "default"
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await fetch(`/api/profiles/${targetUserId}/follow`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unfollow user')
      }
      
      return response.json()
    },
    onSuccess: (data, targetUserId) => {
      // Update the profile data in cache
      queryClient.setQueryData(['profile', targetUserId], (oldData: ProfileData | undefined) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          isFollowing: false,
          profile: {
            ...oldData.profile,
            followers_count: Math.max((oldData.profile.followers_count || 0) - 1, 0)
          }
        }
      })
      
      // Update current user's following count
      queryClient.setQueryData(['profile', currentUserId], (oldData: ProfileData | undefined) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          profile: {
            ...oldData.profile,
            following_count: Math.max((oldData.profile.following_count || 0) - 1, 0)
          }
        }
      })
      
      toast({
        title: "Başarılı",
        description: "Takipten çıkıldı.",
        variant: "default"
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Toggle follow/unfollow
  const toggleFollow = async (targetUserId: string) => {
    if (!data) return
    
    if (data.isFollowing) {
      await unfollowMutation.mutateAsync(targetUserId)
    } else {
      await followMutation.mutateAsync(targetUserId)
    }
  }

  return {
    profile: data?.profile,
    listings: data?.listings || [],
    reviews: data?.reviews || [],
    isFollowing: data?.isFollowing || false,
    isLoading,
    isError,
    error,
    refetch,
    toggleFollow,
    isFollowLoading: followMutation.isPending || unfollowMutation.isPending
  }
}
