import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon,
  Home as HomeIcon
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: props.showDetails || false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service (e.g., Sentry)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Integrate with error reporting service like Sentry
    console.group('🚨 Error Details');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            bgcolor: 'background.default'
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="h1" fontWeight="bold" color="error">
                    Oops! Bir Hata Oluştu
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
                  </Typography>
                </Box>
              </Box>

              {/* Error Alert */}
              <Alert severity="error" sx={{ mb: 3 }}>
                <AlertTitle>Hata Detayları</AlertTitle>
                {this.state.error?.message || 'Bilinmeyen hata'}
              </Alert>

              {/* Action Buttons */}
              <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  size="large"
                >
                  Tekrar Dene
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                  size="large"
                >
                  Ana Sayfaya Dön
                </Button>
                <Button
                  variant="text"
                  startIcon={<BugReportIcon />}
                  onClick={() => window.location.reload()}
                  size="large"
                >
                  Sayfayı Yenile
                </Button>
              </Box>

              {/* Error Details Toggle */}
              <Box mb={2}>
                <Button
                  variant="text"
                  endIcon={this.state.showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={this.toggleDetails}
                  size="small"
                >
                  {this.state.showDetails ? 'Detayları Gizle' : 'Hata Detaylarını Göster'}
                </Button>
              </Box>

              {/* Collapsible Error Details */}
              <Collapse in={this.state.showDetails}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" mb={2}>
                    🔍 Teknik Detaylar
                  </Typography>
                  
                  {this.state.error && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary" mb={1}>
                        Hata Mesajı:
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace" bgcolor="white" p={1} borderRadius={1}>
                        {this.state.error.message}
                      </Typography>
                    </Box>
                  )}

                  {this.state.error?.stack && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary" mb={1}>
                        Stack Trace:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontFamily="monospace" 
                        bgcolor="white" 
                        p={1} 
                        borderRadius={1}
                        sx={{ 
                          maxHeight: 200, 
                          overflow: 'auto',
                          fontSize: '0.75rem',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {this.state.error.stack}
                      </Typography>
                    </Box>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" mb={1}>
                        Component Stack:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontFamily="monospace" 
                        bgcolor="white" 
                        p={1} 
                        borderRadius={1}
                        sx={{ 
                          maxHeight: 200, 
                          overflow: 'auto',
                          fontSize: '0.75rem',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {this.state.errorInfo.componentStack}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Collapse>

              {/* Helpful Information */}
              <Box mt={3} p={2} bgcolor="info.50" borderRadius={1}>
                <Typography variant="body2" color="info.700">
                  💡 <strong>Yardım:</strong> Bu hata devam ederse, lütfen teknik destek ile iletişime geçin. 
                  Hata detayları otomatik olarak kaydedildi.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
