import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { turkishProvincesAndDistricts, Province } from '../config/locations';
import { useThemeColors } from '../stores';
import { useApp } from '../contexts/AppContext';

const SelectDistrictScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();
  const { setSelectedLocation } = useApp();

  const province: string = route.params?.province || '';
  const districts: string[] = useMemo(() => {
    const provinceData = turkishProvincesAndDistricts.find((p: Province) => p.name === province);
    return provinceData?.districts || [];
  }, [province]);

  const handleSelectDistrict = (district: string) => {
    // Set selected location in context
    setSelectedLocation({ province, district });
    // Go back to EditProfile
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <FlatList
        data={districts}
        keyExtractor={(item: string) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, { backgroundColor: colors.surface }]}
            onPress={() => handleSelectDistrict(item)}
          >
            <Text style={{ color: colors.text }}>{item}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  item: { padding: 16, borderRadius: 8, marginBottom: 8 },
  cancelButton: { marginTop: 16, alignItems: 'center' },
  cancelText: { fontSize: 16 },
});

export default SelectDistrictScreen; 