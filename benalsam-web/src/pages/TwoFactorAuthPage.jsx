import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Key, Shield, Smartphone, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores';

const TwoFactorAuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verify2FA } = useAuthStore();
  
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');
  const password = searchParams.get('password');

  // Countdown timer for resend
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Auto-focus on input
  useEffect(() => {
    const input = document.getElementById('2fa-input');
    if (input) {
      input.focus();
    }
  }, []);

  const handle2FAVerification = async (e) => {
    e.preventDefault();
    
    if (!twoFactorCode.trim()) {
      toast({
        title: "Hata!",
        description: "Lütfen 2FA kodunu girin.",
        variant: "destructive"
      });
      return;
    }

    if (twoFactorCode.length !== 6) {
      toast({
        title: "Hata!",
        description: "2FA kodu 6 haneli olmalıdır.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const result = await verify2FA(userId, twoFactorCode, email, password);
    
    if (result.error) {
      toast({ 
        title: "2FA Doğrulama Başarısız", 
        description: result.error, 
        variant: "destructive" 
      });
      setTwoFactorCode('');
      // Reset focus
      setTimeout(() => {
        const input = document.getElementById('2fa-input');
        if (input) input.focus();
      }, 100);
    } else {
      toast({ 
        title: "Başarılı!", 
        description: "Güvenlik doğrulaması tamamlandı.", 
        variant: "default" 
      });
      // 2FA doğrulama başarılı, ana sayfaya yönlendir
      navigate('/', { replace: true });
    }
    setLoading(false);
  };

  const handleResendCode = () => {
    // TODO: Implement resend code functionality
    toast({
      title: "Bilgi",
      description: "Yeni kod gönderildi.",
      variant: "default"
    });
    setTimeLeft(30);
    setCanResend(false);
  };

  const handleGoBack = () => {
    navigate('/auth?action=login', { replace: true });
  };

  if (!userId || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Geçersiz İstek</h1>
          <p className="text-muted-foreground mb-4">2FA doğrulama için gerekli bilgiler eksik.</p>
          <Button onClick={handleGoBack}>Giriş Sayfasına Dön</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-slate-900/30 p-4"
    >
      <div className="absolute top-4 left-4">
        <Button variant="ghost" onClick={handleGoBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5 mr-2" /> Geri Dön
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-effect rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">🔐 Güvenlik Doğrulaması</h1>
          <p className="text-muted-foreground">
            <strong>{email}</strong> hesabı için iki aşamalı doğrulama gerekli
          </p>
        </div>

        <form onSubmit={handle2FAVerification} className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Google Authenticator
              </span>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Google Authenticator uygulamasından 6 haneli kodu girin
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Key className="w-4 h-4 inline mr-2 text-primary" /> Doğrulama Kodu
            </label>
            <input
              id="2fa-input"
              type="text"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              disabled={loading}
              className="w-full px-4 py-3 bg-input border-2 border-blue-300 dark:border-blue-700 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 input-glow text-center text-2xl tracking-widest font-mono"
              autoComplete="one-time-code"
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              6 haneli kodu Google Authenticator'dan alın
            </p>
          </div>
          
          <Button
            type="submit"
            className="w-full btn-primary text-primary-foreground font-semibold py-3 text-lg"
            disabled={loading || twoFactorCode.length !== 6}
          >
            {loading ? (
              <div className="flex items-center">
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Doğrulanıyor...
              </div>
            ) : (
              'Güvenli Giriş Yap'
            )}
          </Button>
          
          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={handleResendCode}
              disabled={!canResend || loading}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {canResend ? (
                'Yeni Kod Gönder'
              ) : (
                `Yeni kod gönder (${timeLeft}s)`
              )}
            </Button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            💡 Güvenlik İpuçları
          </h3>
          <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Kodunuzu kimseyle paylaşmayın</li>
            <li>• Kod 30 saniyede bir yenilenir</li>
            <li>• Cihazınızın saati doğru olmalı</li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TwoFactorAuthPage;
