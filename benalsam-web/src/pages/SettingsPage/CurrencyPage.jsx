import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, DollarSign } from 'lucide-react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

const currencies = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺', flag: '🇹🇷' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
];

const CurrencyPage = () => {
  const navigate = useNavigate();
  const { platformPreferences, updatePlatformPreference } = useUserPreferences();
  const { triggerHaptic } = useHapticFeedback();
  const [selectedCurrency, setSelectedCurrency] = useState(platformPreferences.currency || 'TRY');

  console.log('🔍 [CurrencyPage] Component rendering...');
  console.log('🔍 [CurrencyPage] platformPreferences:', platformPreferences);
  console.log('🔍 [CurrencyPage] selectedCurrency:', selectedCurrency);

  const handleCurrencySelect = (currencyCode) => {
    console.log('🔍 [CurrencyPage] handleCurrencySelect called with:', currencyCode);
    triggerHaptic();
    setSelectedCurrency(currencyCode);
    updatePlatformPreference('currency', currencyCode);
    
    // Kısa bir gecikme ile geri dön
    setTimeout(() => {
      navigate('/ayarlar');
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
          onClick={() => navigate('/ayarlar')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <DollarSign size={24} className="text-primary" />
          <h1 className="text-xl font-semibold">Para Birimi</h1>
        </div>
      </div>

      {/* Currency List */}
      <div className="space-y-2">
        {currencies.map((currency) => (
          <motion.button
            key={currency.code}
            onClick={() => handleCurrencySelect(currency.code)}
            className={`w-full p-4 rounded-lg border transition-all duration-200 ${
              selectedCurrency === currency.code
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currency.flag}</span>
                <div>
                  <div className="font-medium">{currency.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {currency.symbol} {currency.code}
                  </div>
                </div>
              </div>
              {selectedCurrency === currency.code && (
                <Check size={20} className="text-primary" />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Para birimi değişikliği tüm fiyatlar ve tekliflerde geçerli olacaktır.
        </p>
      </div>
    </motion.div>
  );
};

export default CurrencyPage; 