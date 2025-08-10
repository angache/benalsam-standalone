import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Sun, Moon, Search, Bell, Plus, Menu } from 'lucide-react-native';
import { useThemeColors } from '../stores';

interface HeaderProps {
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  unreadNotificationCount?: number;
  onCreatePress?: () => void;
  onMenuPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onThemeToggle,
  isDarkMode,
  onSearchPress,
  onNotificationPress,
  unreadNotificationCount = 0,
  onCreatePress,
  onMenuPress,
}) => {
  const colors = useThemeColors();
  
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      height: 48,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    left: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconBtn: {
      padding: 8,
      marginHorizontal: 2,
      borderRadius: 6,
    },
    createBtn: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 8,
      marginHorizontal: 2,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 36,
      minHeight: 36,
      shadowColor: colors.black,
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    badge: {
      position: 'absolute',
      top: 2,
      right: 2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      paddingHorizontal: 3,
    },
    badgeText: {
      color: colors.white,
      fontWeight: 'bold',
      fontSize: 11,
    },
  });

  return (
    <View style={styles.container}>
      {/* Sol: Logo/Zap */}
      <View style={styles.left}>
        <Zap size={28} color={colors.primary} />
      </View>
      {/* Sağ: İkonlar */}
      <View style={styles.right}>
        <TouchableOpacity onPress={onThemeToggle} style={styles.iconBtn}>
          {isDarkMode ? (
            <Sun size={22} color={colors.textSecondary} />
          ) : (
            <Moon size={22} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onSearchPress} style={styles.iconBtn}>
          <Search size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onNotificationPress} style={styles.iconBtn}>
          <Bell size={22} color={colors.textSecondary} />
          {unreadNotificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onCreatePress} style={styles.createBtn}>
          <Plus size={22} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
          <Menu size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};



export default Header; 