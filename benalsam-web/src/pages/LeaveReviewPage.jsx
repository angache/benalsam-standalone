import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Send, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button.jsx"; 
import { Label } from "@/components/ui/label.jsx"; 
import { Textarea } from "@/components/ui/textarea.jsx"; 
import { createReview, canUserReview } from '@/services/reviewService';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast.js'; 
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';

const LeaveReviewPage = () => {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { toast } = useToast();

  const [offer, setOffer] = useState(null);
  const [loadingOffer, setLoadingOffer] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser || !offerId) {
      return;
    }

    const loadOfferAndCheckReviewability = async () => {
      setLoadingOffer(true);
      
      try {
        const { data: fetchedOffer, error } = await supabase
          .from('offers')
          .select(`
            listing_id,
            listings!offers_listing_id_fkey(user_id),
            offering_user_id,
            status
          `)
          .eq('id', offerId)
          .single();

        if (error || !fetchedOffer) {
          console.error('Error fetching offer for review check or offer not found:', error);
          toast({ title: "Teklif Bulunamadı", description: "Değerlendirilecek teklif bulunamadı.", variant: "destructive" });
          navigate(-1);
          return;
        }

        if (fetchedOffer.status !== 'accepted') {
          toast({ title: "Yorum Yapılamaz", description: "Sadece kabul edilmiş takaslar için yorum yapabilirsiniz.", variant: "info" });
          navigate(-1);
          return;
        }

        const canReview = await canUserReview(currentUser.id, offerId);
        if (!canReview) {
          toast({ title: "Yorum Yapılamaz", description: "Bu takas için daha önce yorum yapmışsınız veya yorum yapma yetkiniz yok.", variant: "info" });
          navigate(-1);
          return;
        }

        const { data: fullOffer, error: fullOfferError } = await supabase
          .from('offers')
          .select(`
            *,
            profiles:offering_user_id(id, name, avatar_url, rating, total_ratings),
            listings!offers_listing_id_fkey(
              id,
              title,
              main_image_url,
              image_url,
              budget,
              status,
              user_id,
              profiles:user_id(id, name, avatar_url, rating, total_ratings)
            )
          `)
          .eq('id', offerId)
          .single();

        if (fullOfferError || !fullOffer) {
          console.error('Error fetching full offer details:', fullOfferError);
          toast({ title: "Teklif Detayları Alınamadı", description: "Teklif bilgileri yüklenirken bir hata oluştu.", variant: "destructive" });
          navigate(-1);
          return;
        }

        setOffer(fullOffer);
        setLoadingOffer(false);
      } catch (error) {
        console.error('Error in loadOfferAndCheckReviewability:', error);
        toast({ title: "Beklenmedik Hata", description: "Teklif bilgileri yüklenirken bir sorun oluştu.", variant: "destructive" });
        navigate(-1);
      }
    };

    loadOfferAndCheckReviewability();

  }, [currentUser, offerId, navigate, toast]);

  if (!offer && !loadingOffer) {
     toast({ title: "Hata", description: "Yorum yapılacak teklif bilgisi alınamadı.", variant: "destructive" });
     navigate(-1);
     return null;
  }
  
  const reviewee = offer?.offering_user_id === currentUser?.id ? offer?.listings?.profiles : offer?.profiles;
  const revieweeId = reviewee?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: "Puan Gerekli", description: "Lütfen 1-5 arası bir puan verin.", variant: "destructive" });
      return;
    }
    if (!revieweeId) {
      toast({ title: "Hata", description: "Yorum yapılacak kullanıcı bulunamadı.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const reviewData = {
      reviewer_id: currentUser.id,
      reviewee_id: revieweeId,
      offer_id: offer.id,
      rating: rating,
      comment: comment.trim(),
    };

    const result = await createReview(reviewData);
    setIsSubmitting(false);

    if (result) {
      toast({ title: "Yorum Gönderildi!", description: `${reviewee.name} için yorumunuz kaydedildi.`});
      navigate(offer.offering_user_id === currentUser.id ? '/aldigim-teklifler' : '/gonderdigim-teklifler');
    }
  };
  
  if (loadingOffer) {
    return (
     <div className="min-h-screen flex items-center justify-center bg-background">
       <Loader2 className="w-12 h-12 animate-spin text-primary" />
     </div>
   );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-12"
    >
      <div className="flex items-center mb-8">
         <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 text-muted-foreground hover:text-foreground" disabled={isSubmitting}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold text-gradient truncate">
          Değerlendirme Yap: <span className="text-primary">{reviewee?.name || 'Kullanıcı'}</span>
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 p-6 glass-effect rounded-2xl">
        <p className="text-sm text-muted-foreground">
            Bu takas deneyiminizi değerlendirin. Yorumunuz diğer kullanıcılar için faydalı olacaktır.
            İlgili ilan: "{offer?.listings?.title || 'İlan Adı Yok'}"
        </p>
        <fieldset disabled={isSubmitting}>
            <div>
                <Label htmlFor="rating" className="mb-2 block text-sm font-medium">Puanınız *</Label>
                <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                    key={star}
                    className={cn(
                        "w-8 h-8 cursor-pointer transition-colors",
                        (hoverRating || rating) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-400 hover:text-yellow-300"
                    )}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    />
                ))}
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="comment" className="font-medium">Yorumunuz (İsteğe Bağlı)</Label>
                <Textarea
                id="comment"
                placeholder={`${reviewee?.name || 'Kullanıcı'} ile takas deneyiminiz nasıldı?`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[120px] bg-input border-border"
                />
            </div>
        </fieldset>
        <div className="flex gap-4 pt-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting} className="flex-1 border-muted-foreground/50 text-muted-foreground hover:bg-muted-foreground/10">İptal</Button>
          <Button type="submit" disabled={isSubmitting || rating === 0} className="flex-1 btn-primary text-primary-foreground">
            {isSubmitting ? (
              <Send className="w-4 h-4 mr-2 animate-pulse" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Değerlendirmeyi Gönder
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default LeaveReviewPage;