'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Settings, 
  UserPlus, 
  UserMinus, 
  ShoppingBag, 
  Users, 
  Award, 
  Eye,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfileData } from '@/hooks/useProfileData'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { EmptyStateProfileListings, EmptyStateProfileReviews } from '@/components/ui/empty-state'
import ListingCard from '@/components/ListingCard'

// Helper function to generate boring avatar URL
const generateBoringAvatarUrl = (name: string, userId: string) => {
  const cleanedName = name ? String(name).replace(/[^a-zA-Z0-9]/g, '') : ''
  const fallbackName = cleanedName || (userId ? String(userId).substring(0, 8) : 'user')
  return `https://source.boringavatars.com/beam/120/${fallbackName}?colors=ff6b35,f7931e,ff8c42,1a0f0a,2d1810`
}

// StatCard component
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  onClick?: () => void
}

const StatCard = ({ icon, label, value, onClick }: StatCardProps) => (
  <div 
    className={`bg-card/50 backdrop-blur-sm p-4 rounded-lg flex flex-col items-center justify-center text-center border border-border/50 ${
      onClick ? 'cursor-pointer hover:bg-primary/10 transition-colors' : ''
    }`}
    onClick={onClick}
  >
    {icon}
    <span className="text-2xl font-bold mt-1">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
)

// Loading skeleton
const ProfileSkeleton = () => (
  <div className="mx-auto w-full max-w-[1600px] px-4 py-8">
    <div className="bg-card/80 backdrop-blur-md shadow-xl rounded-2xl p-8 mb-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-40 h-40 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted rounded w-32 animate-pulse" />
          <div className="h-16 bg-muted rounded w-full animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  </div>
)

// Empty state component (keeping for backward compatibility)
interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
}

