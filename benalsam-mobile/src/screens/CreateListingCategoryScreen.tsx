import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, FlatList, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useCreateListingContext } from '../contexts/CreateListingContext';
import { useAuthStore } from '../stores';
import { categoriesConfig } from '../config/categories-with-attributes';
import { Home, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react-native';
import CategoryCard from '../components/CategoryCard';
import { Smartphone, Car, Building, Shirt, Home as HomeIcon, GraduationCap, Briefcase, Dumbbell, Palette, Baby, Gamepad2, Plane, Bitcoin } from 'lucide-react-native';
import { useCreateListingStore } from '../stores';

const steps = [
  { label: 'Kategori' },
  { label: 'Detaylar' },
  { label: 'Görseller' },
  { label: 'Konum' },
  { label: 'Onay' },
];

function getSubcategories(categories: any[], path: string[]): any[] {
  if (path.length === 0) return categories;
  let current = categories;
  for (let i = 0; i < path.length; i++) {
    const found = current.find(cat => cat.name === path[i]);
    if (!found) return [];
    if (found.subcategories) {
      current = found.subcategories;
    } else {
      return [];
    }
  }
  return current;
}

// Kategorileri recursive olarak düzleştirip path ile birlikte dönen fonksiyon
type FlatCategory = { name: string; icon?: any; path: string[] };
function flattenCategories(categories: any[], parentPath: string[] = [], mainIcon?: any): FlatCategory[] {
  let result: FlatCategory[] = [];
  for (const cat of categories) {
    const currentPath = [...parentPath, cat.name];
    result.push({ name: cat.name, icon: cat.icon || mainIcon, path: currentPath });
    if (cat.subcategories && cat.subcategories.length > 0) {
      result = result.concat(flattenCategories(cat.subcategories, currentPath, cat.icon || mainIcon));
    }
  }
  return result;
}

const CreateListingCategoryScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { data, setStepData, reset } = useCreateListingStore();
  const { user, loading } = useAuthStore();
  const [search, setSearch] = useState('');
  const [path, setPath] = useState<string[]>([]);
  const [selectionDone, setSelectionDone] = useState(false);

  // Context'teki tamamlanmış ilan varsa temizle
  React.useEffect(() => {
    if (data.confirm?.completed) {
      reset();
    }
  }, [data.confirm?.completed, reset]);

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
              text: 'İptal',
              onPress: () => navigation.goBack(),
              style: 'cancel'
            }
          ]
        );
      }
    }, [user, loading, navigation])
  );

  // Ana kategori adı (icon ve renk için)
  const mainCategoryName = path[0] || '';
  const mainCategory = categoriesConfig.find(cat => cat.name === mainCategoryName);

  // Şu anki seviyedeki kategoriler
  const categories = getSubcategories(categoriesConfig, path);
  // Arama filtresi
  const filteredCategories = categories.filter(cat => (cat.name || '').toLowerCase().includes(search.toLowerCase()));

  // Her kategori için icon'u belirle
  const getCategoryIcon = (cat: any) => {
    if (cat.icon) return cat.icon;
    if (mainCategory && mainCategory.icon) return mainCategory.icon;
    return undefined;
  };

  // Seçim tamamlandığında path'i context'e kaydet
  const handleFinalSelect = () => {
    setStepData('category', path);
    setSelectionDone(true);
  };

  // Kategoriye tıklanınca
  const handleCategoryPress = (cat: any) => {
    if (cat.subcategories && cat.subcategories.length > 0) {
      setPath([...path, cat.name]);
      setSearch('');
    } else {
      const finalPath = [...path, cat.name];
      setPath(finalPath);
      setSelectionDone(true);
      console.log('📂 Category selected:', finalPath);
      setStepData('category', finalPath);
      console.log('✅ Category saved to context');
    }
  };

  // Breadcrumb'dan bir seviyeye tıklanınca
  const handleBreadcrumb = (idx: number) => {
    setPath(path.slice(0, idx + 1));
    setSelectionDone(false);
  };

  // Geri butonu
  const handleBack = () => {
    if (selectionDone) {
      setSelectionDone(false);
      setPath(path.slice(0, -1));
    } else if (path.length > 0) {
      setPath(path.slice(0, -1));
    } else {
      // Ana sayfaya dön
      navigation.goBack();
    }
  };

  // İleri butonu
  const handleNext = () => {
    navigation.navigate('CreateListingDetails');
  };

  // FlatList için kart genişliği
  const numColumns = 4;
  const screenWidth = Dimensions.get('window').width;
  const cardGap = 12;
  const horizontalPadding = 16 * 2; // SafeAreaView padding
  const cardWidth = (screenWidth - horizontalPadding - cardGap * (numColumns - 1)) / numColumns;

  // Tüm kategorileri düzleştir
  const allFlatCategories = flattenCategories(categoriesConfig);
  // Arama aktifse, tüm seviyelerde arama yap
  const isSearching = search.trim().length > 0;
  const searchResults = isSearching
    ? allFlatCategories.filter(cat => cat.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  const handleCategorySelect = (category: any) => {
    const finalPath = typeof category === 'string' ? category : category.path;
    setStepData('category', finalPath);
    navigation.navigate('CreateListingDetails');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      {/* Stepper */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
        {steps.map((step, idx) => (
          <View key={step.label} style={{ alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
              backgroundColor: idx === 0 ? colors.primary : colors.surface,
              borderWidth: 2, borderColor: idx === 0 ? colors.primary : colors.border
            }}>
              <Text style={{ color: idx === 0 ? '#fff' : colors.textSecondary, fontWeight: 'bold' }}>{idx + 1}</Text>
            </View>
            <Text style={{ color: idx === 0 ? colors.primary : colors.textSecondary, fontSize: 12, marginTop: 4 }}>{step.label}</Text>
            {idx < steps.length - 1 && (
              <View style={{ position: 'absolute', right: -16, top: 16, width: 32, height: 2, backgroundColor: colors.border }} />
            )}
          </View>
        ))}
      </View>
      {/* Başlık */}
      <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 20, textAlign: 'center', marginBottom: 18 }}>İlanınız için bir Kategori seçin</Text>
      
      {/* AI İlan Oluşturma Butonu */}
      {/* Breadcrumb */}
      {path.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 12, flexWrap: 'wrap' }}>
          <TouchableOpacity onPress={() => { setPath([]); setSelectionDone(false); }}>
            <Home size={18} color={colors.primary} />
          </TouchableOpacity>
          {path.map((p, idx) => (
            <View key={p} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ChevronRight size={16} color={colors.textSecondary} />
              <TouchableOpacity onPress={() => handleBreadcrumb(idx)}>
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 14, marginHorizontal: 2 }}>{p}</Text>
              </TouchableOpacity>
            </View>
          ))}
          {selectionDone && (
            <Text style={{ color: colors.success || '#22c55e', fontWeight: 'bold', marginLeft: 8 }}>Seçim Tamamlandı!</Text>
          )}
        </View>
      )}
      {/* Seçim kutusu */}
      {selectionDone && (
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 18, borderWidth: 1, borderColor: colors.success || '#22c55e' }}>
          <CheckCircle2 size={48} color={colors.success || '#22c55e'} style={{ marginBottom: 8 }} />
          <Text style={{ color: colors.success || '#22c55e', fontWeight: 'bold', fontSize: 18, marginBottom: 6 }}>Harika Seçim!</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: 'center' }}>Artık bir sonraki adıma geçebilirsiniz.</Text>
        </View>
      )}
      {/* Kategori Grid */}
      {!selectionDone && !isSearching && (
        <FlatList
          data={filteredCategories}
          keyExtractor={item => item.name}
          numColumns={numColumns}
          renderItem={({ item }) => (
            <View style={{ width: cardWidth, marginBottom: cardGap, marginRight: cardGap }}>
              <CategoryCard
                title={item.name}
                size="sm"
                lucideIcon={getCategoryIcon(item)}
                mainCategory={mainCategoryName}
                onPress={() => handleCategoryPress(item)}
              />
            </View>
          )}
          columnWrapperStyle={{ justifyContent: 'flex-start' }}
          contentContainerStyle={{ paddingBottom: 8 }}
        />
      )}
      {/* Arama sonuçları grid */}
      {!selectionDone && isSearching && (
        <FlatList
          data={searchResults}
          keyExtractor={item => item.path.join('>')}
          numColumns={numColumns}
          renderItem={({ item }) => (
            <View style={{ width: cardWidth, marginBottom: cardGap, marginRight: cardGap }}>
              <CategoryCard
                title={item.name}
                size="sm"
                lucideIcon={item.icon}
                mainCategory={item.path[0]}
                onPress={() => {
                  setPath(item.path);
                  setSelectionDone(true);
                  console.log('📂 Category selected from search:', item.path);
                  setStepData('category', item.path);
                  console.log('✅ Category saved to context');
                }}
              />
            </View>
          )}
          columnWrapperStyle={{ justifyContent: 'flex-start' }}
          contentContainerStyle={{ paddingBottom: 8 }}
        />
      )}
      {/* veya arama */}
      {!selectionDone && <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: 10 }}>veya</Text>}
      {!selectionDone && <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Kategori ara (örn: akıllı telefon)"
        placeholderTextColor={colors.textSecondary}
        style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12, color: colors.text, marginBottom: 16 }}
      />}
      {/* Butonlar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', marginRight: 8 }} onPress={handleBack}>
          <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>Geri</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: selectionDone ? colors.primary : colors.surface, alignItems: 'center', marginLeft: 8 }} onPress={handleNext} disabled={!selectionDone}>
          <Text style={{ color: selectionDone ? '#fff' : colors.textSecondary, fontWeight: 'bold' }}>İleri <ChevronRight size={16} color={selectionDone ? '#fff' : colors.textSecondary} /></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CreateListingCategoryScreen; 