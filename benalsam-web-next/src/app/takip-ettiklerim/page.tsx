'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Loader2, WifiOff, Rss, PlusCircle, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { fetchFollowingUsers } from '@/services/followService'
import { fetchListingsForFollowedCategories } from '@/services/categoryFollowService'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyStateList } from '@/components/ui/empty-state'
import UserCard from '@/components/following/UserCard'
import CategoryFollowCard from '@/components/following/CategoryFollowCard'
import FollowCategoryModal from '@/components/following/FollowCategoryModal'
import type { User } from 'benalsam-shared-types'

const FollowingPage = () => {
  const router = useRouter()
  const { user, isLoading: loadingAuth } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'users' | 'categories'>('users')
  const [followingUsers, setFollowingUsers] = useState<User[]>([])
  const [followedCategoriesWithListings, setFollowedCategoriesWithListings] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowCategoryModalOpen, setIsFollowCategoryModalOpen] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      if (!loadingAuth) {
        setLoadingUsers(false)
        setLoadingCategories(false)
      }
      return
    }

    const loadInitialData = async () => {
      try {
        setLoadingUsers(true)
        setLoadingCategories(true)
        setError(null)

        const [usersData, categoriesData] = await Promise.all([
          fetchFollowingUsers(user.id),
          fetchListingsForFollowedCategories(user.id, 3, user.id),
        ])

        setFollowingUsers(usersData || [])
        setFollowedCategoriesWithListings(categoriesData || [])
      } catch (err) {
        console.error('Error loading following data:', err)
        setError('Takip edilenler yüklenirken bir sorun oluştu.')
        toast({
          title: 'Hata',
          description: 'Takip edilenler yüklenirken bir sorun oluştu.',
          variant: 'destructive',
        })
      } finally {
        setLoadingUsers(false)
        setLoadingCategories(false)
      }
    }

    loadInitialData()
  }, [user?.id, loadingAuth, toast])

  const handleUnfollowUser = useCallback((userId: string) => {
    setFollowingUsers((prev) => prev.filter((u) => u.id !== userId))
  }, [])

  const handleUnfollowCategory = useCallback((categoryName: string) => {
    setFollowedCategoriesWithListings((prev) => prev.filter((cat) => cat.category_name !== categoryName))
  }, [])

  const handleCategoryFollowed = useCallback(async () => {
    if (!user?.id) return
    
    setLoadingCategories(true)
    try {
      const updatedCategoriesListings = await fetchListingsForFollowedCategories(user.id, 3, user.id)
      setFollowedCategoriesWithListings(updatedCategoriesListings || [])
    } catch (error) {
      console.error('Error refreshing categories:', error)
      toast({
        title: 'Hata',
        description: 'Kategoriler güncellenirken bir sorun oluştu.',
        variant: 'destructive',
      })
    } finally {
      setLoadingCategories(false)
    }
  }, [user?.id, toast])

  const isLoadingPage = loadingAuth || (loadingUsers && loadingCategories)
  const showEmptyState = !isLoadingPage && !error && 
    ((activeTab === 'users' && followingUsers.length === 0) || 
     (activeTab === 'categories' && followedCategoriesWithListings.length === 0)) && 
    !!user

  if (isLoadingPage) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-background p-4 text-center">
        <LoadingSpinner size="xl" />
        <h2 className="text-2xl font-semibold text-foreground mb-3 mt-6">
          {loadingAuth ? 'Kimlik doğrulanıyor...' : 'Takip edilenler yükleniyor...'}
        </h2>
        <p className="text-muted-foreground">Lütfen bekleyin.</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-background p-4 text-center">
        <EmptyStateList
          title="Giriş Yapmalısınız"
          description="Takip ettiklerinizi görmek için giriş yapmanız gerekiyor."
          action={
            <Button onClick={() => router.push('/auth/login')}>Giriş Yap</Button>
          }
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center px-4 bg-background">
        <WifiOff className="w-20 h-20 text-destructive mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-4">Bir Sorun Oluştu</h1>
        <p className="text-muted-foreground mb-8 max-w-md">{error}</p>
        <Button onClick={() => router.push('/')}>Ana Sayfaya Dön</Button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
    >
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-3">Takip Ettiklerim</h1>
      </div>

      <div className="mb-8 flex justify-center border-b border-border/50">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-6 font-medium transition-colors duration-200 flex items-center gap-2 ${
            activeTab === 'users' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-5 h-5" /> Takip Edilen Kullanıcılar ({followingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-3 px-6 font-medium transition-colors duration-200 flex items-center gap-2 ${
            activeTab === 'categories' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Rss className="w-5 h-5" /> Takip Edilen Kategoriler ({followedCategoriesWithListings.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          {loadingUsers ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
              <p className="text-muted-foreground">Kullanıcılar yükleniyor...</p>
            </div>
          ) : followingUsers.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border">
              <Users className="w-20 h-20 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Henüz Kimseyi Takip Etmiyorsunuz
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                İlgi çekici profilleri takip etmeye başlayın ve onların ilanlarından haberdar olun.
              </p>
              <Button
                onClick={() => router.push('/')}
                className="text-primary-foreground px-8 py-3 text-lg"
              >
                Keşfetmeye Başla
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              <AnimatePresence>
                {followingUsers.map((followedUser) => (
                  <UserCard
                    key={followedUser.id}
                    user={followedUser}
                    currentUserId={user?.id}
                    onUnfollow={handleUnfollowUser}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {activeTab === 'categories' && (
        <>
          {user && (
            <div className="mb-6 text-right">
              <Button onClick={() => setIsFollowCategoryModalOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-2" /> Yeni Kategori Takip Et
              </Button>
            </div>
          )}
          {loadingCategories ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
              <p className="text-muted-foreground">Kategoriler yükleniyor...</p>
            </div>
          ) : followedCategoriesWithListings.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border">
              <Tag className="w-20 h-20 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Henüz Kategori Takip Etmiyorsunuz
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                İlgini çeken kategorileri takip ederek yeni ilanlardan haberdar ol.
              </p>
              {user && (
                <Button
                  onClick={() => setIsFollowCategoryModalOpen(true)}
                  className="text-primary-foreground px-8 py-3 text-lg"
                >
                  Kategori Takip Et
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {followedCategoriesWithListings.map((catData) => (
                  <CategoryFollowCard
                    key={catData.category_name}
                    category={{ category_name: catData.category_name }}
                    listings={catData.listings}
                    currentUserId={user?.id}
                    onUnfollowCategory={handleUnfollowCategory}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      <FollowCategoryModal
        isOpen={isFollowCategoryModalOpen}
        onClose={() => setIsFollowCategoryModalOpen(false)}
        currentUserId={user?.id}
        onCategoryFollowed={handleCategoryFollowed}
      />
    </motion.div>
  )
}

export default FollowingPage

