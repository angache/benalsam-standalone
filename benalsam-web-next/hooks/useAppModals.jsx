import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

export const useAppModals = (currentUser, openAuthModal, inventoryItems) => {
  const router = useRouter();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMakeOfferModalOpen, setIsMakeOfferModalOpen] = useState(false);
  const [isReportListingModalOpen, setIsReportListingModalOpen] = useState(false);
  const [isLeaveReviewModalOpen, setIsLeaveReviewModalOpen] = useState(false);
  
  const [selectedListingForOffer, setSelectedListingForOffer] = useState(null);
  const [listingToReport, setListingToReport] = useState(null);
  const [offerToReview, setOfferToReview] = useState(null);

  const handleOpenCreateModal = useCallback(() => {
    if (!currentUser) {
      toast({ title: "Giriş Yapmalısınız!", description: "İlan oluşturmak için lütfen giriş yapın veya kayıt olun.", variant: "destructive" });
      openAuthModal('register');
      return;
    }
    setIsCreateModalOpen(true);
  }, [currentUser, openAuthModal]);

  const handleCloseCreateModal = useCallback(() => setIsCreateModalOpen(false), []);

  const handleOpenMakeOfferModal = useCallback((listing) => {
    if (!currentUser) {
      toast({ title: "Giriş Gerekli", description: "Teklif yapmak için giriş yapmalısınız.", variant: "destructive" });
      openAuthModal('login');
      return;
    }
    if (listing && listing.user_id === currentUser.id) {
      toast({ title: "Kendi İlanınız", description: "Kendi ilanınıza teklif yapamazsınız.", variant: "info" });
      return;
    }
    if (inventoryItems.length === 0) {
      toast({ 
        title: "Envanter Boş!", 
        description: "Teklif yapabilmek için önce envanterinize ürün eklemelisiniz.", 
        variant: "destructive",
        action: (<Button onClick={() => router.push('/envanterim')} variant="outline" size="sm">Envantere Git</Button>)
      });
      return;
    }
    setSelectedListingForOffer(listing);
    setIsMakeOfferModalOpen(true);
  }, [currentUser, openAuthModal, inventoryItems, router]);

  const handleCloseMakeOfferModal = useCallback(() => {
    setIsMakeOfferModalOpen(false);
    setSelectedListingForOffer(null);
  }, []);

  const handleOpenReportListingModal = useCallback((listing) => {
    if (!currentUser) {
      toast({ title: "Giriş Gerekli", description: "İlanı şikayet etmek için giriş yapmalısınız.", variant: "destructive" });
      openAuthModal('login');
      return;
    }
    setListingToReport(listing);
    setIsReportListingModalOpen(true);
  }, [currentUser, openAuthModal]);

  const handleCloseReportListingModal = useCallback(() => {
    setIsReportListingModalOpen(false);
    setListingToReport(null);
  }, []);
  
  const handleOpenLeaveReviewModal = useCallback(async (offer, canUserReviewService) => {
     if (!currentUser) {
      toast({ title: "Giriş Gerekli", description: "Yorum yapmak için giriş yapmalısınız.", variant: "destructive" });
      openAuthModal('login');
      return;
    }
    if (!offer || offer.status !== 'accepted') {
      toast({ title: "Yorum Yapılamaz", description: "Sadece kabul edilmiş takaslar için yorum yapabilirsiniz.", variant: "info" });
      return;
    }
    const canReview = await canUserReviewService(currentUser.id, offer.id);
    if (!canReview) {
      toast({ title: "Yorum Yapılamaz", description: "Bu takas için daha önce yorum yapmışsınız veya yorum yapma yetkiniz yok.", variant: "info" });
      return;
    }
    setOfferToReview(offer);
    setIsLeaveReviewModalOpen(true);
  }, [currentUser, openAuthModal]);

  const handleCloseLeaveReviewModal = useCallback(() => {
    setIsLeaveReviewModalOpen(false);
    setOfferToReview(null);
  }, []);


  return {
    isCreateModalOpen, handleOpenCreateModal, handleCloseCreateModal,
    isMakeOfferModalOpen, handleOpenMakeOfferModal, handleCloseMakeOfferModal, selectedListingForOffer,
    isReportListingModalOpen, handleOpenReportListingModal, handleCloseReportListingModal, listingToReport,
    isLeaveReviewModalOpen, handleOpenLeaveReviewModal, handleCloseLeaveReviewModal, offerToReview,
  };
};