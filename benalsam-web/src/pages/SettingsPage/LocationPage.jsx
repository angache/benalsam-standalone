import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Check, 
  MapPin, 
  Loader2,
  Navigation,
  Info
} from 'lucide-react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/use-toast';

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  console.log('🔍 [LocationPage] Component rendering...');
  console.log('🔍 [LocationPage] platformPreferences:', platformPreferences);
  console.log('🔍 [LocationPage] selectedLocation:', selectedLocation);

  const handleLocationSelect = async (locationId) => {
    console.log('🔍 [LocationPage] handleLocationSelect called with:', locationId);
    triggerHaptic();
    setIsLoading(true);

    try {
      await updatePlatformPreference('defaultLocation', locationId);
      setSelectedLocation(locationId);
      toast({
        title: 'Konum güncellendi',
        description: 'Varsayılan konumunuz başarıyla güncellendi.',
      });

      // Kısa bir gecikme ile geri dön
      setTimeout(() => {
        navigate('/ayarlar');
      }, 300);
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: 'Hata',
        description: 'Konum güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/ayarlar')}
          disabled={isLoading}
          className="hover:bg-accent"
        >
          <ArrowLeft size={20} />
        </Button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold text-foreground">Konum Seçimi</h1>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </motion.div>

      {/* Location List */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          cities.map((city, index) => (
            <motion.div
              key={city.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedLocation === city.id
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleLocationSelect(city.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{city.flag}</span>
                      <div>
                        <div className="font-medium text-foreground">{city.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {city.region}
                        </Badge>
                      </div>
                    </div>
                    {selectedLocation === city.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check size={20} className="text-primary" />
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Navigation size={20} className="text-primary" />
              <CardTitle className="text-lg text-blue-900 dark:text-blue-100">Konum Ayarları</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Konum seçiminiz ilanların sıralanması ve size özel içerikler için kullanılacaktır.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default LocationPage; 