import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { Header, Card, Button } from '../components';
import { followCategory } from '../services/categoryFollowService';
import { ArrowLeft, Plus, Tag } from 'lucide-react-native';
import { categoriesConfig } from '../config/categories-with-attributes';

const FollowCategoryScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = async () => {
    if (!selectedCategory) {
      Alert.alert('Hata', 'Lütfen bir kategori seçin.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor.');
      return;
    }

    setIsFollowing(true);
    try {
      const result = await followCategory(user.id, selectedCategory);
      if (result && !result.already_following) {
        Alert.alert('Başarılı', `"${selectedCategory}" kategorisi takip edildi.`);
        navigation.goBack();
      } else if (result?.already_following) {
        Alert.alert('Bilgi', `"${selectedCategory}" kategorisini zaten takip ediyorsunuz.`);
      }
    } catch (error) {
      console.error('Error following category:', error);
      Alert.alert('Hata', 'Kategori takip edilirken bir sorun oluştu.');
    } finally {
      setIsFollowing(false);
    }
  };

  const renderCategoryOptions = (categories: any[], parentPath = '') => {
    let options: any[] = [];
    
    categories.forEach(cat => {
      const currentPath = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
      
      options.push(
        <TouchableOpacity
          key={currentPath}
          style={[
            styles.categoryOption,
            selectedCategory === currentPath && styles.selectedCategoryOption
          ]}
          onPress={() => setSelectedCategory(currentPath)}
        >
          <Tag size={16} color={selectedCategory === currentPath ? colors.white : colors.textSecondary} />
          <Text style={[
            styles.categoryOptionText,
            selectedCategory === currentPath && styles.selectedCategoryOptionText
          ]}>
            {currentPath}
          </Text>
        </TouchableOpacity>
      );
      
      if (cat.subcategories && cat.subcategories.length > 0) {
        options = options.concat(renderCategoryOptions(cat.subcategories, currentPath));
      }
    });
    
    return options;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 10,
    },
    backButton: {
      marginRight: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 24,
      lineHeight: 22,
    },
    categoryOptions: {
      marginBottom: 32,
    },
    categoryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedCategoryOption: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryOptionText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    selectedCategoryOptionText: {
      color: colors.white,
      fontWeight: '600',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
    },
    followButton: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Kategori Takip Et</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Yeni ilanlardan haberdar olmak için bir kategori seçin ve takibe alın.
        </Text>

        <View style={styles.categoryOptions}>
          {renderCategoryOptions(categoriesConfig)}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="İptal"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
            disabled={isFollowing}
          />
          <Button
            title={isFollowing ? 'Takip Ediliyor...' : 'Takip Et'}
            onPress={handleFollow}
            icon={isFollowing ? undefined : <Plus size={16} />}
            style={styles.followButton}
            disabled={isFollowing || !selectedCategory}
            loading={isFollowing}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default FollowCategoryScreen; 