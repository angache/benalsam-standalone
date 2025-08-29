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
  Sparkles,
  Loader2,
  Eye,
  Zap
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useThemeStore } from '../../stores/themeStore';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../components/ui/use-toast';

const ThemePage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { themeMode, toggleTheme, setTheme } = useThemeStore();
  const { toast } = useToast();
  
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
      
      toast({
        title: "Başarılı!",
        description: "Tema başarıyla değiştirildi!",
      });
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: "Hata",
        description: "Tema değiştirilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleGoBack = () => {
    if (hasChanges) {
      const confirmed = window.confirm('Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinizden emin misiniz?');
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

  const renderThemeCard = (themeOption, index) => {
    const isSelected = selectedTheme === themeOption.id;
    const IconComponent = themeOption.icon;

    return (
      <motion.div
        key={themeOption.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ 
          scale: 1.02,
          y: -5,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleThemeSelect(themeOption.id)}
      >
        <Card className={`relative cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'border-primary bg-primary/5 shadow-lg'
            : 'border-0 shadow-sm hover:shadow-md'
        }`}>
          <CardContent className="p-6">
            {/* Selection Indicator */}
            {isSelected && (
              <motion.div 
                className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, type: "spring" }}
              >
                <Check size={16} className="text-white" />
              </motion.div>
            )}

            {/* Theme Preview */}
            <div className={`w-full h-20 rounded-lg mb-4 ${themeOption.preview} flex items-center justify-center`}>
              <IconComponent size={32} className={themeOption.id === 'auto' ? 'text-gray-600' : 'text-gray-400'} />
            </div>

            {/* Theme Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <IconComponent size={20} className="text-primary" />
                <h3 className="font-semibold text-foreground">{themeOption.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{themeOption.description}</p>
            </div>

            {/* Features */}
            <div className="mt-4 space-y-1">
              {themeOption.features.map((feature, featureIndex) => (
                <motion.div 
                  key={featureIndex} 
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: featureIndex * 0.1 }}
                >
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  <span className="text-xs text-muted-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderInfoCard = (title, description, icon) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">{title}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

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
          onClick={handleGoBack}
          className="hover:bg-accent"
        >
          <ArrowLeft size={20} />
        </Button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold text-foreground">Tema Seçimi</h1>
        </div>

        <Button
          variant={hasChanges ? "default" : "secondary"}
          size="icon"
          onClick={handleSave}
          disabled={!hasChanges}
          className="hover:bg-accent"
        >
          <Save size={20} />
        </Button>
      </motion.div>

      {/* Info Card */}
      {renderInfoCard(
        'Tema Seçimi',
        'Görsel deneyiminizi kişiselleştirin. Tema seçiminiz tüm uygulamada geçerli olacaktır.',
        <Palette size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {/* Theme Options */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {themes.map((theme, index) => renderThemeCard(theme, index))}
      </motion.div>

      {/* Theme Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Theme Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Palette size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Mevcut Tema</h3>
                  <p className="text-sm text-muted-foreground">
                    {themes.find(t => t.id === themeMode)?.name || 'Bilinmeyen Tema'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="text-primary border-primary/20">
                  Aktif
                </Badge>
                <div className="text-sm font-medium text-primary mt-1">
                  {themes.find(t => t.id === themeMode)?.name || 'Bilinmeyen'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Indicator */}
      {hasChanges && (
        <motion.div 
          className="fixed bottom-4 left-4 right-4 z-50"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-500 to-amber-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={20} className="text-white" />
                  <span className="text-white font-medium">Kaydedilmemiş tema değişikliği var</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSave}
                  className="bg-white text-yellow-500 hover:bg-gray-100"
                >
                  Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ThemePage; 