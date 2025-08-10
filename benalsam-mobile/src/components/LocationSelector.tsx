import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X, ChevronLeft } from 'lucide-react-native';
import { turkishProvincesAndDistricts, Province } from '../config/locations';
import { useThemeColors } from '../stores';

interface LocationSelectorProps {
  visible?: boolean;
  onClose?: () => void;
  onLocationSelect?: (province: string, district: string) => void;
  initialProvince?: string;
  initialDistrict?: string;
  title?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  visible = false,
  onClose,
  onLocationSelect,
  initialProvince = '',
  initialDistrict = '',
  title = 'Konum Seçin',
}) => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  
  // Eğer initialProvince boşsa, state'i de boş başlat
  const [selectedProvince, setSelectedProvince] = useState(initialProvince || '');
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict || '');
  const [districts, setDistricts] = useState<string[]>([]);
  const [showDistricts, setShowDistricts] = useState(false);

  // Modal açıldığında state'i sıfırla
  useEffect(() => {
    if (visible) {
      setSelectedProvince(initialProvince || '');
      setSelectedDistrict(initialDistrict || '');
      setShowDistricts(false);
    }
  }, [visible, initialProvince, initialDistrict]);

  useEffect(() => {
    if (selectedProvince) {
      const provinceData = turkishProvincesAndDistricts.find((p: Province) => p.name === selectedProvince);
      setDistricts(provinceData?.districts || []);
      if (!provinceData?.districts?.includes(selectedDistrict)) {
        setSelectedDistrict('');
      }
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedProvince]);

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    setSelectedDistrict('');
    setShowDistricts(true);
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    if (onLocationSelect) {
      onLocationSelect(selectedProvince, district);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleBackToProvinces = () => {
    setShowDistricts(false);
    setSelectedDistrict('');
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  const renderProvinceItem = ({ item }: { item: Province }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface }]}
      onPress={() => handleProvinceSelect(item.name)}
    >
      <Text style={[styles.itemText, { color: colors.text }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderDistrictItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface }]}
      onPress={() => handleDistrictSelect(item)}
    >
      <Text style={[styles.itemText, { color: colors.text }]}>{item}</Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <X size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {showDistricts ? selectedProvince : title}
      </Text>
      {showDistricts && (
        <TouchableOpacity onPress={handleBackToProvinces} style={styles.backButton}>
          <ChevronLeft size={20} color={colors.primary} />
          <Text style={[styles.backButtonText, { color: colors.primary }]}>Geri</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const content = (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      {showDistricts ? (
        <FlatList
          data={districts}
          keyExtractor={(item: string) => item}
          renderItem={renderDistrictItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={turkishProvincesAndDistricts}
          keyExtractor={(item: Province) => item.name}
          renderItem={renderProvinceItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );

  // Modal olarak kullanılıyorsa
  if (visible !== undefined) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        {content}
      </Modal>
    );
  }

  // Ekran olarak kullanılıyorsa
  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  listContainer: {
    paddingBottom: 24,
  },
  item: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  itemText: {
    fontSize: 16,
  },
});

export default LocationSelector; 