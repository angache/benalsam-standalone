'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ProgressPhase = 'idle' | 'uploading' | 'creating' | 'success' | 'error'

interface ProgressModalProps {
  isOpen: boolean
  phase: ProgressPhase
  message: string
  uploadProgress: number
  onSuccess: () => void
  onError: () => void
}

export default function ProgressModal({
  isOpen,
  phase,
  message,
  uploadProgress,
  onSuccess,
  onError,
}: ProgressModalProps) {
  if (!isOpen) return null

  const overallProgress =
    phase === 'uploading' ? Math.round(uploadProgress / 2) :
    phase === 'creating' ? 75 :
    phase === 'success' ? 100 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-700/10 flex items-center justify-center">
            {phase === 'success' ? (
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : phase === 'error' ? (
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            )}
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {phase === 'success' ? '🎉 İlan Hazır!' :
             phase === 'error' ? '❌ Hata Oluştu' :
             '🎯 İlanınız Yayına Hazırlanıyor'}
          </h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {/* Animated Timeline */}
        <div className="space-y-6">
          {/* Step 1: Image Upload */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                phase === 'uploading' ? 'bg-blue-600 text-white scale-110' :
                phase === 'creating' || phase === 'success' ? 'bg-green-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {phase === 'uploading' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : phase === 'creating' || phase === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">1</span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className={`font-medium transition-colors duration-300 ${
                phase === 'uploading' ? 'text-blue-600' :
                phase === 'creating' || phase === 'success' ? 'text-green-600' :
                'text-muted-foreground'
              }`}>
                Görseller yükleniyor...
              </div>
              {phase === 'uploading' && (
                <div className="mt-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-700 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{uploadProgress}% tamamlandı</div>
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              {phase === 'uploading' ? (
                <span className="text-xs text-blue-600 font-medium">🔄</span>
              ) : phase === 'creating' || phase === 'success' ? (
                <span className="text-xs text-green-600 font-medium">✅</span>
              ) : (
                <span className="text-xs text-muted-foreground">⏳</span>
              )}
            </div>
          </div>

          {/* Connecting Line */}
          <div className="ml-5 w-px h-6 bg-gradient-to-b from-blue-600/30 to-muted/30"></div>

          {/* Step 2: Saving */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                phase === 'creating' ? 'bg-blue-600 text-white scale-110' :
                phase === 'success' ? 'bg-green-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {phase === 'creating' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : phase === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">2</span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className={`font-medium transition-colors duration-300 ${
                phase === 'creating' ? 'text-blue-600' :
                phase === 'success' ? 'text-green-600' :
                'text-muted-foreground'
              }`}>
                İlan kaydediliyor...
              </div>
              {phase === 'creating' && (
                <div className="mt-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-700 rounded-full animate-pulse" style={{ width: '70%' }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Veritabanına kaydediliyor</div>
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              {phase === 'creating' ? (
                <span className="text-xs text-blue-600 font-medium">🔄</span>
              ) : phase === 'success' ? (
                <span className="text-xs text-green-600 font-medium">✅</span>
              ) : (
                <span className="text-xs text-muted-foreground">⏳</span>
              )}
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Genel İlerleme</span>
              <span className="text-sm text-muted-foreground">{overallProgress}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 via-blue-700 to-green-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {phase === 'success' && (
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">
                İlanınız onaylandıktan sonra arama sonuçlarında görüntülenecektir.
              </div>
            </div>
            <Button 
              onClick={onSuccess}
              className="w-full bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white"
            >
              🎉 İlanlarıma Git
            </Button>
          </div>
        )}

        {phase === 'error' && (
          <div className="mt-8 space-y-4">
            <Button 
              onClick={onError}
              variant="outline"
              className="w-full"
            >
              Kapat
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

