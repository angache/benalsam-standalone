import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Eye,
  EyeOff,
  Phone,
  MapPin,
  MessageCircle,
  Shield,
  Lock,
  User,
  Save,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  Users,
  Search,
  Clock
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../components/ui/use-toast';

const PrivacyPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  const { toast } = useToast();
  
  // Privacy preferences state
  const [privacyPreferences, setPrivacyPreferences] = useState({
    show_phone: false,
    show_location: false,
    allow_messages: true,
    show_profile_views: false,
    allow_search_indexing: true,
    show_online_status: true
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPrivacyPreferences();
  }, []);

  const loadPrivacyPreferences = async () => {
    try {
      if (!currentUser) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('privacy_preferences')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error loading privacy preferences:', error);
        return;
      }

      if (profile?.privacy_preferences) {
        setPrivacyPreferences(prev => ({
          ...prev,
          ...profile.privacy_preferences
        }));
      }
    } catch (error) {
      console.error('Error loading privacy preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key) => {
    triggerHaptic();
    setPrivacyPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentUser || !hasChanges) return;

    try {
      setIsSaving(true);
      triggerHaptic();

      const { error } = await supabase
        .from('profiles')
        .update({
          privacy_preferences: privacyPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) {
        console.error('Error saving privacy preferences:', error);
        toast({
          title: "Hata",
          description: "Gizlilik ayarları kaydedilirken bir hata oluştu.",
          variant: "destructive",
        });
        return;
      }

      setHasChanges(false);
      toast({
        title: "Başarılı!",
        description: "Gizlilik ayarları başarıyla kaydedildi!",
      });
    } catch (error) {
      console.error('Error saving privacy preferences:', error);
      toast({
        title: "Hata",
        description: "Gizlilik ayarları kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    if (hasChanges) {
      const confirmed = window.confirm('Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinizden emin misiniz?');
      if (!confirmed) return;
    }
    navigate('/ayarlar');
  };

  const renderToggleItem = (title, subtitle, key, icon, description = '', index) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
                {description && (
                  <p className="text-xs text-muted-foreground/60 mt-1">{description}</p>
                )}
              </div>
            </div>
            <Switch
              checked={privacyPreferences[key]}
              onCheckedChange={() => handleToggle(key)}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <h1 className="text-xl font-semibold text-foreground">Gizlilik</h1>
        </div>

        <Button
          variant={hasChanges && !isSaving ? "default" : "secondary"}
          size="icon"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="hover:bg-accent"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save size={20} />
          )}
        </Button>
      </motion.div>

      {/* Info Card */}
      {renderInfoCard(
        'Gizlilik Ayarları',
        'Hesabınızın görünürlüğünü ve veri paylaşımınızı kontrol edin.',
        <Shield size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {/* Privacy Settings */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Profile Visibility */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary" />
              Profil Görünürlüğü
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderToggleItem(
              'Telefon Numarası',
              'Telefon numaranızın diğer kullanıcılara görünürlüğü',
              'show_phone',
              <Phone size={20} className="text-primary" />,
              'Açıkken telefon numaranız profilinizde görünür',
              0
            )}
            {renderToggleItem(
              'Konum Bilgisi',
              'Konumunuzun diğer kullanıcılara görünürlüğü',
              'show_location',
              <MapPin size={20} className="text-primary" />,
              'Açıkken il/ilçe bilginiz profilinizde görünür',
              1
            )}
            {renderToggleItem(
              'Çevrimiçi Durumu',
              'Çevrimiçi durumunuzun görünürlüğü',
              'show_online_status',
              <Clock size={20} className="text-primary" />,
              'Açıkken çevrimiçi olduğunuz görünür',
              2
            )}
          </CardContent>
        </Card>

        {/* Communication */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-primary" />
              İletişim Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderToggleItem(
              'Mesajlaşma',
              'Diğer kullanıcıların size mesaj gönderebilmesi',
              'allow_messages',
              <MessageCircle size={20} className="text-primary" />,
              'Kapalıyken sadece takas yaptığınız kişiler mesaj gönderebilir',
              0
            )}
          </CardContent>
        </Card>

        {/* Data & Analytics */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Lock className="w-5 h-5 mr-2 text-primary" />
              Veri ve Analitik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderToggleItem(
              'Profil Görüntülemeleri',
              'Profilinizin kaç kez görüntülendiğini göster',
              'show_profile_views',
              <Eye size={20} className="text-primary" />,
              'Açıkken profil görüntüleme sayınızı görebilirsiniz',
              0
            )}
            {renderToggleItem(
              'Arama Dizini',
              'Profilinizin arama sonuçlarında görünmesi',
              'allow_search_indexing',
              <Search size={20} className="text-primary" />,
              'Kapalıyken arama sonuçlarında görünmezsiniz',
              1
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Privacy Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
                <Info size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100">Gizlilik İpuçları</h3>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                  <li>• Telefon numaranızı sadece güvendiğiniz kişilerle paylaşın</li>
                  <li>• Konum bilginizi paylaşırken dikkatli olun</li>
                  <li>• Mesajlaşma ayarlarınızı düzenli kontrol edin</li>
                  <li>• Şüpheli aktiviteleri hemen bildirin</li>
                </ul>
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
                  <span className="text-white font-medium">Kaydedilmemiş değişiklikler var</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-white text-yellow-500 hover:bg-gray-100"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    'Kaydet'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PrivacyPage; 