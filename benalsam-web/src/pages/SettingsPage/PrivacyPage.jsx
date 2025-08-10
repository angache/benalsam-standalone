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
  Info
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores';

const PrivacyPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  
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
        alert('Gizlilik ayarları kaydedilirken bir hata oluştu.');
        return;
      }

      setHasChanges(false);
      alert('Gizlilik ayarları başarıyla kaydedildi!');
    } catch (error) {
      console.error('Error saving privacy preferences:', error);
      alert('Gizlilik ayarları kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    if (hasChanges) {
      const confirmed = confirm('Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinizden emin misiniz?');
      if (!confirmed) return;
    }
    navigate('/ayarlar2');
  };

  const renderToggleItem = (title, subtitle, key, icon, description = '') => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          {description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      <div
        onClick={() => handleToggle(key)}
        className={`relative w-11 h-6 rounded-full transition-all duration-200 ease-in-out cursor-pointer ${
          privacyPreferences[key]
            ? 'bg-primary'
            : 'bg-gray-200 dark:bg-gray-700'
        }`}
        style={{ minWidth: '44px', minHeight: '24px' }}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ease-in-out ${
            privacyPreferences[key] ? 'translate-x-5' : 'translate-x-0'
          }`}
          style={{ minWidth: '20px', minHeight: '20px' }}
        />
      </div>
    </div>
  );

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleGoBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold">Gizlilik</h1>
        </div>

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`p-2 rounded-lg transition-colors ${
            hasChanges && !isSaving
              ? 'bg-primary text-white hover:bg-primary/80'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={20} />
          )}
        </button>
      </div>

      {/* Info Card */}
      {renderInfoCard(
        'Gizlilik Ayarları',
        'Hesabınızın görünürlüğünü ve veri paylaşımınızı kontrol edin.',
        <Shield size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {/* Privacy Settings */}
      <div className="space-y-4">
        {/* Profile Visibility */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-primary" />
            Profil Görünürlüğü
          </h2>
          <div className="space-y-3">
            {renderToggleItem(
              'Telefon Numarası',
              'Telefon numaranızın diğer kullanıcılara görünürlüğü',
              'show_phone',
              <Phone size={20} className="text-primary" />,
              'Açıkken telefon numaranız profilinizde görünür'
            )}
            {renderToggleItem(
              'Konum Bilgisi',
              'Konumunuzun diğer kullanıcılara görünürlüğü',
              'show_location',
              <MapPin size={20} className="text-primary" />,
              'Açıkken il/ilçe bilginiz profilinizde görünür'
            )}
            {renderToggleItem(
              'Çevrimiçi Durumu',
              'Çevrimiçi durumunuzun görünürlüğü',
              'show_online_status',
              <CheckCircle size={20} className="text-primary" />,
              'Açıkken çevrimiçi olduğunuz görünür'
            )}
          </div>
        </div>

        {/* Communication */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-primary" />
            İletişim Ayarları
          </h2>
          <div className="space-y-3">
            {renderToggleItem(
              'Mesajlaşma',
              'Diğer kullanıcıların size mesaj gönderebilmesi',
              'allow_messages',
              <MessageCircle size={20} className="text-primary" />,
              'Kapalıyken sadece takas yaptığınız kişiler mesaj gönderebilir'
            )}
          </div>
        </div>

        {/* Data & Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-primary" />
            Veri ve Analitik
          </h2>
          <div className="space-y-3">
            {renderToggleItem(
              'Profil Görüntülemeleri',
              'Profilinizin kaç kez görüntülendiğini göster',
              'show_profile_views',
              <Eye size={20} className="text-primary" />,
              'Açıkken profil görüntüleme sayınızı görebilirsiniz'
            )}
            {renderToggleItem(
              'Arama Dizini',
              'Profilinizin arama sonuçlarında görünmesi',
              'allow_search_indexing',
              <Info size={20} className="text-primary" />,
              'Kapalıyken arama sonuçlarında görünmezsiniz'
            )}
          </div>
        </div>
      </div>

      {/* Privacy Tips */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
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
      </div>

      {/* Status Indicator */}
      {hasChanges && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-500 text-white p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} />
            <span>Kaydedilmemiş değişiklikler var</span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1 bg-white text-yellow-500 rounded font-medium hover:bg-gray-100 transition-colors"
          >
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default PrivacyPage; 