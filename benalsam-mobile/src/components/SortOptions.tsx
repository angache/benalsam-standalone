import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useThemeColors } from '../stores';
import { ChevronDown, Check, ArrowUpDown } from 'lucide-react-native';

interface SortOption {
  id: string;
  label: string;
  value: string;
  description?: string;
  icon?: string;
}

interface SortOptionsProps {
  selectedSort: string;
  onSortChange: (sort: string) => void;
  showReset?: boolean;
  style?: any;
}

const SORT_OPTIONS: SortOption[] = [
  {
    id: 'newest',
    label: 'En Yeni',
    value: 'created_at-desc',
    description: 'En son eklenen ilanlar',
    icon: '🆕',
  },
  {
    id: 'oldest',
    label: 'En Eski',
    value: 'created_at-asc',
    description: 'En eski ilanlar',
    icon: '📅',
  },
  {
    id: 'price-low',
    label: 'Fiyat: Düşük → Yüksek',
    value: 'budget-asc',
    description: 'En ucuzdan en pahalıya',
    icon: '💰',
  },
  {
    id: 'price-high',
    label: 'Fiyat: Yüksek → Düşük',
    value: 'budget-desc',
    description: 'En pahalıdan en ucuza',
    icon: '💎',
  },
  {
    id: 'title-asc',
    label: 'Başlık: A → Z',
    value: 'title-asc',
    description: 'Alfabetik sıralama',
    icon: '📝',
  },
  {
    id: 'title-desc',
    label: 'Başlık: Z → A',
    value: 'title-desc',
    description: 'Ters alfabetik sıralama',
    icon: '📝',
  },
  {
    id: 'urgent',
    label: 'Acil İlanlar',
    value: 'urgency-desc',
    description: 'Acil ilanlar önce',
    icon: '🚨',
  },
  {
    id: 'premium',
    label: 'Premium İlanlar',
    value: 'is_premium-desc',
    description: 'Premium ilanlar önce',
    icon: '⭐',
  },
  {
    id: 'popular',
    label: 'Popüler',
    value: 'views-desc',
    description: 'En çok görüntülenen',
    icon: '🔥',
  },
  {
    id: 'distance',
    label: 'Yakınlık',
    value: 'distance-asc',
    description: 'En yakın ilanlar',
    icon: '📍',
  },
];

export const SortOptions: React.FC<SortOptionsProps> = ({
  selectedSort,
  onSortChange,
  showReset = true,
  style,
}) => {
  const colors = useThemeColors();
  const [showDropdown, setShowDropdown] = useState(false);

  // Get current sort option
  const getCurrentSortOption = useCallback(() => {
    return SORT_OPTIONS.find(option => option.value === selectedSort) || SORT_OPTIONS[0];
  }, [selectedSort]);

  // Handle sort selection
  const handleSortSelect = useCallback((sortOption: SortOption) => {
    onSortChange(sortOption.value);
    setShowDropdown(false);
  }, [onSortChange]);

  // Reset to default sort
  const handleReset = useCallback(() => {
    onSortChange('created_at-desc');
    setShowDropdown(false);
  }, [onSortChange]);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    console.log('🔍 SortOptions - Toggle dropdown:', !showDropdown);
    setShowDropdown(!showDropdown);
  }, [showDropdown]);

  const currentSortOption = getCurrentSortOption();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Sıralama</Text>
        {showReset && (
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={[styles.resetText, { color: colors.primary }]}>Varsayılan</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Dropdown */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={[styles.dropdownButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={toggleDropdown}
        >
          <View style={styles.dropdownContent}>
            <ArrowUpDown size={16} color={colors.textSecondary} />
            <View style={styles.dropdownText}>
              <Text style={[styles.dropdownLabel, { color: colors.text }]}>
                {currentSortOption.label}
              </Text>
              <Text style={[styles.dropdownDescription, { color: colors.textSecondary }]}>
                {currentSortOption.description}
              </Text>
            </View>
          </View>
          <ChevronDown 
            size={16} 
            color={colors.textSecondary}
            style={[styles.dropdownIcon, { transform: [{ rotate: showDropdown ? '180deg' : '0deg' }] }]}
          />
        </TouchableOpacity>

        {/* Dropdown Options */}
        {showDropdown && (
          console.log('🔍 SortOptions - Rendering dropdown with', SORT_OPTIONS.length, 'options'),
          <View style={[styles.dropdownOptions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ScrollView style={styles.optionsScroll} showsVerticalScrollIndicator={false}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor: selectedSort === option.value ? colors.primary + '20' : 'transparent',
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => handleSortSelect(option)}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <View style={styles.optionText}>
                      <Text style={[
                        styles.optionLabel,
                        { 
                          color: selectedSort === option.value ? colors.primary : colors.text,
                          fontWeight: selectedSort === option.value ? '600' : '500',
                        },
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {selectedSort === option.value && (
                    <Check size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Sort Indicators */}
      <View style={styles.indicatorsContainer}>
        <Text style={[styles.indicatorsTitle, { color: colors.textSecondary }]}>
          Aktif Sıralama
        </Text>
        <View style={[styles.activeSortIndicator, { backgroundColor: colors.primary + '20' }]}>
          <Text style={styles.activeSortIcon}>{currentSortOption.icon}</Text>
          <Text style={[styles.activeSortText, { color: colors.primary }]}>
            {currentSortOption.label}
          </Text>
        </View>
      </View>

      {/* Quick Sort Buttons */}
      <View style={styles.quickSortContainer}>
        <Text style={[styles.quickSortTitle, { color: colors.textSecondary }]}>
          Hızlı Sıralama
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SORT_OPTIONS.slice(0, 4).map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.quickSortButton,
                {
                  backgroundColor: selectedSort === option.value ? colors.primary : colors.surface,
                  borderColor: selectedSort === option.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSortSelect(option)}
            >
              <Text style={styles.quickSortIcon}>{option.icon}</Text>
              <Text style={[
                styles.quickSortLabel,
                { 
                  color: selectedSort === option.value ? colors.white : colors.text,
                },
              ]}>
                {option.label.split(':')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetText: {
    fontSize: 14,
  },
  dropdownContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownText: {
    marginLeft: 8,
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdownOptions: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionsScroll: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
  },
  indicatorsContainer: {
    marginBottom: 16,
  },
  indicatorsTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  activeSortIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeSortIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  activeSortText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickSortContainer: {
    marginBottom: 16,
  },
  quickSortTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  quickSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  quickSortIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  quickSortLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 