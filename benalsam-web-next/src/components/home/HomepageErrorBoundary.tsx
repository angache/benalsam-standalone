/**
 * Homepage Error Boundary
 * 
 * Specialized error boundary for homepage components
 * Provides retry mechanism and graceful degradation
 */

'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { logger } from '@/utils/production-logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /**
   * Component name for better error context
   */
  componentName?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
}

const MAX_RETRIES = 3

export class HomepageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with context
    logger.error('[HomepageErrorBoundary] Caught error', {
      component: this.props.componentName || 'Unknown',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Update state with error info
    this.setState({
      errorInfo,
    })
  }

  handleRetry = () => {
    if (this.state.retryCount >= MAX_RETRIES) {
      // Max retries reached, reset to initial state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: 0,
      })
      // Force page reload
      window.location.reload()
      return
    }

    // Increment retry count and reset error state
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }))
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { retryCount } = this.state
      const canRetry = retryCount < MAX_RETRIES

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="flex flex-col items-center text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>

              {/* Error Title */}
              <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                {this.props.componentName ? `${this.props.componentName} Yüklenemedi` : 'Bir Hata Oluştu'}
              </h2>

              {/* Error Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                {canRetry
                  ? `Üzgünüz, beklenmeyen bir hata oluştu. Tekrar denemek için butona tıklayın. (${retryCount}/${MAX_RETRIES})`
                  : 'Maksimum deneme sayısına ulaşıldı. Sayfa yenilenecek.'}
              </p>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="w-full mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-md text-left">
                  <p className="text-xs font-mono text-red-600 dark:text-red-400 mb-2">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 w-full">
                {canRetry ? (
                  <Button
                    onClick={this.handleRetry}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tekrar Dene ({retryCount}/{MAX_RETRIES})
                  </Button>
                ) : (
                  <Button
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Ana Sayfa
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Wrapper component for homepage sections with error boundary
 */
export function HomepageSection({
  children,
  componentName,
}: {
  children: ReactNode
  componentName?: string
}) {
  return (
    <HomepageErrorBoundary componentName={componentName}>
      {children}
    </HomepageErrorBoundary>
  )
}

export default HomepageErrorBoundary

