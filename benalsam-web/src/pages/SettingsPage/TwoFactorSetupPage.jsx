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
  Save
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useAuthStore } from '../../stores';
import TwoFactorService from '../../services/twoFactorService';

const TwoFactorSetupPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  
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
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
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
    navigate('/ayarlar2/guvenlik');
  };

  const handleComplete = () => {
    navigate('/ayarlar2/guvenlik');
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
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-xl font-semibold">2FA Kurulumu</h1>
          </div>

          <div className="w-10" />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">2FA kurulumu hazırlanıyor...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle size={20} className="text-red-500 mr-2" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
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
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-xl font-semibold">2FA Doğrulama</h1>
          </div>

          <div className="w-10" />
        </div>

        {/* QR Code Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <QrCode className="w-5 h-5 mr-2 text-primary" />
            QR Kodu Tarayın
          </h2>
          
          <div className="text-center space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 inline-block">
              <img 
                src={setupData?.qrCode} 
                alt="2FA QR Code" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                1. Google Authenticator, Authy veya benzeri bir uygulama indirin
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                2. QR kodu tarayın veya manuel olarak kodu girin
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                3. Uygulamada görünen 6 haneli kodu aşağıya girin
              </p>
            </div>

            {/* Manual Code */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Manuel Kod:</p>
              <div className="flex items-center justify-center space-x-2">
                <code className="text-lg font-mono bg-white dark:bg-gray-800 px-3 py-1 rounded border">
                  {setupData?.secret}
                </code>
                <button
                  onClick={() => handleCopyBackupCode(setupData?.secret)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  {copiedCode === setupData?.secret ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} className="text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Smartphone className="w-5 h-5 mr-2 text-primary" />
            Doğrulama Kodu
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                6 Haneli Kod
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-center text-lg font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle size={20} className="text-red-500 mr-2" />
                  <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={isLoading || verificationCode.length !== 6}
              className={`w-full p-3 rounded-lg font-medium transition-colors ${
                isLoading || verificationCode.length !== 6
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/80'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Doğrulanıyor...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CheckCircle size={16} className="mr-2" />
                  2FA'yı Etkinleştir
                </div>
              )}
            </button>
          </div>
        </div>
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
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleComplete}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-xl font-semibold">2FA Kurulumu Tamamlandı</h1>
          </div>

          <div className="w-10" />
        </div>

        {/* Success Message */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CheckCircle size={24} className="text-green-500 mr-2" />
            <h2 className="text-lg font-semibold text-green-700 dark:text-green-400">
              2FA Başarıyla Etkinleştirildi!
            </h2>
          </div>
          <p className="text-green-600 dark:text-green-300">
            Hesabınız artık iki aşamalı doğrulama ile korunuyor. Bir sonraki girişinizde 2FA kodu gerekecek.
          </p>
        </div>

        {/* Backup Codes Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
            Yedek Kodlar
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Bu kodları güvenli bir yerde saklayın. Telefonunuzu kaybederseniz bu kodlarla hesabınıza erişebilirsiniz.
            </p>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className="flex items-center text-primary hover:text-primary/80"
              >
                {showBackupCodes ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
                {showBackupCodes ? 'Kodları Gizle' : 'Kodları Göster'}
              </button>

              <button
                onClick={handleDownloadBackupCodes}
                className="flex items-center text-primary hover:text-primary/80"
              >
                <Download size={16} className="mr-2" />
                İndir
              </button>
            </div>

            {showBackupCodes && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  {setupData?.backupCodes?.map((code, index) => (
                    <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 px-3 py-2 rounded border">
                      <code className="font-mono text-sm">{code}</code>
                      <button
                        onClick={() => handleCopyBackupCode(code)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {copiedCode === code ? (
                          <CheckCircle size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} className="text-gray-500" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Complete Button */}
        <button
          onClick={handleComplete}
          className="w-full p-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/80 transition-colors"
        >
          <div className="flex items-center justify-center">
            <CheckCircle size={16} className="mr-2" />
            Tamamla
          </div>
        </button>
      </motion.div>
    );
  }

  return null;
};

export default TwoFactorSetupPage;
