import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Lock,
  Eye,
  EyeOff,
  Shield,
  Smartphone,
  LogOut,
  KeyRound,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores';

const SecurityPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  const [userProfile, setUserProfile] = useState(null);
  
  // Refresh user data to get latest 2FA status
  const refreshUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
          console.log('✅ User profile refreshed:', profile);
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Refresh user data on component mount
  React.useEffect(() => {
    refreshUserData();
  }, []);

  const validatePasswords = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { valid: false, message: 'Lütfen tüm alanları doldurun.' };
    }

    if (newPassword !== confirmPassword) {
      return { valid: false, message: 'Yeni şifreler eşleşmiyor.' };
    }

    if (newPassword.length < 8) {
      return { valid: false, message: 'Yeni şifre en az 8 karakter olmalıdır.' };
    }

    return { valid: true };
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    return strength;
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    triggerHaptic();
    
    const validation = validatePasswords();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    try {
      setIsUpdatingPassword(true);
      
      // Get current user email from session
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email;
      
      if (!userEmail) {
        alert('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      // Verify current password first (Supabase's official recommendation)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword
      });

      if (signInError) {
        alert('Mevcut şifre yanlış.');
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        let message = 'Şifre güncellenirken bir hata oluştu.';
        
        if (error.message?.includes('auth')) {
          message = 'Mevcut şifreniz yanlış.';
        } else if (error.message?.includes('weak-password')) {
          message = 'Yeni şifreniz çok zayıf. Lütfen daha güçlü bir şifre seçin.';
        }
        
        alert(message);
      } else {
        alert('Şifreniz başarıyla güncellendi!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordStrength(0);
      }
    } catch (error) {
      console.error('Password update error:', error);
      alert('Şifre güncellenirken bir hata oluştu.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleGoBack = () => {
    navigate('/ayarlar2');
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return 'Çok Zayıf';
    if (passwordStrength <= 50) return 'Zayıf';
    if (passwordStrength <= 75) return 'Orta';
    return 'Güçlü';
  };

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
          <h1 className="text-xl font-semibold">Güvenlik</h1>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Password Change Form */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-primary" />
            Şifreyi Değiştir
          </h2>
          
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mevcut Şifre
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Mevcut şifrenizi girin"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Yeni Şifre
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Yeni şifrenizi girin"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Şifre Gücü:</span>
                    <span className={passwordStrength >= 75 ? 'text-green-600' : passwordStrength >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Yeni Şifre (Tekrar)
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Yeni şifrenizi tekrar girin"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="mt-2 flex items-center text-sm">
                  {newPassword === confirmPassword ? (
                    <CheckCircle size={16} className="text-green-500 mr-2" />
                  ) : (
                    <AlertTriangle size={16} className="text-red-500 mr-2" />
                  )}
                  <span className={newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}>
                    {newPassword === confirmPassword ? 'Şifreler eşleşiyor' : 'Şifreler eşleşmiyor'}
                  </span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className={`w-full p-3 rounded-lg font-medium transition-colors ${
                isUpdatingPassword
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/80'
              }`}
            >
              {isUpdatingPassword ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Güncelleniyor...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Save size={16} className="mr-2" />
                  Şifreyi Güncelle
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Smartphone className="w-5 h-5 mr-2 text-primary" />
            İki Aşamalı Doğrulama (2FA)
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Hesabınıza ekstra bir güvenlik katmanı ekleyin. Google Authenticator veya benzeri uygulamalarla doğrulama yapabilirsiniz.
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${userProfile?.is_2fa_enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {userProfile?.is_2fa_enabled ? '2FA Aktif' : '2FA Pasif'}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={refreshUserData}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Yenile
              </button>
              <button
                onClick={() => navigate('/ayarlar2/guvenlik/2fa-setup')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
              >
                {userProfile?.is_2fa_enabled ? '2FA Ayarlarını Değiştir' : '2FA Kurulumu'}
              </button>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <LogOut className="w-5 h-5 mr-2 text-primary" />
            Aktif Oturumlar
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Diğer cihazlardaki aktif oturumlarınızı görüntüleyin ve yönetin.
          </p>
          <button
            onClick={() => alert('Bu özellik yakında eklenecek!')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Oturumları Yönet (Yakında)
          </button>
        </div>

        {/* Login Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" />
            Giriş Yöntemleri
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Google, Facebook gibi sosyal medya hesaplarınızla giriş bağlantılarınızı yönetin.
          </p>
          <button
            onClick={() => alert('Bu özellik yakında eklenecek!')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Giriş Yöntemlerini Yönet (Yakında)
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SecurityPage; 