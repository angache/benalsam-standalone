import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Save, BellOff, BellRing, Mail, Smartphone } from 'lucide-react';
import { useAuthStore } from '@/stores';

const defaultPreferences = {
  new_offer_email: true,
  new_offer_push: true,
  new_message_email: true,
  new_message_push: true,
  review_notifications_email: true,
  review_notifications_push: true,
  summary_emails: "weekly" 
};

const NotificationSettings = () => {
  const { currentUser, setCurrentUser } = useAuthStore();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser && currentUser.notification_preferences) {
      setPreferences(prev => ({ ...defaultPreferences, ...currentUser.notification_preferences }));
    } else if (currentUser) {
      setPreferences(defaultPreferences);
    }
    setIsLoading(false);
  }, [currentUser]);

  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };
  
  const handleDisableAll = () => {
    const allDisabled = Object.keys(preferences).reduce((acc, key) => {
      if (typeof preferences[key] === 'boolean') {
        acc[key] = false;
      } else {
        acc[key] = preferences[key]; // Keep non-boolean values (like summary_emails)
      }
      return acc;
    }, {});
    setPreferences(allDisabled);
  };

  const handleSaveChanges = async () => {
    if (!currentUser) return;

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ notification_preferences: preferences })
      .eq('id', currentUser.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Güncelleme Hatası", description: error.message, variant: "destructive" });
    } else if (updatedProfile) {
      setCurrentUser(prev => ({ ...prev, ...updatedProfile }));
      toast({ title: "Bildirim Ayarları Güncellendi", description: "Değişiklikler başarıyla kaydedildi." });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;
  }
  
  const SettingRow = ({ id, label, subLabel, checked, onCheckedChange, type = "switch" }) => (
    <div className="flex items-center justify-between p-4 border-b border-border/50 last:border-b-0">
      <div>
        <Label htmlFor={id} className="text-base font-medium">{label}</Label>
        {subLabel && <p className="text-xs text-muted-foreground">{subLabel}</p>}
      </div>
      {type === "switch" && <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />}
    </div>
  );


  return (
    <div className="space-y-8">
      <div className="p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-1 flex items-center"><BellRing className="w-5 h-5 mr-2 text-primary" /> Yeni Teklif Bildirimleri</h3>
        <SettingRow id="new_offer_email" label="E-posta ile Bildir" checked={preferences.new_offer_email} onCheckedChange={() => handleToggle('new_offer_email')} />
        <SettingRow id="new_offer_push" label="Anlık Bildirim (Push)" subLabel="Mobil uygulama veya tarayıcı bildirimi" checked={preferences.new_offer_push} onCheckedChange={() => handleToggle('new_offer_push')} />
      </div>

      <div className="p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-1 flex items-center"><Mail className="w-5 h-5 mr-2 text-primary" /> Mesaj Bildirimleri</h3>
        <SettingRow id="new_message_email" label="E-posta ile Bildir" checked={preferences.new_message_email} onCheckedChange={() => handleToggle('new_message_email')} />
        <SettingRow id="new_message_push" label="Anlık Bildirim (Push)" checked={preferences.new_message_push} onCheckedChange={() => handleToggle('new_message_push')} />
      </div>
      
      <div className="p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-1 flex items-center"><Smartphone className="w-5 h-5 mr-2 text-primary" /> Yorum ve Değerlendirme Bildirimleri</h3>
        <SettingRow id="review_notifications_email" label="E-posta ile Bildir" checked={preferences.review_notifications_email} onCheckedChange={() => handleToggle('review_notifications_email')} />
        <SettingRow id="review_notifications_push" label="Anlık Bildirim (Push)" checked={preferences.review_notifications_push} onCheckedChange={() => handleToggle('review_notifications_push')} />
      </div>

      <div className="p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-3">Özet E-postaları</h3>
         <select 
            id="summary_emails"
            value={preferences.summary_emails} 
            onChange={(e) => handleSelectChange('summary_emails', e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background focus:ring-primary focus:border-primary"
          >
            <option value="daily">Günlük</option>
            <option value="weekly">Haftalık</option>
            <option value="monthly">Aylık</option>
            <option value="never">Hiçbir Zaman</option>
          </select>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-border/50">
        <Button variant="outline" onClick={handleDisableAll} className="w-full sm:w-auto">
          <BellOff className="w-4 h-4 mr-2" /> Tüm Bildirimleri Kapat
        </Button>
        <Button onClick={handleSaveChanges} className="btn-primary w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" /> Değişiklikleri Kaydet
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;