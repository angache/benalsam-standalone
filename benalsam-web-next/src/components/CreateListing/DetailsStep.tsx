'use client'

import React, { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Loader2 } from 'lucide-react'
import { listingAIService } from '@/services/listingAIService'
import { useToast } from '@/hooks/use-toast'
import { useCreateListingStore } from '@/stores'

const detailsSchema = z.object({
  title: z.string().min(5, 'Başlık en az 5 karakter olmalı'),
  description: z.string().min(20, 'Açıklama en az 20 karakter olmalı'),
  budget: z.string().min(1, 'Bütçe gerekli').refine((val) => {
    const num = Number(val.replace(/\D+/g, ''))
    return !isNaN(num) && num > 0
  }, 'Fiyat pozitif bir sayı olmalı'),
  urgency: z.enum(['normal', 'urgent', 'very_urgent']).default('normal')
})

type DetailsFormData = z.infer<typeof detailsSchema>

interface DetailsStepProps {
  formData: DetailsFormData
  onChange: (field: keyof DetailsFormData, value: string) => void
  onNext: () => void
  onBack: () => void
  selectedCategoryId?: string | null
}

export default function DetailsStep({ formData, onChange, onNext, onBack, selectedCategoryId }: DetailsStepProps) {
  const { toast } = useToast()
  const { attributes } = useCreateListingStore()
  const [isAILoading, setIsAILoading] = React.useState(false)
  const [aiLoadingType, setAILoadingType] = React.useState<'title' | 'description' | 'all' | null>(null)

  // Seçilen kategori adını localStorage cache'inden bul
  const selectedCategoryName = useMemo(() => {
    try {
      if (!selectedCategoryId) return ''
      const raw = localStorage.getItem('benalsam_categories_next_v1.0.0')
      if (!raw) return ''
      const parsed = JSON.parse(raw)
      const roots: any[] = parsed?.data || []
      const findById = (nodes: any[]): any | null => {
        for (const n of nodes) {
          if (String(n.id) === String(selectedCategoryId)) return n
          const subs = n.subcategories || n.children || []
          const found = findById(subs)
          if (found) return found
        }
        return null
      }
      const node = findById(roots)
      return node?.name || ''
    } catch {
      return ''
    }
  }, [selectedCategoryId])

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue
  } = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: formData,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // Watch form changes and update store
  const watchedValues = watch()
  const prevValues = React.useRef<DetailsFormData>(formData)
  
  React.useEffect(() => {
    const currentValues = {
      title: watchedValues.title || '',
      description: watchedValues.description || '',
      budget: watchedValues.budget || '',
      urgency: watchedValues.urgency || 'normal'
    }
    
    // Only update if values actually changed
    if (
      prevValues.current.title !== currentValues.title ||
      prevValues.current.description !== currentValues.description ||
      prevValues.current.budget !== currentValues.budget ||
      prevValues.current.urgency !== currentValues.urgency
    ) {
      // Only log when form is complete (all fields filled)
      if (currentValues.title && currentValues.description && currentValues.budget) {
        console.log('📝 [FORM] Form completed:', currentValues)
      }
      onChange('title', currentValues.title)
      onChange('description', currentValues.description)
      onChange('budget', currentValues.budget)
      onChange('urgency', currentValues.urgency)
      prevValues.current = currentValues
    }
  }, [watchedValues.title, watchedValues.description, watchedValues.budget, watchedValues.urgency, onChange])

  // Manual validation check for button state
  const isFormValid = useMemo(() => {
    const values = watch()
    try {
      detailsSchema.parse(values)
      return true
    } catch {
      return false
    }
  }, [watch()])

  const formatNumberTR = (valueNumber: number) => {
    return new Intl.NumberFormat('tr-TR').format(valueNumber)
  }

  const handlePriceChange = (raw: string) => {
    // Remove non-digits and limit to 10 characters
    const digitsOnly = raw.replace(/\D+/g, '').slice(0, 10)
    const num = Number(digitsOnly)
    
    if (num > 0) {
      const formatted = formatNumberTR(num)
      setValue('budget', formatted)
      onChange('budget', String(num))
    } else {
      setValue('budget', '')
      onChange('budget', '')
    }
  }

  const onSubmit = (data: DetailsFormData) => {
    onNext()
  }

  // AI Functions
  const handleAISuggestTitle = async () => {
    if (!selectedCategoryName) {
      toast({ title: 'Kategori seçilmedi', description: 'Önce bir kategori seçmelisiniz', variant: 'destructive' })
      return
    }

    setIsAILoading(true)
    setAILoadingType('title')
    try {
      const suggestions = await listingAIService.suggestTitle({
        category: selectedCategoryName,
        categoryId: selectedCategoryId || undefined,
        attributes: attributes || {},
        currentTitle: formData.title,
        userInput: formData.title || formData.description || selectedCategoryName
      })

      if (suggestions.length > 0) {
        setValue('title', suggestions[0].title)
        onChange('title', suggestions[0].title)
        toast({ 
          title: 'Başlık önerildi', 
          description: suggestions[0].reason,
          variant: 'default'
        })
      } else {
        toast({ title: 'Öneri bulunamadı', variant: 'destructive' })
      }
    } catch (error: any) {
      console.error('AI title suggestion error:', error)
      const errorMessage = error?.message?.includes('not authenticated') 
        ? 'Giriş yapmanız gerekiyor' 
        : 'Başlık önerisi alınamadı'
      toast({ title: 'Hata', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsAILoading(false)
      setAILoadingType(null)
    }
  }

  const handleAISuggestDescription = async () => {
    if (!selectedCategoryName) {
      toast({ title: 'Kategori seçilmedi', description: 'Önce bir kategori seçmelisiniz', variant: 'destructive' })
      return
    }

    setIsAILoading(true)
    setAILoadingType('description')
    try {
      const description = await listingAIService.suggestDescription({
        category: selectedCategoryName,
        categoryId: selectedCategoryId || undefined,
        attributes: attributes || {},
        currentDescription: formData.description,
        userInput: formData.title || formData.description || selectedCategoryName
      })

      if (description) {
        setValue('description', description)
        onChange('description', description)
        toast({ title: 'Açıklama oluşturuldu', variant: 'default' })
      }
    } catch (error: any) {
      console.error('AI description suggestion error:', error)
      const errorMessage = error?.message?.includes('not authenticated') 
        ? 'Giriş yapmanız gerekiyor' 
        : 'Açıklama oluşturulamadı'
      toast({ title: 'Hata', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsAILoading(false)
      setAILoadingType(null)
    }
  }

  const handleAIGenerateAll = async () => {
    if (!selectedCategoryName) {
      toast({ title: 'Kategori seçilmedi', description: 'Önce bir kategori seçmelisiniz', variant: 'destructive' })
      return
    }

    setIsAILoading(true)
    setAILoadingType('all')
    try {
      const result = await listingAIService.generateCompleteListing({
        category: selectedCategoryName,
        categoryId: selectedCategoryId || undefined,
        attributes: attributes || {},
        userInput: formData.title || formData.description || selectedCategoryName,
        currentTitle: formData.title,
        currentDescription: formData.description
      })

      // Fill all fields
      if (result.title) {
        setValue('title', result.title)
        onChange('title', result.title)
      }
          if (result.description) {
            setValue('description', result.description)
            onChange('description', result.description)
          }
          // Bütçe önerisi kaldırıldı - kullanıcı kendisi girecek

      // Update attributes in store
      if (result.attributes && Object.keys(result.attributes).length > 0) {
        const { updateAttribute } = useCreateListingStore.getState()
        for (const [key, value] of Object.entries(result.attributes)) {
          updateAttribute(key, value)
        }
      }

      toast({ 
        title: 'AI ile oluşturuldu', 
        description: 'Tüm alanlar otomatik dolduruldu',
        variant: 'default'
      })
    } catch (error: any) {
      console.error('AI generate all error:', error)
      let errorMessage = 'İlan oluşturulamadı'
      
      if (error?.message?.includes('not authenticated')) {
        errorMessage = 'Giriş yapmanız gerekiyor'
      } else if (error?.message?.includes('kullanılamıyor') || error?.message?.includes('Failed to fetch')) {
        errorMessage = 'AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({ title: 'Hata', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsAILoading(false)
      setAILoadingType(null)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step <= 2 
                  ? 'text-white shadow-lg' 
                  : 'bg-gray-300'}`} style={step <= 2 ? {backgroundColor: 'var(--primary)'} : {}}>
                {step < 2 ? '✓' : step === 2 ? '2' : step}
              </div>
              {step < 6 && (
                <div className={`w-20 h-2 mx-3 rounded-full transition-all duration-300`} style={{
                  backgroundColor: step < 2 ? 'var(--primary)' : '#e5e7eb'
                }} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-medium text-gray-600">
          <span className="text-green-600">✓ Kategori</span>
          <span style={{color: 'var(--primary)'}}>Detaylar</span>
          <span>Özellikler</span>
          <span>Görseller</span>
          <span>Konum</span>
          <span>Onay</span>
        </div>
      </div>

      {selectedCategoryName && (
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="opacity-80">Seçilen Kategori:</span>
                <Badge variant="secondary">{selectedCategoryName}</Badge>
              </span>
            </div>
            <Button
              onClick={handleAIGenerateAll}
              disabled={isAILoading}
              variant="outline"
              className="gap-2"
            >
              {isAILoading && aiLoadingType === 'all' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI ile Oluştur
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      <h1 className="text-2xl md:text-3xl font-bold mb-6" style={{color: 'var(--primary)'}}>
        Detaylar
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">İlan Başlığı</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAISuggestTitle}
                  disabled={isAILoading}
                  className="h-7 gap-1 text-xs"
                >
                  {isAILoading && aiLoadingType === 'title' ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Öneriliyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      AI Öner
                    </>
                  )}
                </Button>
              </div>
              <Input
                id="title"
                {...register('title')}
                placeholder="Örn: iPhone 13 Pro Max 256GB, çiziksiz"
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Açıklama</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAISuggestDescription}
                  disabled={isAILoading}
                  className="h-7 gap-1 text-xs"
                >
                  {isAILoading && aiLoadingType === 'description' ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      AI Oluştur
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Ürün durumu, aksesuarlar, garanti bilgisi vb. detayları yazın"
                rows={6}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            {/* Budget & Urgency on the same row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Bütçe (₺) *</Label>
                <Input
                  id="budget"
                  value={watch('budget')}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="Örn: 1.000.000"
                  maxLength={12}
                />
                {errors.budget && <p className="text-xs text-destructive">{errors.budget.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Aciliyet</Label>
                <Select
                  value={watch('urgency')}
                  onValueChange={(v) => {
                    setValue('urgency', v as any)
                    onChange('urgency', v)
                  }}
                >
                  <SelectTrigger id="urgency">
                    <SelectValue placeholder="Normal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                    <SelectItem value="very_urgent">Çok Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={onBack}>
                ← Geri
              </Button>
              <Button type="submit" disabled={!isFormValid} className="text-white"
                style={{backgroundColor: 'var(--primary)'}}
                onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}}
                onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'var(--primary)'}}
              >
                İleri →
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}