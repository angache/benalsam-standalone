import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, MapPin } from 'lucide-react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

const cities = [
  { id: 1, name: 'İstanbul', region: 'Marmara', flag: '🇹🇷' },
  { id: 2, name: 'Ankara', region: 'İç Anadolu', flag: '🇹🇷' },
  { id: 3, name: 'İzmir', region: 'Ege', flag: '🇹🇷' },
  { id: 4, name: 'Bursa', region: 'Marmara', flag: '🇹🇷' },
  { id: 5, name: 'Antalya', region: 'Akdeniz', flag: '🇹🇷' },
  { id: 6, name: 'Adana', region: 'Akdeniz', flag: '🇹🇷' },
  { id: 7, name: 'Konya', region: 'İç Anadolu', flag: '🇹🇷' },
  { id: 8, name: 'Gaziantep', region: 'Güneydoğu Anadolu', flag: '🇹🇷' },
  { id: 9, name: 'Şanlıurfa', region: 'Güneydoğu Anadolu', flag: '🇹🇷' },
  { id: 10, name: 'Kocaeli', region: 'Marmara', flag: '🇹🇷' },
  { id: 11, name: 'Mersin', region: 'Akdeniz', flag: '🇹🇷' },
  { id: 12, name: 'Diyarbakır', region: 'Güneydoğu Anadolu', flag: '🇹🇷' },
  { id: 13, name: 'Hatay', region: 'Akdeniz', flag: '🇹🇷' },
  { id: 14, name: 'Manisa', region: 'Ege', flag: '🇹🇷' },
  { id: 15, name: 'Kayseri', region: 'İç Anadolu', flag: '🇹🇷' },
];

const LocationPage = () => {
  const navigate = useNavigate();
  const { platformPreferences, updatePlatformPreference } = useUserPreferences();
  const { triggerHaptic } = useHapticFeedback();
  const [selectedLocation, setSelectedLocation] = useState(platformPreferences.defaultLocation || 1);

  console.log('🔍 [LocationPage] Component rendering...');
  console.log('🔍 [LocationPage] platformPreferences:', platformPreferences);
  console.log('🔍 [LocationPage] selectedLocation:', selectedLocation);

  const handleLocationSelect = (locationId) => {
    console.log('🔍 [LocationPage] handleLocationSelect called with:', locationId);
    triggerHaptic();
    setSelectedLocation(locationId);
    updatePlatformPreference('defaultLocation', locationId);
    
    // Kısa bir gecikme ile geri dön
    setTimeout(() => {
      navigate('/ayarlar2');
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/ayarlar2')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <MapPin size={24} className="text-primary" />
          <h1 className="text-xl font-semibold">Konum Seçimi</h1>
        </div>
      </div>

      {/* Location List */}
      <div className="space-y-2">
        {cities.map((city) => (
          <motion.button
            key={city.id}
            onClick={() => handleLocationSelect(city.id)}
            className={`w-full p-4 rounded-lg border transition-all duration-200 ${
              selectedLocation === city.id
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{city.flag}</span>
                <div>
                  <div className="font-medium">{city.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {city.region}
                  </div>
                </div>
              </div>
              {selectedLocation === city.id && (
                <Check size={20} className="text-primary" />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Konum seçiminiz ilanların sıralanması ve size özel içerikler için kullanılacaktır.
        </p>
      </div>
    </motion.div>
  );
};

export default LocationPage; 