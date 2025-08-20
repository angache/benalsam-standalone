import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores';

const UnpublishListingPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [listing, setListing] = useState(null);
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const reasons = [
    { value: 'Sattım', label: 'Ürünü sattım' },
    { value: 'Vazgeçtim', label: 'Satmaktan vazgeçtim' },
    { value: 'Diğer', label: 'Diğer' },
  ];

  useEffect(() => {
    if (!currentUser || !listingId) return;

    const fetchListing = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .eq('user_id', currentUser.id)
        .single();

      if (error || !data) {
        toast({ title: "İlan Bulunamadı", description: "Kaldırılacak ilan bulunamadı.", variant: "destructive" });
        navigate(-1);
        return;
      }

      setListing(data);
      setLoading(false);
    };

    fetchListing();
  }, [currentUser, listingId, navigate]);

  const handleConfirm = async () => {
    const finalReason = reason === 'Diğer' ? otherReason.trim() : reason;
    if (!finalReason) return;
    
    const status = reason === 'Sattım' ? 'sold' : 'inactive';
    
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: status,
          unpublish_reason: finalReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId);

      if (error) throw error;

      toast({ 
        title: "İlan Yayından Kaldırıldı", 
        description: `İlanınız "${finalReason}" nedeniyle yayından kaldırıldı.` 
      });
      navigate('/ilanlarim');
    } catch (error) {
      console.error('Error unpublishing listing:', error);
      toast({ 
        title: "Hata", 
        description: "İlan kaldırılırken bir sorun oluştu.", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
        <span>İlan bilgileri yükleniyor...</span>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-12"
    >
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center">
          <AlertTriangle className="w-7 h-7 mr-3 text-destructive" />
          <h1 className="text-2xl font-bold text-gradient">İlanı Yayından Kaldır</h1>
        </div>
      </div>

      <div className="glass-effect rounded-2xl p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-foreground mb-2">İlan: {listing.title}</h3>
          <p className="text-muted-foreground text-sm">
            İlanınızı neden yayından kaldırdığınızı belirtin. Bu bilgi, deneyiminizi iyileştirmemize yardımcı olur.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reason" className="text-sm font-medium">
              Neden
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Bir neden seçin..." />
              </SelectTrigger>
              <SelectContent>
                {reasons.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          {reason === 'Diğer' && (
            <div>
              <Label htmlFor="other-reason" className="text-sm font-medium">
                Detay
              </Label>
              <Textarea
                id="other-reason"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                className="bg-input border-border"
                placeholder="Lütfen nedeninizi belirtin..."
              />
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-3">
          <Button variant="outline" onClick={() => navigate(-1)} disabled={isProcessing} className="flex-1">
            İptal
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!reason || (reason === 'Diğer' && !otherReason.trim()) || isProcessing}
            className="flex-1 bg-destructive hover:bg-destructive/90"
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'İşleniyor...' : 'Onayla ve Kaldır'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default UnpublishListingPage;