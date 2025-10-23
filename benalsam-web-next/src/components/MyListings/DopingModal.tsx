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
import { ShoppingCart, Loader2 } from 'lucide-react'

interface SelectedDoping extends DopingOption {
  selectedPrice: DopingPrice
}

interface DopingModalProps {
  isOpen: boolean
  onClose: () => void
  listing: any | null
  onSuccess: () => void
}

const DopingModal = ({ isOpen, onClose, listing, onSuccess }: DopingModalProps) => {
  const [selectedDopings, setSelectedDopings] = useState<Record<string, SelectedDoping>>({})
  const [isPurchasing, setIsPurchasing] = useState(false)

  useEffect(() => {
    if (listing) {
      const initialDopings: Record<string, SelectedDoping> = {}
      dopingOptions.forEach(option => {
        if (listing[option.db_field]) {
          const defaultPrice = option.prices[0]
          initialDopings[option.id] = {
            ...option,
            selectedPrice: defaultPrice,
          }
        }
      })
      setSelectedDopings(initialDopings)
    } else {
      setSelectedDopings({})
    }
  }, [listing])

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

  const handlePurchase = async () => {
    if (!listing || isPurchasing) return
    setIsPurchasing(true)

    const updatePayload: Record<string, any> = {}
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

    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      })

      if (!response.ok) {
        throw new Error('Doping güncellenemedi')
      }

      toast({
        title: 'Başarılı',
        description: 'Doping başarıyla uygulandı.',
        variant: 'default',
      })

      if (onSuccess) {
        onSuccess()
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Doping purchase error:', error)
      toast({ 
        title: 'Hata', 
        description: 'Doping güncellenirken bir hata oluştu.', 
        variant: 'destructive' 
      })
    } finally {
      setIsPurchasing(false)
    }
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
        
        <div className="flex-grow overflow-y-auto p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {dopingOptions.map((option) => {
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
                            {listing[option.db_field] && <Badge variant="secondary" className="ml-2">Aktif</Badge>}
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

        <DialogFooter className="p-6 bg-background/80 backdrop-blur-sm border-t flex-shrink-0">
          <div className="w-full flex justify-between items-center">
            <div>
              <span className="text-muted-foreground">Toplam Tutar:</span>
              <span className="text-2xl font-bold text-blue-700 ml-2">{totalPrice} TL</span>
            </div>
            <Button 
              onClick={handlePurchase} 
              size="lg" 
              className="bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white" 
              disabled={totalPrice === 0 || isPurchasing}
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
    </Dialog>
  )
}

export default DopingModal