const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6">{description}</p>
    {action}
  </div>
)

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const { user: currentUser, isAuthenticated } = useAuth()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState<'ilanlar' | 'yorumlar'>('ilanlar')
  
  // Use the real hook
  const { 
    profile, 
    listings, 
    reviews, 
    isFollowing, 
    isLoading, 
    isError, 
    error, 
    refetch, 
    toggleFollow, 
    isFollowLoading 
  } = useProfileData(userId, currentUser?.id)

  const isCurrentUserProfile = currentUser?.id === userId

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true)
        setIsError(false)

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) throw profileError

        setProfile(profileData)

        // Fetch listings
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (!listingsError) {
          setListings(listingsData || [])
        }

        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .eq('reviewee_id', userId)
          .order('created_at', { ascending: false })

        if (!reviewsError) {
          setReviews(reviewsData || [])
        }

        // Check follow status
        if (currentUser && currentUser.id !== userId) {
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId)
            .single()

          setIsFollowing(!!followData)
        }

        // Increment profile view (only for other users)
        if (currentUser && currentUser.id !== userId) {
          const hasViewed = sessionStorage.getItem(`viewed_profile_${userId}`)
          if (!hasViewed) {
            await supabase.rpc('increment_profile_view', { user_id_to_increment: userId })
            sessionStorage.setItem(`viewed_profile_${userId}`, 'true')
          }
        }

      } catch (error) {
        console.error('Error fetching profile:', error)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchProfileData()
    }
  }, [userId, currentUser])

  const handleToggleFollow = async () => {
    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    if (isCurrentUserProfile || followLoading) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId)

        setIsFollowing(false)
        setProfile((prev: any) => ({
          ...prev,
          followers_count: Math.max(0, (prev.followers_count || 0) - 1)
        }))

        toast({
          title: 'Takipten çıkıldı',
          description: 'Kullanıcıyı takipten çıktınız',
        })
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: userId
          })

        setIsFollowing(true)
        setProfile((prev: any) => ({
          ...prev,
          followers_count: (prev.followers_count || 0) + 1
        }))

        toast({
          title: 'Takip edildi',
          description: 'Kullanıcıyı takip etmeye başladınız',
        })
      }
    } catch (error) {
      console.error('Follow toggle error:', error)
      toast({
        title: 'Hata',
        description: 'İşlem başarısız oldu',
        variant: 'destructive',
      })
    } finally {
      setFollowLoading(false)
    }
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <EmptyState
          title="Profil Yüklenemedi"
          description={isError ? 'Profil bilgileri yüklenirken bir hata oluştu.' : 'Aradığınız kullanıcı profili mevcut değil.'}
          action={
            <div className="flex gap-4">
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tekrar Dene
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Ana Sayfaya Dön
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  const displayName = profile.name || profile.username || 'İsimsiz Kullanıcı'
  const displayAvatarFallback = displayName.charAt(0).toUpperCase()
  const displayLocation = [profile.province, profile.district, profile.neighborhood]
    .filter(Boolean)
    .join(' / ') || 'Konum belirtilmemiş'

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-[1600px] px-4 py-8"
    >
      {/* Profile Header */}
      <div className="relative bg-card/80 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden p-6 md:p-8 mb-8">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-primary/70 to-secondary/70 opacity-50 -z-10 transform -skew-y-3"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-lg">
            <AvatarImage 
              src={profile.avatar_url || generateBoringAvatarUrl(displayName, profile.id)} 
              alt={displayName} 
            />
            <AvatarFallback className="text-4xl bg-muted">
              {displayAvatarFallback}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
              {displayName}
            </h1>
            {profile.username && profile.name && (
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            )}
            
            <p className="text-muted-foreground flex items-center justify-center md:justify-start mt-2">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              {displayLocation}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-prose mt-2">
              {profile.bio || (isCurrentUserProfile ? "Henüz bir biyografi eklemediniz." : "Kullanıcının biyografisi bulunmuyor.")}
            </p>
          </div>

          {isCurrentUserProfile ? (
            <Button 
              onClick={() => router.push('/ayarlar')} 
              className="w-full md:w-auto mt-4 md:mt-0"
            >
              <Settings className="w-4 h-4 mr-2" />
              Profili Düzenle
            </Button>
          ) : isAuthenticated ? (
            <Button 
              onClick={handleToggleFollow} 
              disabled={followLoading}
              variant={isFollowing ? 'outline' : 'default'}
              className="w-full md:w-auto mt-4 md:mt-0"
            >
              {followLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isFollowing ? (
                <UserMinus className="w-4 h-4 mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {isFollowing ? 'Takipten Çık' : 'Takip Et'}
            </Button>
          ) : null}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-border/50">
          <StatCard 
            icon={<ShoppingBag className="w-6 h-6 text-primary"/>} 
            label="İlan Sayısı" 
            value={listings.length} 
          />
          <StatCard 
            icon={<Users className="w-6 h-6 text-purple-500"/>} 
            label="Takipçi" 
            value={profile.followers_count || 0} 
          />
          <StatCard 
            icon={<Users className="w-6 h-6 text-teal-500"/>} 
            label="Takip Edilen" 
            value={profile.following_count || 0}
            onClick={() => router.push(`/takip-edilenler/${profile.id}`)}
          />
          <StatCard 
            icon={<Award className="w-6 h-6 text-yellow-400"/>} 
            label="Güven Puanı" 
            value={profile.trust_score || 0} 
          />
          <StatCard 
            icon={<Eye className="w-6 h-6 text-blue-500"/>} 
            label="Görüntülenme" 
            value={profile.profile_views || 0} 
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex border-b border-border/50">
          <button 
            onClick={() => setActiveTab('ilanlar')}
            className={`py-3 px-6 font-medium transition-colors duration-200 ${
              activeTab === 'ilanlar' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            İlanlar ({listings.length})
          </button>
          <button 
            onClick={() => setActiveTab('yorumlar')}
            className={`py-3 px-6 font-medium transition-colors duration-200 ${
              activeTab === 'yorumlar' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yorumlar ({reviews.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'ilanlar' && (
        listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map(listing => (
              <ListingCard 
                key={listing.id} 
                listing={listing}
                size="normal"
                onView={(listing) => {
                  // TODO: Navigate to listing detail page
                  console.log('View listing:', listing.id)
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyStateProfileListings 
            isCurrentUser={isCurrentUserProfile}
            onCreateClick={() => router.push('/ilan-olustur')}
          />
        )
      )}

      {activeTab === 'yorumlar' && (
        reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="bg-card rounded-lg p-4 border">
                <p>{review.comment}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Puan: {review.rating}/5
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateProfileReviews 
            isCurrentUser={isCurrentUserProfile}
          />
        )
      )}
    </motion.div>
  )
}

