/**
 * Payment Checkout Component
 * 
 * Handles payment flow UI (mock, Stripe, İyzico)
 * Shows payment status and handles success/error states
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, CreditCard } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { logger } from '@/utils/production-logger'
import type { PaymentIntent, PaymentResult } from '@/services/paymentService/types'

interface PaymentCheckoutProps {
  isOpen: boolean
  onClose: () => void
  paymentIntent: PaymentIntent | null
  amount: number
  currency: 'TRY' | 'USD' | 'EUR'
  description?: string
  onSuccess: (result: PaymentResult) => void
  onError?: (error: Error) => void
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error'

const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  isOpen,
  onClose,
  paymentIntent,
  amount,
  currency,
  description,
  onSuccess,
  onError,
}) => {
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && paymentIntent) {
      setStatus('idle')
      setPaymentResult(null)
      setError(null)
    }
  }, [isOpen, paymentIntent])

  const formatAmount = (amount: number, currency: 'TRY' | 'USD' | 'EUR'): string => {
    const currencySymbols = {
      TRY: '₺',
      USD: '$',
      EUR: '€',
    }
    const symbol = currencySymbols[currency]
    const major = Math.floor(amount / 100)
    const minor = amount % 100

    if (currency === 'TRY') {
      return `${symbol}${major},${minor.toString().padStart(2, '0')}`
    }
    return `${symbol}${major}.${minor.toString().padStart(2, '0')}`
  }

  const handlePayNow = async () => {
    if (!paymentIntent) {
      setError('Ödeme bilgisi bulunamadı')
      return
    }

    setStatus('processing')
    setError(null)

    try {
      logger.debug('[PaymentCheckout] Processing payment', { paymentIntentId: paymentIntent.id })

      // For mock provider, simulate payment with delay
      if (paymentIntent.provider === 'mock') {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Verify payment
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message || 'Ödeme doğrulanamadı')
        }

        const data = await response.json()
        const result: PaymentResult = data.data.payment

        if (result.status === 'succeeded') {
          setStatus('success')
          setPaymentResult(result)
          
          logger.debug('[PaymentCheckout] Payment successful', { paymentIntentId: paymentIntent.id })
          
          // Call success callback after a short delay
          setTimeout(() => {
            onSuccess(result)
            // Close modal after callback
            setTimeout(() => {
              onClose()
              setStatus('idle')
            }, 1000)
          }, 1500)
        } else {
          setStatus('error')
          setError('Ödeme başarısız oldu. Lütfen tekrar deneyin.')
          
          if (onError) {
            onError(new Error('Payment failed'))
          }
        }
      } else {
        // For Stripe/İyzico, redirect to payment page or use their SDK
        // This will be implemented when actual provider integration is added
        throw new Error('Payment provider not yet fully integrated. Please use mock mode for now.')
      }
    } catch (err) {
      logger.error('[PaymentCheckout] Payment error', { error: err })
      setStatus('error')
      const errorMessage = err instanceof Error ? err.message : 'Ödeme işlenirken bir hata oluştu'
      setError(errorMessage)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    }
  }

  const handleClose = () => {
    if (status === 'processing') {
      toast({
        title: 'Ödeme İşleniyor',
        description: 'Lütfen ödeme tamamlanana kadar bekleyin.',
        variant: 'default',
      })
      return
    }

    setStatus('idle')
    setPaymentResult(null)
    setError(null)
    onClose()
  }

  if (!paymentIntent) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Ödeme
          </DialogTitle>
          <DialogDescription>
            {description || 'Ödeme işlemini tamamlayın'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Info */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tutar:</span>
              <span className="text-2xl font-bold">{formatAmount(amount, currency)}</span>
            </div>
            {paymentIntent.provider === 'mock' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">Mock Mode</span>
                <span>Gerçek ödeme yapılmayacak (Test modu)</span>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {status === 'processing' && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-900">Ödeme işleniyor...</p>
                <p className="text-xs text-blue-700">Lütfen bekleyin, işlem tamamlanana kadar bu sayfayı kapatmayın.</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Ödeme başarılı!</p>
                {paymentResult?.providerTransactionId && (
                  <p className="text-xs text-green-700">İşlem ID: {paymentResult.providerTransactionId}</p>
                )}
              </div>
            </div>
          )}

          {status === 'error' && error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">Ödeme başarısız</p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                İptal
              </Button>
              <Button onClick={handlePayNow} className="min-w-[120px]">
                Ödeme Yap
              </Button>
            </>
          )}
          {status === 'processing' && (
            <Button disabled className="min-w-[120px]">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              İşleniyor...
            </Button>
          )}
          {status === 'success' && (
            <Button onClick={handleClose} className="min-w-[120px]">
              Tamam
            </Button>
          )}
          {status === 'error' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Kapat
              </Button>
              <Button onClick={handlePayNow} className="min-w-[120px]">
                Tekrar Dene
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PaymentCheckout

