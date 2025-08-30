import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { turkishProvincesAndDistricts, Province } from '../config/locations';
import { useCreateListingStore } from '../stores';
import { LocationSelector } from '../components';

const CreateListingLocationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();
  const { data, setStepData } = useCreateListingStore();
  const { user, loading } = useAuthStore();

  // Auth kontrolü - kullanıcı giriş yapmamışsa login sayfasına yönlendir
  useFocusEffect(
    React.useCallback(() => {
      if (!loading && !user) {
        Alert.alert(
          'Giriş Gerekli',
          'İlan vermek için giriş yapmanız gerekiyor.',
          [
            {
              text: 'Giriş Yap',
              onPress: () => navigation.navigate('Login')
            },
            {
              text: 'Ana Sayfa',
              onPress: () => navigation.navigate('Home'),
              style: 'cancel'
            }
          ]
        );
      }
    }, [user, loading, navigation])
  );

  const [selectedProvince, setSelectedProvince] = useState(data.location?.province || '');
  const [selectedDistrict, setSelectedDistrict] = useState(data.location?.district || '');
  const [neighborhood, setNeighborhood] = useState(data.location?.neighborhood || '');
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Route params'tan gelen seçimleri dinle
  useEffect(() => {
    if (route.params?.selectedProvince) {
      setSelectedProvince(route.params.selectedProvince);
    }
    if (route.params?.selectedDistrict) {
      setSelectedDistrict(route.params.selectedDistrict);
    }
  }, [route.params?.selectedProvince, route.params?.selectedDistrict]);

  const detectLocation = async () => {
    try {
      setIsLocating(true);
      console.log('📍 Starting location detection...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 Location permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('İzin Verilmedi', 'Konum tespiti için izin verilmedi');
        return;
      }

      console.log('📍 Getting current position...');
      const location = await Location.getCurrentPositionAsync({});
      console.log('📍 Current position:', location.coords);
      
      // Reverse geocoding ile konum bilgilerini al
      const geocodingUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}&accept-language=tr`;
      console.log('📍 Geocoding URL:', geocodingUrl);
      
      const response = await fetch(geocodingUrl);
      console.log('📍 Geocoding response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📍 Geocoding data:', JSON.stringify(data, null, 2));
        
        // Türkiye'de olup olmadığını kontrol et
        if (data.address?.country_code !== 'tr') {
          console.log('📍 Not in Turkey, country code:', data.address?.country_code);
          Alert.alert('Uyarı', 'Sadece Türkiye içindeki konumlar desteklenmektedir');
          return;
        }

        const province = data.address?.state || data.address?.province || data.address?.region;
        const district = data.address?.county || data.address?.city_district || data.address?.town;
        const detectedNeighborhood = data.address?.neighbourhood || data.address?.suburb || data.address?.quarter;

        console.log('📍 Detected province:', province);
        console.log('📍 Detected district:', district);
        console.log('📍 Detected neighborhood:', detectedNeighborhood);

        // İl ve ilçeyi config'den bul - daha gelişmiş eşleştirme
        let foundProvince = null;
        let foundDistrict = null;

        // Önce tam eşleşme ara
        foundProvince = turkishProvincesAndDistricts.find((p: Province) => 
          p.name.toLowerCase() === (province?.toLowerCase() || '')
        );

        // Tam eşleşme yoksa kısmi eşleşme ara
        if (!foundProvince) {
          foundProvince = turkishProvincesAndDistricts.find((p: Province) => 
            p.name.toLowerCase().includes(province?.toLowerCase() || '') ||
            (province?.toLowerCase() || '').includes(p.name.toLowerCase())
          );
        }

        // Özel durumlar için manuel eşleştirme
        if (!foundProvince) {
          const specialMappings: { [key: string]: string } = {
            'ege bölgesi': 'İzmir',
            'marmara bölgesi': 'İstanbul',
            'akdeniz bölgesi': 'Antalya',
            'iç anadolu bölgesi': 'Ankara',
            'karadeniz bölgesi': 'Trabzon',
            'doğu anadolu bölgesi': 'Erzurum',
            'güneydoğu anadolu bölgesi': 'Diyarbakır'
          };
          
          const regionKey = province?.toLowerCase() || '';
          if (specialMappings[regionKey]) {
            foundProvince = turkishProvincesAndDistricts.find((p: Province) => 
              p.name === specialMappings[regionKey]
            );
          }
        }
        
        console.log('📍 Found province in config:', foundProvince?.name);
        
        if (foundProvince) {
          // İlçe eşleştirmesi
          const districtName = district?.toLowerCase() || '';
          
          // Önce tam eşleşme ara
          foundDistrict = foundProvince.districts.find((d: string) => 
            d.toLowerCase() === districtName
          );

          // Tam eşleşme yoksa kısmi eşleşme ara
          if (!foundDistrict) {
            foundDistrict = foundProvince.districts.find((d: string) => 
              d.toLowerCase().includes(districtName) ||
              districtName.includes(d.toLowerCase())
            );
          }
          
          console.log('📍 Found district in config:', foundDistrict);
          
          setSelectedProvince(foundProvince.name);
          setSelectedDistrict(foundDistrict || district || '');
          
          console.log('📍 Set province:', foundProvince.name);
          console.log('📍 Set district:', foundDistrict || district || '');
        } else {
          console.log('📍 Province not found in config');
          Alert.alert('Uyarı', 'Konumunuz Türkiye\'deki desteklenen iller arasında bulunamadı');
        }

        if (detectedNeighborhood) {
          setNeighborhood(detectedNeighborhood);
          console.log('📍 Set neighborhood:', detectedNeighborhood);
        }

      } else {
        console.log('📍 Geocoding failed with status:', response.status);
        Alert.alert('Hata', 'Konum bilgileri alınamadı');
      }
    } catch (error: any) {
      console.error('📍 Location detection error:', error);
      Alert.alert('Hata', 'Konum tespiti sırasında bir hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
    } finally {
      setIsLocating(false);
      console.log('📍 Location detection finished');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedProvince) {
      newErrors.province = 'İl seçimi zorunludur';
    }
    if (!selectedDistrict) {
      newErrors.district = 'İlçe seçimi zorunludur';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }
    setStepData('location', {
      province: selectedProvince,
      district: selectedDistrict,
      neighborhood: neighborhood
    });
    navigation.navigate('CreateListingConfirm' as never);
  };

  const handleLocationSelect = (province: string, district: string) => {
    console.log('📍 Location selected:', province, district);
    
    // İl veya ilçe değiştiğinde mahalle bilgisini sıfırla
    const provinceChanged = selectedProvince !== province;
    const districtChanged = selectedDistrict !== district;
    
    if (provinceChanged || districtChanged) {
      setNeighborhood('');
      console.log('📍 Neighborhood reset due to location change');
    }
    
    setSelectedProvince(province);
    setSelectedDistrict(district);
    setShowLocationSelector(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNumber, { color: colors.background }]}>1</Text>
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
            <View style={[styles.stepDot, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNumber, { color: colors.background }]}>2</Text>
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
            <View style={[styles.stepDot, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNumber, { color: colors.background }]}>3</Text>
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
            <View style={[styles.stepDot, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNumber, { color: colors.background }]}>4</Text>
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            <View style={[styles.stepDot, { backgroundColor: colors.border }]}>
              <Text style={[styles.stepNumber, { color: colors.background }]}>5</Text>
            </View>
          </View>
        </View>

        {/* Selected Category Path */}
        <View style={styles.categoryPathContainer}>
          <Text style={[styles.categoryPath, { color: colors.primary }]}>
            Elektronik {'>'} Telefon {'>'} Akıllı Telefon
          </Text>
        </View>

        <View style={styles.mainContent}>
          <Text style={[styles.title, { color: colors.text }]}>Konum Belirtin</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Doğru teklifler alabilmek için konumunuzu belirtin.
          </Text>

          <View style={styles.formContainer}>
            <TouchableOpacity
              style={[styles.detectButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={detectLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.primary} style={styles.buttonIcon} />
              ) : (
                <MapPin size={20} color={colors.primary} style={styles.buttonIcon} />
              )}
              <Text style={[styles.detectButtonText, { color: colors.text }]}>Konumumu Otomatik Bul</Text>
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text }]}>Konum *</Text>
            <TouchableOpacity
              style={[styles.locationSelectButton, { borderColor: errors.province || errors.district ? colors.error : colors.border }]}
              onPress={() => setShowLocationSelector(true)}
            >
              <Text style={{ color: selectedProvince ? colors.text : colors.textSecondary }}>
                {selectedProvince && selectedDistrict
                  ? `${selectedProvince} / ${selectedDistrict}`
                  : 'Konum Seç'}
              </Text>
            </TouchableOpacity>
            {(errors.province || errors.district) && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.province || errors.district}
              </Text>
            )}
            <Text style={[styles.label, { color: colors.text }]}>Mahalle (İsteğe bağlı)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={neighborhood}
              onChangeText={setNeighborhood}
              placeholder="Mahalle adını girin"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      </ScrollView>

      {/* Butonlar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 20, paddingBottom: 16 }}>
        <TouchableOpacity 
          style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', marginRight: 8, flexDirection: 'row', justifyContent: 'center' }} 
          onPress={() => navigation.goBack()}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ChevronLeft size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', marginLeft: 4 }}>Geri</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', marginLeft: 8, flexDirection: 'row', justifyContent: 'center' }} 
          onPress={handleNext}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 4 }}>İleri</Text>
            <ChevronRight size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Location Selector Modal */}
      <LocationSelector
        visible={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onLocationSelect={handleLocationSelect}
        title="Konum Seçin"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  stepsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  categoryPathContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  categoryPath: {
    fontSize: 14,
    fontWeight: '500',
  },
  mainContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  formContainer: {
    gap: 16,
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  detectButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  nextButton: {
    flex: 1,
  },
  locationSelectButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
});

export default CreateListingLocationScreen; 