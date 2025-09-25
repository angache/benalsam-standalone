import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Repeat, Phone, ShieldCheck, CopyCheck, Tag, Text, DollarSign, MapPin, FileImage as ImageIcon, Crown, Zap, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import FormField from '../FormField';
import { Checkbox } from '@/components/ui/checkbox';
import PremiumFeaturesSelector from '@/components/CreateListingPage/PremiumFeaturesSelector';
import { Settings } from 'lucide-react';

const durationOptions = [
  { value: '7', label: '7 Gün' },
  { value: '15', label: '15 Gün' },
  { value: '30', label: '30 Gün' },
  { value: '60', label: '60 Gün' },
];

const contactOptions = [
    { value: 'site_message', label: 'Sadece Site Üzerinden Mesaj' },
    { value: 'phone', label: 'Telefon ve Mesaj' },
];

const urgencyOptions = [
  { 
    value: 'Acil Değil', 
    label: 'Acil Değil', 
    price: null, 
    description: 'Standart görünüm' 
  },
  { 
    value: 'Normal', 
    label: 'Normal', 
    price: null, 
    description: 'Standart görünüm' 
  },
  { 
    value: 'Acil', 
    label: 'Acil', 
    price: '₺10', 
    description: 'Kırmızı "ACİL" etiketi ile öne çıkar (3 gün)' 
  }
];

const ReviewItem = ({ icon: Icon, label, value, isImage = false, children }) => (
  <div className="flex items-start py-3">
    <Icon className="w-5 h-5 mr-4 text-muted-foreground mt-1 shrink-0" />
    <div className="flex-grow">
      <p className="text-sm text-muted-foreground">{label}</p>
      {children ? children : <p className={cn("font-semibold", !value && "text-muted-foreground/70")}>{value || "Belirtilmedi"}</p>}
    </div>
  </div>
);

