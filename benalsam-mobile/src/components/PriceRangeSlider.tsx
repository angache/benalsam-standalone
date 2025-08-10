import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useThemeColors } from '../stores';
import { X, Minus, Plus } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

interface PriceRangeSliderProps {
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  currency?: string;
  step?: number;
  showReset?: boolean;
  style?: any;
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  minPrice = 0,
  maxPrice = 10000,
  onPriceChange,
  currency = '₺',
  step = 100,
  showReset = true,
  style,
}) => {
  const colors = useThemeColors();
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

  // Format price for display
  const formatPrice = useCallback((price: number): string => {
    if (price === 0) return 'Tümü';
    return `${price.toLocaleString('tr-TR')} ${currency}`;
  }, [currency]);

  // Handle price input change
  const handlePriceInputChange = useCallback((type: 'min' | 'max', value: string) => {
    const numericValue = parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
    
    if (type === 'min') {
      const newMin = Math.min(numericValue, localMaxPrice);
      setLocalMinPrice(newMin);
      onPriceChange(newMin, localMaxPrice);
    } else {
      const newMax = Math.max(numericValue, localMinPrice);
      setLocalMaxPrice(newMax);
      onPriceChange(localMinPrice, newMax);
    }
  }, [localMinPrice, localMaxPrice, onPriceChange]);

  // Handle step buttons
  const handleStepChange = useCallback((type: 'min' | 'max', direction: 'increase' | 'decrease') => {
    const change = direction === 'increase' ? step : -step;
    
    if (type === 'min') {
      const newMin = Math.max(0, localMinPrice + change);
      const finalMin = Math.min(newMin, localMaxPrice);
      setLocalMinPrice(finalMin);
      onPriceChange(finalMin, localMaxPrice);
    } else {
      const newMax = Math.max(localMinPrice, localMaxPrice + change);
      setLocalMaxPrice(newMax);
      onPriceChange(localMinPrice, newMax);
    }
  }, [localMinPrice, localMaxPrice, step, onPriceChange]);

  // Reset prices
  const handleReset = useCallback(() => {
    setLocalMinPrice(0);
    setLocalMaxPrice(10000);
    onPriceChange(0, 10000);
  }, [onPriceChange]);

  // Update local state when props change
  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  // Calculate slider positions
  const sliderWidth = screenWidth - 80; // Account for padding
  const minPosition = (localMinPrice / 10000) * sliderWidth;
  const maxPosition = (localMaxPrice / 10000) * sliderWidth;

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Fiyat Aralığı</Text>
        {showReset && (
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <X size={16} color={colors.primary} />
            <Text style={[styles.resetText, { color: colors.primary }]}>Sıfırla</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Price Inputs */}
      <View style={styles.priceInputsContainer}>
        {/* Min Price Input */}
        <View style={styles.priceInputGroup}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Min</Text>
          <View style={[styles.priceInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.stepButton}
              onPress={() => handleStepChange('min', 'decrease')}
              disabled={localMinPrice <= 0}
            >
              <Minus size={16} color={localMinPrice <= 0 ? colors.textSecondary : colors.primary} />
            </TouchableOpacity>
            
            <Text style={[styles.priceInput, { color: colors.text }]}>
              {formatPrice(localMinPrice)}
            </Text>
            
            <TouchableOpacity
              style={styles.stepButton}
              onPress={() => handleStepChange('min', 'increase')}
              disabled={localMinPrice >= localMaxPrice}
            >
              <Plus size={16} color={localMinPrice >= localMaxPrice ? colors.textSecondary : colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Max Price Input */}
        <View style={styles.priceInputGroup}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Max</Text>
          <View style={[styles.priceInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.stepButton}
              onPress={() => handleStepChange('max', 'decrease')}
              disabled={localMaxPrice <= localMinPrice}
            >
              <Minus size={16} color={localMaxPrice <= localMinPrice ? colors.textSecondary : colors.primary} />
            </TouchableOpacity>
            
            <Text style={[styles.priceInput, { color: colors.text }]}>
              {formatPrice(localMaxPrice)}
            </Text>
            
            <TouchableOpacity
              style={styles.stepButton}
              onPress={() => handleStepChange('max', 'increase')}
            >
              <Plus size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Visual Slider */}
      <View style={styles.sliderContainer}>
        <View style={[styles.sliderTrack, { backgroundColor: colors.border }]}>
          {/* Selected Range */}
          <View
            style={[
              styles.selectedRange,
              {
                backgroundColor: colors.primary,
                left: minPosition,
                width: maxPosition - minPosition,
              },
            ]}
          />
          
          {/* Min Handle */}
          <View
            style={[
              styles.sliderHandle,
              {
                backgroundColor: colors.primary,
                left: minPosition - 12,
              },
            ]}
          />
          
          {/* Max Handle */}
          <View
            style={[
              styles.sliderHandle,
              {
                backgroundColor: colors.primary,
                left: maxPosition - 12,
              },
            ]}
          />
        </View>
        
        {/* Price Labels */}
        <View style={styles.priceLabels}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>₺0</Text>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>₺10.000+</Text>
        </View>
      </View>

      {/* Quick Price Ranges */}
      <View style={styles.quickRanges}>
        {[
          { label: '₺0-100', min: 0, max: 100 },
          { label: '₺100-500', min: 100, max: 500 },
          { label: '₺500-1000', min: 500, max: 1000 },
          { label: '₺1000+', min: 1000, max: 10000 },
        ].map((range, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.quickRangeChip,
              {
                backgroundColor: localMinPrice === range.min && localMaxPrice === range.max 
                  ? colors.primary 
                  : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              setLocalMinPrice(range.min);
              setLocalMaxPrice(range.max);
              onPriceChange(range.min, range.max);
            }}
          >
            <Text
              style={[
                styles.quickRangeText,
                {
                  color: localMinPrice === range.min && localMaxPrice === range.max 
                    ? colors.white 
                    : colors.text,
                },
              ]}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetText: {
    fontSize: 14,
    marginLeft: 4,
  },
  priceInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  priceInputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
  },
  stepButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
    marginBottom: 8,
  },
  selectedRange: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  sliderHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    top: -10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  priceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickRanges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickRangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickRangeText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 