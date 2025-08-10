import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useThemeColors } from '../stores';
import { MapPin, Search, X, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';

interface LocationData {
  id: string;
  name: string;
  type: 'city' | 'district' | 'neighborhood';
  parentId?: string;
}

interface LocationFilterProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  showReset?: boolean;
  style?: any;
}

// Mock location data - gerçek uygulamada API'den gelecek
const LOCATION_DATA: LocationData[] = [
  // İller
  { id: 'istanbul', name: 'İstanbul', type: 'city' },
  { id: 'ankara', name: 'Ankara', type: 'city' },
  { id: 'izmir', name: 'İzmir', type: 'city' },
  { id: 'bursa', name: 'Bursa', type: 'city' },
  { id: 'antalya', name: 'Antalya', type: 'city' },
  
  // İstanbul İlçeleri
  { id: 'kadikoy', name: 'Kadıköy', type: 'district', parentId: 'istanbul' },
  { id: 'besiktas', name: 'Beşiktaş', type: 'district', parentId: 'istanbul' },
  { id: 'sisli', name: 'Şişli', type: 'district', parentId: 'istanbul' },
  { id: 'uskudar', name: 'Üsküdar', type: 'district', parentId: 'istanbul' },
  { id: 'fatih', name: 'Fatih', type: 'district', parentId: 'istanbul' },
  
  // Ankara İlçeleri
  { id: 'cankaya', name: 'Çankaya', type: 'district', parentId: 'ankara' },
  { id: 'kecioren', name: 'Keçiören', type: 'district', parentId: 'ankara' },
  { id: 'mamak', name: 'Mamak', type: 'district', parentId: 'ankara' },
  
  // Mahalleler
  { id: 'moda', name: 'Moda', type: 'neighborhood', parentId: 'kadikoy' },
  { id: 'fenerbahce', name: 'Fenerbahçe', type: 'neighborhood', parentId: 'kadikoy' },
  { id: 'levent', name: 'Levent', type: 'neighborhood', parentId: 'besiktas' },
  { id: 'nisantasi', name: 'Nişantaşı', type: 'neighborhood', parentId: 'sisli' },
];

