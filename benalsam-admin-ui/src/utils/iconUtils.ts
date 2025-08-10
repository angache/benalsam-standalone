import * as LucideIcons from 'lucide-react';

export const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Folder; // Fallback to Folder if icon not found
};

export const isValidIcon = (iconName: string) => {
  return !!(LucideIcons as any)[iconName];
}; 