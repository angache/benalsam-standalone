import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeColors } from '../stores';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  textContentType?: 'none' | 'URL' | 'addressCity' | 'addressCityAndState' | 'addressState' | 'countryName' | 'creditCardNumber' | 'creditCardExpiration' | 'creditCardExpirationMonth' | 'creditCardExpirationYear' | 'creditCardSecurityCode' | 'creditCardName' | 'creditCardGivenName' | 'creditCardMiddleName' | 'creditCardFamilyName' | 'creditCardType' | 'birthdate' | 'birthdateDay' | 'birthdateMonth' | 'birthdateYear' | 'emailAddress' | 'familyName' | 'fullStreetAddress' | 'givenName' | 'jobTitle' | 'location' | 'middleName' | 'name' | 'namePrefix' | 'nameSuffix' | 'nickname' | 'organizationName' | 'postalCode' | 'streetAddressLine1' | 'streetAddressLine2' | 'sublocality' | 'telephoneNumber' | 'username' | 'password' | 'newPassword' | 'oneTimeCode';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad' | 'decimal-pad';
  autoCorrect?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  style,
  inputStyle,
  leftIcon,
  rightIcon,
  autoCapitalize = 'sentences',
  textContentType,
  keyboardType = 'default',
  autoCorrect = true,
}) => {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = (): ViewStyle => {
    return {
      marginBottom: 16,
      ...style,
    };
  };

  const getInputContainerStyle = (): ViewStyle => {
    return {
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: multiline ? 12 : 0,
      minHeight: multiline ? numberOfLines * 24 + 24 : 48,
      backgroundColor: colors.surface,
      borderColor: error 
        ? colors.error 
        : isFocused 
        ? colors.primary 
        : colors.border,
      ...(disabled && {
        opacity: 0.5,
      }),
    };
  };

  const getInputStyle = (): TextStyle => {
    return {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      paddingVertical: 12,
      ...(multiline && {
        textAlignVertical: 'top',
      }),
      ...inputStyle,
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

  return (
    <View style={getContainerStyle()}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <View style={{ marginRight: 8, marginTop: multiline ? 12 : 0 }}>
            {leftIcon}
          </View>
        )}
        <TextInput
          style={getInputStyle()}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          autoCapitalize={autoCapitalize}
          textContentType={textContentType}
          keyboardType={keyboardType}
          autoCorrect={autoCorrect}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {rightIcon && (
          <View style={{ marginLeft: 8, marginTop: multiline ? 12 : 0 }}>
            {rightIcon}
          </View>
        )}
      </View>
      {error && <Text style={getErrorStyle()}>{error}</Text>}
    </View>
  );
}; 