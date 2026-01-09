'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { dopingOptions, DopingOption, DopingPrice } from '@/config/dopingOptions'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Loader2, FileText, X, Zap } from 'lucide-react'
import { logger } from '@/utils/production-logger'
import PaymentCheckout from '@/components/Payment/PaymentCheckout'
import type { PaymentIntent, PaymentResult } from '@/services/paymentService/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface SelectedDoping extends DopingOption {
  selectedPrice: DopingPrice
}

interface DopingModalProps {
  isOpen: boolean
  onClose: () => void
  listing: Partial<{ id: string; title: string; [key: string]: unknown }> | null
  onSuccess: () => void
}

const DopingModal = ({ isOpen, onClose, listing, onSuccess }: DopingModalProps) => {
  const [selectedDopings, setSelectedDopings] = useState<Record<string, SelectedDoping>>({})
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null)
  const [showPaymentCheckout, setShowPaymentCheckout] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [cancellingDoping, setCancellingDoping] = useState<string | null>(null)

  useEffect(() => {
    // Don't pre-select active dopings - they should be shown separately
    // Only reset selectedDopings when modal opens
    if (isOpen) {
      setSelectedDopings({})
      setAcceptTerms(false)
    }
  }, [isOpen])

  const handleCheckboxChange = (checked: boolean, option: DopingOption) => {
    setSelectedDopings(prev => {
      const newDopings = { ...prev }
      if (checked) {
        newDopings[option.id] = {
          ...option,
          selectedPrice: option.prices[0],
        }
      } else {
        delete newDopings[option.id]
      }
      return newDopings
    })
  }

  const handlePriceChange = (optionId: string, priceValue: string) => {
    const [duration, price] = priceValue.split('-').map(Number)
    setSelectedDopings(prev => {
      const newDopings = { ...prev }
      const option = newDopings[optionId]
      if (option) {
        const selectedPrice = option.prices.find(p => p.duration === duration && p.price === price)
        if (selectedPrice) {
          option.selectedPrice = selectedPrice
        }
      }
      return newDopings
    })
  }

  const totalPrice = useMemo(() => {
    return Object.values(selectedDopings).reduce((total, option) => {
      return total + (option.selectedPrice?.price || 0)
    }, 0)
  }, [selectedDopings])

  // Get active dopings (already purchased, not in selectedDopings)
  const getActiveDopings = () => {
    const activeDopings: Array<{
      id: string
      title: string
      icon: React.ComponentType<{ className?: string }>
      expiresAt: string | null
      db_field: string
    }> = []

    const now = new Date()

    dopingOptions.forEach(option => {
      const isActive = listing?.[option.db_field] === true
      const isInSelected = !!selectedDopings[option.id]
      
      // Only show if active and not in selected (not being repurchased)
      if (isActive && !isInSelected) {
        let expiresAt: string | null = null

        // Check expiration dates
        if (option.id === 'showcase' && listing?.showcase_expires_at) {
          expiresAt = listing.showcase_expires_at as string
          const isExpired = new Date(expiresAt) < now
          if (isExpired) return // Skip expired
        } else if (option.id === 'urgent' && listing?.urgent_expires_at) {
          expiresAt = listing.urgent_expires_at as string
          const isExpired = new Date(expiresAt) < now
          if (isExpired) return // Skip expired
        } else if (option.id === 'featured' && listing?.featured_expires_at) {
          expiresAt = listing.featured_expires_at as string
          const isExpired = new Date(expiresAt) < now
          if (isExpired) return // Skip expired
        } else if (option.id === 'up_to_date' && listing?.upped_at) {
          expiresAt = listing.upped_at as string
        }

        activeDopings.push({
          id: option.id,
          title: option.title,
          icon: option.icon,
          expiresAt,
          db_field: option.db_field,
        })
      }
    })

    return activeDopings
  }

  const activeDopings = getActiveDopings()

  /**
   * Cancel a specific doping
   */
  const handleCancelDoping = async (dopingId: string) => {
    if (!listing?.id || cancellingDoping) return

    setCancellingDoping(dopingId)

    try {
      // Find the doping option to get db_field
      const dopingOption = dopingOptions.find(opt => opt.id === dopingId)
      if (!dopingOption) {
        throw new Error('Doping seçeneği bulunamadı')
      }

      // Prepare update payload based on doping type
      const updatePayload: Record<string, unknown> = {
        [dopingOption.db_field]: false,
        updated_at: new Date().toISOString()
      }

      // Clear expiration dates
      if (dopingId === 'showcase') {
        updatePayload.showcase_expires_at = null
      } else if (dopingId === 'urgent') {
        updatePayload.urgent_expires_at = null
      } else if (dopingId === 'featured') {
        updatePayload.featured_expires_at = null
      } else if (dopingId === 'up_to_date') {
        updatePayload.upped_at = null
      }

      logger.debug('[DopingModal] Sending cancellation request', { updatePayload, listingId: listing.id })

      const response = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        logger.error('[DopingModal] API error cancelling doping', { errorData, status: response.status })
        throw new Error(errorData.error?.message || 'Doping iptal edilemedi')
      }

      toast({
        title: 'Başarılı',
        description: 'Doping başarıyla iptal edildi. (Not: Para iadesi yapılmaz)',
        variant: 'default',
      })

      // Refresh listing data
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      logger.error('[DopingModal] Error cancelling doping', { 
        error: error instanceof Error ? error.message : String(error),
        dopingId, 
        listingId: listing?.id 
      })
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Doping iptal edilirken bir hata oluştu.',
        variant: 'destructive',
      })
    } finally {
      setCancellingDoping(null)
    }
  }

  /**
   * Create payment intent for doping purchase
   */
  const handlePurchase = async () => {
    if (!listing || isPurchasing) return
    
    // Check if terms are accepted
    if (!acceptTerms) {
      toast({
        title: 'Onay Gerekli',
        description: 'Devam etmek için Doping Hizmeti Kullanım Koşullarını kabul etmelisiniz.',
        variant: 'destructive',
      })
      return
    }
    
    // Ensure amount is integer (cents/kuruş) and minimum 100 (₺1.00)
    const totalAmount = Math.round(totalPrice * 100)
    
    if (totalAmount < 100) {
      toast({
        title: 'Hata',
        description: totalAmount === 0 
          ? 'Lütfen en az bir doping seçin.' 
          : `Minimum ödeme tutarı ₺1.00'dir. Seçtiğiniz tutar: ₺${(totalAmount / 100).toFixed(2)}`,
        variant: 'destructive',
      })
      return
    }

    setIsPurchasing(true)

    try {
      // Create payment intent
      const items = Object.values(selectedDopings).map(doping => {
        // Ensure amount is integer (cents/kuruş)
        const itemAmount = Math.round(doping.selectedPrice.price * 100)
        
        return {
          id: doping.id,
          name: doping.title,
          description: doping.description || undefined, // Explicit undefined if empty
          amount: itemAmount,
          quantity: 1,
        }
      })

      logger.debug('[DopingModal] Creating payment intent', { listingId: listing.id, amount: totalAmount, items })

      const requestBody = {
        amount: totalAmount,
        currency: 'TRY' as const,
        items,
        description: `${listing.title} için doping`,
        metadata: {
          listingId: listing.id,
          listingTitle: listing.title || '',
          dopingIds: Object.keys(selectedDopings).join(','),
        },
      }

      // Validate request body before sending
      const requestBodyString = JSON.stringify(requestBody)
      
      // Log to console for debugging
      console.log('🔍 [DopingModal] Request body details:', {
        requestBody,
        requestBodyString,
        requestBodyLength: requestBodyString.length,
        isValidJSON: (() => {
          try {
            JSON.parse(requestBodyString)
            return true
          } catch {
            return false
          }
        })(),
      })
      
      logger.debug('[DopingModal] Payment request body', { 
        requestBody,
        requestBodyString,
        requestBodyLength: requestBodyString.length,
        isValidJSON: (() => {
          try {
            JSON.parse(requestBodyString)
            return true
          } catch {
            return false
          }
        })(),
      })

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: requestBodyString,
      })

      logger.debug('[DopingModal] Payment API response', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      })

      if (!response.ok) {
        // Clone response to read it multiple times
        const responseClone = response.clone()
        let errorData: Record<string, unknown> = {}
        let errorText = ''
        
        try {
          // Try to get response as text first to see raw content
          errorText = await responseClone.text()
          console.error('🔍 [DopingModal] Raw error response:', errorText)
          
          // Try to parse as JSON
          if (errorText) {
            try {
              errorData = JSON.parse(errorText)
              console.error('🔍 [DopingModal] Parsed error data:', errorData)
            } catch (jsonError) {
              console.error('🔍 [DopingModal] JSON parse failed:', jsonError)
              errorData = { 
                message: `HTTP ${response.status}: ${response.statusText}`,
                rawResponse: errorText 
              }
            }
          }
        } catch (parseError) {
          console.error('🔍 [DopingModal] Failed to read error response:', parseError)
          errorData = { 
            message: `HTTP ${response.status}: ${response.statusText}`,
            parseError: parseError instanceof Error ? parseError.message : String(parseError)
          }
        }

        // Log error details separately for better visibility
        console.error('🔍 [DopingModal] Payment API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          rawResponse: errorText,
          requestBody
        })

        logger.error('[DopingModal] Payment API error response', { 
          status: response.status, 
          statusText: response.statusText,
        })
        
        // Log error data separately
        if (errorData && Object.keys(errorData).length > 0) {
          logger.error('[DopingModal] Error data', errorData as Record<string, unknown>)
        }
        
        // Log raw response if available
        if (errorText) {
          logger.error('[DopingModal] Raw error response', { rawResponse: errorText })
        }
        
        // Log request body for debugging
        logger.debug('[DopingModal] Request body that failed', { requestBody })

        // Extract error message from various possible formats
        let errorMessage = `Ödeme hazırlanamadı (${response.status})`
        
        if (errorData.error) {
          const errorObj = errorData.error as Record<string, unknown>
          if (errorObj.message) {
            errorMessage = String(errorObj.message)
          } else if (errorObj.errors && Array.isArray(errorObj.errors)) {
            // Validation errors
            const validationErrors = errorObj.errors as Array<{ field: string; message: string }>
            const errorMessages = validationErrors.map(e => `${e.field}: ${e.message}`).join(', ')
            errorMessage = `Doğrulama hatası: ${errorMessages}`
          }
        } else if (errorData.message) {
          errorMessage = String(errorData.message)
        }
        
        console.error('🔍 [DopingModal] Final error message:', errorMessage)
        
        throw new Error(errorMessage)
      }

      let data: { success: boolean; data?: { paymentIntent?: PaymentIntent }; error?: unknown } = {}
      try {
        data = await response.json()
      } catch (parseError) {
        logger.error('[DopingModal] Failed to parse success response', { parseError })
        throw new Error('Sunucudan geçersiz yanıt alındı')
      }

      if (!data.success || !data.data?.paymentIntent) {
        logger.error('[DopingModal] Invalid payment intent response', { data })
        throw new Error('Ödeme hazırlama başarısız oldu')
      }

      const intent: PaymentIntent = data.data.paymentIntent

      logger.debug('[DopingModal] Payment intent created', { paymentIntentId: intent.id })

      setPaymentIntent(intent)
      setShowPaymentCheckout(true)
      onClose() // Close doping modal, show payment checkout
    } catch (error) {
      // Better error serialization
      let errorMessage = 'Ödeme hazırlanırken bir hata oluştu.'
      let errorStack: string | undefined
      let errorName = 'UnknownError'
      
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage
        errorStack = error.stack
        errorName = error.name
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object') {
        // Try to extract message from error object
        const errObj = error as Record<string, unknown>
        errorMessage = (errObj.message as string) || (errObj.error as string) || String(error)
        errorName = (errObj.name as string) || 'ObjectError'
      } else {
        errorMessage = String(error) || errorMessage
      }
      
      const errorDetails = {
        errorName,
        message: errorMessage,
        stack: errorStack,
        errorString: String(error),
        listingId: listing?.id,
        amount: totalAmount,
        itemCount: Object.keys(selectedDopings).length,
        errorType: error instanceof Error ? 'Error' : typeof error,
      }
      
      logger.error('[DopingModal] Payment intent creation error', errorDetails)
      
      // Try to get more details from response if it's a fetch error
      let userFriendlyMessage = errorMessage
      if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        userFriendlyMessage = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.'
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        userFriendlyMessage = 'Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.'
      } else if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
        userFriendlyMessage = 'Çok fazla istek gönderildi. Lütfen bir süre bekleyip tekrar deneyin.'
      } else if (errorMessage.includes('400') || errorMessage.includes('Validation')) {
        userFriendlyMessage = 'Geçersiz istek. Lütfen formu kontrol edin.'
      }
      
      toast({
        title: 'Hata',
        description: userFriendlyMessage,
        variant: 'destructive',
      })
    } finally {
      setIsPurchasing(false)
    }
  }

  /**
   * Handle successful payment
   */
  const handlePaymentSuccess = async (result: PaymentResult) => {
    if (!listing) return

    logger.debug('[DopingModal] Payment successful, applying doping', { 
      paymentIntentId: result.id, 
      listingId: listing.id 
    })

    // Apply doping to listing
    const updatePayload: Record<string, unknown> = {}
    const now = new Date()

    Object.values(selectedDopings).forEach(doping => {
      updatePayload[doping.db_field] = true
      const duration = doping.selectedPrice.duration

      if (duration > 0) {
        const expiresAt = new Date()
        expiresAt.setDate(now.getDate() + duration)
        
        if (doping.id === 'showcase') updatePayload.showcase_expires_at = expiresAt.toISOString()
        if (doping.id === 'urgent') updatePayload.urgent_expires_at = expiresAt.toISOString()
        if (doping.id === 'featured') updatePayload.featured_expires_at = expiresAt.toISOString()
      }
      
      if (doping.id === 'up_to_date') {
        updatePayload.upped_at = now.toISOString()
      }
    })

    // Add payment metadata (if these fields exist in the database)
    // Note: These fields might not exist in the listings table
    // If they don't exist, remove these lines or add them to the database schema
    // updatePayload.payment_id = result.id
    // updatePayload.payment_provider = result.provider
    // updatePayload.payment_transaction_id = result.providerTransactionId

    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        throw new Error('Doping güncellenemedi')
      }

      logger.debug('[DopingModal] Doping applied successfully', { listingId: listing.id })

      toast({
        title: 'Başarılı',
        description: 'Doping başarıyla uygulandı.',
        variant: 'default',
      })

      // Reset state
      setSelectedDopings({})
      setPaymentIntent(null)
      setShowPaymentCheckout(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      logger.error('[DopingModal] Doping application error', { error })
      toast({ 
        title: 'Hata', 
        description: 'Doping uygulanırken bir hata oluştu. Ödeme yapıldı ancak doping uygulanamadı. Lütfen destek ile iletişime geçin.',
        variant: 'destructive',
      })
    }
  }

  /**
   * Handle payment error
   */
  const handlePaymentError = (error: Error) => {
    logger.error('[DopingModal] Payment error', { error })
    toast({
      title: 'Ödeme Hatası',
      description: error.message || 'Ödeme işlenirken bir hata oluştu.',
      variant: 'destructive',
    })
  }

  if (!listing) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 flex flex-col h-[90vh] max-h-[800px]">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
            İlan için Doping Seçenekleri
          </DialogTitle>
          <DialogDescription>
            &quot;{listing.title}&quot; ilanınızı öne çıkarmak için aşağıdaki dopinglerden bir veya daha fazlasını seçin.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto p-6 pt-0 space-y-6">
          {/* Active Dopings Section */}
          {activeDopings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Aktif Doping'ler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeDopings.map((doping) => {
                  const Icon = doping.icon
                  const isCancelling = cancellingDoping === doping.id
                  return (
                    <motion.div
                      key={doping.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-700/10 rounded-lg flex items-center justify-center">
                              <Icon className="w-5 h-5 text-blue-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{doping.title}</p>
                              {doping.expiresAt && (
                                <p className="text-xs text-muted-foreground">
                                  Bitiş: {format(new Date(doping.expiresAt), 'dd.MM.yyyy', { locale: tr })}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Doping\'i iptal etmek istediğinize emin misiniz?\n\nNot: Para iadesi yapılmaz.')) {
                                handleCancelDoping(doping.id)
                              }
                            }}
                            disabled={isCancelling}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            {isCancelling ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                İptal Et
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* New Doping Selection Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              {activeDopings.length > 0 ? 'Yeni Doping Ekle' : 'Doping Seçenekleri'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {dopingOptions
                  .filter(option => {
                    // Only show options that are not active (or allow repurchase)
                    const isActive = listing?.[option.db_field] === true
                    return !isActive || !!selectedDopings[option.id]
                  })
                  .map((option) => {
                    const isSelected = !!selectedDopings[option.id]
                    const Icon = option.icon
                    return (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className={`rounded-lg border p-4 transition-all h-full ${isSelected ? 'border-blue-700 ring-2 ring-blue-700/50 bg-blue-700/5' : 'bg-card'}`}>
                          <div className="flex items-start gap-4">
                            <Checkbox
                              id={option.id}
                              checked={isSelected}
                              onCheckedChange={(checked) => handleCheckboxChange(checked as boolean, option)}
                              className="mt-1 h-5 w-5"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-blue-700/10 rounded-lg flex items-center justify-center">
                                  <Icon className="w-6 h-6 text-blue-700" />
                                </div>
                                <div>
                                  <label htmlFor={option.id} className="font-semibold text-lg text-foreground cursor-pointer">
                                    {option.title}
                                  </label>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                              
                              {isSelected && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <Select
                                    value={`${selectedDopings[option.id].selectedPrice.duration}-${selectedDopings[option.id].selectedPrice.price}`}
                                    onValueChange={(value) => handlePriceChange(option.id, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {option.prices.map((p, index) => (
                                        <SelectItem key={index} value={`${p.duration}-${p.price}`}>
                                          <div className="flex justify-between w-full gap-4">
                                            <span>{p.label}</span>
                                            <span className="font-bold text-blue-700">{p.price} TL</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-background/80 backdrop-blur-sm border-t flex-shrink-0 flex-col gap-4">
          {/* Terms Acceptance */}
          <div className="w-full flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
            <Checkbox 
              id="doping-terms" 
              checked={acceptTerms} 
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              className="mt-0.5 flex-shrink-0"
            />
            <div className="flex-1">
              <label
                htmlFor="doping-terms"
                className="text-sm font-medium leading-none cursor-pointer block"
              >
                Doping Hizmeti Kullanım Koşullarını okudum ve kabul ediyorum.
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                <Button 
                  type="button" 
                  variant="link" 
                  className="p-0 h-auto text-primary text-xs"
                  onClick={() => setShowTermsModal(true)}
                >
                  Sözleşmeyi Görüntüle
                </Button>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Önemli:</strong> Doping hizmetleri dijital hizmet kapsamındadır ve anında teslim edilir. 
                Para iadesi yapılmaz. İptal edebilirsiniz ancak para iadesi almayacaksınız.
              </p>
            </div>
          </div>

          {/* Purchase Button */}
          <div className="w-full flex justify-between items-center">
            <div>
              <span className="text-muted-foreground">Toplam Tutar:</span>
              <span className="text-2xl font-bold text-blue-700 ml-2">{totalPrice} TL</span>
            </div>
            <Button 
              onClick={handlePurchase} 
              size="lg" 
              className="bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white" 
              disabled={totalPrice === 0 || isPurchasing || !acceptTerms}
            >
              {isPurchasing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="w-5 h-5 mr-2" />
              )}
              {isPurchasing ? 'İşleniyor...' : 'Satın Al'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Payment Checkout Modal */}
      {paymentIntent && (
        <PaymentCheckout
          isOpen={showPaymentCheckout}
          onClose={() => {
            setShowPaymentCheckout(false)
            setPaymentIntent(null)
          }}
          paymentIntent={paymentIntent}
          amount={totalPrice * 100}
          currency="TRY"
          description={`${listing?.title} için doping ödemesi`}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      )}

      {/* Terms of Service Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Doping Hizmeti Kullanım Koşulları
            </DialogTitle>
            <DialogDescription>
              Lütfen aşağıdaki sözleşmeyi dikkatlice okuyun.
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="text-sm space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">1. GENEL BİLGİLER</h3>
                <p className="text-muted-foreground">
                  Bu sözleşme, Benalsam platformunda sunulan "Doping" hizmetlerinin kullanım koşullarını belirler. 
                  Doping hizmetleri, ilanlarınızın platformda daha fazla görünürlük kazanması için sunulan ücretli ek hizmetlerdir.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">4. İPTAL VE İADE POLİTİKASI</h3>
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    <strong>4.1. İptal Hakkı:</strong> Kullanıcılar, aktif doping hizmetlerini istedikleri zaman iptal edebilir. 
                    İptal işlemi doping hizmetini anında sonlandırır.
                  </p>
                  <p className="text-muted-foreground">
                    <strong>4.2. Para İadesi:</strong> Doping hizmetleri dijital hizmet kapsamında olduğundan ve anında teslim edildiğinden, 
                    cayma hakkı kapsamı dışındadır. <strong>Para iadesi yapılmaz.</strong>
                  </p>
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-3">
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                      ⚠️ ÖNEMLİ: Para iadesi yapılmaz:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                      <li>Doping hizmeti satın alındıktan sonra</li>
                      <li>Doping hizmeti aktif hale geldikten sonra</li>
                      <li>Doping hizmeti iptal edildiğinde</li>
                      <li>Süre bitmeden önce iptal edildiğinde</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">7. YASAKLI KULLANIM VE İSTİSMAR</h3>
                <p className="text-muted-foreground">
                  Yasalara aykırı içerik, yanıltıcı bilgi, spam veya kötüye kullanım durumlarında doping hizmeti iptal edilir 
                  ve para iadesi yapılmaz. Hesap askıya alınabilir veya kapatılabilir.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">13. KABUL VE ONAY</h3>
                <p className="text-muted-foreground">
                  Bu sözleşmeyi kabul ederek:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                  <li>Doping hizmetinin dijital hizmet olduğunu ve anında teslim edildiğini kabul edersiniz.</li>
                  <li>Para iadesi yapılmayacağını kabul edersiniz.</li>
                  <li>İptal ettiğinizde kalan süre için para iadesi almayacağınızı kabul edersiniz.</li>
                  <li>Sözleşmenin tüm maddelerini okuduğunuzu ve anladığınızı beyan edersiniz.</li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Son Güncelleme:</strong> 9 Ocak 2026 | <strong>Versiyon:</strong> 1.0
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Tam sözleşme metni için: <a href="/doping-terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">DOPING_TERMS_OF_SERVICE.md</a>
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setShowTermsModal(false)
              setAcceptTerms(true)
            }}>
              Kabul Ediyorum
            </Button>
            <Button variant="outline" onClick={() => setShowTermsModal(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

export default DopingModal

