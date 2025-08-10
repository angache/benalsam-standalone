import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Save, Shield, Lock, Smartphone, LogOut, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/stores';

const SecuritySettings = () => {
  const { currentUser } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (newPassword !== confirmPassword) {
      toast({ title: "Şifreler Eşleşmiyor", description: "Yeni şifre ve tekrarı aynı olmalıdır.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Şifre Çok Kısa", description: "Yeni şifreniz en az 6 karakter olmalıdır.", variant: "destructive" });
      return;
    }

    setIsUpdatingPassword(true);
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setIsUpdatingPassword(false);
    if (error) {
      toast({ title: "Şifre Değiştirme Hatası", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Şifre Başarıyla Değiştirildi!", description: "Yeni şifrenizle giriş yapabilirsiniz." });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };
  
  const handleNotImplemented = () => {
    toast({ title: "🚧 Bu özellik henüz uygulanmadı—ama merak etme! Bir sonraki istekte talep edebilirsin! 🚀" });
  };

  return (
    <div className="space-y-10">
      <form onSubmit={handleChangePassword} className="space-y-6 p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium flex items-center"><Lock className="w-5 h-5 mr-2 text-primary" /> Şifreyi Değiştir</h3>
        <div>
          <label htmlFor="newPassword">Yeni Şifre</label>
          <Input 
            id="newPassword" 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            placeholder="Yeni şifreniz" 
            required 
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Yeni Şifreyi Tekrarla</label>
          <Input 
            id="confirmPassword" 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            placeholder="Yeni şifrenizi tekrar girin" 
            required 
          />
        </div>
        <Button type="submit" disabled={isUpdatingPassword} className="btn-primary w-full sm:w-auto">
          {isUpdatingPassword ? <KeyRound className="w-4 h-4 mr-2 animate-pulse" /> : <Save className="w-4 h-4 mr-2" />}
          Şifreyi Kaydet
        </Button>
      </form>

      <div className="p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-3 flex items-center"><Smartphone className="w-5 h-5 mr-2 text-primary" /> İki Aşamalı Doğrulama (2FA)</h3>
        <p className="text-sm text-muted-foreground mb-4">Hesabınıza ekstra bir güvenlik katmanı ekleyin.</p>
        <Button variant="outline" onClick={handleNotImplemented}>2FA Ayarlarını Yönet (Yakında)</Button>
      </div>

      <div className="p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-3 flex items-center"><LogOut className="w-5 h-5 mr-2 text-primary" /> Aktif Oturumlar</h3>
        <p className="text-sm text-muted-foreground mb-4">Diğer cihazlardaki aktif oturumlarınızı yönetin.</p>
        <Button variant="outline" onClick={handleNotImplemented}>Oturumları Yönet (Yakında)</Button>
      </div>
      
      <div className="p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-3 flex items-center"><Shield className="w-5 h-5 mr-2 text-primary" /> Giriş Yöntemleri</h3>
        <p className="text-sm text-muted-foreground mb-4">Google, Facebook gibi sosyal medya hesaplarınızla giriş bağlantılarınızı yönetin.</p>
        <Button variant="outline" onClick={handleNotImplemented}>Giriş Yöntemlerini Yönet (Yakında)</Button>
      </div>
    </div>
  );
};

export default SecuritySettings;