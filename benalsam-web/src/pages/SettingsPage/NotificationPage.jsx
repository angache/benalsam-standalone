import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Bell,
  BellOff,
  Mail,
  Smartphone,
  MessageCircle,
  Star,
  Settings,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores';

const NotificationPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  
  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState({
    new_offer_push: true,
    new_offer_email: true,
    new_message_push: true,
    new_message_email: true,
    review_push: true,
    review_email: true,
    summary_emails: 'weekly'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      if (!currentUser) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error loading notification preferences:', error);
        return;
      }

      if (profile?.notification_preferences) {
        setNotificationPreferences(prev => ({
          ...prev,
          ...profile.notification_preferences
        }));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key) => {
    triggerHaptic();
    setNotificationPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };

  const handleSummaryEmailsChange = (value) => {
    triggerHaptic();
    setNotificationPreferences(prev => ({
      ...prev,
      summary_emails: value
    }));
    setHasChanges(true);
  };

  const handleDisableAll = () => {
    triggerHaptic();
    setNotificationPreferences(prev => ({
      ...prev,
      new_offer_push: false,
      new_offer_email: false,
      new_message_push: false,
      new_message_email: false,
      review_push: false,
      review_email: false
    }));
    setHasChanges(true);
  };

  const handleEnableAll = () => {
    triggerHaptic();
    setNotificationPreferences(prev => ({
      ...prev,
      new_offer_push: true,
      new_offer_email: true,
      new_message_push: true,
      new_message_email: true,
      review_push: true,
      review_email: true
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
          notification_preferences: notificationPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) {
        console.error('Error saving notification preferences:', error);
        alert('Bildirim ayarları kaydedilirken bir hata oluştu.');
        return;
      }

      setHasChanges(false);
      alert('Bildirim ayarları başarıyla kaydedildi!');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      alert('Bildirim ayarları kaydedilirken bir hata oluştu.');
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

  const renderToggleItem = (title, subtitle, key, icon) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div
        onClick={() => handleToggle(key)}
        className={`relative w-11 h-6 rounded-full transition-all duration-200 ease-in-out cursor-pointer ${
          notificationPreferences[key]
            ? 'bg-primary'
            : 'bg-gray-200 dark:bg-gray-700'
        }`}
        style={{ minWidth: '44px', minHeight: '24px' }}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ease-in-out ${
            notificationPreferences[key] ? 'translate-x-5' : 'translate-x-0'
          }`}
          style={{ minWidth: '20px', minHeight: '20px' }}
        />
      </div>
    </div>
  );

  const renderSummaryEmailsSelector = () => (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Mail size={20} className="text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white">Özet E-postaları</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Haftalık aktivite özeti</p>
        </div>
      </div>
      <div className="flex space-x-2">
        {[
          { value: 'never', label: 'Hiç' },
          { value: 'weekly', label: 'Haftalık' },
          { value: 'daily', label: 'Günlük' }
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => handleSummaryEmailsChange(option.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              notificationPreferences.summary_emails === option.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
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
          <h1 className="text-xl font-semibold">Bildirimler</h1>
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

      {/* Quick Actions */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={handleEnableAll}
          className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
        >
          Tümünü Aç
        </button>
        <button
          onClick={handleDisableAll}
          className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
        >
          Tümünü Kapat
        </button>
      </div>

      {/* Notification Categories */}
      <div className="space-y-4">
        {/* New Offers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-primary" />
            Yeni Teklif Bildirimleri
          </h2>
          <div className="space-y-3">
            {renderToggleItem(
              'Push Bildirimleri',
              'Mobil uygulama veya tarayıcı bildirimi',
              'new_offer_push',
              <Smartphone size={20} className="text-primary" />
            )}
            {renderToggleItem(
              'E-posta Bildirimleri',
              'E-posta ile bildirim al',
              'new_offer_email',
              <Mail size={20} className="text-primary" />
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-primary" />
            Mesaj Bildirimleri
          </h2>
          <div className="space-y-3">
            {renderToggleItem(
              'Push Bildirimleri',
              'Mobil uygulama veya tarayıcı bildirimi',
              'new_message_push',
              <Smartphone size={20} className="text-primary" />
            )}
            {renderToggleItem(
              'E-posta Bildirimleri',
              'E-posta ile bildirim al',
              'new_message_email',
              <Mail size={20} className="text-primary" />
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-primary" />
            Değerlendirme Bildirimleri
          </h2>
          <div className="space-y-3">
            {renderToggleItem(
              'Push Bildirimleri',
              'Mobil uygulama veya tarayıcı bildirimi',
              'review_push',
              <Smartphone size={20} className="text-primary" />
            )}
            {renderToggleItem(
              'E-posta Bildirimleri',
              'E-posta ile bildirim al',
              'review_email',
              <Mail size={20} className="text-primary" />
            )}
          </div>
        </div>

        {/* Summary Emails */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-primary" />
            Özet E-postaları
          </h2>
          {renderSummaryEmailsSelector()}
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

export default NotificationPage; 