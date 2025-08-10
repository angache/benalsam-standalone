import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores/themeStore';
import { Sparkles, Edit3, ArrowLeft } from 'lucide-react-native';

export default function CreateListingMethodScreen() {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>İlan Oluştur</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>İlan Oluşturma Yöntemi</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Nasıl ilan oluşturmak istersiniz?</Text>

        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateListingCategory')}
          activeOpacity={0.85}
        >
          <Edit3 size={32} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={[styles.optionTitle, { color: colors.primary }]}>Kendi İlanımı Oluşturmak İstiyorum</Text>
          <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Kategorini seç, detayları elle gir.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: colors.surface, borderColor: colors.secondary }]}
          onPress={() => navigation.navigate('AIGenerateListing')}
          activeOpacity={0.85}
        >
          <Sparkles size={32} color={colors.secondary} style={{ marginBottom: 8 }} />
          <Text style={[styles.optionTitle, { color: colors.secondary }]}>AI ile Otomatik Oluştur</Text>
          <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Yapay zeka ile hızlıca ilan oluştur.</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    color: '#888',
  },
  optionButton: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 