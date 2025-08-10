// Tailwind CSS renk değerlerini CSS gradient'e çeviren utility
export const getColorStyle = (colorValue: string): string => {
  if (!colorValue) return '#6b7280'; // Default gray

  // Tailwind gradient formatını CSS gradient'e çevir
  const colorMap: Record<string, string> = {
    'from-blue-500 to-cyan-500': 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    'from-green-500 to-emerald-500': 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
    'from-purple-500 to-pink-500': 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    'from-orange-500 to-red-500': 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
    'from-yellow-500 to-orange-500': 'linear-gradient(135deg, #eab308 0%, #f97316 100%)',
    'from-indigo-500 to-purple-500': 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    'from-pink-500 to-rose-500': 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    'from-gray-500 to-slate-500': 'linear-gradient(135deg, #6b7280 0%, #64748b 100%)',
    'from-teal-500 to-cyan-500': 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
    'from-amber-500 to-orange-500': 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  };

  return colorMap[colorValue] || colorValue;
};

// Renk adını döndüren utility
export const getColorName = (colorValue: string): string => {
  const colorNames: Record<string, string> = {
    'from-blue-500 to-cyan-500': 'Mavi',
    'from-green-500 to-emerald-500': 'Yeşil',
    'from-purple-500 to-pink-500': 'Mor',
    'from-orange-500 to-red-500': 'Turuncu',
    'from-yellow-500 to-orange-500': 'Sarı',
    'from-indigo-500 to-purple-500': 'İndigo',
    'from-pink-500 to-rose-500': 'Pembe',
    'from-gray-500 to-slate-500': 'Gri',
    'from-teal-500 to-cyan-500': 'Teal',
    'from-amber-500 to-orange-500': 'Amber',
  };

  return colorNames[colorValue] || colorValue;
}; 