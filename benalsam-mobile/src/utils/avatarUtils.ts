export const generateAvatarUrl = (name: string | undefined | null, size: number = 40): string => {
  const fallbackName = name?.replace(/\s+/g, '') || 'user';
  // Use UI Avatars as it's more reliable for mobile
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&size=${size}&background=ff6b35&color=ffffff&bold=true&format=png`;
};

export const getInitials = (name: string | undefined | null): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}; 