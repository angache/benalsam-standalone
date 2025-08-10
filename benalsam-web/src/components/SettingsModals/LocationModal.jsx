import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMobileModalLock } from '@/hooks/useMobileModalLock';

const provinces = [
  { code: 'TR-34', name: 'İstanbul' },
  { code: 'TR-06', name: 'Ankara' },
  { code: 'TR-35', name: 'İzmir' },
  { code: 'TR-16', name: 'Bursa' },
  { code: 'TR-07', name: 'Antalya' },
  { code: 'TR-01', name: 'Adana' },
];

const districts = {
  'TR-34': [
    { code: 'TR-34-01', name: 'Adalar' },
    { code: 'TR-34-02', name: 'Bakırköy' },
    { code: 'TR-34-03', name: 'Beşiktaş' },
    { code: 'TR-34-04', name: 'Beyoğlu' },
    { code: 'TR-34-05', name: 'Kadıköy' },
    { code: 'TR-34-06', name: 'Şişli' },
  ],
  'TR-06': [
    { code: 'TR-06-01', name: 'Altındağ' },
    { code: 'TR-06-02', name: 'Çankaya' },
    { code: 'TR-06-03', name: 'Keçiören' },
    { code: 'TR-06-04', name: 'Mamak' },
    { code: 'TR-06-05', name: 'Yenimahalle' },
  ],
  'TR-35': [
    { code: 'TR-35-01', name: 'Bornova' },
    { code: 'TR-35-02', name: 'Buca' },
    { code: 'TR-35-03', name: 'Karşıyaka' },
    { code: 'TR-35-04', name: 'Konak' },
    { code: 'TR-35-05', name: 'Menemen' },
  ],
};

const LocationModal = ({ isOpen, onClose, selectedLocation, onLocationSelect }) => {
  // Scroll lock kaldırıldı - basit modal
  
  const [selectedProvince, setSelectedProvince] = useState(selectedLocation?.province || null);
  const [selectedDistrict, setSelectedDistrict] = useState(selectedLocation?.district || null);

  if (!isOpen) return null;

  const handleProvinceSelect = (province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
  };

  const handleSave = () => {
    if (selectedProvince) {
      onLocationSelect({
        province: selectedProvince,
        district: selectedDistrict,
      });
      onClose();
    }
  };

  const handleClear = () => {
    setSelectedProvince(null);
    setSelectedDistrict(null);
    onLocationSelect(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-start justify-center p-4 pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          className="bg-card rounded-lg border shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Konum Seçimi</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* İl Seçimi */}
            <div>
              <h4 className="font-medium mb-2">İl</h4>
              <div className="space-y-2">
                {provinces.map((province) => (
                  <motion.button
                    key={province.code}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-3 rounded-lg border transition-colors ${
                      selectedProvince?.code === province.code
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleProvinceSelect(province)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{province.name}</span>
                      </div>
                      {selectedProvince?.code === province.code && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* İlçe Seçimi */}
            {selectedProvince && districts[selectedProvince.code] && (
              <div>
                <h4 className="font-medium mb-2">İlçe</h4>
                <div className="space-y-2">
                  {districts[selectedProvince.code].map((district) => (
                    <motion.button
                      key={district.code}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-3 rounded-lg border transition-colors ${
                        selectedDistrict?.code === district.code
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border hover:bg-muted/50'
                      }`}
                      onClick={() => handleDistrictSelect(district)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium">{district.name}</span>
                        </div>
                        {selectedDistrict?.code === district.code && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <Button variant="outline" onClick={handleClear}>
              Temizle
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                İptal
              </Button>
              <Button onClick={handleSave} disabled={!selectedProvince}>
                Kaydet
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LocationModal; 