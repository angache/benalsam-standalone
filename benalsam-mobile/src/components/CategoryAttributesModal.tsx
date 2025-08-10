import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { categoriesConfig, findCategoryAttributes, CategoryAttribute } from '../config/categories-with-attributes';

interface CategoryAttributesModalProps {
  visible: boolean;
  onClose: () => void;
  categoryPath: string[];
  initialValues?: Record<string, any>;
  onSave: (values: Record<string, any>) => void;
}

const renderInput = (
  attr: CategoryAttribute,
  value: any,
  onChange: (val: any) => void
) => {
  if (attr.options && attr.options.length > 0) {
    // Select
    return (
      <View style={styles.selectContainer}>
        {attr.options.map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.option, value === option && styles.selectedOption]}
            onPress={() => onChange(option)}
          >
            <Text style={value === option ? styles.selectedOptionText : styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
  if (attr.type === 'boolean') {
    return (
      <View style={styles.selectContainer}>
        <TouchableOpacity
          style={[styles.option, value === true && styles.selectedOption]}
          onPress={() => onChange(true)}
        >
          <Text style={value === true ? styles.selectedOptionText : styles.optionText}>Evet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, value === false && styles.selectedOption]}
          onPress={() => onChange(false)}
        >
          <Text style={value === false ? styles.selectedOptionText : styles.optionText}>Hayır</Text>
        </TouchableOpacity>
      </View>
    );
  }
  // Varsayılan: string/number
  return (
    <TextInput
      style={styles.input}
      value={value || ''}
      onChangeText={onChange}
      placeholder={attr.label}
      keyboardType={attr.type === 'number' ? 'numeric' : 'default'}
    />
  );
};

const CategoryAttributesModal: React.FC<CategoryAttributesModalProps> = ({
  visible,
  onClose,
  categoryPath,
  initialValues = {},
  onSave,
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);

  // Kategori path'ini stringe çevir
  const pathStr = categoryPath.join(' > ');
  const attributes = findCategoryAttributes(pathStr) || [];

  const handleChange = (key: string, val: any) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    onSave(values);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Kategori Detayları</Text>
        <ScrollView>
          {attributes.length === 0 && (
            <Text style={styles.noAttributes}>Bu kategori için ek özellik yok.</Text>
          )}
          {attributes.map(attr => (
            <View key={attr.key} style={styles.attributeRow}>
              <Text style={styles.label}>{attr.label}{attr.required ? ' *' : ''}</Text>
              {renderInput(attr, values[attr.key], val => handleChange(attr.key, val))}
            </View>
          ))}
        </ScrollView>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  attributeRow: { marginBottom: 18 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, fontSize: 16 },
  selectContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { padding: 8, borderWidth: 1, borderColor: '#bbb', borderRadius: 6, marginRight: 8, marginBottom: 8 },
  selectedOption: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  optionText: { color: '#222' },
  selectedOptionText: { color: 'white', fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  cancelButton: { padding: 12, marginRight: 12 },
  cancelText: { color: '#888', fontSize: 16 },
  saveButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 6 },
  saveText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  noAttributes: { color: '#888', fontStyle: 'italic', marginTop: 24 },
});

export default CategoryAttributesModal; 