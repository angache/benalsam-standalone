'use client'

import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { turkishProvincesAndDistricts } from '@/config/locations'

interface LocationStepProps {
  formData: {
    city: string
    district: string
    neighborhood: string
  }
  onChange: (key: string, value: string) => void
  onNext: () => void
  onBack: () => void
}

export default function LocationStep({ formData, onChange, onNext, onBack }: LocationStepProps) {
  const [districts, setDistricts] = useState<string[]>([])
  const [isLocating, setIsLocating] = useState(false)
  const [wasAutoDetected, setWasAutoDetected] = useState(false)
  const [previousDistrict, setPreviousDistrict] = useState('')
  const { toast } = useToast()

  // Update districts when city changes
  useEffect(() => {
    if (formData.city) {
      const provinceData = turkishProvincesAndDistricts.find(p => p.name === formData.city)
      setDistricts(provinceData?.districts || [])
      
      // Clear district if not valid for new city
      if (!provinceData?.districts?.includes(formData.district)) {
        onChange('district', '')
      }
    } else {
      setDistricts([])
      onChange('district', '')
    }
  }, [formData.city])

  // Clear neighborhood when district changes (but not on initial load or auto-detection)
  useEffect(() => {
    // If district changed and it's not empty, and it's different from previous
    if (formData.district && previousDistrict && formData.district !== previousDistrict) {
      // Clear neighborhood when user manually changes district
      if (formData.neighborhood) {
        onChange('neighborhood', '')
      }
    }
    // Update previous district
    setPreviousDistrict(formData.district)
  }, [formData.district])

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Hata",
        description: "Tarayıcınız konum servisini desteklemiyor.",
        variant: "destructive"
      })
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=tr`
          )
          if (!response.ok) throw new Error('Konum bilgisi alınamadı.')
          
          const data = await response.json()
          const address = data.address
          
          const province = address.province || address.state
          const district = address.district || address.town || address.county
          const detectedNeighborhood = address.neighbourhood || address.suburb || address.quarter || ''

          // Set all location data at once
          if (province) onChange('city', province)
          if (district) {
            onChange('district', district)
            // Update previousDistrict to prevent neighborhood clearing
            setPreviousDistrict(district)
          }
          if (detectedNeighborhood) onChange('neighborhood', detectedNeighborhood)

          setWasAutoDetected(true)
          
          toast({
            title: "Başarılı",
            description: "Konumunuz başarıyla algılandı.",
            variant: "success"
          })
        } catch (error) {
          toast({
            title: "Hata",
            description: "Konum bilgisi işlenirken bir hata oluştu.",
            variant: "destructive"
          })
        } finally {
          setIsLocating(false)
        }
      },
      (error) => {
        let message = "Konum alınırken bir hata oluştu."
        if (error.code === 1) {
          message = "Konum izni reddedildi. Lütfen tarayıcı ayarlarından izin verin."
        }
        toast({
          title: "Hata",
          description: message,
          variant: "destructive"
        })
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleClearLocation = () => {
    onChange('city', '')
    onChange('district', '')
    onChange('neighborhood', '')
    setWasAutoDetected(false)
    toast({
      title: "Konum Temizlendi",
      description: "Yeni bir konum seçebilirsiniz."
    })
  }

  const isFormValid = !!(formData.city.trim() && formData.district.trim())

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div key={step} className="flex items-center flex-shrink-0">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-300 ${
                step <= 5 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg ring-2 ring-blue-200' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step < 5 ? '✓' : step === 5 ? '5' : step}
              </div>
              {step < 6 && (
                <div className={`w-12 md:w-20 h-2 mx-2 md:mx-3 rounded-full transition-all duration-300 ${
                  step < 5 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs md:text-sm font-medium text-gray-600 overflow-x-auto">
          <span className="text-green-600 flex-shrink-0">✓ Kategori</span>
          <span className="text-green-600 flex-shrink-0">✓ Detaylar</span>
          <span className="text-green-600 flex-shrink-0">✓ Özellikler</span>
          <span className="text-green-600 flex-shrink-0">✓ Görseller</span>
          <span className="text-blue-600 flex-shrink-0">Konum</span>
          <span className="flex-shrink-0">Onay</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Konum Belirtin
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Doğru teklifler alabilmek için konumunuzu belirtin
          </p>
        </div>

        {/* Auto Location Detection Button */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            type="button"
            variant="outline"
            onClick={handleGeolocate}
            disabled={isLocating}
            className="flex items-center gap-2 border-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 px-6 py-6 text-base font-semibold rounded-xl transition-all duration-300 hover:scale-105"
          >
            {isLocating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Konum algılanıyor...
              </>
            ) : (
              <>
                <Navigation className="h-5 w-5" />
                Konumumu Otomatik Algıla
              </>
            )}
          </Button>
          
          {(formData.city || formData.district || formData.neighborhood) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearLocation}
              className="flex items-center gap-2 border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 px-6 py-6 text-base font-semibold rounded-xl transition-all duration-300 hover:scale-105"
            >
              <X className="h-5 w-5" />
              Temizle
            </Button>
          )}
        </div>

        {/* Auto-detected Info Message */}
        {wasAutoDetected && (
          <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  ℹ️ Konum otomatik algılandı
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500">
                  İsterseniz manuel olarak değiştirebilir veya "Temizle" butonuna basarak yeni bir konum seçebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Location Form */}
        <div className="space-y-6">
          {/* City Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              İl *
            </label>
            <Select value={formData.city} onValueChange={(value) => onChange('city', value)}>
              <SelectTrigger className="w-full h-12 text-base border-2 focus:border-green-500 focus:ring-green-500 rounded-xl">
                <SelectValue placeholder="İl Seçin" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {turkishProvincesAndDistricts.map(province => (
                  <SelectItem key={province.name} value={province.name}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* District Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              İlçe *
            </label>
            <Select 
              value={formData.district} 
              onValueChange={(value) => onChange('district', value)}
              disabled={!formData.city || districts.length === 0}
            >
              <SelectTrigger className="w-full h-12 text-base border-2 focus:border-green-500 focus:ring-green-500 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                <SelectValue placeholder={!formData.city ? "Önce İl Seçin" : "İlçe Seçin"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {districts.map(district => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.city && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                İlçe seçebilmek için önce bir il seçin
              </p>
            )}
          </div>

          {/* Neighborhood Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              Mahalle / Semt (İsteğe bağlı)
            </label>
            <Input
              type="text"
              value={formData.neighborhood}
              onChange={(e) => onChange('neighborhood', e.target.value)}
              placeholder="Örn: Çankaya Mahallesi"
              className="w-full h-12 text-base border-2 focus:border-green-500 focus:ring-green-500 rounded-xl"
            />
          </div>

          {/* Location Preview */}
          {formData.city && formData.district && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                    📍 Seçilen Konum
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {formData.neighborhood && `${formData.neighborhood}, `}
                    {formData.district} / {formData.city}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="px-8 py-6 text-base font-semibold rounded-xl border-2 hover:scale-105 transition-all duration-300"
        >
          ← Geri
        </Button>
        
        <Button
          type="button"
          onClick={onNext}
          disabled={!isFormValid}
          className="px-8 py-6 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          İleri →
        </Button>
      </div>
    </div>
  )
}

