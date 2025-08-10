import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '../stores';
import { spacing, margins, paddings, shadows, borderRadius } from '../utils/spacing';
import { typography } from '../utils/typography';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryClass extends Component<Props & { colors: any }, State> {
  constructor(props: Props & { colors: any }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={[styles.container, { backgroundColor: this.props.colors.background }]}>
          <View style={[styles.errorCard, { backgroundColor: this.props.colors.surface }]}>
            <View style={[styles.errorIcon, { backgroundColor: this.props.colors.error }]} />
            <Text style={[styles.errorTitle, { color: this.props.colors.text }]}>
              Bir Hata Oluştu
            </Text>
            <Text style={[styles.errorMessage, { color: this.props.colors.textSecondary }]}>
              Uygulama beklenmeyen bir hatayla karşılaştı. Lütfen tekrar deneyin.
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: this.props.colors.primary }]}
              onPress={this.handleRetry}
            >
              <Text style={[styles.retryButtonText, { color: this.props.colors.white }]}>
                Tekrar Dene
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...paddings.all.lg,
  },
  errorCard: {
    borderRadius: borderRadius.lg,
    ...paddings.all.xl,
    alignItems: 'center',
    ...shadows.lg,
    maxWidth: 400,
    width: '100%',
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body2,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  retryButton: {
    ...paddings.all.md,
    borderRadius: borderRadius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    ...typography.button1,
  },
});

// Wrapper component to provide theme colors
export const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  const colors = useThemeColors();
  return (
    <ErrorBoundaryClass colors={colors} fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}; 