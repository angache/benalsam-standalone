import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  Save,
  AlertCircle,
  Info,
  Sparkles
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useThemeStore } from '../../stores/themeStore';

const ThemePage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { themeMode, toggleTheme, setTheme } = useThemeStore();
  
  const [selectedTheme, setSelectedTheme] = useState(themeMode);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSelectedTheme(themeMode);
  }, [themeMode]);

  const handleThemeSelect = (newTheme) => {
    triggerHaptic();
    setSelectedTheme(newTheme);
    setHasChanges(newTheme !== themeMode);
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      triggerHaptic();
      setTheme(selectedTheme);
      setHasChanges(false);
      
      alert('Tema başarıyla değiştirildi!');
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Tema değiştirilirken bir hata oluştu.');
    }
  };

  const handleGoBack = () => {
    if (hasChanges) {
      const confirmed = confirm('Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinizden emin misiniz?');
      if (!confirmed) return;
    }
    navigate('/ayarlar');
  };

  const themes = [
    {
      id: 'light',
      name: 'Açık Tema',
      description: 'Parlak ve temiz görünüm',
      icon: Sun,
      preview: 'bg-white border-gray-200',
      features: [
        'Göz yorgunluğunu azaltır',
        'Güneşli ortamlarda daha iyi görünür',
        'Minimalist tasarım'
      ]
    },
    {
      id: 'dark',
      name: 'Koyu Tema',
      description: 'Göz dostu karanlık görünüm',
      icon: Moon,
      preview: 'bg-gray-900 border-gray-700',
      features: [
        'Gece kullanımı için ideal',
        'Pil tasarrufu sağlar',
        'Modern görünüm'
      ]
    },
    {
      id: 'auto',
      name: 'Otomatik',
      description: 'Sistem ayarlarına göre değişir',
      icon: Monitor,
      preview: 'bg-gradient-to-r from-gray-100 to-gray-900 border-gray-300',
      features: [
        'Sistem temasını takip eder',
        'Otomatik geçiş yapar',
        'Akıllı tema seçimi'
      ]
    }
  ];

  const renderThemeCard = (themeOption) => {
    const isSelected = selectedTheme === themeOption.id;
    const IconComponent = themeOption.icon;

    return (
      <motion.div
        key={themeOption.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleThemeSelect(themeOption.id)}
        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Check size={16} className="text-white" />
          </div>
        )}

        {/* Theme Preview */}
        <div className={`w-full h-20 rounded-lg mb-4 ${themeOption.preview} flex items-center justify-center`}>
          <IconComponent size={32} className={themeOption.id === 'auto' ? 'text-gray-600' : 'text-gray-400'} />
        </div>

        {/* Theme Info */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <IconComponent size={20} className="text-primary" />
            <h3 className="font-semibold text-gray-900 dark:text-white">{themeOption.name}</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{themeOption.description}</p>
        </div>

        {/* Features */}
        <div className="mt-4 space-y-1">
          {themeOption.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{feature}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderInfoCard = (title, description, icon) => (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 dark:text-blue-100">{title}</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleGoBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold">Tema Seçimi</h1>
        </div>

        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`p-2 rounded-lg transition-colors ${
            hasChanges
              ? 'bg-primary text-white hover:bg-primary/80'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Save size={20} />
        </button>
      </div>

      {/* Info Card */}
      {renderInfoCard(
        'Tema Seçimi',
        'Görsel deneyiminizi kişiselleştirin. Tema seçiminiz tüm uygulamada geçerli olacaktır.',
        <Palette size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {/* Theme Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map(renderThemeCard)}
      </div>

      {/* Theme Tips */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
            <Sparkles size={20} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-yellow-900 dark:text-yellow-100">Tema İpuçları</h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
              <li>• Açık tema güneşli ortamlarda daha iyi görünür</li>
              <li>• Koyu tema gece kullanımı için idealdir</li>
              <li>• Otomatik tema sistem ayarlarınızı takip eder</li>
              <li>• Tema değişikliği anında uygulanır</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current Theme Display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Palette size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Mevcut Tema</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {themes.find(t => t.id === themeMode)?.name || 'Bilinmeyen Tema'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 dark:text-gray-500">Aktif</div>
            <div className="text-sm font-medium text-primary">
              {themes.find(t => t.id === themeMode)?.name || 'Bilinmeyen'}
            </div>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      {hasChanges && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-500 text-white p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} />
            <span>Kaydedilmemiş tema değişikliği var</span>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-1 bg-white text-yellow-500 rounded font-medium hover:bg-gray-100 transition-colors"
          >
            Kaydet
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ThemePage; 