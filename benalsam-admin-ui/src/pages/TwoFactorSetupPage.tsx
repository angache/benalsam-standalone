import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  QrCode,
  Smartphone,
  CheckCircle,
  Error,
  Visibility,
  VisibilityOff,
  ContentCopy,
  Download,
  Refresh
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import TwoFactorService, { TwoFactorSetupData } from '../services/twoFactorService';

const TwoFactorSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [step, setStep] = useState(1); // 1: Setup, 2: Verify, 3: Success
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  useEffect(() => {
    if (step === 1) {
      handleSetup();
    }
  }, []);

  const handleSetup = async () => {
    setIsLoading(true);
    setError('');

    try {
      // For admin, we'll use a default admin user ID
      const result = await TwoFactorService.setupTwoFactor('admin');
      
      if (result.success && result.data) {
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

    if (!setupData) {
      setError('Kurulum verisi bulunamadı');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await TwoFactorService.enableTwoFactor(
        'admin',
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

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleDownloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const content = `Benalsam Admin 2FA Yedek Kodları\n\n${setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nBu kodları güvenli bir yerde saklayın.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'benalsam-admin-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGoBack = () => {
    navigate('/security');
  };

  const handleComplete = () => {
    navigate('/security');
  };

  if (step === 1) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleGoBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            2FA Kurulumu
          </Typography>
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                2FA kurulumu hazırlanıyor...
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    );
  }

  if (step === 2) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleGoBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            2FA Doğrulama
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* QR Code Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <QrCode sx={{ mr: 1 }} />
                  QR Kodu Tarayın
                </Typography>
                
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box sx={{ 
                    bgcolor: 'grey.100', 
                    p: 2, 
                    borderRadius: 1, 
                    display: 'inline-block',
                    border: `1px solid ${theme.palette.divider}`
                  }}>
                    <img 
                      src={setupData?.qrCode} 
                      alt="2FA QR Code" 
                      style={{ width: '200px', height: '200px' }}
                    />
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  1. Google Authenticator, Authy veya benzeri bir uygulama indirin
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  2. QR kodu tarayın veya manuel olarak kodu girin
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  3. Uygulamada görünen 6 haneli kodu aşağıya girin
                </Typography>

                {/* Manual Code */}
                <Box sx={{ 
                  bgcolor: 'grey.50', 
                  p: 2, 
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Manuel Kod:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Chip 
                      label={setupData?.secret}
                      variant="outlined"
                      sx={{ fontFamily: 'monospace', fontSize: '1rem' }}
                    />
                    <IconButton
                      onClick={() => handleCopyCode(setupData?.secret || '')}
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      {copiedCode === setupData?.secret ? (
                        <CheckCircle color="success" />
                      ) : (
                        <ContentCopy />
                      )}
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Verification Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Smartphone sx={{ mr: 1 }} />
                  Doğrulama Kodu
                </Typography>
                
                <TextField
                  fullWidth
                  label="6 Haneli Kod"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  inputProps={{
                    maxLength: 6,
                    style: { 
                      textAlign: 'center', 
                      fontSize: '1.2rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.5em'
                    }
                  }}
                  sx={{ mb: 2 }}
                />

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleVerify}
                  disabled={isLoading || verificationCode.length !== 6}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircle />}
                  sx={{ mb: 2 }}
                >
                  {isLoading ? 'Doğrulanıyor...' : '2FA\'yı Etkinleştir'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (step === 3) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleComplete} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            2FA Kurulumu Tamamlandı
          </Typography>
        </Box>

        {/* Success Message */}
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            2FA Başarıyla Etkinleştirildi!
          </Typography>
          <Typography variant="body2">
            Hesabınız artık iki aşamalı doğrulama ile korunuyor. Bir sonraki girişinizde 2FA kodu gerekecek.
          </Typography>
        </Alert>

        {/* Backup Codes Section */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Error color="warning" sx={{ mr: 1 }} />
              Yedek Kodlar
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Bu kodları güvenli bir yerde saklayın. Telefonunuzu kaybederseniz bu kodlarla hesabınıza erişebilirsiniz.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={showBackupCodes ? <VisibilityOff /> : <Visibility />}
                onClick={() => setShowBackupCodes(!showBackupCodes)}
              >
                {showBackupCodes ? 'Kodları Gizle' : 'Kodları Göster'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownloadBackupCodes}
              >
                İndir
              </Button>
            </Box>

            {showBackupCodes && (
              <Box sx={{ 
                bgcolor: 'grey.50', 
                p: 2, 
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`
              }}>
                <Grid container spacing={1}>
                  {setupData?.backupCodes?.map((code, index) => (
                    <Grid item xs={6} key={index}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        bgcolor: 'background.paper',
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`
                      }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {code}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyCode(code)}
                        >
                          {copiedCode === code ? (
                            <CheckCircle color="success" />
                          ) : (
                            <ContentCopy />
                          )}
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Complete Button */}
        <Box sx={{ mt: 3 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleComplete}
            startIcon={<CheckCircle />}
          >
            Tamamla
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
};

export default TwoFactorSetupPage;
