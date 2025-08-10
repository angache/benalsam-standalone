import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Send } from 'lucide-react';
import { Button } from "@/components/ui/button.jsx"; 
import { Label } from "@/components/ui/label.jsx"; 
import { Textarea } from "@/components/ui/textarea.jsx"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx"; 
import { createListingReport } from '@/services/reportService';
import { useToast } from '@/components/ui/use-toast.js'; 
import { useAuthStore } from '@/stores';
import { supabase } from '@/lib/supabaseClient';
const reportReasons = [
  "Yasaklı ürün veya hizmet",
  "Yanlış veya yanıltıcı kategori",
  "Aldatıcı veya eksik bilgi",
  "Spam veya alakasız içerik",
  "Telif hakkı ihlali",
  "Dolandırıcılık şüphesi",
  "BenAlsam politikalarına aykırı",
  "Diğer"
];

const ReportListingPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { toast } = useToast();

  const [listingTitle, setListingTitle] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingListing, setLoadingListing] = useState(true);

  useEffect(() => {
    if (!currentUser || !listingId) {
      return;
    }

    const fetchListingTitle = async () => {
      setLoadingListing(true);
      const { data, error } = await supabase
        .from('listings')
        .select('title')
        .eq('id', listingId)
        .single();
      
      if (error || !data) {
        toast({ title: "İlan Bulunamadı", description: "Şikayet edilecek ilan bulunamadı.", variant: "destructive" });
        navigate(-1);
        return;
      }
      setListingTitle(data.title);
      setLoadingListing(false);
    };

    fetchListingTitle();
  }, [currentUser, listingId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      toast({ title: "Şikayet Nedeni Seçilmedi", description: "Lütfen bir şikayet nedeni seçin.", variant: "destructive" });
      return;
    }
    if (reason === "Diğer" && !details.trim()) {
      toast({ title: "Detay Gerekli", description: "Lütfen 'Diğer' seçeneği için şikayet detayını belirtin.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const reportData = {
      reporter_id: currentUser.id,
      listing_id: listingId,
      reason: reason,
      details: details.trim(),
    };

    const result = await createListingReport(reportData);
    setIsSubmitting(false);

    if (result) {
      navigate(`/ilan/${listingId}`);
    }
  };
  
  if (loadingListing) {
    return (
     <div className="min-h-screen flex items-center justify-center bg-background">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
     </div>
   );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto px-4 py-12"
    >
      <div className="flex items-center mb-8">
         <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 text-muted-foreground hover:text-foreground" disabled={isSubmitting}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center">
           <AlertTriangle className="w-7 h-7 mr-3 text-destructive" />
          <h1 className="text-2xl font-bold text-gradient truncate">İlanı Şikayet Et: {listingTitle}</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 p-6 glass-effect rounded-2xl">
        <p className="text-sm text-muted-foreground">
            Bu ilanın BenAlsam politikalarına aykırı olduğunu düşünüyorsanız, lütfen aşağıdaki formu doldurun.
        </p>
        <fieldset disabled={isSubmitting}>
            <div className="grid gap-2">
                <Label htmlFor="reason" className="font-medium">Şikayet Nedeni *</Label>
                <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason" className="w-full bg-input border-border">
                    <SelectValue placeholder="Bir neden seçin..." />
                </SelectTrigger>
                <SelectContent className="dropdown-content">
                    {reportReasons.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="details" className="font-medium">Detaylar (İsteğe Bağlı)</Label>
                <Textarea
                id="details"
                placeholder="Şikayetinizle ilgili ek bilgi verin..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="min-h-[120px] bg-input border-border"
                />
            </div>
        </fieldset>
        <div className="flex gap-4 pt-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting} className="flex-1 border-muted-foreground/50 text-muted-foreground hover:bg-muted-foreground/10">İptal</Button>
          <Button type="submit" disabled={isSubmitting || !reason || (reason === "Diğer" && !details.trim())} className="flex-1 btn-primary text-primary-foreground">
            {isSubmitting ? (
              <Send className="w-4 h-4 mr-2 animate-pulse" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Şikayeti Gönder
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default ReportListingPage;