const Step6_Review = ({ 
  formData, 
  handleInputChange,
  handlePremiumFeatureChange,
  selectedCategoryPath,
  selectedLocationPath,
  onOpenRulesModal,
  errors
}) => {
  const selectedUrgencyOption = urgencyOptions.find(option => option.value === formData.urgency);
  const urgencyCost = selectedUrgencyOption?.price ? parseInt(selectedUrgencyOption.price.replace('₺', '')) : 0;

  // Premium özellikler maliyeti hesaplama
  const premiumFeatures = [
    { id: 'is_featured', price: 15 },
    { id: 'is_urgent_premium', price: 10 },
    { id: 'is_showcase', price: 25 }
  ];

  const premiumCost = premiumFeatures.reduce((total, feature) => {
    if (formData.premiumFeatures?.[feature.id]) {
      return total + feature.price;
    }
    return total;
  }, 0);

  const totalCost = urgencyCost + premiumCost;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -50 }} 
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">Önizleme ve Onay</h2>
      <p className="text-center text-muted-foreground">Lütfen bilgileri kontrol edin ve ilanınızı onaya gönderin.</p>
      
      <div className="p-4 space-y-2 rounded-lg glass-effect divide-y divide-border">
          <ReviewItem icon={Tag} label="İlan Başlığı" value={formData.title} />
          <ReviewItem icon={Text} label="Kategori" value={selectedCategoryPath} />
          <ReviewItem icon={Text} label="Açıklama" value={formData.description} />
          <ReviewItem icon={DollarSign} label="Bütçe" value={`${formData.budget} ₺`} />
          <ReviewItem icon={MapPin} label="Konum" value={selectedLocationPath} />
          <ReviewItem icon={ShieldCheck} label="Kabul Ettiğim Durumlar">
            <div className="flex flex-wrap gap-2 mt-1">
              {(!formData.condition || formData.condition.length === 0 || (formData.condition.length === 1 && formData.condition[0] === 'any')) ? (
                <Badge className="bg-primary/10 text-primary border border-primary/20">Fark Etmez</Badge>
              ) : (
                formData.condition.filter(c => c !== 'any').map((c) => (
                  <Badge key={c} className="bg-primary/10 text-primary border border-primary/20">{c}</Badge>
                ))
              )}
            </div>
          </ReviewItem>
          <ReviewItem icon={Settings} label="Seçili Özellikler">
            <div className="flex flex-wrap gap-2 mt-1">
              {formData.attributes && Object.keys(formData.attributes).length > 0 ? (
                Object.entries(formData.attributes).flatMap(([k, vals]) => {
                  const arr = Array.isArray(vals) ? vals : [vals];
                  return arr.map((v, idx) => (
                    <Badge key={`${k}-${idx}`} className="bg-primary/10 text-primary border border-primary/20">{k}: {v}</Badge>
                  ));
                })
              ) : (
                <span className="text-sm text-muted-foreground">Seçili özellik yok</span>
              )}
            </div>
          </ReviewItem>
          <ReviewItem icon={Clock} label="Aciliyet">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{formData.urgency}</span>
              {selectedUrgencyOption?.price && (
                <Badge className="bg-red-600 text-white text-xs">
                  {selectedUrgencyOption.price}
                </Badge>
              )}
            </div>
            {selectedUrgencyOption?.price && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedUrgencyOption.description}
              </p>
            )}
          </ReviewItem>
          <ReviewItem icon={ImageIcon} label="Görseller">
            <div className="flex flex-wrap gap-2 mt-1">
              {formData.images.map((img, index) => (
                <img key={index} src={img.preview} alt={`preview ${index}`} className="w-16 h-16 object-cover rounded-md border" />
              ))}
            </div>
          </ReviewItem>
      </div>

      <PremiumFeaturesSelector
        selectedFeatures={formData.premiumFeatures}
        onFeatureChange={handlePremiumFeatureChange}
      />

      {totalCost > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-lg">Toplam Ek Maliyet</p>
              <p className="text-sm text-muted-foreground">Seçilen ücretli özellikler için</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">₺{totalCost}</p>
              <p className="text-xs text-muted-foreground">Tek seferlik</p>
            </div>
          </div>
          
          {urgencyCost > 0 && (
            <div className="flex items-center justify-between py-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-red-500" />
                <span className="text-sm">Acil İlan</span>
              </div>
              <span className="font-semibold">₺{urgencyCost}</span>
            </div>
          )}
          
          {premiumCost > 0 && (
            <div className="flex items-center justify-between py-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Premium Özellikler</span>
              </div>
              <span className="font-semibold">₺{premiumCost}</span>
            </div>
          )}

          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Ödeme Bilgisi
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
                  İlanınız onaylandıktan sonra seçtiğiniz ücretli özellikler için ödeme yapmanız gerekecektir. 
                  Ödeme yapılmadan ücretli özellikler aktif olmayacaktır.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-primary"/>Yayın Ayarları</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Yayın Süresi" icon={Clock}>
                <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                    <SelectTrigger className="w-full bg-input border-border text-foreground">
                        <SelectValue placeholder="Yayın Süresi Seçin" />
                    </SelectTrigger>
                    <SelectContent className="dropdown-content">
                        {durationOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </FormField>
            <FormField label="İletişim Tercihi" icon={Phone}>
                <Select value={formData.contactPreference} onValueChange={(value) => handleInputChange('contactPreference', value)}>
                    <SelectTrigger className="w-full bg-input border-border text-foreground">
                        <SelectValue placeholder="İletişim Tercihi Seçin" />
                    </SelectTrigger>
                    <SelectContent className="dropdown-content">
                        {contactOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </FormField>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-input rounded-lg">
            <Repeat className="w-5 h-5 text-primary"/>
            <Label htmlFor="auto-republish" className="flex-grow">Süre bitince ilanı otomatik olarak yeniden yayınla</Label>
            <Switch
                id="auto-republish"
                checked={formData.autoRepublish}
                onCheckedChange={(checked) => handleInputChange('autoRepublish', checked)}
            />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center"><CopyCheck className="w-5 h-5 mr-2 text-primary"/>Kurallar ve Onay</h3>
        <div className="items-top flex space-x-3 p-3 bg-input rounded-lg">
            <Checkbox id="terms" checked={formData.acceptTerms} onCheckedChange={(checked) => handleInputChange('acceptTerms', checked)} className="mt-0.5 flex-shrink-0" />
            <div className="grid gap-1.5 leading-none">
                <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                    İlan verme kurallarını okudum ve kabul ediyorum.
                </label>
                <p className="text-sm text-muted-foreground">
                    <Button type="button" variant="link" className="p-0 h-auto text-primary" onClick={onOpenRulesModal}>Kuralları Görüntüle</Button>
                </p>
            </div>
        </div>
        {errors.acceptTerms && <p className="text-destructive text-xs mt-1">{errors.acceptTerms}</p>}
      </div>
    </motion.div>
  );
};

export default Step6_Review;