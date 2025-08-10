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
  Book,
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
  Utensils,
  MoreHorizontal,
  Leaf,
  Anchor,
  Zap,
  Snowflake,
  Fish,
  PartyPopper,
  Pill,
  Microscope,
  Rocket,
  Shield,
} from "lucide-react-native";

// Attribute'ları içeren JSON dosyasını import et
// @ts-ignore
import newCategoriesData from './new-categories-no-input.json';

interface CategoryAttribute {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  options?: string[];
}

interface SubSubCategory {
  name: string;
  attributes?: CategoryAttribute[];
  subcategories?: SubSubCategory[];
}

interface SubCategory {
  name: string;
  icon?: any;
  attributes?: CategoryAttribute[];
  subcategories?: SubSubCategory[];
}

interface Category {
  name: string;
  icon: any;
  color: string;
  subcategories: SubCategory[];
}

// Icon mapping
const iconMap: { [key: string]: any } = {
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
  Book,
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
  Utensils,
  MoreHorizontal,
  Leaf,
  Anchor,
  Zap,
  Snowflake,
  Fish,
  PartyPopper,
  Pill,
  Microscope,
  Rocket,
  Shield,
};

// JSON verilerini TypeScript formatına dönüştür
const transformCategories = (categories: any[]): Category[] => {
  return categories.map(category => ({
    name: category.name,
    icon: iconMap[category.icon] || ShoppingBag,
    color: category.color,
    subcategories: category.subcategories?.map((sub: any) => ({
      name: sub.name,
      icon: iconMap[sub.icon],
      subcategories: sub.subcategories?.map((subSub: any) => ({
        name: subSub.name,
        attributes: subSub.attributes,
        subcategories: subSub.subcategories?.map((subSubSub: any) => ({
          name: subSubSub.name,
          attributes: subSubSub.attributes,
        })),
      })),
    })),
  }));
};

// Kategorileri oluştur
const categoriesConfig: Category[] = transformCategories(newCategoriesData);

// Utility fonksiyonları
const getCategoryPath = (
  categoryName: string,
  subCategoryName?: string,
  subSubCategoryName?: string
) => {
  let path = categoryName;
  if (subCategoryName) path += ` > ${subCategoryName}`;
  if (subSubCategoryName) path += ` > ${subSubCategoryName}`;
  return path;
};

const findCategoryByName = (name: string) => {
  return categoriesConfig.find((category) => category.name === name);
};

// Attribute'ları bulma fonksiyonu
const findCategoryAttributes = (categoryPath: string): CategoryAttribute[] | undefined => {
  const pathParts = categoryPath.split(' > ');
  
  if (pathParts.length === 1) {
    // Ana kategori
    return undefined;
  }
  
  const mainCategory = categoriesConfig.find(cat => cat.name === pathParts[0]);
  if (!mainCategory) return undefined;
  
  if (pathParts.length === 2) {
    // Alt kategori
    const subCat = mainCategory.subcategories?.find(sub => sub.name === pathParts[1]);
    return subCat?.attributes;
  } else if (pathParts.length === 3) {
    // Alt-alt kategori
    const subCat = mainCategory.subcategories?.find(sub => sub.name === pathParts[1]);
    const subSubCat = subCat?.subcategories?.find(subSub => subSub.name === pathParts[2]);
    return subSubCat?.attributes;
  } else if (pathParts.length === 4) {
    // Alt-alt-alt kategori
    const subCat = mainCategory.subcategories?.find(sub => sub.name === pathParts[1]);
    const subSubCat = subCat?.subcategories?.find(subSub => subSub.name === pathParts[2]);
    const subSubSubCat = subSubCat?.subcategories?.find(subSubSub => subSubSub.name === pathParts[3]);
    return subSubSubCat?.attributes;
  }
  
  return undefined;
};

export {
  categoriesConfig,
  getCategoryPath,
  findCategoryByName,
  findCategoryAttributes,
  type Category,
  type SubCategory,
  type SubSubCategory,
  type CategoryAttribute,
}; 