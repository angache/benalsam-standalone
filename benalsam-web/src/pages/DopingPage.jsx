import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { dopingOptions } from '@/config/dopingOptions.js';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores';

const DopingPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [listing, setListing] = useState(null);
  const [selectedDopings, setSelectedDopings] = useState({});
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);

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
        toast({ title: "İlan Bulunamadı", description: "Doping yapılacak ilan bulunamadı.", variant: "destructive" });
        navigate(-1);
        return;
      }

      setListing(data);
      
      const initialDopings = {};
      dopingOptions.forEach(option => {
        if (data[option.db_field]) {
          const defaultPrice = option.prices[0];
          initialDopings[option.id] = {
            ...option,
            selectedPrice: defaultPrice,
          };
        }
      });
      setSelectedDopings(initialDopings);
      setLoading(false);
    };

    fetchListing();
  }, [currentUser, listingId, navigate]);

  const handleCheckboxChange = (checked, option) => {
    setSelectedDopings(prev => {
      const newDopings = { ...prev };
      if (checked) {
        newDopings[option.id] = {
          ...option,
          selectedPrice: option.prices[0],
        };
      } else {
        delete newDopings[option.id];
      }
      return newDopings;
    });
  };

  const handlePriceChange = (optionId, priceValue) => {
    const [duration, price] = priceValue.split('-').map(Number);
    setSelectedDopings(prev => {
      const newDopings = { ...prev };
      const option = newDopings[optionId];
      if (option) {
        const selectedPrice = option.prices.find(p => p.duration === duration && p.price === price);
        option.selectedPrice = selectedPrice;
      }
      return newDopings;
    });
  };

  const totalPrice = useMemo(() => {
    return Object.values(selectedDopings).reduce((total, option) => {
      return total + (option.selectedPrice?.price || 0);
    }, 0);
  }, [selectedDopings]);

  const handlePurchase = async () => {
    if (!listing || isPurchasing) return;
    setIsPurchasing(true);

    const updatePayload = {};
    const now = new Date();

    Object.values(selectedDopings).forEach(doping => {
      updatePayload[doping.db_field] = true;
      const duration = doping.selectedPrice.duration;

      if (duration > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(now.getDate() + duration);
        
        if (doping.id === 'showcase') updatePayload.showcase_expires_at = expiresAt.toISOString();
        if (doping.id === 'urgent') updatePayload.urgent_expires_at = expiresAt.toISOString();
        if (doping.id === 'featured') updatePayload.featured_expires_at = expiresAt.toISOString();
      }
      
      if (doping.id === 'up_to_date') {
        updatePayload.upped_at = now.toISOString();
      }
    });

    try {
      const { error } = await supabase
        .from('listings')
        .update(updatePayload)
        .eq('id', listing.id);

      if (error) throw error;

      toast({ title: "Doping Başarılı!", description: "İlanınız için seçilen dopingler aktif edildi." });
      navigate('/ilanlarim');
    } catch (error) {
      console.error("Doping purchase error:", error);
      toast({ title: "Hata", description: "Doping güncellenirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsPurchasing(false);
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
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
    >
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold text-gradient">İlan için Doping Seçenekleri</h1>
      </div>

      <div className="glass-effect rounded-2xl p-6">
        <p className="text-muted-foreground mb-6">
          "{listing.title}" ilanınızı öne çıkarmak için aşağıdaki dopinglerden bir veya daha fazlasını seçin.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <AnimatePresence>
            {dopingOptions.map((option) => {
              const isSelected = !!selectedDopings[option.id];
              const Icon = option.icon;
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`rounded-lg border p-4 transition-all h-full ${isSelected ? 'border-primary ring-2 ring-primary/50 bg-primary/5' : 'bg-card'}`}>
                    <div className="flex items-start gap-4">
                      <Checkbox
                        id={option.id}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleCheckboxChange(checked, option)}
                        className="mt-1 h-5 w-5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <label htmlFor={option.id} className="font-semibold text-lg text-foreground cursor-pointer">{option.title}</label>
                            {listing[option.db_field] && <Badge variant="secondary" className="ml-2">Aktif</Badge>}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                        
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <Select
                              value={`${selectedDopings[option.id].selectedPrice.duration}-${selectedDopings[option.id].selectedPrice.price}`}
                              onValueChange={(value) => handlePriceChange(option.id, value)}
                            >
                              <SelectTrigger className="bg-input border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {option.prices.map((p, index) => (
                                  <SelectItem key={index} value={`${p.duration}-${p.price}`}>
                                    <div className="flex justify-between w-full">
                                      <span>{p.label}</span>
                                      <span className="font-bold text-primary">{p.price} TL</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-border/50">
          <div>
            <span className="text-muted-foreground">Toplam Tutar:</span>
            <span className="text-2xl font-bold text-primary ml-2">{totalPrice} TL</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>İptal</Button>
            <Button onClick={handlePurchase} className="btn-primary" disabled={totalPrice === 0 || isPurchasing}>
              {isPurchasing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="w-5 h-5 mr-2" />
              )}
              {isPurchasing ? 'İşleniyor...' : 'Satın Al'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DopingPage;