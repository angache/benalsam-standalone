'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Send, Package, DollarSign, MessageSquare, Loader2, Image as ImageIcon, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

interface MakeOfferFormProps {
  listing: any
  inventoryItems: any[]
  currentUser: any
  onSubmit: (offerData: {
    selectedItemId?: string
    offeredPrice?: number
    message: string
    attachments?: File[]
  }) => Promise<void>
  isSubmitting: boolean
}

const MakeOfferForm: React.FC<MakeOfferFormProps> = ({
  listing,
  inventoryItems,
  currentUser,
  onSubmit,
  isSubmitting,
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedItemId, setSelectedItemId] = useState('')
  const [offeredPrice, setOfferedPrice] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (offeredPrice !== '' && (isNaN(parseFloat(offeredPrice)) || parseFloat(offeredPrice) < 0)) {
      newErrors.offeredPrice = 'Geçerli bir teklif fiyatı girin (0 veya daha büyük).'
    } else if (offeredPrice === '' && !selectedItemId) {
      newErrors.offeredPrice = 'Lütfen bir ürün seçin veya bir nakit teklifi yapın.'
    }
    
    if (!message.trim()) {
      newErrors.message = 'Lütfen bir teklif mesajı yazın.'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const offerData = {
      selectedItemId: selectedItemId || undefined,
      offeredPrice: offeredPrice ? parseFloat(offeredPrice) : undefined,
      message: message.trim(),
    }

    await onSubmit(offerData)
  }

  const selectedInventoryItem = inventoryItems.find((item) => item.id === selectedItemId)
  const isInventoryEmpty = inventoryItems.length === 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-card rounded-2xl border">
      {isInventoryEmpty && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-400" />
            <div>
              <h4 className="font-semibold text-blue-300">Daha Güçlü Teklifler İçin İpucu!</h4>
              <p className="text-sm mt-1 text-blue-300/80">
                Envanteriniz şu an boş. Teklifinize envanterinizden bir ürün eklemek, karşı tarafın teklifinizi daha
                ciddiye almasını sağlayabilir. Dilerseniz sadece nakit teklif de yapabilirsiniz.
              </p>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto mt-2 text-blue-400 hover:text-blue-300"
                onClick={() => router.push('/envanter/yeni')}
              >
                Envanterime Ürün Ekle →
              </Button>
            </div>
          </div>
        </div>
      )}

      <fieldset disabled={isSubmitting} className="space-y-6">
        {/* Inventory Item Selection */}
        <div>
          <Label className="block text-sm font-medium text-foreground mb-1.5">
            <Package className="w-4 h-4 inline mr-2 text-primary" /> Teklif Edilecek Envanter Ürünü (Opsiyonel)
          </Label>
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger
              className={`w-full ${errors.selectedItemId ? 'border-destructive' : ''}`}
            >
              <SelectValue placeholder="Envanterinizden bir ürün seçin..." />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {inventoryItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage
                        src={item.main_image_url || item.image_url}
                        alt={item.name}
                      />
                      <AvatarFallback>
                        <ImageIcon className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span>{item.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.selectedItemId && (
            <p className="text-destructive text-xs mt-1">{errors.selectedItemId}</p>
          )}
          {selectedInventoryItem && (
            <div className="mt-2 p-3 bg-muted/30 rounded-md border border-border/50 flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-md overflow-hidden border border-border flex-shrink-0">
                {selectedInventoryItem.main_image_url || selectedInventoryItem.image_url ? (
                  <Image
                    src={selectedInventoryItem.main_image_url || selectedInventoryItem.image_url}
                    alt={selectedInventoryItem.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedInventoryItem.name}</p>
                <p className="text-xs text-muted-foreground">{selectedInventoryItem.category}</p>
              </div>
            </div>
          )}
        </div>

        {/* Price Offer */}
        <div>
          <Label className="block text-sm font-medium text-foreground mb-1.5">
            <DollarSign className="w-4 h-4 inline mr-2 text-primary" /> Ek Nakit Teklifi (₺) (Opsiyonel)
          </Label>
          <Input
            type="number"
            value={offeredPrice}
            onChange={(e) => setOfferedPrice(e.target.value)}
            placeholder="0"
            min="0"
            className={errors.offeredPrice ? 'border-destructive' : ''}
          />
          {errors.offeredPrice && (
            <p className="text-destructive text-xs mt-1">{errors.offeredPrice}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <Label className="block text-sm font-medium text-foreground mb-1.5">
            <MessageSquare className="w-4 h-4 inline mr-2 text-primary" /> Teklif Mesajınız *
          </Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Teklifiniz hakkında ek detaylar, takas koşulları vb."
            rows={4}
            className={errors.message ? 'border-destructive' : ''}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right mt-1">
            {message.length} / 500
          </p>
          {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
        </div>
      </fieldset>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Teklifi Gönder
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export default MakeOfferForm

