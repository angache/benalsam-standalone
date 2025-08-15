import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Paper
} from '@mui/material';
import {
  ArrowBack,
  Shield,
  Smartphone,
  CheckCircle,
  Error,
  Visibility,
  VisibilityOff,
  Refresh
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuthStore } from '../stores/authStore';

const TwoFactorVerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const { verify2FA, requires2FA, pendingCredentials, setRequires2FA, setPendingCredentials } = useAuthStore();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  const userId = searchParams.get('userId');
  const email = searchParams.get('email') || pendingCredentials?.email;
  const password = searchParams.get('password') || pendingCredentials?.password;

  // Auto-focus on input
  useEffect(() => {
    const input = document.getElementById('2fa-input');
    if (input) {
      input.focus();
    }
  }, []);

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setError('Lütfen 2FA kodunu girin');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('2FA kodu 6 haneli olmalıdır');
      return;
    }

    if (attempts >= maxAttempts) {
      setError('Çok fazla başarısız deneme yaptınız. Lütfen daha sonra tekrar deneyin.');
      return;
    }

    if (!userId || !email || !password) {
      setError('Geçersiz istek: Gerekli bilgiler eksik');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await verify2FA(userId, verificationCode, email, password);
      
      if (result.success) {
        setVerificationCode('');
        setRequires2FA(false);
        setPendingCredentials(null);
        
        // Redirect to admin dashboard
        navigate('/', { replace: true });
      } else {
        setAttempts(prev => prev + 1);
        setVerificationCode('');
        setError(result.error || '2FA doğrulama başarısız');
        
        // Reset focus
        setTimeout(() => {
          const input = document.getElementById('2fa-input');
          if (input) input.focus();
        }, 100);
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      setError('Doğrulama sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setRequires2FA(false);
    setPendingCredentials(null);
    navigate('/login', { replace: true });
  };

  if (!userId || !email) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 2
        }}
      >
        <Card sx={{ maxWidth: 400, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" color="error" gutterBottom>
              Geçersiz İstek
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              2FA doğrulama için gerekli bilgiler eksik.
            </Typography>
            <Button variant="contained" onClick={handleGoBack}>
              Giriş Sayfasına Dön
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
        width: '100%'
      }}
    >
      <Card sx={{ 
        maxWidth: 500, 
        width: '100%',
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        boxShadow: 3,
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Shield sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              🔐 Güvenlik Doğrulaması
            </Typography>
            <Typography variant="body1" color="text.secondary">
              <strong>{email}</strong> hesabı için iki aşamalı doğrulama gerekli
            </Typography>
          </Box>

          {/* Back Button */}
          <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
            <IconButton onClick={handleGoBack} color="inherit">
              <ArrowBack />
            </IconButton>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* 2FA Instructions */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: 'primary.50', 
            border: `1px solid ${theme.palette.primary.light}`,
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Smartphone sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Google Authenticator
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Google Authenticator uygulamasından 6 haneli kodu girin
            </Typography>
          </Paper>

          {/* 2FA Form */}
          <form onSubmit={handle2FAVerification}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                Doğrulama Kodu
              </Typography>
              <TextField
                id="2fa-input"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                fullWidth
                disabled={isLoading || attempts >= maxAttempts}
                sx={{
                  '& .MuiInputBase-input': {
                    textAlign: 'center',
                    fontSize: '24px',
                    letterSpacing: '8px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace'
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
                autoComplete="one-time-code"
              />
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mt: 1 }}>
                6 haneli kodu Google Authenticator'dan alın
              </Typography>
            </Box>

            {/* Attempts Counter */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Chip
                label={`Kalan deneme: ${maxAttempts - attempts}`}
                color={attempts >= maxAttempts - 2 ? 'error' : 'default'}
                variant="outlined"
              />
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading || !verificationCode.trim() || verificationCode.length !== 6 || attempts >= maxAttempts}
              sx={{ 
                mb: 2,
                borderRadius: 2,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Refresh sx={{ mr: 1, animation: 'spin 1s linear infinite' }} />
                  Doğrulanıyor...
                </Box>
              ) : (
                'Güvenli Giriş Yap'
              )}
            </Button>
          </form>

          {/* Security Tips */}
          <Paper sx={{ 
            p: 3, 
            bgcolor: 'warning.50', 
            border: `1px solid ${theme.palette.warning.light}`,
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'warning.dark', mb: 1 }}>
              💡 Güvenlik İpuçları
            </Typography>
            <Typography variant="body2" color="warning.dark" sx={{ fontSize: '0.875rem' }}>
              • Kodunuzu kimseyle paylaşmayın<br/>
              • Kod 30 saniyede bir yenilenir<br/>
              • Cihazınızın saati doğru olmalı
            </Typography>
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TwoFactorVerifyPage;