export const LocationFilter: React.FC<LocationFilterProps> = ({
  selectedLocation,
  onLocationChange,
  showReset = true,
  style,
}) => {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLevel, setCurrentLevel] = useState<'city' | 'district' | 'neighborhood'>('city');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Filter locations based on current level and search query
  const filteredLocations = LOCATION_DATA.filter(location => {
    const matchesLevel = location.type === currentLevel;
    const matchesSearch = location.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (currentLevel === 'district') {
      return matchesLevel && matchesSearch && location.parentId === selectedCity;
    } else if (currentLevel === 'neighborhood') {
      return matchesLevel && matchesSearch && location.parentId === selectedDistrict;
    }
    
    return matchesLevel && matchesSearch;
  });

  // Handle location selection
  const handleLocationSelect = useCallback((location: LocationData) => {
    if (location.type === 'city') {
      setSelectedCity(location.id);
      setSelectedDistrict('');
      setCurrentLevel('district');
      setSearchQuery('');
    } else if (location.type === 'district') {
      setSelectedDistrict(location.id);
      setCurrentLevel('neighborhood');
      setSearchQuery('');
    } else if (location.type === 'neighborhood') {
      const cityName = LOCATION_DATA.find(l => l.id === selectedCity)?.name || '';
      const districtName = LOCATION_DATA.find(l => l.id === selectedDistrict)?.name || '';
      const fullLocation = `${cityName} / ${districtName} / ${location.name}`;
      onLocationChange(fullLocation);
    }
  }, [selectedCity, selectedDistrict, onLocationChange]);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Konum İzni',
          'Mevcut konumunuzu almak için konum izni gereklidir.',
          [{ text: 'Tamam' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Reverse geocoding - gerçek uygulamada API kullanılacak
      Alert.alert(
        'Konum Bulundu',
        `Enlem: ${latitude.toFixed(4)}, Boylam: ${longitude.toFixed(4)}\n\nBu özellik geliştirme aşamasındadır.`,
        [{ text: 'Tamam' }]
      );
      
    } catch (error) {
      Alert.alert(
        'Hata',
        'Mevcut konum alınamadı. Lütfen manuel olarak seçin.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  // Reset location
  const handleReset = useCallback(() => {
    setSelectedCity('');
    setSelectedDistrict('');
    setCurrentLevel('city');
    setSearchQuery('');
    onLocationChange('');
  }, [onLocationChange]);

  // Go back to previous level
  const goBack = useCallback(() => {
    if (currentLevel === 'neighborhood') {
      setCurrentLevel('district');
      setSelectedDistrict('');
      setSearchQuery('');
    } else if (currentLevel === 'district') {
      setCurrentLevel('city');
      setSelectedCity('');
      setSelectedDistrict('');
      setSearchQuery('');
    }
  }, [currentLevel]);

  // Get breadcrumb text
  const getBreadcrumbText = useCallback(() => {
    if (currentLevel === 'city') return 'İl Seçin';
    if (currentLevel === 'district') {
      const cityName = LOCATION_DATA.find(l => l.id === selectedCity)?.name || '';
      return `${cityName} - İlçe Seçin`;
    }
    if (currentLevel === 'neighborhood') {
      const cityName = LOCATION_DATA.find(l => l.id === selectedCity)?.name || '';
      const districtName = LOCATION_DATA.find(l => l.id === selectedDistrict)?.name || '';
      return `${cityName} > ${districtName} - Mahalle Seçin`;
    }
    return 'Konum Seçin';
  }, [currentLevel, selectedCity, selectedDistrict]);

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Konum</Text>
        {showReset && (
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <X size={16} color={colors.primary} />
            <Text style={[styles.resetText, { color: colors.primary }]}>Sıfırla</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Current Location Button */}
      <TouchableOpacity
        style={[styles.currentLocationButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={getCurrentLocation}
        disabled={isLoadingLocation}
      >
        <Navigation size={16} color={colors.primary} />
        <Text style={[styles.currentLocationText, { color: colors.primary }]}>
          {isLoadingLocation ? 'Konum Alınıyor...' : 'Mevcut Konumumu Kullan'}
        </Text>
      </TouchableOpacity>

      {/* Breadcrumb */}
      {currentLevel !== 'city' && (
        <TouchableOpacity style={styles.breadcrumb} onPress={goBack}>
          <Text style={[styles.breadcrumbText, { color: colors.primary }]}>
            ← {getBreadcrumbText()}
          </Text>
        </TouchableOpacity>
      )}

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={16} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Konum ara..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Location List */}
      <ScrollView style={styles.locationList} showsVerticalScrollIndicator={false}>
        {filteredLocations.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={[styles.locationItem, { borderBottomColor: colors.border }]}
            onPress={() => handleLocationSelect(location)}
          >
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={[styles.locationName, { color: colors.text }]}>
              {location.name}
            </Text>
            {location.type !== 'neighborhood' && (
              <Text style={[styles.locationType, { color: colors.textSecondary }]}>
                {location.type === 'city' ? 'İl' : 'İlçe'}
              </Text>
            )}
          </TouchableOpacity>
        ))}
        
        {filteredLocations.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Konum bulunamadı
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Selected Location Display */}
      {selectedLocation && (
        <View style={[styles.selectedLocationContainer, { backgroundColor: colors.primary + '20' }]}>
          <MapPin size={16} color={colors.primary} />
          <Text style={[styles.selectedLocationText, { color: colors.primary }]}>
            {selectedLocation}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetText: {
    fontSize: 14,
    marginLeft: 4,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  currentLocationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  breadcrumb: {
    marginBottom: 16,
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  locationList: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  locationName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  locationType: {
    fontSize: 12,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  selectedLocationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
}); 