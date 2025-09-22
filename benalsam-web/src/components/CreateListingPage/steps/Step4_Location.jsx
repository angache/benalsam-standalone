import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import FormField from '@/components/CreateListingPage/FormField.jsx';
import LocationSelector from '@/components/CreateListingPage/LocationSelector.jsx';
import MapLocationModal from '@/components/CreateListingPage/MapLocationModal.jsx';
import { Button } from '@/components/ui/button';

const Step4_Location = ({ 
  selectedProvince,
  setSelectedProvince,
  selectedDistrict,
  setSelectedDistrict,
  formData,
  handleInputChange,
  onLocationDetect,
  detectLocation,
  errors 
}) => {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Handle location selection from map
  const handleMapLocationSelect = (locationData) => {
    // Update form data
    handleInputChange('latitude', locationData.latitude);
    handleInputChange('longitude', locationData.longitude);
    handleInputChange('geolocation', locationData.geolocation);
    handleInputChange('neighborhood', locationData.neighborhood);

    // Update province and district
    if (locationData.province) {
      setSelectedProvince(locationData.province);
    }
    if (locationData.district) {
      setSelectedDistrict(locationData.district);
    }

    console.log('Haritadan konum seçildi:', locationData);
  };
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -50 }} 
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">Konum Belirtin</h2>
      <p className="text-center text-muted-foreground">Doğru teklifler alabilmek için konumunuzu belirtin.</p>
      
      {/* Auto Location Detection Button */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={detectLocation}
          className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10"
        >
          <Navigation className="h-4 w-4" />
          Konumumu Algıla
        </Button>
      </div>

      {/* Show detected location if available */}
      {formData.latitude && formData.longitude && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <p className="text-sm text-primary font-medium">📍 Konum Algılandı</p>
          <div className="text-xs text-muted-foreground space-y-1">
            {selectedProvince && (
              <p>İl: {selectedProvince}</p>
            )}
            {selectedDistrict && (
              <p>İlçe: {selectedDistrict}</p>
            )}
            {formData.neighborhood && (
              <p>Mahalle: {formData.neighborhood}</p>
            )}
            <p className="text-xs opacity-75">
              Koordinat: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
            </p>
          </div>
        </div>
      )}
      
      <FormField label="Konum *" icon={MapPin} error={errors.location}>
          <LocationSelector
            selectedProvince={selectedProvince} onProvinceChange={setSelectedProvince}
            selectedDistrict={selectedDistrict} onDistrictChange={setSelectedDistrict}
            neighborhood={formData.neighborhood} onNeighborhoodChange={(value) => handleInputChange('neighborhood', value)}
            onLocationDetect={onLocationDetect}
            onMapLocationSelect={() => setIsMapModalOpen(true)}
            errors={errors}
          />
      </FormField>

      {/* Map Location Modal */}
      <MapLocationModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onLocationSelect={handleMapLocationSelect}
        initialPosition={formData.latitude && formData.longitude ? 
          [parseFloat(formData.latitude), parseFloat(formData.longitude)] : 
          [39.9334, 32.8597] // Default to Ankara
        }
      />
    </motion.div>
  );
};

export default Step4_Location;