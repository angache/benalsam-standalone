import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, DollarSign, Clock, Tag, Image as ImageIcon, Building, MapPin, Phone, MessageSquare, Repeat, FileText, ShieldCheck, Zap, Info, Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useEditListingForm } from '@/hooks/useEditListingForm';
import FormField from '@/components/CreateListingPage/FormField.jsx';
import CategorySelector from '@/components/CreateListingPage/CategorySelector.jsx';
import LocationSelector from '@/components/CreateListingPage/LocationSelector.jsx';
import ImageUploader from '@/components/CreateListingPage/ImageUploader.jsx';
import PremiumFeaturesSelector from '@/components/CreateListingPage/PremiumFeaturesSelector';

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

const durationOptions = [
  { value: '7', label: '7 Gün' },
  { value: '15', label: '15 Gün' },
  { value: '30', label: '30 Gün' },
  { value: '60', label: '60 Gün' },
];

const contactOptions = [
    { value: 'site_message', label: 'Sadece Site Üzerinden Mesaj', icon: MessageSquare },
    { value: 'phone', label: 'Telefon ve Mesaj', icon: Phone },
];

const MAX_IMAGES_LISTING = 5;

const EditListingModal = ({ isOpen, onOpenChange, listingId }) => {
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  
  const {
    formData,
    selectedMainCategory, setSelectedMainCategory,
    selectedSubCategory, setSelectedSubCategory,
    selectedSubSubCategory, setSelectedSubSubCategory,
    selectedProvince, setSelectedProvince,
    selectedDistrict, setSelectedDistrict,
    errors,
    loadingInitialData,
    isUploading,
    uploadProgress,
    handleInputChange,
    handlePremiumFeatureChange,
    handleImageArrayChange,
    handleRemoveImageFromArray,
    handleSubmit,
  } = useEditListingForm(listingId);

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

  if (loadingInitialData) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
            <span>İlan bilgileri yükleniyor...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">İlanı Düzenle</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField label="İlan Başlığı *" icon={Tag} error={errors.title}>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => handleInputChange('title', e.target.value)} 
              placeholder="Örn: iPhone 14 Pro Arıyorum"
              disabled={isUploading}
              className={`w-full px-4 py-2.5 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none input-glow ${errors.title ? 'border-destructive' : 'border-border'}`} 
            />
          </FormField>

          <FormField label="Açıklama *" error={errors.description}>
            <textarea 
              value={formData.description} 
              onChange={(e) => handleInputChange('description', e.target.value)} 
              placeholder="Aradığınız ürün/hizmet hakkında detaylı bilgi verin..."
              rows={4} 
              disabled={isUploading}
              className={`w-full px-4 py-2.5 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none input-glow resize-none ${errors.description ? 'border-destructive' : 'border-border'}`} 
            />
          </FormField>

          <FormField label="Kategori Seçimi *" icon={Building} error={errors.category}>
            <CategorySelector 
              selectedMain={selectedMainCategory} onMainChange={setSelectedMainCategory}
              selectedSub={selectedSubCategory} onSubChange={setSelectedSubCategory}
              selectedSubSub={selectedSubSubCategory} onSubSubChange={setSelectedSubSubCategory}
              errors={errors}
              disabled={isUploading}
            />
          </FormField>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Bütçe (₺) *" icon={DollarSign} error={errors.budget}>
              <input 
                type="number" 
                value={formData.budget} 
                onChange={(e) => handleInputChange('budget', e.target.value)} 
                placeholder="0" 
                min="0"
                disabled={isUploading}
                className={`w-full px-4 py-2.5 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none input-glow ${errors.budget ? 'border-destructive' : 'border-border'}`} 
              />
            </FormField>
            <FormField label="Konum *" icon={MapPin} error={errors.location}>
              <LocationSelector
                selectedProvince={selectedProvince} onProvinceChange={setSelectedProvince}
                selectedDistrict={selectedDistrict} onDistrictChange={setSelectedDistrict}
                neighborhood={formData.neighborhood} onNeighborhoodChange={(value) => handleInputChange('neighborhood', value)}
                errors={errors}
                disabled={isUploading}
              />
            </FormField>
          </div>
          
          <FormField label="Aciliyet" icon={Clock}>
            <div className="space-y-3">
              <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)} disabled={isUploading}>
                <SelectTrigger className="w-full bg-input border-border text-foreground">
                  <SelectValue placeholder="Aciliyet Durumu Seçin" />
                </SelectTrigger>
                <SelectContent className="dropdown-content">
                  {urgencyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="py-3">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {option.value === 'Acil' && <Zap className="w-4 h-4 text-red-500" />}
                          <span>{option.label}</span>
                          {option.price && (
                            <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                              {option.price}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedUrgencyOption && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`${selectedUrgencyOption.price ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {selectedUrgencyOption.price ? (
                          <div className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-full">
                            <Zap className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-full">
                            <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">
                              {selectedUrgencyOption.label}
                            </p>
                            {selectedUrgencyOption.price && (
                              <Badge className="bg-red-600 text-white text-xs">
                                {selectedUrgencyOption.price}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {selectedUrgencyOption.description}
                          </p>
                          {selectedUrgencyOption.price && (
                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                              <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                                    Ücretli Özellik
                                  </p>
                                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
                                    Bu seçenek için {selectedUrgencyOption.price} ek ücret alınacaktır. 
                                    İlanınız 3 gün boyunca kırmızı "ACİL" etiketi ile öne çıkacak.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </FormField>

          <FormField label={`İlan Görselleri (En az 1, En fazla ${MAX_IMAGES_LISTING}) *`} icon={ImageIcon} error={errors.images}>
            <ImageUploader 
              images={formData.images} 
              onImageChange={handleImageArrayChange}
              onRemoveImage={handleRemoveImageFromArray}
              onSetMainImage={(index) => handleInputChange('mainImageIndex', index)}
              mainImageIndex={formData.mainImageIndex}
              errors={errors}
              disabled={isUploading}
              maxImages={MAX_IMAGES_LISTING}
            />
          </FormField>

          {isUploading && (
            <div className="mt-4">
              <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground mt-1">Görseller yükleniyor: {uploadProgress}%</p>
            </div>
          )}

          <PremiumFeaturesSelector
            selectedFeatures={formData.premiumFeatures}
            onFeatureChange={handlePremiumFeatureChange}
            disabled={isUploading}
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

          <div className="border-t border-border/50 pt-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-primary"/>Yayın Ayarları</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Yayın Süresi" icon={Clock}>
                <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)} disabled={isUploading}>
                  <SelectTrigger className="w-full bg-input border-border text-foreground">
                    <SelectValue placeholder="Yayın Süresi Seçin" />
                  </SelectTrigger>
                  <SelectContent className="dropdown-content">
                    {durationOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="İletişim Tercihi" icon={Phone}>
                <Select value={formData.contactPreference} onValueChange={(value) => handleInputChange('contactPreference', value)} disabled={isUploading}>
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
                disabled={isUploading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
              İptal
            </Button>
            <Button type="submit" disabled={isUploading} className="btn-primary">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Değişiklikleri Kaydet'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditListingModal;