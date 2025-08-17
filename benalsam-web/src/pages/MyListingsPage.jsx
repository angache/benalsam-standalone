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
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <MyListingsHeader
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        statusConfig={statusConfig}
        onCreateClick={() => navigate('/ilan-olustur')}
      />

      {isLoading ? (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">İlanlarınız yükleniyor...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <EmptyState
          selectedStatus={selectedStatus}
          statusConfig={statusConfig}
          onCreateClick={() => navigate('/ilan-olustur')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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