import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';
import FormField from '@/components/CreateListingPage/FormField.jsx';
import ImageUploader from '@/components/CreateListingPage/ImageUploader.jsx';

const MAX_IMAGES_LISTING = 5;

const Step4_Images = ({ 
  formData, 
  handleImageArrayChange, 
  handleRemoveImageFromArray, 
  handleInputChange,
  onOpenStockModal,
  errors 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -50 }} 
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">Görsel Ekleyin</h2>
      <p className="text-center text-muted-foreground">İlanınızın daha fazla dikkat çekmesi için görseller ekleyin.</p>
      
      <FormField label={`İlan Görselleri (En az 1, En fazla ${MAX_IMAGES_LISTING}) *`} icon={ImageIcon} error={errors.images}>
        <ImageUploader 
            images={formData.images} 
            onImageChange={handleImageArrayChange}
            onRemoveImage={handleRemoveImageFromArray}
            onSetMainImage={(index) => handleInputChange('mainImageIndex', index)}
            mainImageIndex={formData.mainImageIndex}
            errors={errors}
            maxImages={MAX_IMAGES_LISTING}
            onOpenStockModal={onOpenStockModal}
        />
      </FormField>
    </motion.div>
  );
};

export default Step4_Images;