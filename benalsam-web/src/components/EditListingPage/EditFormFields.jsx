import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, DollarSign, Clock, Tag, Image as ImageIcon, Building, MapPin, Phone, MessageSquare, Repeat, ShieldCheck, Zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FormField from '@/components/CreateListingPage/FormField.jsx';
import CategorySelector from '@/components/CreateListingPage/CategorySelector.jsx';
import LocationSelector from '@/components/CreateListingPage/LocationSelector.jsx';
import ImageUploader from '@/components/CreateListingPage/ImageUploader.jsx';
import PremiumFeaturesSelector from '@/components/CreateListingPage/PremiumFeaturesSelector';

const urgencyOptions = [
  { value: 'Normal', label: 'Normal', price: null, description: 'Standart görünüm' },
  { value: 'Acil', label: 'Acil', price: '₺10', description: 'Kırmızı "ACİL" etiketi ile öne çıkar (3 gün)' }
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

const EditFormFields = ({
  formData,
  handleInputChange,
  handlePremiumFeatureChange,
  handleImageArrayChange,
  handleRemoveImageFromArray,
  errors,
  isUploading,
  uploadProgress,
  selectedMainCategory,
  setSelectedMainCategory,
  selectedSubCategory,
  setSelectedSubCategory,
  selectedSubSubCategory,
  setSelectedSubSubCategory,
  selectedProvince,
  setSelectedProvince,
  selectedDistrict,
  setSelectedDistrict,
}) => {
  const selectedUrgencyOption = urgencyOptions.find(option => option.value === formData.urgency);

  return (
    <div className="space-y-6">
      <FormField label="İlan Başlığı *" icon={Tag} error={errors.title}>
        <Input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Örn: iPhone 14 Pro Arıyorum"
          disabled={isUploading}
          className={`${errors.title ? 'border-destructive' : ''}`}
        />
      </FormField>

      <FormField label="Açıklama *" error={errors.description}>
        <Textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Aradığınız ürün/hizmet hakkında detaylı bilgi verin..."
          rows={4}
          disabled={isUploading}
          className={`${errors.description ? 'border-destructive' : ''}`}
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
          <Input
            type="number"
            value={formData.budget}
            onChange={(e) => handleInputChange('budget', e.target.value)}
            placeholder="0"
            min="0"
            disabled={isUploading}
            className={`${errors.budget ? 'border-destructive' : ''}`}
          />
        </FormField>
        <FormField label="Konum *" icon={MapPin} error={errors.location}>
          <LocationSelector
            selectedProvince={selectedProvince} onProvinceChange={setSelectedProvince}
            selectedDistrict={selectedDistrict} onDistrictChange={setSelectedDistrict}
            neighborhood={formData.neighborhood} onNeighborhoodChange={(value) => handleInputChange('neighborhood', value)}
            onLocationDetect={() => {}}
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
                  <p className="text-xs text-muted-foreground">
                    {selectedUrgencyOption.description}
                  </p>
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
          onOpenStockModal={() => { /* Not implemented for edit page */ }}
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
    </div>
  );
};

export default EditFormFields;