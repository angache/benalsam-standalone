import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MessageCircle,
  Eye,
  EyeOff,
  Check,
  CheckCircle,
  Clock,
  Scroll,
  Save,
  AlertCircle,
  Info
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores';

const ChatSettingsPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  
  // Chat preferences state
  const [chatPreferences, setChatPreferences] = useState({
    read_receipts: true,
    show_last_seen: true,
    auto_scroll_messages: true
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadChatPreferences();
  }, []);

  const loadChatPreferences = async () => {
    try {
      if (!currentUser) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('chat_preferences')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error loading chat preferences:', error);
        return;
      }

      if (profile?.chat_preferences) {
        setChatPreferences(prev => ({
          ...prev,
          ...profile.chat_preferences
        }));
      }
    } catch (error) {
      console.error('Error loading chat preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key) => {
    triggerHaptic();
    setChatPreferences(prev => ({
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
          chat_preferences: chatPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) {
        console.error('Error saving chat preferences:', error);
        alert('Sohbet ayarları kaydedilirken bir hata oluştu.');
        return;
      }

      setHasChanges(false);
      alert('Sohbet ayarları başarıyla kaydedildi!');
    } catch (error) {
      console.error('Error saving chat preferences:', error);
      alert('Sohbet ayarları kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    if (hasChanges) {
      const confirmed = confirm('Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinizden emin misiniz?');
      if (!confirmed) return;
    }
    navigate('/ayarlar');
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
          chatPreferences[key]
            ? 'bg-primary'
            : 'bg-gray-200 dark:bg-gray-700'
        }`}
        style={{ minWidth: '44px', minHeight: '24px' }}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ease-in-out ${
            chatPreferences[key] ? 'translate-x-5' : 'translate-x-0'
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
          <h1 className="text-xl font-semibold">Sohbet Ayarları</h1>
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
        'Sohbet Ayarları',
        'Mesajlaşma deneyiminizi kişiselleştirin. Bu ayarlar diğer kullanıcıların sizi nasıl gördüğünü etkiler.',
        <MessageCircle size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {/* Chat Settings */}
      <div className="space-y-4">
        {/* Message Visibility */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-primary" />
            Mesaj Görünürlüğü
          </h2>
          <div className="space-y-3">
            {renderToggleItem(
              'Okundu Bilgisi',
              'Mesajlarınızın okunduğunu göster',
              'read_receipts',
              <CheckCircle size={20} className="text-primary" />,
              'Açıkken karşı taraf mesajınızın okunduğunu görebilir'
            )}
            {renderToggleItem(
              'Son Görülme',
              'Son görülme zamanınızı göster',
              'show_last_seen',
              <Clock size={20} className="text-primary" />,
              'Açıkken diğer kullanıcılar sizin son görülme zamanınızı görebilir'
            )}
          </div>
        </div>

        {/* Message Behavior */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Scroll className="w-5 h-5 mr-2 text-primary" />
            Mesaj Davranışı
          </h2>
          <div className="space-y-3">
            {renderToggleItem(
              'Otomatik Kaydırma',
              'Yeni mesaj geldiğinde otomatik kaydır',
              'auto_scroll_messages',
              <Scroll size={20} className="text-primary" />,
              'Açıkken yeni mesaj geldiğinde sohbet otomatik olarak aşağı kayar'
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
            <h3 className="font-medium text-yellow-900 dark:text-yellow-100">Sohbet İpuçları</h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
              <li>• Okundu bilgisi karşılıklı çalışır</li>
              <li>• Son görülme gizlilik ayarlarınızla uyumludur</li>
              <li>• Otomatik kaydırma uzun sohbetlerde faydalıdır</li>
              <li>• Bu ayarlar anında uygulanır</li>
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

export default ChatSettingsPage; 