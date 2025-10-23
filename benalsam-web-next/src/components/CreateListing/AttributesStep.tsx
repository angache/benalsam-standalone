'use client'

import React, { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'

// Kategoriye özel attribute tanımları
const categoryAttributes = {
  'smartphone': {
    name: 'Akıllı Telefon',
    attributes: [
      { key: 'brand', label: 'Marka', type: 'checkbox-grid', required: false, options: [
        { value: 'apple', label: 'Apple', description: 'iPhone, iPad, MacBook' },
        { value: 'samsung', label: 'Samsung', description: 'Galaxy serisi' },
        { value: 'huawei', label: 'Huawei', description: 'P serisi, Mate serisi' },
        { value: 'xiaomi', label: 'Xiaomi', description: 'Mi, Redmi serisi' },
        { value: 'oppo', label: 'Oppo', description: 'Find, Reno serisi' },
        { value: 'vivo', label: 'Vivo', description: 'X, V serisi' },
        { value: 'oneplus', label: 'OnePlus', description: 'Nord, Pro serisi' },
        { value: 'google', label: 'Google', description: 'Pixel serisi' },
        { value: 'other', label: 'Diğer', description: 'Diğer markalar' }
      ]},
      { key: 'model', label: 'Model', type: 'text', required: false, placeholder: 'Örn: iPhone 13 Pro Max' },
      { key: 'color', label: 'Renk', type: 'checkbox-grid', required: false, options: [
        { value: 'black', label: 'Siyah', description: 'Klasik siyah renk' },
        { value: 'white', label: 'Beyaz', description: 'Temiz beyaz renk' },
        { value: 'blue', label: 'Mavi', description: 'Okyanus mavisi' },
        { value: 'red', label: 'Kırmızı', description: 'Canlı kırmızı' },
        { value: 'green', label: 'Yeşil', description: 'Doğal yeşil' },
        { value: 'purple', label: 'Mor', description: 'Kraliyet moru' },
        { value: 'gold', label: 'Altın', description: 'Lüks altın' },
        { value: 'silver', label: 'Gümüş', description: 'Şık gümüş' },
        { value: 'other', label: 'Diğer', description: 'Diğer renkler' }
      ]},
      { key: 'storage', label: 'Depolama', type: 'checkbox-grid', required: false, options: [
        { value: '64gb', label: '64GB', description: 'Temel kullanım için yeterli' },
        { value: '128gb', label: '128GB', description: 'Orta seviye kullanım' },
        { value: '256gb', label: '256GB', description: 'Yoğun kullanım için ideal' },
        { value: '512gb', label: '512GB', description: 'Profesyonel kullanım' },
        { value: '1tb', label: '1TB', description: 'Maksimum depolama' },
        { value: '2tb', label: '2TB', description: 'Ultra yüksek kapasite' }
      ]},
      { key: 'condition', label: 'Durum', type: 'checkbox-grid', required: false, options: [
        { value: 'new', label: 'Sadece Yeni', description: 'Hiç kullanılmamış, orijinal ambalajında' },
        { value: 'like-new', label: 'Sıfır Gibi', description: 'Çok az kullanılmış, neredeyse yeni' },
        { value: 'good', label: 'İyi Durumda', description: 'Normal kullanım izleri var, çalışır durumda' },
        { value: 'fair', label: 'Orta Durumda', description: 'Kullanım izleri belirgin, çalışır durumda' },
        { value: 'poor', label: 'Kötü Durumda', description: 'Hasarlı veya çalışmayan' },
        { value: 'parts', label: 'Parça İçin', description: 'Sadece parça olarak kullanılabilir' },
        { value: 'new-used', label: 'Yeni + İkinci El', description: 'Hem yeni hem ikinci el kabul ediyorum' },
        { value: 'any', label: 'Fark Etmez', description: 'Herhangi bir durumda olabilir' }
      ]},
      { key: 'warranty', label: 'Garanti', type: 'checkbox', required: false, label: 'Garantili' },
      { key: 'accessories', label: 'Aksesuarlar', type: 'textarea', required: false, placeholder: 'Kutu, şarj aleti, kulaklık vb.' }
    ]
  },
  'laptop': {
    name: 'Laptop',
    attributes: [
      { key: 'brand', label: 'Marka', type: 'checkbox-grid', required: false, options: [
        { value: 'apple', label: 'Apple', description: 'MacBook, MacBook Pro, MacBook Air' },
        { value: 'dell', label: 'Dell', description: 'XPS, Inspiron, Latitude' },
        { value: 'hp', label: 'HP', description: 'Pavilion, EliteBook, ProBook' },
        { value: 'lenovo', label: 'Lenovo', description: 'ThinkPad, IdeaPad, Yoga' },
        { value: 'asus', label: 'Asus', description: 'ZenBook, VivoBook, ROG' },
        { value: 'acer', label: 'Acer', description: 'Aspire, Swift, Nitro' },
        { value: 'msi', label: 'MSI', description: 'Gaming, Creator, Prestige' },
        { value: 'samsung', label: 'Samsung', description: 'Galaxy Book serisi' },
        { value: 'other', label: 'Diğer', description: 'Diğer markalar' }
      ]},
      { key: 'model', label: 'Model', type: 'text', required: false, placeholder: 'Örn: MacBook Pro M2' },
      { key: 'screen_size', label: 'Ekran Boyutu', type: 'checkbox-grid', required: false, options: [
        { value: '11', label: '11"', description: 'Kompakt boyut' },
        { value: '12', label: '12"', description: 'Ultra kompakt' },
        { value: '13', label: '13"', description: 'Taşınabilir boyut' },
        { value: '14', label: '14"', description: 'Dengeli boyut' },
        { value: '15', label: '15"', description: 'Standart boyut' },
        { value: '16', label: '16"', description: 'Geniş ekran' },
        { value: '17', label: '17"', description: 'Büyük ekran' },
        { value: '18', label: '18"', description: 'Maksimum ekran' }
      ]},
      { key: 'ram', label: 'RAM', type: 'checkbox-grid', required: false, options: [
        { value: '4gb', label: '4GB', description: 'Temel kullanım' },
        { value: '8gb', label: '8GB', description: 'Orta seviye' },
        { value: '16gb', label: '16GB', description: 'Yoğun kullanım' },
        { value: '32gb', label: '32GB', description: 'Profesyonel' },
        { value: '64gb', label: '64GB', description: 'Ultra performans' }
      ]},
      { key: 'storage', label: 'Depolama', type: 'checkbox-grid', required: false, options: [
        { value: '128gb', label: '128GB', description: 'Temel depolama' },
        { value: '256gb', label: '256GB', description: 'Orta seviye' },
        { value: '512gb', label: '512GB', description: 'Yoğun kullanım' },
        { value: '1tb', label: '1TB', description: 'Profesyonel' },
        { value: '2tb', label: '2TB', description: 'Maksimum kapasite' },
        { value: '4tb', label: '4TB', description: 'Ultra yüksek kapasite' }
      ]},
      { key: 'processor', label: 'İşlemci', type: 'text', required: false, placeholder: 'Örn: Intel i7, AMD Ryzen 7' },
      { key: 'condition', label: 'Durum', type: 'checkbox-grid', required: false, options: [
        { value: 'new', label: 'Sadece Yeni', description: 'Hiç kullanılmamış, orijinal ambalajında' },
        { value: 'like-new', label: 'Sıfır Gibi', description: 'Çok az kullanılmış, neredeyse yeni' },
        { value: 'good', label: 'İyi Durumda', description: 'Normal kullanım izleri var, çalışır durumda' },
        { value: 'fair', label: 'Orta Durumda', description: 'Kullanım izleri belirgin, çalışır durumda' },
        { value: 'poor', label: 'Kötü Durumda', description: 'Hasarlı veya çalışmayan' },
        { value: 'parts', label: 'Parça İçin', description: 'Sadece parça olarak kullanılabilir' },
        { value: 'new-used', label: 'Yeni + İkinci El', description: 'Hem yeni hem ikinci el kabul ediyorum' },
        { value: 'any', label: 'Fark Etmez', description: 'Herhangi bir durumda olabilir' }
      ]}
    ]
  },
  'car': {
    name: 'Araç',
    attributes: [
      { key: 'brand', label: 'Marka', type: 'checkbox-grid', required: false, options: [
        { value: 'bmw', label: 'BMW', description: 'Lüks Alman markası' },
        { value: 'mercedes', label: 'Mercedes', description: 'Premium Alman markası' },
        { value: 'audi', label: 'Audi', description: 'Teknoloji odaklı lüks' },
        { value: 'volkswagen', label: 'Volkswagen', description: 'Güvenilir Alman markası' },
        { value: 'toyota', label: 'Toyota', description: 'Güvenilir Japon markası' },
        { value: 'honda', label: 'Honda', description: 'Kaliteli Japon markası' },
        { value: 'ford', label: 'Ford', description: 'Amerikan güvenilirliği' },
        { value: 'renault', label: 'Renault', description: 'Fransız tasarımı' },
        { value: 'other', label: 'Diğer', description: 'Diğer markalar' }
      ]},
      { key: 'model', label: 'Model', type: 'text', required: false, placeholder: 'Örn: 3.20i' },
      { key: 'year', label: 'Model Yılı', type: 'checkbox-grid', required: false, options: Array.from({length: 25}, (_, i) => {
        const year = 2024 - i
        return { 
          value: year.toString(), 
          label: year.toString(), 
          description: year >= 2020 ? 'Yeni nesil' : year >= 2015 ? 'Modern' : 'Klasik' 
        }
      }) },
      { key: 'fuel', label: 'Yakıt Türü', type: 'checkbox-grid', required: false, options: [
        { value: 'gasoline', label: 'Benzin', description: 'Geleneksel yakıt' },
        { value: 'diesel', label: 'Dizel', description: 'Yakıt tasarrufu' },
        { value: 'hybrid', label: 'Hibrit', description: 'Çevre dostu' },
        { value: 'electric', label: 'Elektrik', description: 'Sıfır emisyon' },
        { value: 'lpg', label: 'LPG', description: 'Ekonomik yakıt' }
      ]},
      { key: 'transmission', label: 'Vites', type: 'checkbox-grid', required: false, options: [
        { value: 'manual', label: 'Manuel', description: 'Geleneksel vites' },
        { value: 'automatic', label: 'Otomatik', description: 'Kolay kullanım' },
        { value: 'semi-auto', label: 'Yarı Otomatik', description: 'Hibrit sistem' }
      ]},
      { key: 'mileage', label: 'Kilometre', type: 'text', required: false, placeholder: 'Örn: 50.000 km' },
      { key: 'condition', label: 'Durum', type: 'checkbox-grid', required: false, options: [
        { value: 'new', label: 'Sadece Yeni', description: 'Hiç kullanılmamış, orijinal ambalajında' },
        { value: 'like-new', label: 'Sıfır Gibi', description: 'Çok az kullanılmış, neredeyse yeni' },
        { value: 'good', label: 'İyi Durumda', description: 'Normal kullanım izleri var, çalışır durumda' },
        { value: 'fair', label: 'Orta Durumda', description: 'Kullanım izleri belirgin, çalışır durumda' },
        { value: 'poor', label: 'Kötü Durumda', description: 'Hasarlı veya çalışmayan' },
        { value: 'parts', label: 'Parça İçin', description: 'Sadece parça olarak kullanılabilir' },
        { value: 'new-used', label: 'Yeni + İkinci El', description: 'Hem yeni hem ikinci el kabul ediyorum' },
        { value: 'any', label: 'Fark Etmez', description: 'Herhangi bir durumda olabilir' }
      ]}
    ]
  },
  'real_estate': {
    name: 'Emlak',
    attributes: [
      { key: 'area', label: 'Metrekare', type: 'text', required: false, placeholder: 'Örn: 120 m²' },
      { key: 'rooms', label: 'Oda Sayısı', type: 'checkbox-grid', required: false, options: [
        { value: '1+0', label: '1+0', description: 'Stüdyo' },
        { value: '1+1', label: '1+1', description: '1 oda 1 salon' },
        { value: '2+1', label: '2+1', description: '2 oda 1 salon' },
        { value: '3+1', label: '3+1', description: '3 oda 1 salon' },
        { value: '4+1', label: '4+1', description: '4 oda 1 salon' },
        { value: '5+1', label: '5+1', description: '5 oda 1 salon' },
        { value: '6+', label: '6+', description: '6 ve üzeri' }
      ]},
      { key: 'floor', label: 'Kat', type: 'text', required: false, placeholder: 'Örn: 3. Kat' },
      { key: 'building_age', label: 'Bina Yaşı', type: 'checkbox-grid', required: false, options: [
        { value: '0', label: '0 (Yeni)', description: 'Sıfır bina' },
        { value: '1-5', label: '1-5', description: 'Çok yeni' },
        { value: '6-10', label: '6-10', description: 'Yeni sayılır' },
        { value: '11-15', label: '11-15', description: 'Orta yaşlı' },
        { value: '16-20', label: '16-20', description: 'Eski' },
        { value: '21+', label: '21+', description: 'Çok eski' }
      ]},
      { key: 'heating', label: 'Isıtma', type: 'checkbox-grid', required: false, options: [
        { value: 'central', label: 'Merkezi', description: 'Merkezi ısıtma' },
        { value: 'combi', label: 'Kombi', description: 'Doğalgaz kombisi' },
        { value: 'stove', label: 'Soba', description: 'Soba ile' },
        { value: 'floor', label: 'Yerden', description: 'Yerden ısıtma' },
        { value: 'none', label: 'Yok', description: 'Isıtma yok' }
      ]},
      { key: 'furnished', label: 'Eşyalı', type: 'checkbox-grid', required: false, options: [
        { value: 'yes', label: 'Evet', description: 'Eşyalı' },
        { value: 'no', label: 'Hayır', description: 'Boş' },
        { value: 'partial', label: 'Kısmi', description: 'Kısmen eşyalı' }
      ]},
      { key: 'deed_status', label: 'Tapu Durumu', type: 'checkbox-grid', required: false, options: [
        { value: 'clear', label: 'Kat Mülkiyeti', description: 'Temiz tapu' },
        { value: 'shared', label: 'Kat İrtifakı', description: 'Kat irtifakı' },
        { value: 'land', label: 'Arsa Tapusu', description: 'Arsa tapusu' },
        { value: 'other', label: 'Diğer', description: 'Diğer tapu durumları' }
      ]}
    ]
  }
}

interface AttributesStepProps {
  formData: Record<string, any>
  onChange: (key: string, value: any) => void
  onNext: () => void
  onBack: () => void
  selectedCategoryId?: string | null
  selectedCategoryName?: string | null
}

export default function AttributesStep({ formData, onChange, onNext, onBack, selectedCategoryId, selectedCategoryName: propCategoryName }: AttributesStepProps) {
  // Seçilen kategorinin backend'den gelen attribute'larını bul
  const categoryAttributesFromBackend = useMemo(() => {
    try {
      console.log('🔍 [ATTRIBUTES] Finding attributes for category ID:', selectedCategoryId)
      
      if (!selectedCategoryId) {
        console.log('❌ [ATTRIBUTES] No category ID provided')
        return []
      }
      
      const raw = localStorage.getItem('benalsam_categories_next_v1.0.0')
      if (!raw) {
        console.log('❌ [ATTRIBUTES] No categories cache found')
        return []
      }
      
      const parsed = JSON.parse(raw)
      const categories: any[] = parsed?.data || []
      console.log('🌳 [ATTRIBUTES] Total categories:', categories.length)
      
      const findById = (nodes: any[]): any | null => {
        for (const n of nodes) {
          if (String(n.id) === String(selectedCategoryId)) {
            console.log('✅ [ATTRIBUTES] Found matching category:', { 
              id: n.id, 
              name: n.name, 
              attributesCount: n.category_attributes?.length || 0 
            })
            return n
          }
          const subs = n.children || []
          const found = findById(subs)
          if (found) return found
        }
        return null
      }
      
      const category = findById(categories)
      const attrs = category?.category_attributes || []
      console.log('🎯 [ATTRIBUTES] Category attributes:', attrs)
      return attrs
    } catch (error) {
      console.error('❌ [ATTRIBUTES] Error finding category attributes:', error)
      return []
    }
  }, [selectedCategoryId])
  
  // Seçilen kategori adını prop'tan al
  const selectedCategoryName = propCategoryName || ''

  // Backend'den gelen attribute'ları kullan (eğer varsa), yoksa hardcoded olanları kullan
  const attributes = useMemo(() => {
    if (categoryAttributesFromBackend && categoryAttributesFromBackend.length > 0) {
      console.log('✅ [ATTRIBUTES] Using backend attributes:', categoryAttributesFromBackend.length)
      // Backend attribute'larını component'in beklediği formata çevir
      return categoryAttributesFromBackend.map((attr: any) => {
        const parsedOptions = attr.options ? JSON.parse(attr.options) : []
        return {
          key: attr.key,
          label: attr.label,
          type: attr.type === 'string' ? 'select' : attr.type,
          required: attr.required,
          options: parsedOptions.map((opt: string) => ({
            value: opt.toLowerCase().replace(/\s+/g, '_'),
            label: opt,
            description: ''
          })),
          placeholder: `${attr.label} seçin`
        }
      })
    }
    
    // Fallback: Hardcoded attribute'lar
    console.log('⚠️ [ATTRIBUTES] No backend attributes, using fallback')
    const name = selectedCategoryName.toLowerCase()
    
    if (name.includes('telefon') || name.includes('smartphone')) {
      console.log('📱 [ATTRIBUTES] Matched: smartphone')
      return categoryAttributes['smartphone']?.attributes || []
    }
    if (name.includes('laptop') || name.includes('bilgisayar')) {
      console.log('💻 [ATTRIBUTES] Matched: laptop')
      return categoryAttributes['laptop']?.attributes || []
    }
    if (name.includes('araç') || name.includes('otomobil')) {
      console.log('🚗 [ATTRIBUTES] Matched: car')
      return categoryAttributes['car']?.attributes || []
    }
    if (name.includes('emlak') || name.includes('daire') || name.includes('ev') || name.includes('dükkan') || name.includes('mağaza') || name.includes('ofis') || name.includes('arsa') || name.includes('bina')) {
      console.log('🏠 [ATTRIBUTES] Matched: real_estate')
      return categoryAttributes['real_estate']?.attributes || []
    }
    
    console.log('⚠️ [ATTRIBUTES] No match, no attributes')
    return []
  }, [categoryAttributesFromBackend, selectedCategoryName])

  const handleAttributeChange = (key: string, value: any) => {
    console.log('🔧 [ATTRIBUTES] Attribute changed:', { key, value })
    onChange(key, value)
  }

  const handleNext = () => {
    console.log('🚀 [ATTRIBUTES] Next button clicked:', { isFormValid, attributes: attributes.length })
    onNext()
  }

  const isFormValid = useMemo(() => {
    console.log('🔍 [VALIDATION] Attributes validation:', {
      formData,
      attributes: attributes.length
    })
    
    // Attributes step is always valid - all fields are optional
    console.log('✅ [VALIDATION] All attributes optional, form is valid')
    return true
  }, [formData, attributes])

  const renderAttributeField = (attr: any) => {
    const value = formData[attr.key] || ''

    switch (attr.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleAttributeChange(attr.key, e.target.value)}
            placeholder={attr.placeholder}
          />
        )
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleAttributeChange(attr.key, e.target.value)}
            placeholder={attr.placeholder}
            rows={3}
          />
        )
      
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => handleAttributeChange(attr.key, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`${attr.label} seçin`} />
            </SelectTrigger>
            <SelectContent>
              {attr.options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={attr.key}
              checked={!!value}
              onCheckedChange={(checked) => handleAttributeChange(attr.key, checked)}
            />
            <Label htmlFor={attr.key}>{attr.label}</Label>
          </div>
        )
      
      case 'checkbox-grid':
        const selectedValues = Array.isArray(value) ? value : (value ? [value] : [])
        const isSelected = (optionValue: string) => selectedValues.includes(optionValue)
        
        const toggleOption = (optionValue: string) => {
          console.log('🔄 [TOGGLE] Toggle option:', { optionValue, current: selectedValues, isSelected: isSelected(optionValue) })
          const current = selectedValues
          let next = current
          if (isSelected(optionValue)) {
            next = current.filter(v => v !== optionValue)
            console.log('➖ [TOGGLE] Removing option:', { next })
          } else {
            next = [...current.filter(c => c !== 'any'), optionValue]
            console.log('➕ [TOGGLE] Adding option:', { next })
          }
          if (next.length === 0) {
            next = ['any']
            console.log('🔄 [TOGGLE] No options, setting to any:', { next })
          }
          console.log('✅ [TOGGLE] Final value:', { next })
          handleAttributeChange(attr.key, next)
        }
        
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>{attr.label} (Opsiyonel)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {attr.options.map((option: any) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                    isSelected(option.value)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/50'
                  }`}
                >
                  <Checkbox
                    checked={isSelected(option.value)}
                    onCheckedChange={(checked) => {
                      console.log('🔧 [CHECKBOX] Checkbox clicked:', { option: option.value, checked })
                      toggleOption(option.value)
                    }}
                    className="mt-0.5 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{option.label}</div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {/* Seçili özet - eski projedeki chip stili */}
            <div className="flex flex-wrap gap-1 mt-2">
              {(!selectedValues || selectedValues.length === 0 || (selectedValues.length === 1 && selectedValues[0] === 'any')) ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
                  Fark Etmez
                </span>
              ) : (
                selectedValues.filter(c => c !== 'any').map((selectedValue) => {
                  const option = attr.options.find((opt: any) => opt.value === selectedValue)
                  return (
                    <span 
                      key={selectedValue}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
                    >
                      {option?.label}
                    </span>
                  )
                })
              )}
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div key={step} className="flex items-center flex-shrink-0">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-300 ${
                step <= 3 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg ring-2 ring-blue-200' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step < 3 ? '✓' : step === 3 ? '3' : step}
              </div>
              {step < 6 && (
                <div className={`w-12 md:w-20 h-2 mx-2 md:mx-3 rounded-full transition-all duration-300 ${
                  step < 3 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs md:text-sm font-medium text-gray-600 overflow-x-auto">
          <span className="text-green-600 flex-shrink-0 font-semibold">✓ Kategori</span>
          <span className="text-green-600 flex-shrink-0 font-semibold">✓ Detaylar</span>
          <span className="text-blue-600 flex-shrink-0 font-semibold">Özellikler</span>
          <span className="text-gray-500 flex-shrink-0">Görseller</span>
          <span className="text-gray-500 flex-shrink-0">Konum</span>
          <span className="text-gray-500 flex-shrink-0">Onay</span>
        </div>
      </div>

      {selectedCategoryName && (
        <div className="mb-4">
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground w-fit">
            <span className="inline-flex items-center gap-2">
              <span className="opacity-80">Seçilen Kategori:</span>
              <Badge variant="secondary">{selectedCategoryName}</Badge>
            </span>
          </div>
        </div>
      )}

      <h1 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Ürün Özellikleri
      </h1>

      <Card>
        <CardContent className="space-y-6 p-6">
          {attributes.length > 0 ? (
            <div className="space-y-6">
              {attributes.map((attr) => (
                <div key={attr.key} className="space-y-2">
                  <Label htmlFor={attr.key} className="flex items-center gap-2">
                    {attr.label}
                    {attr.required && <span className="text-red-500">*</span>}
                  </Label>
                  {renderAttributeField(attr)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Bu kategori için özel özellik bulunmuyor.</p>
              <p className="text-sm text-muted-foreground mt-2">Genel bilgiler yeterli.</p>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={onBack}>
              ← Geri
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={!isFormValid}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              İleri →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
