import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Grid, List } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeColors } from '../stores';

const InventoryHeaderToggle = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();

  // Varsayılan: card
  const viewType = route.params?.viewType || 'card';

  const handleToggle = () => {
    const newType = viewType === 'card' ? 'list' : 'card';
    navigation.setParams({ viewType: newType });
  };

  return (
    <TouchableOpacity onPress={handleToggle} style={{ marginRight: 8 }}>
      {viewType === 'card' ? (
        <List size={24} color={colors.text} />
      ) : (
        <Grid size={24} color={colors.text} />
      )}
    </TouchableOpacity>
  );
};

export default InventoryHeaderToggle; 