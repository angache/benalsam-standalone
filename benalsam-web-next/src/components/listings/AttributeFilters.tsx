/**
 * Dynamic Attribute Filters Component
 * Shows attribute filters based on selected category
 */

'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface AttributeFiltersProps {
  selectedCategories: number[]
  selectedAttributes: Record<string, string[]>
  onAttributeChange: (key: string, values: string[]) => void
  availableAttributes?: Record<string, string[]> // Optional: Pre-computed from backend
}

export function AttributeFilters({
  selectedCategories,
  selectedAttributes,
  onAttributeChange,
  availableAttributes,
}: AttributeFiltersProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [attributes, setAttributes] = useState<Record<string, string[]>>(availableAttributes || {})

  // Fetch available attributes for selected category
  useEffect(() => {
    if (selectedCategories.length === 0) {
      setAttributes({})
      return
    }

    // If availableAttributes is provided, use it
    if (availableAttributes) {
      setAttributes(availableAttributes)
      return
    }

    // Otherwise, fetch from API
    fetchAttributesForCategory(selectedCategories[selectedCategories.length - 1])
  }, [selectedCategories, availableAttributes])

  const fetchAttributesForCategory = async (categoryId: number) => {
    setLoading(true)
    try {
      // Fetch listings for this category to extract unique attributes
      const response = await fetch(`/api/listings?categories=${categoryId}&pageSize=100`)
      const data = await response.json()
      
      if (data.success && data.listings) {
        const attrMap: Record<string, Set<string>> = {}
        
        // Extract unique attribute values
        data.listings.forEach((listing: any) => {
          const attrs = listing.attributes || {}
          Object.entries(attrs).forEach(([key, values]) => {
            if (!attrMap[key]) {
              attrMap[key] = new Set()
            }
            if (Array.isArray(values)) {
              values.forEach(v => attrMap[key].add(v))
            } else if (values) {
              attrMap[key].add(String(values))
            }
          })
        })

        // Convert Sets to Arrays
        const result: Record<string, string[]> = {}
        Object.entries(attrMap).forEach(([key, valueSet]) => {
          result[key] = Array.from(valueSet).sort()
        })

        setAttributes(result)
      }
    } catch (error) {
      console.error('Error fetching attributes:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (attrName: string) => {
    setExpanded(prev => ({ ...prev, [attrName]: !prev[attrName] }))
  }

  const handleCheckboxChange = (attrName: string, value: string, checked: boolean) => {
    const currentValues = selectedAttributes[attrName] || []
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value)
    
    onAttributeChange(attrName, newValues)
  }

  const getAttributeLabel = (key: string): string => {
    const labels: Record<string, string> = {
      brand: 'Marka',
      color: 'Renk',
      size: 'Beden',
      material: 'Malzeme',
      condition: 'Durum',
      fuel_type: 'Yakıt Tipi',
      transmission: 'Vites',
      room_count: 'Oda Sayısı',
      building_age: 'Bina Yaşı',
    }
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1)
  }

  if (selectedCategories.length === 0) {
    return null
  }

  if (loading) {
    return (
      <div className="space-y-2 py-4 text-center text-sm text-muted-foreground">
        Filtreler yükleniyor...
      </div>
    )
  }

  if (Object.keys(attributes).length === 0) {
    return null
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      <Label className="text-base">Özellikler</Label>

      {Object.entries(attributes).map(([attrName, values]) => {
        const isExpanded = expanded[attrName] ?? false
        const displayedValues = isExpanded ? values : values.slice(0, 5)
        const hasMore = values.length > 5

        return (
          <div key={attrName} className="space-y-2">
            <Label className="text-sm font-medium">{getAttributeLabel(attrName)}</Label>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {displayedValues.map(value => {
                const isChecked = (selectedAttributes[attrName] || []).includes(value)
                
                return (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${attrName}-${value}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange(attrName, value, !!checked)
                      }
                    />
                    <label
                      htmlFor={`${attrName}-${value}`}
                      className="text-sm cursor-pointer hover:text-primary"
                    >
                      {value}
                    </label>
                  </div>
                )
              })}
            </div>

            {hasMore && (
              <button
                onClick={() => toggleExpanded(attrName)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Daha az göster
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    {values.length - 5} tane daha göster
                  </>
                )}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

