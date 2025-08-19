import React, { useState, useRef, useEffect, memo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, ListChecks, Clock as ClockIcon, XCircle, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores';
import { useListingDetail } from '@/hooks/useListingDetail.js';
import { getUrgencyColor, formatDate, getStatusColor } from '@/components/ListingDetailPage/utils.js';

import SuggestedListings from '@/components/SuggestedListings';
import PopularInCategory from '@/components/PopularInCategory';
import ListingImages from '@/components/ListingDetailPage/ListingImages';
import ListingInfo from '@/components/ListingDetailPage/ListingInfo';
import OwnerInfo from '@/components/ListingDetailPage/OwnerInfo';
import OfferCard from '@/components/ListingDetailPage/OfferCard';
import ListingActions from '@/components/ListingDetailPage/ListingActions';
import EditListingModal from '@/components/EditListingModal';
import UnpublishListingModal from '@/components/UnpublishListingModal';
import { updateListingStatus, deleteListing } from '@/services/listingService';
import { addToListingHistory } from '@/services/userActivityService';
import { trackEvent } from '@/services/analyticsService';
import SEOHead from '@/components/SEOHead';
import StructuredData from '@/components/StructuredData';

const ListingDetailPage = ({ setListings, onToggleFavorite }) => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuthStore();
  const { inventoryItems, isFetchingInventory } = useAuthStore();
  
  const {
    listing,
    offers,
    loading,
    isFavorited,
    updatingOfferId,
    handleUpdateOfferStatus,
    handleStartOrGoToConversation,
    handleToggleFavoriteClick,
    fetchListingDetails,
  } = useListingDetail(listingId, setListings);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const pageRef = useRef(null);

  useEffect(() => {
    if (listing) {
      trackEvent('view_listing', { listing_id: listing.id }, currentUser?.id);
      if (currentUser) {
        addToListingHistory(listing.id);
      }
      const images = [];
      if (listing.main_image_url) images.push(listing.main_image_url);
      if (listing.additional_image_urls) images.push(...listing.additional_image_urls);
      if (images.length === 0 && listing.image_url) images.push(listing.image_url);
      if (images.length === 0) images.push(`https://source.unsplash.com/random/800x600/?${listing.category?.split(' > ')[0].replace(/\s/g, '+') || 'product'}&sig=${listing.id}`);
      
      setAllImages(images.filter(Boolean));
      setCurrentImageIndex(0);
    }
  }, [listing, currentUser]);

  useEffect(() => {
    if (pageRef.current) {
        pageRef.current.scrollTo(0, 0);
    } else {
        window.scrollTo(0, 0);
    }
  }, [listingId]);

  const handleEditListing = () => setIsEditModalOpen(true);
  
  const handleUpdateSuccess = () => {
    setIsEditModalOpen(false);
    fetchListingDetails();
    toast({ title: "Başarılı!", description: "İlanınız başarıyla güncellendi." });
  };
  
  const handleUnpublishConfirm = async (status, reason) => {
    if (!listing || !currentUser) return;
    setIsProcessingAction(true);
    const updatedListing = await updateListingStatus(listing.id, currentUser.id, status, reason);
    setIsProcessingAction(false);
    setIsUnpublishModalOpen(false);

    if (updatedListing) {
      toast({ title: "Başarılı!", description: "İlanınız yayından kaldırıldı." });
      fetchListingDetails();
    }
  };

  const handleRepublishListing = async () => {
    if (!listing || !currentUser) return;
    setIsProcessingAction(true);
    await updateListingStatus(listing.id, currentUser.id, 'active');
    setIsProcessingAction(false);
    toast({ title: "Başarılı!", description: "İlanınız tekrar yayınlandı." });
    fetchListingDetails();
  };

  const handleDeleteListing = async () => {
    if (!listing || !currentUser) return;
    setIsProcessingAction(true);
    const success = await deleteListing(listing.id, currentUser.id);
    setIsProcessingAction(false);

    if (success) {
      toast({ title: "Başarılı!", description: "İlanınız kalıcı olarak silindi." });
      setListings(prev => prev.filter(l => l.id !== listing.id));
      navigate(`/profil/${currentUser.id}`);
    }
  };

  const handleViewOfferedItem = (item) => {
    toast({ title: "Ürün Detayı (Yakında)", description: `${item?.name || 'Ürün'} detay sayfası yakında eklenecektir.` });
  };

  const handleReportListingClick = () => {
    if (!currentUser) {
      navigate('/auth?action=login', { state: { from: location } });
      toast({ title: "Giriş Yapmalısınız", description: "İlanı şikayet etmek için lütfen giriş yapın.", variant: "info" });
      return;
    }
    if (listing && listing.id) {
      navigate(`/ilan-bildir/${listing.id}`);
    } else {
      toast({ title: "Hata", description: "Şikayet edilecek ilan bulunamadı.", variant: "destructive" });
    }
  };

  if (loading || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }
  
  const isOwner = currentUser && listing.user && currentUser.id === listing.user.id;

  const StatusBanner = () => {
    let bannerInfo = null;

    if (listing.status === 'in_transaction') {
      bannerInfo = {
        icon: ArrowLeftRight,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-400',
        title: 'Alışveriş Devam Ediyor',
        description: 'Bu ilan için bir teklif kabul edildi. Süreç tamamlandığında ilan otomatik olarak yayından kaldırılacaktır.'
      };
    } else if (isOwner) {
        switch (listing.status) {
          case 'pending_approval':
            bannerInfo = {
              icon: ClockIcon,
              bgColor: 'bg-yellow-500/10',
              textColor: 'text-yellow-400',
              title: 'İlanınız Onay Bekliyor',
              description: 'İlanınız ekibimiz tarafından inceleniyor. Kurallara uygun bulunması durumunda en kısa sürede yayına alınacaktır.'
            };
            break;
          case 'rejected':
            bannerInfo = {
              icon: XCircle,
              bgColor: 'bg-destructive/10',
              textColor: 'text-destructive',
              title: 'İlanınız Reddedildi',
              description: `Neden: ${listing.rejection_reason || 'Belirtilmemiş'}`
            };
            break;
        }
    }
    
    if (!bannerInfo) return null;

    const Icon = bannerInfo.icon;
    return (
      <div className={`p-4 rounded-lg mb-6 flex items-start gap-4 ${bannerInfo.bgColor}`}>
        <Icon className={`w-6 h-6 flex-shrink-0 mt-1 ${bannerInfo.textColor}`} />
        <div>
          <h3 className={`font-semibold ${bannerInfo.textColor}`}>{bannerInfo.title}</h3>
          <p className="text-sm text-muted-foreground">{bannerInfo.description}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      {listing && (
        <>
          <SEOHead 
            title={`${listing.title} - BenAlsam`}
            description={listing.description || `İhtiyacınız olan ${listing.title} için alım ilanı. Fiyat: ${listing.price} TL`}
            keywords={`${listing.title}, alım ilanı, ${listing.category}, ${listing.location}`}
            image={listing.main_image_url || listing.image_url || "/og-listing.jpg"}
            type="product"
            url={`https://benalsam.com/ilan/${listing.id}`}
          />
          <StructuredData 
            type="listing" 
            data={{
              title: listing.title,
              description: listing.description,
              image_url: listing.main_image_url || listing.image_url,
              price: listing.price,
              seller_name: listing.user?.name || "Satıcı"
            }}
          />
        </>
      )}
      <motion.div
        ref={pageRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto px-4 py-8"
      >
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-8 border-primary/50 text-primary hover:bg-primary/10 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> İlanlara Geri Dön
      </Button>

      <StatusBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="glass-effect rounded-2xl p-6 shadow-2xl">
            <ListingImages 
              images={allImages}
              title={listing.title}
              urgency={listing.urgency}
              currentImageIndex={currentImageIndex}
              setCurrentImageIndex={setCurrentImageIndex}
              getUrgencyColor={getUrgencyColor}
              isFavorited={isFavorited}
              onToggleFavorite={handleToggleFavoriteClick}
              showFavoriteButton={!!currentUser}
            />
            <ListingInfo listing={listing} formatDate={formatDate} />
            
            <div className="mt-6 pt-6 border-t border-border/50">
              <Button variant="link" onClick={handleReportListingClick} className="text-destructive hover:text-destructive/80 px-0">
                <AlertTriangle className="w-4 h-4 mr-2" /> İlan ile İlgili Şikayetim Var
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-8"
        >
          <OwnerInfo owner={listing.user} />
          <ListingActions 
            listing={listing}
            currentUser={currentUser}
            inventoryItems={inventoryItems}
            isFetchingInventory={isFetchingInventory}
            isFavorited={isFavorited}
            onToggleFavorite={handleToggleFavoriteClick}
            onStartConversation={handleStartOrGoToConversation}
          />
          
          <div className="glass-effect rounded-2xl p-6 shadow-xl">
            {isOwner ? (
              <>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <ListChecks className="w-6 h-6 mr-2 text-primary" /> Gelen Teklifler ({offers.length})
                </h2>
                {offers.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {offers.map(offer => (
                      <OfferCard 
                        key={offer.id}
                        offer={offer}
                        isOwner={isOwner}
                        isListingInTransaction={listing.status === 'in_transaction'}
                        currentUser={currentUser}
                        handleUpdateOfferStatus={handleUpdateOfferStatus}
                        handleStartOrGoToConversation={handleStartOrGoToConversation}
                        handleViewOfferedItem={handleViewOfferedItem}
                        getStatusColor={getStatusColor}
                        formatDate={formatDate}
                        updatingOfferId={updatingOfferId}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Bu ilana henüz teklif gelmemiş.</p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                <ListChecks className="w-6 h-6 mr-3 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold text-white">Gelen Teklif Sayısı</h2>
                  <p className="text-3xl font-bold text-primary mt-1">{listing.offers_count || 0}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      {listing && listing.status === 'active' && (
        <div className="mt-12">
          <SuggestedListings 
            currentListingId={listing.id} 
            category={listing.category} 
            onToggleFavorite={onToggleFavorite}
            currentUser={currentUser}
          />
          <PopularInCategory 
            currentListingId={listing.id} 
            category={listing.category} 
            sortBy="views_count" 
            title="Kategoride Çok Görüntülenenler"
            onToggleFavorite={onToggleFavorite}
            currentUser={currentUser}
          />
           <PopularInCategory 
            currentListingId={listing.id} 
            category={listing.category} 
            sortBy="offers_count" 
            title="Kategoride Çok Teklif Alanlar"
            onToggleFavorite={onToggleFavorite}
            currentUser={currentUser}
          />
        </div>
      )}

      {isOwner && (
        <>
          <EditListingModal
            listingId={listing.id}
            isOpen={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onSuccess={handleUpdateSuccess}
          />
          <UnpublishListingModal
            isOpen={isUnpublishModalOpen}
            onOpenChange={setIsUnpublishModalOpen}
            onConfirm={handleUnpublishConfirm}
            isProcessing={isProcessingAction}
          />
        </>
      )}
      </motion.div>
    </>
  );
};

export default memo(ListingDetailPage);