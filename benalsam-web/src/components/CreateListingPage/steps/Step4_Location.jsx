import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import FormField from '@/components/CreateListingPage/FormField.jsx';
import LocationSelector from '@/components/CreateListingPage/LocationSelector.jsx';

const Step4_Location = ({ 
  selectedProvince,
  setSelectedProvince,
  selectedDistrict,
  setSelectedDistrict,
  formData,
  handleInputChange,
  onLocationDetect,
  errors 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -50 }} 
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">Konum Belirtin</h2>
      <p className="text-center text-muted-foreground">Doğru teklifler alabilmek için konumunuzu belirtin.</p>
      
      <FormField label="Konum *" icon={MapPin} error={errors.location}>
          <LocationSelector
            selectedProvince={selectedProvince} onProvinceChange={setSelectedProvince}
            selectedDistrict={selectedDistrict} onDistrictChange={setSelectedDistrict}
            neighborhood={formData.neighborhood} onNeighborhoodChange={(value) => handleInputChange('neighborhood', value)}
            onLocationDetect={onLocationDetect}
            errors={errors}
          />
      </FormField>
    </motion.div>
  );
};

export default Step4_Location;