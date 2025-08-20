import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Loader2, WifiOff, Rss, PlusCircle, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores';
import { 
  fetchFollowingUsers, 
  fetchUserProfile,
  fetchListingsForFollowedCategories,
} from '@/services/supabaseService';
import UserCard from '@/components/FollowingPage/UserCard';
import CategoryFollowCard from '@/components/FollowingPage/CategoryFollowCard';
import FollowCategoryModal from '@/components/FollowingPage/FollowCategoryModal';

const FollowingPage = ({ onToggleFavorite }) => {
  const { userId: routeUserId } = useParams();
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('users'); 
  
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followedCategoriesWithListings, setFollowedCategoriesWithListings] = useState([]);
  
  const [profileUser, setProfileUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowCategoryModalOpen, setIsFollowCategoryModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const targetUserId = routeUserId || currentUser?.id;

  useEffect(() => {
    if (!targetUserId || isInitialized) {
        return;
    }

    const loadInitialData = async () => {
      try {
        setLoadingUsers(true);
        setLoadingCategories(true);
        setError(null);

        if (routeUserId && routeUserId !== currentUser?.id) {
          const fetchedProfileUser = await fetchUserProfile(routeUserId);
          if (!fetchedProfileUser) throw new Error("Profil sahibi bulunamadı.");
          setProfileUser(fetchedProfileUser);
        } else if (currentUser) {
          setProfileUser(currentUser);
        }

        const fetchedFollowing = await fetchFollowingUsers(targetUserId);
        setFollowingUsers(fetchedFollowing);
        setLoadingUsers(false);

        const fetchedCategoriesListings = await fetchListingsForFollowedCategories(targetUserId, 3, currentUser?.id);
        setFollowedCategoriesWithListings(fetchedCategoriesListings);
        setLoadingCategories(false);
        
        setIsInitialized(true);

      } catch (e) {
        console.error("Error in FollowingPage useEffect:", e);
        setError("Takip edilenler yüklenirken bir sorun oluştu.");
        toast({ title: "Hata", description: e.message || "Veri yüklenemedi.", variant: "destructive" });
        setLoadingUsers(false);
        setLoadingCategories(false);
      }
    };
    loadInitialData();
  }, [targetUserId, currentUser?.id, routeUserId, isInitialized]);

  const handleUnfollowUserOptimistic = useCallback((unfollowedUserId) => {
    setFollowingUsers(prev => prev.filter(user => user.id !== unfollowedUserId));
  }, []);

  const handleUnfollowCategoryOptimistic = useCallback((unfollowedCategoryName) => {
    setFollowedCategoriesWithListings(prev => prev.filter(cat => cat.category_name !== unfollowedCategoryName));
  }, []);
  
  const handleCategoryFollowed = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const updatedCategoriesListings = await fetchListingsForFollowedCategories(targetUserId, 3, currentUser?.id);
      setFollowedCategoriesWithListings(updatedCategoriesListings);
    } catch (error) {
      console.error('Error refreshing categories:', error);
      toast({ title: "Hata", description: "Kategoriler güncellenirken bir sorun oluştu.", variant: "destructive" });
    } finally {
      setLoadingCategories(false);
    }
  }, [targetUserId, currentUser?.id]);

  const pageTitle = profileUser 
    ? (profileUser.id === currentUser?.id ? "Takip Ettiklerim" : `${profileUser.name || 'Kullanıcı'}'nın Takip Ettikleri`)
    : "Takip Edilenler";

  const isLoading = loadingUsers || loadingCategories;

  if (isLoading && !error) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Takip edilenler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center px-4 bg-background">
        <WifiOff className="w-20 h-20 text-destructive mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-4">Bir Sorun Oluştu</h1>
        <p className="text-muted-foreground mb-8 max-w-md">{error}</p>
        {!currentUser && (
             <Button asChild className="btn-primary text-primary-foreground">
                <Link to="/auth?action=login">Giriş Yap</Link>
            </Button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
    >
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gradient mb-3">{pageTitle}</h1>
      </div>

      <div className="mb-8 flex justify-center border-b border-border/50">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-6 font-medium transition-colors duration-200 flex items-center gap-2 ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Users className="w-5 h-5" /> Takip Edilen Kullanıcılar ({followingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-3 px-6 font-medium transition-colors duration-200 flex items-center gap-2 ${activeTab === 'categories' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Rss className="w-5 h-5" /> Takip Edilen Kategoriler ({followedCategoriesWithListings.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          {followingUsers.length === 0 ? (
            <div className="text-center py-12 glass-effect rounded-xl">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {profileUser && profileUser.id === currentUser?.id ? "Henüz Kimseyi Takip Etmiyorsun" : "Bu Kullanıcı Henüz Kimseyi Takip Etmiyor"}
              </h3>
              <p className="text-muted-foreground">İlgi çekici profilleri takip etmeye başla!</p>
              <Button asChild className="mt-6 btn-primary text-primary-foreground">
                <Link to="/">Keşfet</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {followingUsers.map((user) => (
                  <UserCard 
                    key={user.id} 
                    user={user} 
                    currentUserId={currentUser?.id}
                    onUnfollow={handleUnfollowUserOptimistic} 
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {activeTab === 'categories' && (
        <>
          {profileUser && profileUser.id === currentUser?.id && (
            <div className="mb-6 text-right">
              <Button onClick={() => setIsFollowCategoryModalOpen(true)} className="btn-primary">
                <PlusCircle className="w-4 h-4 mr-2" /> Yeni Kategori Takip Et
              </Button>
            </div>
          )}
          {followedCategoriesWithListings.length === 0 ? (
            <div className="text-center py-12 glass-effect rounded-xl">
              <Tag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {profileUser && profileUser.id === currentUser?.id ? "Henüz Kategori Takip Etmiyorsun" : "Bu Kullanıcı Henüz Kategori Takip Etmiyor"}
              </h3>
              <p className="text-muted-foreground">İlgini çeken kategorileri takip ederek yeni ilanlardan haberdar ol.</p>
              {profileUser && profileUser.id === currentUser?.id && (
                <Button onClick={() => setIsFollowCategoryModalOpen(true)} className="mt-6 btn-primary text-primary-foreground">
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
                    currentUserId={currentUser?.id}
                    onUnfollowCategory={handleUnfollowCategoryOptimistic}
                    onToggleFavorite={onToggleFavorite}
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
        currentUserId={currentUser?.id}
        onCategoryFollowed={handleCategoryFollowed}
      />
    </motion.div>
  );
};

export default memo(FollowingPage);