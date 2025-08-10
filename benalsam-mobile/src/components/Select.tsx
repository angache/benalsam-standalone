import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useThemeColors } from '../stores';

interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Seçiniz...',
  value,
  options,
  onValueChange,
  error,
  disabled = false,
  style,
  textStyle,
}) => {
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const getContainerStyle = (): ViewStyle => {
    return {
      marginBottom: 16,
      ...style,
    };
  };

  const getSelectStyle = (): ViewStyle => {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 48,
      backgroundColor: colors.surface,
      borderColor: error 
        ? colors.error 
        : colors.border,
      ...(disabled && {
        opacity: 0.5,
      }),
    };
  };

  const getTextStyle = (): TextStyle => {
    return {
      flex: 1,
      fontSize: 16,
      color: selectedOption ? colors.text : colors.textSecondary,
      ...textStyle,
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    };
  };

  const getErrorStyle = (): TextStyle => {
    return {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
    };
  };

  const getModalStyle = (): ViewStyle => {
    return {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    };
  };

  const getModalContentStyle = (): ViewStyle => {
    return {
      backgroundColor: colors.surface,
      borderRadius: 12,
      width: '90%',
      maxHeight: '70%',
      padding: 20,
    };
  };

  const getOptionStyle = (option: SelectOption): ViewStyle => {
    return {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: option.value === value ? colors.primary + '20' : 'transparent',
    };
  };

  const getOptionTextStyle = (option: SelectOption): TextStyle => {
    return {
      fontSize: 16,
      color: option.disabled 
        ? colors.textSecondary 
        : option.value === value 
        ? colors.primary 
        : colors.text,
      fontWeight: option.value === value ? '600' : '400',
    };
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onValueChange(option.value);
    setIsOpen(false);
  };

  const renderOption = ({ item }: { item: SelectOption }) => (
    <TouchableOpacity
      style={getOptionStyle(item)}
      onPress={() => handleSelect(item)}
      disabled={item.disabled}
    >
      <Text style={getOptionTextStyle(item)}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={getContainerStyle()}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      
      <TouchableOpacity
        style={getSelectStyle()}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={getTextStyle()}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={{ fontSize: 16, color: colors.textSecondary }}>
          ▼
        </Text>
      </TouchableOpacity>

      {error && <Text style={getErrorStyle()}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={getModalStyle()}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={getModalContentStyle()}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
                {label || 'Seçenekler'}
              </Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={{ fontSize: 20, color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}; 