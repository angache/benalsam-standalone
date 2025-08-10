import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, Tag, Image as ImageIcon, Building, MapPin, Phone, MessageSquare, Repeat, FileText, ShieldCheck, Zap, Info } from 'lucide-react';
import FormField from '@/components/CreateListingPage/FormField.jsx';
import CategorySelector from '@/components/CreateListingPage/CategorySelector.jsx';
import LocationSelector from '@/components/CreateListingPage/LocationSelector.jsx';
import ImageUploader from '@/components/CreateListingPage/ImageUploader.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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

const ListingFormFields = ({
  formData,
  setFormData,
  errors,
  isUploading,
  uploadProgress,
  handleInputChange,
  handleImageArrayChange,
  handleRemoveImageFromArray,
  selectedMainCategory, setSelectedMainCategory,
  selectedSubCategory, setSelectedSubCategory,
  selectedSubSubCategory, setSelectedSubSubCategory,
  selectedProvince, setSelectedProvince,
  selectedDistrict, setSelectedDistrict,
  onOpenRulesModal,
  onLocationDetect,
  onOpenStockModal,
}) => {
  const selectedUrgencyOption = urgencyOptions.find(option => option.value === formData.urgency);
  const urgencyCost = selectedUrgencyOption?.price ? parseInt(selectedUrgencyOption.price.replace('₺', '')) : 0;

  return (
    <>
      <FormField label="İlan Başlığı *" icon={Tag} error={errors.title}>
        <input type="text" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="Örn: iPhone 14 Pro Arıyorum"
          disabled={isUploading}
          className={`w-full px-4 py-2.5 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none input-glow ${errors.title ? 'border-destructive' : 'border-border'}`} />
      </FormField>
      <FormField label="Açıklama *" error={errors.description}>
        <textarea value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Aradığınız ürün/hizmet hakkında detaylı bilgi verin..."
          rows={4} 
          disabled={isUploading}
          className={`w-full px-4 py-2.5 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none input-glow resize-none ${errors.description ? 'border-destructive' : 'border-border'}`} />
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
          <input type="number" value={formData.budget} onChange={(e) => handleInputChange('budget', e.target.value)} placeholder="0" min="0"
            disabled={isUploading}
            className={`w-full px-4 py-2.5 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none input-glow ${errors.budget ? 'border-destructive' : 'border-border'}`} />
        </FormField>
        <FormField label="Konum *" icon={MapPin} error={errors.location}>
            <LocationSelector
              selectedProvince={selectedProvince} onProvinceChange={setSelectedProvince}
              selectedDistrict={selectedDistrict} onDistrictChange={setSelectedDistrict}
              neighborhood={formData.neighborhood} onNeighborhoodChange={(value) => handleInputChange('neighborhood', value)}
              onLocationDetect={onLocationDetect}
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
              onOpenStockModal={onOpenStockModal}
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

      {urgencyCost > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">Acil İlan Ücreti</p>
                <p className="text-sm text-red-700 dark:text-red-300">Seçilen aciliyet özelliği için</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">₺{urgencyCost}</p>
              <p className="text-xs text-red-500 dark:text-red-400">3 gün süreyle</p>
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

      <div className="border-t border-border/50 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center"><FileText className="w-5 h-5 mr-2 text-primary"/>Kurallar ve Onay</h3>
        <div className="items-top flex space-x-2">
            <Checkbox id="terms" checked={formData.acceptTerms} onCheckedChange={(checked) => handleInputChange('acceptTerms', checked)} />
            <div className="grid gap-1.5 leading-none">
                <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
    </>
  );
};

export default ListingFormFields;