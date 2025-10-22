'use client'

import React, { useState } from 'react'
import { Tag, MapPin, ImageIcon, CheckCircle, FileText, Settings, Clock, Phone, Repeat, ShieldCheck, CopyCheck, DollarSign, Text, Zap, Crown, Star, Eye, Info, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface ReviewStepProps {
  formData: {
    category: {
      selectedCategoryId: string | null
      selectedCategoryName: string | null
      categoryPath: string[]
    }
    details: {
      title: string
      description: string
      price: string
      urgency: 'normal' | 'urgent'
    }
    attributes: Record<string, any>
    images: any[]
    mainImageIndex: number
    location: {
      city: string
      district: string
      neighborhood: string
    }
  }
  acceptTerms: boolean
  onAcceptTermsChange: (checked: boolean) => void
  onSubmit: () => void
  onBack: () => void
  isSubmitting?: boolean
}

const ReviewItem = ({ icon: Icon, label, value, children }: { 
  icon: any
  label: string
  value?: string
  children?: React.ReactNode
}) => (
  <div className="flex items-start py-3">
    <Icon className="w-5 h-5 mr-4 text-blue-600 dark:text-blue-400 mt-1 shrink-0" />
    <div className="flex-grow">
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      {children ? children : <p className="font-semibold">{value || "Belirtilmedi"}</p>}
    </div>
  </div>
)

const premiumFeaturesList = [
  {
    id: 'is_featured',
    name: 'Öne Çıkar',
    icon: Star,
    price: '₺15',
    duration: '7 gün',
    description: 'İlanınız arama sonuçlarında en üstte görünür',
    benefits: ['Arama sonuçlarında öncelik', '3x daha fazla görüntülenme', 'Daha hızlı satış']
  },
  {
    id: 'is_urgent_premium',
    name: 'Acil İlan',
    icon: Zap,
    price: '₺10',
    duration: '3 gün',
    description: 'İlanınız "ACİL" etiketi ile öne çıkar',
    benefits: ['Kırmızı "ACİL" etiketi', 'Kategori sayfasında öncelik', 'Hızlı dikkat çekme']
  },
  {
    id: 'is_showcase',
    name: 'Vitrin',
    icon: Eye,
    price: '₺25',
    duration: '14 gün',
    description: 'Ana sayfada özel vitrin alanında gösterilir',
    benefits: ['Ana sayfa vitrini', 'Premium görsel tasarım', 'Maksimum görünürlük']
  }
]

const durationOptions = [
  { value: '7', label: '7 Gün' },
  { value: '15', label: '15 Gün' },
  { value: '30', label: '30 Gün' },
  { value: '60', label: '60 Gün' },
]

const contactOptions = [
  { value: 'site_message', label: 'Sadece Site Üzerinden Mesaj' },
  { value: 'phone', label: 'Telefon ve Mesaj' },
]

export default function ReviewStep({ 
  formData, 
  acceptTerms,
  onAcceptTermsChange,
  onSubmit, 
  onBack,
  isSubmitting = false
}: ReviewStepProps) {
  const [premiumFeatures, setPremiumFeatures] = useState<Record<string, boolean>>({})
  const [duration, setDuration] = useState('30')
  const [contactPreference, setContactPreference] = useState('site_message')
  const [autoRepublish, setAutoRepublish] = useState(false)
  const { toast } = useToast()

  // Debug: Log images to console
  React.useEffect(() => {
    console.log('🖼️ [REVIEW] Images data:', {
      images: formData.images,
      mainImageIndex: formData.mainImageIndex,
      count: Array.isArray(formData.images) ? formData.images.length : 'not an array'
    })
  }, [formData.images, formData.mainImageIndex])

  const locationPath = [
    formData.location.neighborhood,
    formData.location.district,
    formData.location.city
  ].filter(Boolean).join(', ')

  const categoryPath = formData.category.categoryPath.join(' > ')

  const handlePremiumFeatureChange = (featureId: string, enabled: boolean) => {
    setPremiumFeatures(prev => ({
      ...prev,
      [featureId]: enabled
    }))
  }

  const calculateTotalCost = () => {
    return premiumFeaturesList.reduce((total, feature) => {
      if (premiumFeatures[feature.id]) {
        const price = parseInt(feature.price.replace('₺', ''))
        return total + price
      }
      return total
    }, 0)
  }

  const totalCost = calculateTotalCost()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h2 className="text-2xl font-bold text-center">Önizleme ve Onay</h2>
      <p className="text-center text-muted-foreground">Lütfen bilgileri kontrol edin ve ilanınızı onaya gönderin.</p>
      
      <div className="p-4 space-y-2 rounded-lg glass-effect divide-y divide-border">
        <ReviewItem icon={Tag} label="İlan Başlığı" value={formData.details.title} />
        <ReviewItem icon={Text} label="Kategori" value={categoryPath} />
        <ReviewItem icon={Text} label="Açıklama" value={formData.details.description} />
        <ReviewItem icon={DollarSign} label="Bütçe" value={`${formData.details.price} ₺`} />
        <ReviewItem icon={MapPin} label="Konum" value={locationPath} />
        <ReviewItem icon={ShieldCheck} label="Kabul Ettiğim Durumlar">
          <div className="flex flex-wrap gap-2 mt-1">
            {(!formData.attributes || Object.keys(formData.attributes).length === 0) ? (
              <Badge className="bg-primary/10 text-primary border border-primary/20">Fark Etmez</Badge>
            ) : (
              Object.entries(formData.attributes).flatMap(([k, vals]) => {
                const arr = Array.isArray(vals) ? vals : [vals]
                return arr.map((v, idx) => (
                  <Badge key={`${k}-${idx}`} className="bg-primary/10 text-primary border border-primary/20">{k}: {v}</Badge>
                ))
              })
            )}
          </div>
        </ReviewItem>
        <ReviewItem icon={Settings} label="Seçili Özellikler">
          <div className="flex flex-wrap gap-2 mt-1">
            {formData.attributes && Object.keys(formData.attributes).length > 0 ? (
              Object.entries(formData.attributes).flatMap(([k, vals]) => {
                const arr = Array.isArray(vals) ? vals : [vals]
                return arr.map((v, idx) => (
                  <Badge key={`${k}-${idx}`} className="bg-primary/10 text-primary border border-primary/20">{k}: {v}</Badge>
                ))
              })
            ) : (
              <span className="text-sm text-muted-foreground">Seçili özellik yok</span>
            )}
          </div>
        </ReviewItem>
        <ReviewItem icon={Clock} label="Aciliyet">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{formData.details.urgency}</span>
          </div>
        </ReviewItem>
        <ReviewItem icon={ImageIcon} label={`Görseller (${Array.isArray(formData.images) ? formData.images.length : 0})`}>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-2">
            {Array.isArray(formData.images) && formData.images.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                <img 
                  src={img.preview} 
                  alt={`Görsel ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                {formData.mainImageIndex === index && (
                  <div className="absolute top-1 right-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">ANA</div>
                )}
              </div>
            ))}
          </div>
        </ReviewItem>
      </div>

      {/* Premium Features */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Premium Özellikler
          </h3>
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Premium Gerekli
          </Badge>
        </div>

        <div className="grid gap-4">
          {premiumFeaturesList.map((feature) => {
            const Icon = feature.icon
            const isSelected = premiumFeatures[feature.id]

            return (
              <Card key={feature.id} className={`relative transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                           <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{feature.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {feature.price}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {feature.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={isSelected}
                      onCheckedChange={(checked) => handlePremiumFeatureChange(feature.id, checked)}
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <CardDescription className="mb-3">
                    {feature.description}
                  </CardDescription>
                  
                  <div className="space-y-1">
                    {feature.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        {benefit}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {totalCost > 0 && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Toplam Premium Maliyet</p>
                <p className="text-sm text-muted-foreground">Seçilen özellikler için</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">₺{totalCost}</p>
                <p className="text-xs text-muted-foreground">Tek seferlik</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Premium Üyelik Gerekli
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Bu özellikleri kullanabilmek için Premium üyeliğe sahip olmanız gerekiyor. 
                Premium ile sınırsız ilan, teklif ve mesaj hakkının yanı sıra bu özel özelliklere de erişim sağlayabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400"/>Yayın Ayarları</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Yayın Süresi
            </label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="w-full bg-input border-border text-foreground">
                <SelectValue placeholder="Yayın Süresi Seçin" />
              </SelectTrigger>
              <SelectContent className="dropdown-content">
                {durationOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              İletişim Tercihi
            </label>
            <Select value={contactPreference} onValueChange={setContactPreference}>
              <SelectTrigger className="w-full bg-input border-border text-foreground">
                <SelectValue placeholder="İletişim Tercihi Seçin" />
              </SelectTrigger>
              <SelectContent className="dropdown-content">
                {contactOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-input rounded-lg">
          <Repeat className="w-5 h-5 text-blue-600 dark:text-blue-400"/>
          <Label htmlFor="auto-republish" className="flex-grow">Süre bitince ilanı otomatik olarak yeniden yayınla</Label>
          <Switch
            id="auto-republish"
            checked={autoRepublish}
            onCheckedChange={setAutoRepublish}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center"><CopyCheck className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400"/>Kurallar ve Onay</h3>
        <div className="items-top flex space-x-3 p-3 bg-input rounded-lg">
          <Checkbox id="terms" checked={acceptTerms} onCheckedChange={onAcceptTermsChange} className="mt-0.5 flex-shrink-0" />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              İlan verme kurallarını okudum ve kabul ediyorum.
            </label>
            <p className="text-sm text-muted-foreground">
              <Button type="button" variant="link" className="p-0 h-auto text-primary">Kuralları Görüntüle</Button>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-8 py-6 text-base font-semibold rounded-xl border-2 hover:scale-105 transition-all duration-300"
        >
          ← Geri
        </Button>
        
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!acceptTerms || isSubmitting}
          className="px-8 py-6 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              İlan Gönderiliyor...
            </>
          ) : (
            <>
              ✓ Onaya Gönder
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

