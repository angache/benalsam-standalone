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
  Loader2,
  Star
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfileData } from '@/hooks/useProfileData'
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

  // Profile view increment (client-side only for now)
  useEffect(() => {
    if (userId && currentUser && currentUser.id !== userId) {
      const hasViewed = sessionStorage.getItem(`viewed_profile_${userId}`)
      if (!hasViewed) {
        // TODO: Call API to increment view count
        console.log(`Incrementing view for profile: ${userId}`)
        sessionStorage.setItem(`viewed_profile_${userId}`, 'true')
      }
    }
  }, [userId, currentUser])

  useEffect(() => {
    console.log(`🔍 [PROFILE] Loading: ${isLoading}, Error: ${isError}, Tab: ${activeTab}, Listings: ${listings.length}`)
    if (listings.length > 0) {
      console.log('📋 Listings:', listings.map(l => `${l.id} - ${l.title}`))
    }
  }, [isLoading, listings, activeTab, isError])

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      toast({ title: "Giriş Yapın", description: "Takip etmek için giriş yapmalısınız.", variant: "destructive" })
      router.push('/auth/login')
      return
    }
    if (isCurrentUserProfile || isFollowLoading || !profile) return

    await toggleFollow(userId)
  }

  const handleEditProfile = () => {
    router.push('/ayarlar/profil')
  }

  const displayName = profile?.name || profile?.username || "İsimsiz Kullanıcı"
  const displayAvatarFallback = displayName.charAt(0).toUpperCase()

  const getDisplayLocation = (profileData: typeof profile) => {
    if (!profileData) return "Konum belirtilmemiş"
    const { province, district, neighborhood } = profileData
    return [province, district, neighborhood].filter(Boolean).join(' / ') || "Konum belirtilmemiş"
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <EmptyStateProfileListings 
          title="Profil Bulunamadı"
          description={error?.message || 'Profil bilgileri yüklenirken bir hata oluştu veya profil mevcut değil.'}
          action={
            <div className="space-x-4">
              <Button onClick={() => refetch()} className="btn-primary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tekrar Dene
              </Button>
              <Button onClick={() => router.push('/')} variant="outline">
                Ana Sayfaya Dön
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
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
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-1">{displayName}</h1>
            {profile.username && profile.name && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
            
            <p className="text-muted-foreground flex items-center justify-center md:justify-start mt-2">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              {getDisplayLocation(profile)}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-prose mt-2">
              {profile.bio || (isCurrentUserProfile ? "Henüz bir biyografi eklemediniz." : "Kullanıcının biyografisi bulunmuyor.")}
            </p>
          </div>

          {isCurrentUserProfile ? (
            <Button onClick={handleEditProfile} className="btn-secondary w-full md:w-auto mt-4 md:mt-0 self-center md:self-start">
              <Settings className="w-4 h-4 mr-2" /> Profili ve Ayarları Düzenle
            </Button>
          ) : isAuthenticated && (
            <Button 
              onClick={handleToggleFollow} 
              disabled={isFollowLoading}
              className={`w-full md:w-auto mt-4 md:mt-0 self-center md:self-start transition-all ${
                isFollowing ? "btn-secondary-amazon" : "btn-primary"
              }`}
            >
              {isFollowLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (isFollowing ? <UserMinus className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />)}
              {isFollowing ? "Takipten Çık" : "Takip Et"}
            </Button>
          )}
        </div>
        
        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-border/50">
          <StatCard icon={<ShoppingBag className="w-6 h-6 text-primary"/>} label="İlan Sayısı" value={listings.length} />
          <StatCard 
            icon={<Users className="w-6 h-6 text-purple-500"/>} 
            label="Takipçi" 
            value={profile.followers_count || 0} 
            onClick={() => {
              toast({ title: "🚧 Bu özellik henüz uygulanmadı—ama merak etme! Bir sonraki istekte talep edebilirsin! 🚀" })
            }}
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
          <StatCard icon={<Eye className="w-6 h-6 text-blue-500"/>} label="Profil Görüntülenme" value={profile.profile_views || 0} />
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
                  router.push(`/ilan/${listing.id}`)
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
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={review.reviewer?.avatar_url} />
                    <AvatarFallback>{review.reviewer?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{review.reviewer?.name || 'Anonim'}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
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
    </div>
  )
}
