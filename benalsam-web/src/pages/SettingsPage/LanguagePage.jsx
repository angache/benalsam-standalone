import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Globe } from 'lucide-react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

const languages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

const LanguagePage = () => {
  const navigate = useNavigate();
  const { preferences, updatePreferences } = useUserPreferences();
  const { triggerHaptic } = useHapticFeedback();
  const [selectedLanguage, setSelectedLanguage] = useState(preferences.language || 'tr');

  console.log('🔍 [LanguagePage] Component rendering...');
  console.log('🔍 [LanguagePage] preferences:', preferences);
  console.log('🔍 [LanguagePage] selectedLanguage:', selectedLanguage);

  const handleLanguageSelect = (languageCode) => {
    console.log('🔍 [LanguagePage] handleLanguageSelect called with:', languageCode);
    triggerHaptic();
    setSelectedLanguage(languageCode);
    updatePreferences({ language: languageCode });
    
    // Kısa bir gecikme ile geri dön
    setTimeout(() => {
      navigate('/ayarlar2');
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/ayarlar2')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Globe size={24} className="text-primary" />
          <h1 className="text-xl font-semibold">Dil Seçimi</h1>
        </div>
      </div>

      {/* Language List */}
      <div className="space-y-2">
        {languages.map((language) => (
          <motion.button
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            className={`w-full p-4 rounded-lg border transition-all duration-200 ${
              selectedLanguage === language.code
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
              </div>
              {selectedLanguage === language.code && (
                <Check size={20} className="text-primary" />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Dil değişikliği tüm uygulamada geçerli olacaktır. Değişiklik anında uygulanır.
        </p>
      </div>
    </motion.div>
  );
};

export default LanguagePage; 