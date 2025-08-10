import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useCreateListingContext } from '../contexts/CreateListingContext';
import { findCategoryAttributes } from '../config/categories-with-attributes';
import { Input, Button } from '../components';

const CreateListingAttributesScreen = ({ navigation }: any) => {
  const { categoryPath, attributes, setAttributes } = useCreateListingContext();

  // Seçilen kategoriye göre attribute'ları bul
  const categoryAttributes = useMemo(() => {
    if (!categoryPath || categoryPath.length === 0) return [];
    return findCategoryAttributes(categoryPath.join(' > ')) || [];
  }, [categoryPath]);

  // Attribute değerlerini güncelle
  const handleChange = (key: string, value: any) => {
    setAttributes({ ...attributes, [key]: value });
  };

  const handleNext = () => {
    navigation.navigate('CreateListingConfirmScreen');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Kategori Özellikleri</Text>
      {categoryAttributes.length === 0 && (
        <Text style={styles.info}>Bu kategori için ek özellik yok.</Text>
      )}
      {categoryAttributes.map(attr => (
        <View key={attr.key} style={styles.inputContainer}>
          <Input
            label={attr.label}
            value={attributes[attr.key] || ''}
            onChangeText={text => handleChange(attr.key, text)}
            placeholder={attr.label}
          />
        </View>
      ))}
      <Button title="Devam Et" onPress={handleNext} style={styles.button} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
  },
});

export default CreateListingAttributesScreen; 