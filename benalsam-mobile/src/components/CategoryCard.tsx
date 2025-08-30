import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useThemeColors } from '../stores';
import { 
  Smartphone, 
  Car, 
  Building, 
  Shirt, 
  Home, 
  GraduationCap, 
  Briefcase, 
  Dumbbell, 
  Palette, 
  Baby, 
  Gamepad2, 
  Plane, 
  Bitcoin,
  Laptop,
  Camera,
  Tv,
  Gamepad,
  Watch,
  Wrench,
  Monitor,
  Headphones,
  Tablet,
  Printer,
  Heart,
  Stethoscope,
  Scissors,
  Truck,
  Bus,
  Bike,
  Flower,
  Trees,
  ShoppingBag,
  ShoppingCart,
  DollarSign,
  Coins,
  TrendingUp,
  Users,
  User,
  UserCheck,
  MessageCircle,
  Calendar,
  Star,
  Gift,
  FileText,
  Brush,
  PenTool,
  Award,
  Map,
  Music,
  Utensils
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Statik kategori sistemi deprecated - artık dinamik sistem kullanılıyor

interface CategoryCardProps {
  title: string;
  icon?: React.ComponentType<any>;
  image?: string;
  count?: number;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  lucideIcon?: React.ComponentType<any>;
  mainCategory?: string;
}

const DEFAULT_ICON = Smartphone;



// Tailwind renklerini hex'e çeviren mapping
const tailwindColorMap: Record<string, string> = {
  'blue-500': '#3b82f6',
  'cyan-500': '#06b6d4',
  'red-500': '#ef4444',
  'pink-500': '#ec4899',
  'rose-500': '#f43f5e',
  'orange-400': '#fb923c',
  'amber-600': '#d97706',
  'green-500': '#22c55e',
  'emerald-500': '#10b981',
  'purple-500': '#a855f7',
  'violet-500': '#8b5cf6',
  'orange-500': '#f59e42',
  'amber-500': '#f59e42',
  'teal-500': '#14b8a6',
  'indigo-500': '#6366f1',
  'sky-500': '#0ea5e9',
  'yellow-500': '#eab308',
  'amber-400': '#fbbf24',
};

function parseGradient(colorStr: string): string[] {
  // ör: 'from-blue-500 to-cyan-500' => ['#3b82f6', '#06b6d4']
  const fromMatch = colorStr.match(/from-([a-z\-0-9]+)/);
  const toMatch = colorStr.match(/to-([a-z\-0-9]+)/);
  const from = fromMatch ? tailwindColorMap[fromMatch[1]] : '#3b82f6';
  const to = toMatch ? tailwindColorMap[toMatch[1]] : '#06b6d4';
  return [from, to];
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  icon,
  image,
  count,
  onPress,
  size = 'md',
  lucideIcon,
  mainCategory,
}) => {
  const colors = useThemeColors();

  // Kategoriye göre renk bul - artık dinamik sistem kullanılıyor
  const gradientColors = ['#3b82f6', '#06b6d4']; // Default gradient
  const iconColor = gradientColors[0];

  const getSize = () => {
    switch (size) {
      case 'sm': return { width: 64, height: 64, fontSize: 9.6, icon: 22.4 };
      case 'md': return { width: 80, height: 80, fontSize: 11.2, icon: 28.8 };
      case 'lg': return { width: 96, height: 96, fontSize: 12.8, icon: 35.2 };
      default: return { width: 80, height: 80, fontSize: 11.2, icon: 28.8 };
    }
  };

  const { width, height, fontSize, icon: iconSize } = getSize();
  
  // Icon'u belirle: önce lucideIcon prop'u, sonra icon prop'u, sonra default
  let LucideIcon = lucideIcon || DEFAULT_ICON;
  
  // Eğer icon prop'u string ise, icon mapping'den bul
  if (typeof icon === 'string') {
    const iconMapping: Record<string, React.ComponentType<any>> = {
      'Smartphone': Smartphone,
      'Car': Car,
      'Building': Building,
      'Shirt': Shirt,
      'Home': Home,
      'GraduationCap': GraduationCap,
      'Briefcase': Briefcase,
      'Dumbbell': Dumbbell,
      'Palette': Palette,
      'Baby': Baby,
      'Gamepad2': Gamepad2,
      'Plane': Plane,
      'Bitcoin': Bitcoin,
      'Laptop': Laptop,
      'Camera': Camera,
      'Tv': Tv,
      'Gamepad': Gamepad,
      'Watch': Watch,
      'Wrench': Wrench,
      'Monitor': Monitor,
      'Headphones': Headphones,
      'Tablet': Tablet,
      'Printer': Printer,
      'Heart': Heart,
      'Stethoscope': Stethoscope,
      'Scissors': Scissors,
      'Truck': Truck,
      'Bus': Bus,
      'Bike': Bike,
      'Flower': Flower,
      'Trees': Trees,
      'ShoppingBag': ShoppingBag,
      'ShoppingCart': ShoppingCart,
      'DollarSign': DollarSign,
      'Coins': Coins,
      'TrendingUp': TrendingUp,
      'Users': Users,
      'User': User,
      'UserCheck': UserCheck,
      'MessageCircle': MessageCircle,
      'Calendar': Calendar,
      'Star': Star,
      'Gift': Gift,
      'FileText': FileText,
      'Brush': Brush,
      'PenTool': PenTool,
      'Award': Award,
      'Map': Map,
      'Music': Music,
      'Utensils': Utensils
    };
    LucideIcon = iconMapping[icon] || DEFAULT_ICON;
  } else if (icon) {
    LucideIcon = icon;
  }

  const styles = {
    card: {
      width,
      height,
      backgroundColor: colors.surface,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      margin: 8,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 3,
      overflow: 'hidden' as const,
    },
    image: {
      width: '100%' as const,
      height: '100%' as const,
      borderRadius: 12,
    },
    overlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    icon: {
      marginBottom: 4,
    },
    title: {
      fontSize,
      fontWeight: '600' as const,
      color: colors.text,
      textAlign: 'center' as const,
      paddingHorizontal: 4,
    },
    titleWithImage: {
      fontSize,
      fontWeight: '600' as const,
      color: colors.white,
      textAlign: 'center' as const,
      paddingHorizontal: 4,
    },
    count: {
      fontSize: fontSize - 2,
      color: colors.textSecondary,
      marginTop: 2,
    },
    countWithImage: {
      fontSize: fontSize - 2,
      color: colors.white,
      marginTop: 2,
      opacity: 0.9,
    },
  };

  const renderContent = () => {
    if (image) {
      return (
        <>
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
          <View style={styles.overlay}>
            <LucideIcon size={iconSize} color="#fff" style={styles.icon} />
            <Text style={styles.titleWithImage}>{title}</Text>
            {count !== undefined && (
              <Text style={styles.countWithImage}>{count} ilan</Text>
            )}
          </View>
        </>
      );
    }

    return (
      <LinearGradient
        colors={gradientColors as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { padding: 0 }]}
      >
        <LucideIcon size={iconSize} color="#fff" style={styles.icon} />
        <Text style={styles.titleWithImage}>{title}</Text>
        {count !== undefined && (
          <Text style={styles.countWithImage}>{count} ilan</Text>
        )}
      </LinearGradient>
    );
  };

  return (
    <TouchableOpacity style={{ borderRadius: 12, overflow: 'hidden' }} onPress={onPress} activeOpacity={0.8}>
      {renderContent()}
    </TouchableOpacity>
  );
};

export default CategoryCard; 