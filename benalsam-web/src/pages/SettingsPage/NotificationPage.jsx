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
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/use-toast';

const NotificationPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  const { toast } = useToast();
  
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
        toast({
          title: "Hata",
          description: "Bildirim ayarları kaydedilirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      setHasChanges(false);
      toast({
        title: "Başarılı",
        description: "Bildirim ayarları başarıyla kaydedildi!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: "Hata",
        description: "Bildirim ayarları kaydedilirken bir hata oluştu.",
        variant: "destructive"
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

  const renderToggleItem = (title, subtitle, key, icon) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <Switch
              checked={notificationPreferences[key]}
              onCheckedChange={() => handleToggle(key)}
              className="ml-4"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderSummaryEmailsSelector = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Özet E-postaları</h3>
              <p className="text-sm text-muted-foreground">Haftalık aktivite özeti</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {[
              { value: 'never', label: 'Hiç' },
              { value: 'weekly', label: 'Haftalık' },
              { value: 'daily', label: 'Günlük' }
            ].map((option) => (
              <Button
                key={option.value}
                onClick={() => handleSummaryEmailsChange(option.value)}
                variant={notificationPreferences.summary_emails === option.value ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="w-10 h-10 rounded-lg" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="flex space-x-2 mb-6">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
        </div>

        {/* Content Skeletons */}
        {[...Array(4)].map((_, sectionIndex) => (
          <Card key={sectionIndex} className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-6 w-48" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(2)].map((_, itemIndex) => (
                <div key={itemIndex} className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="w-11 h-6 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
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
        transition={{ duration: 0.3 }}
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
          <h1 className="text-xl font-semibold text-foreground">Bildirimler</h1>
        </div>

        <Button
          variant={hasChanges && !isSaving ? "default" : "secondary"}
          size="icon"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={20} />
          )}
        </Button>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="flex space-x-2 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Button
          onClick={handleEnableAll}
          variant="default"
          className="flex-1 bg-green-500 hover:bg-green-600"
        >
          <CheckCircle size={16} className="mr-2" />
          Tümünü Aç
        </Button>
        <Button
          onClick={handleDisableAll}
          variant="destructive"
          className="flex-1"
        >
          <BellOff size={16} className="mr-2" />
          Tümünü Kapat
        </Button>
      </motion.div>

      {/* Notification Categories */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* New Offers */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Bell className="w-5 h-5 mr-2 text-primary" />
              Yeni Teklif Bildirimleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MessageCircle className="w-5 h-5 mr-2 text-primary" />
              Mesaj Bildirimleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Star className="w-5 h-5 mr-2 text-primary" />
              Değerlendirme Bildirimleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        {/* Summary Emails */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="w-5 h-5 mr-2 text-primary" />
              Özet E-postaları
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderSummaryEmailsSelector()}
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Indicator */}
      {hasChanges && (
        <motion.div 
          className="fixed bottom-4 left-4 right-4 bg-yellow-500 text-white p-3 rounded-lg flex items-center justify-between shadow-lg"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} />
            <span className="font-medium">Kaydedilmemiş değişiklikler var</span>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="secondary"
            size="sm"
            className="bg-white text-yellow-500 hover:bg-gray-100"
          >
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default NotificationPage; 