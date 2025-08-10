import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useThemeColors } from '../stores';
import { Search, X, Mic } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SimpleSearchSuggestions from './SimpleSearchSuggestions';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'history' | 'trending' | 'suggestion';
  category?: string;
}

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: () => void;
  onClear?: () => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  showSuggestions?: boolean;
  autoFocus?: boolean;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Ara...',
  value,
  onChangeText,
  onSearch,
  onClear,
  onSuggestionSelect,
  suggestions = [],
  showSuggestions = true,
  autoFocus = false,
  style,
}) => {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const addToRecentSearches = async (searchText: string) => {
    try {
      // SearchHistory formatında kaydet
      const newItem = {
        id: `history-${Date.now()}`,
        text: searchText,
        timestamp: Date.now(),
      };

      const existingHistory = await AsyncStorage.getItem('searchHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Aynı aramayı varsa kaldır (duplicate prevention)
      const filteredHistory = history.filter((item: any) => item.text !== searchText);
      
      // Yeni aramayı başa ekle
      const updatedHistory = [newItem, ...filteredHistory].slice(0, 20); // Max 20 item
      
      await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.log('Recent search kaydedilemedi:', error);
    }
  };



  const handleClear = () => {
    onChangeText('');
    onClear?.();
    setShowSuggestionsList(false);
    inputRef.current?.focus();
  };

  // Eski suggestion press handler kaldırıldı - SearchSuggestions kullanılıyor

  const handleSearchPress = () => {
    setShowSuggestionsList(false);
    Keyboard.dismiss();
    
    // Recent searches'e ekle
    if (value.trim()) {
      addToRecentSearches(value.trim());
    }
    
    onSearch?.();
  };

  // Suggestions'ları göster/gizle
  useEffect(() => {
    if (showSuggestions && value.length > 0 && isFocused) {
      setShowSuggestionsList(true);
    } else {
      setShowSuggestionsList(false);
    }
  }, [value, isFocused, showSuggestions]);

  // Eski suggestion item render sistemi kaldırıldı - SearchSuggestions kullanılıyor

  // Eski suggestion sistemi kaldırıldı - SearchSuggestions kullanılıyor

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchContainer,
        {
          backgroundColor: colors.surface,
          borderColor: isFocused ? colors.primary : colors.border,
          ...style,
        }
      ]}>
        {/* Search Icon */}
        <View style={styles.searchIconContainer}>
          <Search size={20} color={colors.textSecondary} />
        </View>

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            { color: colors.text }
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          autoFocus={autoFocus}
          onChangeText={(text) => {
            onChangeText(text);
            if (showSuggestions) {
              setShowSuggestionsList(true);
            }
          }}
          onFocus={() => {
            setIsFocused(true);
            if (showSuggestions) {
              setShowSuggestionsList(true);
            }
          }}
          onBlur={() => {
            // Suggestions'a tıklarken hemen kapanmasın
            setTimeout(() => {
              setIsFocused(false);
            }, 100);
          }}
          onSubmitEditing={handleSearchPress}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {/* Clear Button */}
        {value.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClear}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Voice Search Button (Optional) */}
        <TouchableOpacity 
          style={styles.voiceButton}
          onPress={() => {
            // TODO: Implement voice search
            console.log('🎤 Voice search pressed');
          }}
        >
          <Mic size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Search Button */}
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearchPress}
        >
          <Search size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Suggestions List */}
      {showSuggestionsList && (
        <View 
          style={styles.suggestionsWrapper}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <SimpleSearchSuggestions
            query={value}
            onSuggestionPress={(suggestion) => {
              console.log('🔍 SearchBar - Suggestion selected:', suggestion);
              onChangeText(suggestion);
              setShowSuggestionsList(false);
              
              // Timing sorunu için setTimeout kullan
              setTimeout(() => {
                onSuggestionSelect?.({
                  id: `selected-${Date.now()}`,
                  text: suggestion,
                  type: 'suggestion',
                });
              }, 0);
            }}
            visible={true}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  suggestionsWrapper: {
    marginTop: 4,
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIconContainer: {
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  clearButton: {
    padding: 8,
    marginRight: 4,
  },
  voiceButton: {
    padding: 8,
    marginRight: 4,
  },
  searchButton: {
    padding: 8,
    marginRight: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 300,
    zIndex: 1001,
  },
  suggestionsList: {
    borderRadius: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  suggestionCategory: {
    fontSize: 12,
    marginTop: 2,
  },
}); 