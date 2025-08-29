import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Smartphone,
  QrCode,
  Copy,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Download,
  Save,
  Loader2,
  Shield,
  Lock,
  Key
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useAuthStore } from '../../stores';
import TwoFactorService from '../../services/twoFactorService';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/use-toast';

const TwoFactorSetupPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1); // 1: Setup, 2: Verify, 3: Success
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    if (step === 1) {
      handleSetup();
    }
  }, []);

  const handleSetup = async () => {
    if (!currentUser?.id) {
      setError('Kullanıcı bilgisi bulunamadı');
      return;
    }

    console.log('🔐 Current user:', currentUser);
    console.log('🔐 User ID:', currentUser.id);
    console.log('🔐 2FA Enabled:', currentUser.is_2fa_enabled);

    setIsLoading(true);
    setError('');

    try {
      // Use the current user's ID from Supabase
      const result = await TwoFactorService.setupTwoFactor(currentUser.id);
      
      if (result.success) {
        setSetupData(result.data);
        setStep(2);
      } else {
        setError(result.error || '2FA kurulumu başlatılamadı');
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      setError('2FA kurulumu sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Lütfen 6 haneli doğrulama kodunu girin');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await TwoFactorService.enableTwoFactor(
        currentUser.id,
        setupData.secret,
        verificationCode
      );
      
      if (result.success) {
        setSuccess('2FA başarıyla etkinleştirildi!');
        setStep(3);
      } else {
        setError(result.error || 'Doğrulama kodu yanlış');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      setError('Doğrulama sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBackupCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      triggerHaptic();
      toast({
        title: 'Kopyalandı',
        description: 'Kod panoya kopyalandı.',
      });
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        title: 'Hata',
        description: 'Kod kopyalanamadı.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const content = `Benalsam 2FA Yedek Kodları\n\n${setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nBu kodları güvenli bir yerde saklayın.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'benalsam-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGoBack = () => {
    navigate('/ayarlar/guvenlik');
  };

  const handleComplete = () => {
    navigate('/ayarlar/guvenlik');
  };

  if (step === 1) {
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
            <h1 className="text-xl font-semibold text-foreground">2FA Kurulumu</h1>
          </div>

          <div className="w-10" />
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">2FA kurulumu hazırlanıyor...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertTriangle size={20} className="text-red-500 mr-2" />
                  <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    );
  }

  if (step === 2) {
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
            <h1 className="text-xl font-semibold text-foreground">2FA Doğrulama</h1>
          </div>

          <div className="w-10" />
        </motion.div>

        {/* QR Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <QrCode className="w-5 h-5 mr-2 text-primary" />
                QR Kodu Tarayın
              </CardTitle>
            </CardHeader>
            <CardContent>
          
          <div className="text-center space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 inline-block">
              <img 
                src={setupData?.qrCode} 
                alt="2FA QR Code" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                1. Google Authenticator, Authy veya benzeri bir uygulama indirin
              </p>
              <p className="text-sm text-muted-foreground">
                2. QR kodu tarayın veya manuel olarak kodu girin
              </p>
              <p className="text-sm text-muted-foreground">
                3. Uygulamada görünen 6 haneli kodu aşağıya girin
              </p>
            </div>

            {/* Manual Code */}
            <Card className="bg-muted">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Manuel Kod:</p>
                <div className="flex items-center justify-center space-x-2">
                  <Badge variant="outline" className="text-lg font-mono px-3 py-1">
                    {setupData?.secret}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyBackupCode(setupData?.secret)}
                    className="h-8 w-8"
                  >
                    {copiedCode === setupData?.secret ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </motion.div>

        {/* Verification Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Smartphone className="w-5 h-5 mr-2 text-primary" />
                Doğrulama Kodu
              </CardTitle>
            </CardHeader>
            <CardContent>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                6 Haneli Kod
              </label>
              <Input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-lg font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
                autoComplete="off"
              />
            </div>

            {error && (
              <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <AlertTriangle size={20} className="text-red-500 mr-2" />
                    <p className="text-red-700 dark:text-red-400">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleVerify}
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Doğrulanıyor...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  2FA'yı Etkinleştir
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  </motion.div>
);
}

  if (step === 3) {
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
            onClick={handleComplete}
            className="hover:bg-accent"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <div className="flex-1 text-center">
            <h1 className="text-xl font-semibold text-foreground">2FA Kurulumu Tamamlandı</h1>
          </div>

          <div className="w-10" />
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <CheckCircle size={24} className="text-green-500 mr-2" />
                <h2 className="text-lg font-semibold text-green-700 dark:text-green-400">
                  2FA Başarıyla Etkinleştirildi!
                </h2>
              </div>
              <p className="text-green-600 dark:text-green-300">
                Hesabınız artık iki aşamalı doğrulama ile korunuyor. Bir sonraki girişinizde 2FA kodu gerekecek.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Backup Codes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Key className="w-5 h-5 mr-2 text-primary" />
                Yedek Kodlar
              </CardTitle>
            </CardHeader>
            <CardContent>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Bu kodları güvenli bir yerde saklayın. Telefonunuzu kaybederseniz bu kodlarla hesabınıza erişebilirsiniz.
            </p>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBackupCodes(!showBackupCodes)}
              >
                {showBackupCodes ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
                {showBackupCodes ? 'Kodları Gizle' : 'Kodları Göster'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadBackupCodes}
              >
                <Download size={16} className="mr-2" />
                İndir
              </Button>
            </div>

            {showBackupCodes && (
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {setupData?.backupCodes?.map((code, index) => (
                      <div key={index} className="flex items-center justify-between bg-background px-3 py-2 rounded border">
                        <Badge variant="outline" className="font-mono text-sm">
                          {code}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyBackupCode(code)}
                          className="h-6 w-6"
                        >
                          {copiedCode === code ? (
                            <CheckCircle size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} className="text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>

        {/* Complete Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button
            onClick={handleComplete}
            className="w-full"
          >
            <CheckCircle size={16} className="mr-2" />
            Tamamla
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return null;
};

export default TwoFactorSetupPage;
