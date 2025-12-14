/**
 * Dynamic Attribute Filters Component
 * Shows attribute filters based on selected category
 */

'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface AttributeDefinition {
  key: string
  label: string
  type: string
  options?: string[]
}

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
  const [attributeLabels, setAttributeLabels] = useState<Record<string, string>>({})

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
      // Get categories from localStorage cache
      const cachedCategories = localStorage.getItem('benalsam_categories_next_v1.0.0')
      if (!cachedCategories) {
        console.warn('No cached categories found')
        return
      }

      const parsed = JSON.parse(cachedCategories)
      // Handle both formats: {data: [...]} or [...]
      const categories = parsed.data || parsed
      
      // Find the selected category
      const findCategory = (cats: any[], id: number): any => {
        for (const cat of cats) {
          if (cat.id === id) return cat
          if (cat.subcategories) {
            const found = findCategory(cat.subcategories, id)
            if (found) return found
          }
        }
        return null
      }

      const selectedCategory = findCategory(categories, categoryId)
      
      console.log('🔍 Selected category:', selectedCategory?.name, 'ID:', categoryId)
      console.log('📦 Category attributes:', selectedCategory?.category_attributes)
      
      // Check for category_attributes (from backend)
      const categoryAttrs = selectedCategory?.category_attributes || selectedCategory?.attributes || []
      
      console.log('✅ Found', categoryAttrs.length, 'attributes')
      
      if (categoryAttrs.length > 0) {
        // Build attributes object from category definition
        const result: Record<string, string[]> = {}
        const labels: Record<string, string> = {}
        
        categoryAttrs.forEach((attr: any) => {
          // Parse options if it's a JSON string
          let options = attr.options
          if (typeof options === 'string') {
            try {
              options = JSON.parse(options)
            } catch (e) {
              options = []
            }
          }

          // If attribute has predefined options, use them
          if (options && Array.isArray(options) && options.length > 0) {
            result[attr.key] = options
            labels[attr.key] = attr.label
          }
        })

        setAttributes(result)
        setAttributeLabels(labels)
      } else {
        setAttributes({})
        setAttributeLabels({})
      }
    } catch (error) {
      console.error('Error loading attributes from cache:', error)
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
    // Use label from category definition if available
    return attributeLabels[key] || key.charAt(0).toUpperCase() + key.slice(1)
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

