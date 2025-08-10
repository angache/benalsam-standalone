import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores';
import { fetchInventoryItems } from '@/services/inventoryService';
import { supabase } from '@/lib/supabaseClient';
import { 
  checkOfferLimit, 
  incrementUserUsage, 
  showPremiumUpgradeToast, 
  getUserActivePlan,
  addOfferAttachment
} from '@/services/premiumService';
import PremiumModal from '@/components/PremiumModal.jsx';
import MakeOfferForm from './MakeOfferPage/MakeOfferForm.jsx';
import PlanInfoCard from './MakeOfferPage/PlanInfoCard.jsx';

const MakeOfferPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: loadingAuth, initialized } = useAuthStore();
  
  // Debug logs for authentication state
  console.log('🔍 [MakeOfferPage] Component rendered with:', {
    listingId,
    currentUser: currentUser ? { id: currentUser.id, email: currentUser.email, name: currentUser.name } : null,
    loadingAuth,
    initialized,
    hasUser: !!currentUser,
    userType: typeof currentUser
  });

  const [listing, setListing] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingListing, setLoadingListing] = useState(false);
  const [isFetchingInventory, setIsFetchingInventory] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [userPlan, setUserPlan] = useState(null);

  // Debug effect for auth state changes
  useEffect(() => {
    console.log('🔍 [MakeOfferPage] Auth state changed:', {
      currentUser: currentUser ? { id: currentUser.id, email: currentUser.email } : null,
      loadingAuth,
      initialized,
      timestamp: new Date().toISOString()
    });
  }, [currentUser, loadingAuth, initialized]);

  useEffect(() => {
    console.log('🔍 [MakeOfferPage] Fetch data effect triggered:', {
      hasUser: !!currentUser,
      userId: currentUser?.id,
      listingId,
      loadingAuth,
      initialized
    });

    // Kullanıcı yoksa loading'i durdur
    if (!currentUser) {
      console.log('🔍 [MakeOfferPage] No currentUser, stopping loading');
      setLoadingListing(false);
      return;
    }
    
    const fetchData = async () => {
      console.log('🔍 [MakeOfferPage] Starting to fetch listing data:', { listingId, userId: currentUser.id });
      setLoadingListing(true);
      
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, description, budget, user_id, status')
        .eq('id', listingId)
        .single();

      console.log('🔍 [MakeOfferPage] Listing fetch result:', { data, error, hasData: !!data });

      if (error || !data) {
        console.error('🔍 [MakeOfferPage] Listing fetch error:', error);
        toast({ title: "İlan Bulunamadı", description: "Teklif yapılacak ilan bulunamadı.", variant: "destructive" });
        navigate(-1);
        return;
      }
      
      console.log('🔍 [MakeOfferPage] Listing data:', { 
        listingId: data.id, 
        title: data.title, 
        userId: data.user_id, 
        currentUserId: currentUser.id,
        isOwnListing: data.user_id === currentUser.id 
      });

      if (data.user_id === currentUser.id) {
        console.log('🔍 [MakeOfferPage] User trying to offer on own listing');
        toast({ title: "Kendi İlanınız", description: "Kendi ilanınıza teklif yapamazsınız.", variant: "info" });
        navigate(-1);
        return;
      }

      if (data.status === 'in_transaction' || data.status === 'sold') {
        console.log('🔍 [MakeOfferPage] Listing not available for offers:', { status: data.status });
        toast({ title: "Teklif Yapılamaz", description: "Bu ilan için bir teklif kabul edilmiş veya ilan satılmış.", variant: "info" });
        navigate(`/ilan/${listingId}`);
        return;
      }
      
      setListing(data);
      console.log('🔍 [MakeOfferPage] Listing set successfully');
      
      const plan = await getUserActivePlan(currentUser.id);
      console.log('🔍 [MakeOfferPage] User plan:', plan);
      setUserPlan(plan);
      
      setLoadingListing(false);
    };

    fetchData();
  }, [currentUser?.id, listingId]);

  // Envanter yükleme
  useEffect(() => {
    console.log('🔍 [MakeOfferPage] Inventory fetch effect triggered:', {
      hasUser: !!currentUser,
      userId: currentUser?.id
    });

    if (!currentUser) {
      console.log('🔍 [MakeOfferPage] No currentUser for inventory fetch');
      return;
    }
    
    const fetchInventory = async () => {
      console.log('🔍 [MakeOfferPage] Starting inventory fetch for user:', currentUser.id);
      setIsFetchingInventory(true);
      try {
        const data = await fetchInventoryItems(currentUser.id);
        console.log('🔍 [MakeOfferPage] Inventory data loaded:', { 
          itemCount: data?.length || 0, 
          data: data 
        });
        setInventoryItems(data || []);
      } catch (error) {
        console.error('🔍 [MakeOfferPage] Inventory yükleme hatası:', error);
        setInventoryItems([]);
      } finally {
        setIsFetchingInventory(false);
      }
    };

    fetchInventory();
  }, [currentUser?.id]);

  const handleOfferSubmit = useCallback(async (offerData) => {
    console.log('🔍 [MakeOfferPage] Offer submit triggered:', {
      hasUser: !!currentUser,
      userId: currentUser?.id,
      offerData: {
        selectedItemId: offerData.selectedItemId,
        hasMessage: !!offerData.message,
        attachmentCount: offerData.attachments?.length || 0
      }
    });

    if (!currentUser) {
      console.log('🔍 [MakeOfferPage] No currentUser in offer submit');
      toast({ title: "Giriş Gerekli", description: "Teklif yapmak için giriş yapmalısınız.", variant: "destructive" });
      return;
    }

    const canMakeOffer = await checkOfferLimit(currentUser.id);
    console.log('🔍 [MakeOfferPage] Offer limit check:', { canMakeOffer, userId: currentUser.id });
    
    if (!canMakeOffer) {
      console.log('🔍 [MakeOfferPage] Offer limit exceeded, showing premium modal');
      showPremiumUpgradeToast('offer', 0, userPlan?.limits?.offers_per_month || 10);
      setIsPremiumModalOpen(true);
      return;
    }

    setIsSubmittingOffer(true);
    try {
      console.log('🔍 [MakeOfferPage] Submitting offer to database:', {
        listingId: listing.id,
        offeringUserId: currentUser.id,
        offeredItemId: offerData.selectedItemId
      });

      const { data, error } = await supabase
        .from('offers')
        .insert([{
          listing_id: listing.id,
          offering_user_id: currentUser.id,
          offered_item_id: offerData.selectedItemId,
          message: offerData.message,
          status: 'pending'
        }])
        .select()
        .single();

      console.log('🔍 [MakeOfferPage] Offer insert result:', { data, error });

      if (error) {
        console.error('🔍 [MakeOfferPage] Offer insert error:', error);
        toast({ title: "Teklif Gönderilemedi", description: error.message, variant: "destructive" });
        return;
      }

      if (offerData.attachments && offerData.attachments.length > 0) {
        console.log('🔍 [MakeOfferPage] Adding attachments:', { count: offerData.attachments.length });
        for (const file of offerData.attachments) {
          await addOfferAttachment(data.id, file);
        }
      }
      
      await incrementUserUsage(currentUser.id, 'offer');
      console.log('🔍 [MakeOfferPage] Offer submitted successfully');
      toast({ title: "Başarılı!", description: "Teklifiniz başarıyla gönderildi." });
      navigate(`/ilan/${listing.id}`);
    } catch (error) {
      console.error('🔍 [MakeOfferPage] Teklif gönderme hatası:', error);
      toast({ title: "Hata", description: "Teklif gönderilirken bir sorun oluştu.", variant: "destructive" });
    } finally {
      setIsSubmittingOffer(false);
    }
  }, [currentUser?.id, userPlan, listing]);

  const isLoading = useMemo(() => {
    const loading = loadingListing || isFetchingInventory || !listing;
    console.log('🔍 [MakeOfferPage] Loading state:', { 
      loadingListing, 
      isFetchingInventory, 
      hasListing: !!listing, 
      isLoading: loading 
    });
    return loading;
  }, [loadingListing, isFetchingInventory, listing]);

  const loadingText = useMemo(() => {
    if (loadingListing) return 'İlan yükleniyor...';
    if (isFetchingInventory) return 'Envanter yükleniyor...';
    return 'Yükleniyor...';
  }, [loadingListing, isFetchingInventory]);

  // Debug render info
  console.log('🔍 [MakeOfferPage] Render state:', {
    isLoading,
    hasListing: !!listing,
    hasUser: !!currentUser,
    inventoryCount: inventoryItems.length,
    isSubmittingOffer
  });

  if (isLoading) {
    console.log('🔍 [MakeOfferPage] Showing loading state:', { loadingText });
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{loadingText}</p>
        </div>
      </div>
    );
  }

  console.log('🔍 [MakeOfferPage] Rendering main content');
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-2xl mx-auto px-4 py-12"
      >
        <div className="flex items-center mb-8">
           <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 text-muted-foreground hover:text-foreground" disabled={isSubmittingOffer}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-gradient truncate">Teklif Yap: {listing.title}</h1>
        </div>

        <PlanInfoCard userPlan={userPlan} />
        
        <MakeOfferForm
          listing={listing}
          inventoryItems={inventoryItems}
          userPlan={userPlan}
          currentUser={currentUser}
          onSubmit={handleOfferSubmit}
          isSubmitting={isSubmittingOffer}
          onOpenPremiumModal={() => setIsPremiumModalOpen(true)}
        />
      </motion.div>

      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onOpenChange={setIsPremiumModalOpen}
        feature="offer"
      />
    </>
  );
};

export default MakeOfferPage;