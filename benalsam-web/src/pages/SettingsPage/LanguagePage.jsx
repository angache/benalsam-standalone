import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Check, 
  Globe, 
  Languages,
  Loader2,
  Info
} from 'lucide-react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../components/ui/use-toast';

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  console.log('🔍 [LanguagePage] Component rendering...');
  console.log('🔍 [LanguagePage] preferences:', preferences);
  console.log('🔍 [LanguagePage] selectedLanguage:', selectedLanguage);

  const handleLanguageSelect = async (languageCode) => {
    console.log('🔍 [LanguagePage] handleLanguageSelect called with:', languageCode);
    triggerHaptic();
    setIsLoading(true);

    try {
      await updatePreferences({ language: languageCode });
      setSelectedLanguage(languageCode);
      toast({
        title: 'Dil değiştirildi',
        description: 'Uygulama yeniden başlatılmadan dil değişikliği uygulandı.',
      });

      // Kısa bir gecikme ile geri dön
      setTimeout(() => {
        navigate('/ayarlar');
      }, 300);
    } catch (error) {
      console.error('Error updating language:', error);
      toast({
        title: 'Hata',
        description: 'Dil değiştirilirken bir hata oluştu.',
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
          <h1 className="text-xl font-semibold text-foreground">Dil Seçimi</h1>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </motion.div>

      {/* Language List */}
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
          languages.map((language, index) => (
            <motion.div
              key={language.code}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedLanguage === language.code
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleLanguageSelect(language.code)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{language.flag}</span>
                      <div>
                        <span className="font-medium text-foreground">{language.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {language.code.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    {selectedLanguage === language.code && (
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
              <Languages size={20} className="text-primary" />
              <CardTitle className="text-lg text-blue-900 dark:text-blue-100">Dil Ayarları</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Dil değişikliği tüm uygulamada geçerli olacaktır. Değişiklik anında uygulanır.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default LanguagePage; 