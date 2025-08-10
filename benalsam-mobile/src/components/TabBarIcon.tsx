import React from 'react';
import { View, Text } from 'react-native';
import { Home, Search, Plus, Heart, User } from 'lucide-react-native';
import { useThemeColors } from '../stores';

interface TabBarIconProps {
  route: any;
  focused: boolean;
  color: string;
  size: number;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ route, focused, color, size }) => {
  const colors = useThemeColors();

  const getIcon = () => {
    switch (route.name) {
      case 'Home':
        return <Home color={color} size={size} fill="none" strokeWidth={focused ? 2.5 : 2} />;
      case 'Search':
        return <Search color={color} size={size} fill="none" strokeWidth={focused ? 2.5 : 2} />;
      case 'Create':
        return <Plus color={color} size={size} fill="none" strokeWidth={focused ? 2.5 : 2} />;
      case 'Favorites':
        return <Heart color={color} size={size} fill="none" strokeWidth={focused ? 2.5 : 2} />;
      case 'ProfileMenu':
      case 'Profile':
        return <User color={color} size={size} fill="none" strokeWidth={focused ? 2.5 : 2} />;
      default:
        return <User color={color} size={size} fill="none" strokeWidth={focused ? 2.5 : 2} />;
    }
  };

  // Özel Create tab tasarımı
  if (route.name === 'Create') {
    return (
      <View style={{ 
        alignItems: 'center', 
        justifyContent: 'center',
        width: 72,
      }}>
        <View style={{ 
          alignItems: 'center', 
          justifyContent: 'center',
          marginTop: -15,
          backgroundColor: colors.primary,
          borderRadius: 28,
          width: 56,
          height: 56,
          shadowColor: colors.primary,
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          borderWidth: 4,
          borderColor: colors.surface,
        }}>
          <Plus 
            color="#FFFFFF" 
            size={28} 
            strokeWidth={3} 
          />
        </View>
        <Text 
          numberOfLines={1}
          style={{
            color: focused ? colors.primary : colors.textSecondary,
            fontSize: 12,
            marginTop: 6,
            fontFamily: 'AmazonEmber-Regular',
            width: '100%',
            textAlign: 'center',
          }}>
          İlan Ver
        </Text>
      </View>
    );
  }

  return (
    <View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      width: 72,
    }}>
      {getIcon()}
      {route.name !== 'Create' && (
        <Text 
          numberOfLines={1}
          style={{
            color: color,
            fontSize: 10,
            marginTop: 1,
            fontFamily: 'AmazonEmber-Regular',
            width: '100%',
            textAlign: 'center',
          }}>
          {route.options?.title || ''}
        </Text>
      )}
    </View>
  );
};

export default TabBarIcon; 