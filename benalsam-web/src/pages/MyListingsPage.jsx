import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores';
import { supabase } from '@/lib/supabaseClient';
import MyListingsHeader from '@/components/MyListingsPage/MyListingsHeader';
import ListingCard from '@/components/MyListingsPage/ListingCard';
import EmptyState from '@/components/MyListingsPage/EmptyState';
import DopingModal from '@/components/MyListingsPage/DopingModal';
import { statusConfig, getListingStatus, getStatusBadge, getPremiumBadges } from '@/components/MyListingsPage/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyStateList } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

// Modern skeleton component for my listings page
const MyListingsSkeleton = () => (
  <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8">
    {/* Header Skeleton */}
    <div className="mb-8">
      <div className="h-8 bg-muted rounded w-48 mb-4"></div>
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-10 bg-muted rounded w-20"></div>
        ))}
      </div>
    </div>

    {/* Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-5 2xl:gap-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  </div>
);

const MyListingsPage = () => {
  const navigate = useNavigate();
  const { currentUser, loadingAuth } = useAuthStore();
  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isDeleting, setIsDeleting] = useState(null);
  const [dopingModalOpen, setDopingModalOpen] = useState(false);
  const [selectedListingForDoping, setSelectedListingForDoping] = useState(null);

  useEffect(() => {
    if (loadingAuth || !currentUser) return;
    fetchMyListings();
  }, [currentUser, loadingAuth]);

  const fetchMyListings = async () => {
    if (!currentUser?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          offers:offers(count),
          favorites:user_favorites(count)
        `)
        .eq('user_id', currentUser.id)
        .order('is_urgent_premium', { ascending: false, nullsLast: true })
        .order('is_featured', { ascending: false, nullsLast: true })
        .order('is_showcase', { ascending: false, nullsLast: true })
        .order('upped_at', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedListings = data.map(listing => ({
        ...listing,
        offers_count: listing.offers?.[0]?.count || 0,
        favorites_count: listing.favorites?.[0]?.count || 0
      }));

      setMyListings(processedListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: "İlanlar Yüklenemedi",
        description: "İlanlarınız yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredListings = useMemo(() => {
    if (selectedStatus === 'all') return myListings;
    return myListings.filter(listing => getListingStatus(listing) === selectedStatus);
  }, [myListings, selectedStatus]);

  const handleDeleteListing = async (listingId) => {
    setIsDeleting(listingId);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setMyListings(prev => prev.filter(listing => listing.id !== listingId));
      toast({
        title: "İlan Silindi",
        description: "İlanınız başarıyla silindi."
      });
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({
        title: "Silme Başarısız",
        description: "İlan silinirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleStatus = async (listingId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listingId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setMyListings(prev => prev.map(listing => 
        listing.id === listingId ? { ...listing, status: newStatus } : listing
      ));

      toast({
        title: newStatus === 'published' ? "İlan Yayınlandı" : "İlan Yayından Kaldırıldı",
        description: `İlanınız ${newStatus === 'published' ? 'yayına alındı' : 'yayından kaldırıldı'}.`
      });
    } catch (error) {
      console.error('Error updating listing status:', error);
      toast({
        title: "Durum Güncellenemedi",
        description: "İlan durumu güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsCompleted = async (listingId) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'sold',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setMyListings(prev => prev.map(listing => 
        listing.id === listingId ? { 
          ...listing, 
          status: 'sold',
          completed_at: new Date().toISOString()
        } : listing
      ));

      toast({
        title: "🎉 Alışveriş Tamamlandı!",
        description: "İlanınız başarıyla tamamlandı olarak işaretlendi."
      });
    } catch (error) {
      console.error('Error marking listing as completed:', error);
      toast({
        title: "Güncelleme Başarısız",
        description: "İlan durumu güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleDopingClick = (listing) => {
    setSelectedListingForDoping(listing);
    setDopingModalOpen(true);
  };

  const handleDopingSuccess = () => {
    setDopingModalOpen(false);
    toast({
      title: "🚀 Doping Başarılı!",
      description: "İlanınız başarıyla güncellendi ve en kısa sürede üst sıralarda yer alacak.",
    });
    fetchMyListings();
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
    >
      <MyListingsHeader
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        statusConfig={statusConfig}
        onCreateClick={() => navigate('/ilan-olustur')}
      />

      {isLoading ? (
        <MyListingsSkeleton />
      ) : filteredListings.length === 0 ? (
        <EmptyStateList
          title={selectedStatus === 'all' ? 'Henüz ilan oluşturmamışsınız' : `${statusConfig[selectedStatus].label} ilan bulunamadı`}
          description={selectedStatus === 'all' 
            ? 'İlk ilanınızı oluşturarak takas yapmaya başlayın!'
            : 'Bu durumda ilan bulunmuyor. Farklı bir filtre deneyin.'
          }
          action={
            selectedStatus === 'all' && (
              <Button onClick={() => navigate('/ilan-olustur')} className="btn-primary">
                İlk İlanını Oluştur
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-5 2xl:gap-4">
          <AnimatePresence>
            {filteredListings.map((listing) => {
              const status = getListingStatus(listing);
              
              return (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  status={status}
                  onView={(id) => navigate(`/ilan/${id}`)}
                  onEdit={() => toast({ title: "🚧 Yakında!", description: "İlan düzenleme özelliği geliştirme aşamasında." })}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDeleteListing}
                  onMarkAsCompleted={handleMarkAsCompleted}
                  isDeleting={isDeleting}
                  getStatusBadge={getStatusBadge}
                  getPremiumBadges={getPremiumBadges}
                  onDopingClick={handleDopingClick}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <DopingModal
        isOpen={dopingModalOpen}
        onClose={() => setDopingModalOpen(false)}
        listing={selectedListingForDoping}
        onSuccess={handleDopingSuccess}
      />
    </motion.div>
  );
};

export default memo(MyListingsPage);