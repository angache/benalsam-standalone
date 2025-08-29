import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Check, 
  DollarSign, 
  Loader2,
  Coins,
  Info
} from 'lucide-react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/use-toast';

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  console.log('🔍 [CurrencyPage] Component rendering...');
  console.log('🔍 [CurrencyPage] platformPreferences:', platformPreferences);
  console.log('🔍 [CurrencyPage] selectedCurrency:', selectedCurrency);

  const handleCurrencySelect = async (currencyCode) => {
    console.log('🔍 [CurrencyPage] handleCurrencySelect called with:', currencyCode);
    triggerHaptic();
    setIsLoading(true);

    try {
      await updatePlatformPreference('currency', currencyCode);
      setSelectedCurrency(currencyCode);
      toast({
        title: 'Para birimi güncellendi',
        description: 'Varsayılan para biriminiz başarıyla güncellendi.',
      });

      // Kısa bir gecikme ile geri dön
      setTimeout(() => {
        navigate('/ayarlar');
      }, 300);
    } catch (error) {
      console.error('Error updating currency:', error);
      toast({
        title: 'Hata',
        description: 'Para birimi güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/ayarlar')}
          disabled={isLoading}
          className="hover:bg-accent"
        >
          <ArrowLeft size={20} />
        </Button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold text-foreground">Para Birimi</h1>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </motion.div>

      {/* Currency List */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          currencies.map((currency, index) => (
            <motion.div
              key={currency.code}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedCurrency === currency.code
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleCurrencySelect(currency.code)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{currency.flag}</span>
                      <div>
                        <div className="font-medium text-foreground">{currency.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {currency.symbol} {currency.code}
                        </Badge>
                      </div>
                    </div>
                    {selectedCurrency === currency.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check size={20} className="text-primary" />
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Coins size={20} className="text-primary" />
              <CardTitle className="text-lg text-blue-900 dark:text-blue-100">Para Birimi Ayarları</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Para birimi değişikliği tüm fiyatlar ve tekliflerde geçerli olacaktır.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CurrencyPage; 