'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Category } from '@/services/categoryService'

interface InventoryCategorySelectorProps {
  selectedMain: string
  onMainChange: (value: string) => void
  selectedSub: string
  onSubChange: (value: string) => void
  selectedSubSub: string
  onSubSubChange: (value: string) => void
  errors?: { category?: string }
  disabled?: boolean
  onLeafCategorySelect?: (categoryId: string, pathNames: string[], pathIds: string[]) => void
}

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
  subcategories?: CategoryWithChildren[]
}

const InventoryCategorySelector: React.FC<InventoryCategorySelectorProps> = ({
  selectedMain,
  onMainChange,
  selectedSub,
  onSubChange,
  selectedSubSub,
  onSubSubChange,
  errors,
  disabled,
  onLeafCategorySelect,
}) => {
  const [mainCategories, setMainCategories] = useState<CategoryWithChildren[]>([])
  const [allCategoriesFlat, setAllCategoriesFlat] = useState<CategoryWithChildren[]>([])
  
  // Use ref to avoid dependency issues with optional callback
  // Store the callback in a ref to avoid closure issues
  const onLeafCategorySelectRef = useRef<((categoryId: string, pathNames: string[], pathIds: string[]) => void) | undefined>(undefined)
  
  // Update ref when prop changes - use callback form to ensure latest value
  useEffect(() => {
    const callback = onLeafCategorySelect
    if (callback) {
      onLeafCategorySelectRef.current = callback
    } else {
      onLeafCategorySelectRef.current = undefined
    }
  }, [onLeafCategorySelect])


  // Load categories from localStorage (same as CategoryStep)
  // If cache is empty, try to fetch from API via categoryService
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cachedCategories = localStorage.getItem('benalsam_categories_next_v1.0.0')
        if (cachedCategories) {
          const parsedCache = JSON.parse(cachedCategories)
          if (parsedCache.data && Array.isArray(parsedCache.data) && parsedCache.data.length > 0) {
            // Recursive function to map children/subcategories at all levels
            const mapSubcategories = (cat: any): CategoryWithChildren => {
              const subcategories = cat.children || cat.subcategories || []
              return {
                ...cat,
                children: subcategories.map(mapSubcategories),
                subcategories: subcategories.map(mapSubcategories),
              }
            }

            const categoriesWithSubcategories = parsedCache.data.map(mapSubcategories)
            setMainCategories(categoriesWithSubcategories)

            // Also create flat list for easy lookup
            const flatten = (cats: CategoryWithChildren[]): CategoryWithChildren[] => {
              const result: CategoryWithChildren[] = []
              cats.forEach((cat) => {
                result.push(cat)
                const children = cat.children || cat.subcategories || []
                if (children.length > 0) {
                  result.push(...flatten(children))
                }
              })
              return result
            }
            setAllCategoriesFlat(flatten(categoriesWithSubcategories))
            console.log('✅ [InventoryCategorySelector] Categories loaded from localStorage:', {
              rootCount: categoriesWithSubcategories.length,
              totalCount: flatten(categoriesWithSubcategories).length,
            })
            return
          }
        }

        // Cache is empty or invalid, try to fetch from API
        console.log('📦 [InventoryCategorySelector] No cached categories, fetching from API...')
        const { categoryService } = await import('@/services/categoryService')
        const flatCategories = await categoryService.getCategories()
        
        if (flatCategories && flatCategories.length > 0) {
          // Build tree structure from flat list
          const buildTree = (categories: Category[]): CategoryWithChildren[] => {
            const categoryMap = new Map<string | number, CategoryWithChildren>()
            const roots: CategoryWithChildren[] = []

            // First pass: create all category nodes
            categories.forEach((cat) => {
              categoryMap.set(cat.id, {
                ...cat,
                children: [],
                subcategories: [],
              })
            })

            // Second pass: build tree
            categories.forEach((cat) => {
              const node = categoryMap.get(cat.id)!
              if (!cat.parent_id || cat.level === 0) {
                roots.push(node)
              } else {
                const parent = categoryMap.get(cat.parent_id)
                if (parent) {
                  if (!parent.children) parent.children = []
                  if (!parent.subcategories) parent.subcategories = []
                  parent.children.push(node)
                  parent.subcategories.push(node)
                }
              }
            })

            return roots
          }

          const treeCategories = buildTree(flatCategories)
          setMainCategories(treeCategories)

          // Create flat list for lookup
          const flatten = (cats: CategoryWithChildren[]): CategoryWithChildren[] => {
            const result: CategoryWithChildren[] = []
            cats.forEach((cat) => {
              result.push(cat)
              const children = cat.children || cat.subcategories || []
              if (children.length > 0) {
                result.push(...flatten(children))
              }
            })
            return result
          }
          setAllCategoriesFlat(flatten(treeCategories))
          console.log('✅ [InventoryCategorySelector] Categories loaded from API:', {
            rootCount: treeCategories.length,
            totalCount: flatten(treeCategories).length,
          })
        } else {
          console.warn('⚠️ [InventoryCategorySelector] No categories available from API')
        }
      } catch (error) {
        console.error('❌ [InventoryCategorySelector] Error loading categories:', error)
      }
    }
    loadCategories()
  }, [])

  // Get subcategories for selected main category
  const subCategories = useMemo(() => {
    if (!selectedMain) return []
    const mainCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedMain)
    if (!mainCat) return []
    const children = mainCat.children || mainCat.subcategories || []
    return children
  }, [selectedMain, allCategoriesFlat])
  
  // Handle leaf category selection for main (1st level)
  useEffect(() => {
    if (selectedMain && onLeafCategorySelectRef.current) {
      const mainCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedMain)
      if (mainCat) {
        const children = mainCat.children || mainCat.subcategories || []
        const isLeaf = children.length === 0
        
        if (isLeaf) {
          const pathNames = [mainCat.name]
          const pathIds = [String(mainCat.id)]
          onLeafCategorySelectRef.current(String(mainCat.id), pathNames, pathIds)
        }
      }
    }
  }, [selectedMain, allCategoriesFlat])

  // Get sub-subcategories for selected sub category
  const subSubCategories = useMemo(() => {
    if (!selectedSub) return []
    const subCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedSub)
    if (!subCat) return []
    const children = subCat.children || subCat.subcategories || []
    return children
  }, [selectedSub, allCategoriesFlat])
  
  // Handle leaf category selection for sub (2nd level)
  useEffect(() => {
    if (selectedSub && onLeafCategorySelectRef.current) {
      const subCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedSub)
      if (subCat) {
        const children = subCat.children || subCat.subcategories || []
        const isLeaf = children.length === 0
        
        if (isLeaf) {
          // Build path: main > sub
          const mainCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedMain)
          const pathNames = mainCat ? [mainCat.name, subCat.name] : [subCat.name]
          const pathIds = mainCat ? [String(mainCat.id), String(subCat.id)] : [String(subCat.id)]
          onLeafCategorySelectRef.current(String(subCat.id), pathNames, pathIds)
        }
      }
    }
  }, [selectedSub, selectedMain, allCategoriesFlat])
  
  // Check if subSub is a leaf category
  const isSubSubLeaf = useMemo(() => {
    if (!selectedSubSub) return false
    const subSubCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedSubSub)
    if (!subSubCat) return false
    const children = subSubCat.children || subSubCat.subcategories || []
    return children.length === 0
  }, [selectedSubSub, allCategoriesFlat])
  
  // Get 4th level categories (if subSub has children)
  const fourthLevelCategories = useMemo(() => {
    if (!selectedSubSub || isSubSubLeaf) return []
    const subSubCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedSubSub)
    if (!subSubCat) return []
    return subSubCat.children || subSubCat.subcategories || []
  }, [selectedSubSub, isSubSubLeaf, allCategoriesFlat])
  
  const [selectedFourthLevel, setSelectedFourthLevel] = useState<string>('')
  
  // Handle leaf category selection for subSub
  useEffect(() => {
    if (selectedSubSub && isSubSubLeaf && onLeafCategorySelectRef.current) {
      const subSubCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedSubSub)
      if (subSubCat) {
        // Build path: main > sub > subSub
        const mainCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedMain)
        const subCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedSub)
        const pathNames = [mainCat?.name, subCat?.name, subSubCat.name].filter(Boolean) as string[]
        const pathIds = [selectedMain, selectedSub, selectedSubSub].filter(Boolean) as string[]
        onLeafCategorySelectRef.current(selectedSubSub, pathNames, pathIds)
      }
    }
  }, [selectedSubSub, isSubSubLeaf, selectedMain, selectedSub, allCategoriesFlat])
  
  // Handle leaf category selection for 4th level
  useEffect(() => {
    if (selectedFourthLevel && onLeafCategorySelectRef.current) {
      const fourthCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedFourthLevel)
      if (fourthCat) {
        const children = fourthCat.children || fourthCat.subcategories || []
        if (children.length === 0) {
          // Build path: main > sub > subSub > fourth
          const mainCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedMain)
          const subCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedSub)
          const subSubCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedSubSub)
          const pathNames = [mainCat?.name, subCat?.name, subSubCat?.name, fourthCat.name].filter(Boolean) as string[]
          const pathIds = [selectedMain, selectedSub, selectedSubSub, selectedFourthLevel].filter(Boolean) as string[]
          onLeafCategorySelectRef.current(selectedFourthLevel, pathNames, pathIds)
        }
      }
    }
  }, [selectedFourthLevel, selectedMain, selectedSub, selectedSubSub, allCategoriesFlat])

  // Reset subcategories when main category changes
  useEffect(() => {
    if (selectedMain) {
      if (subCategories.length === 0 || !subCategories.find((sub) => String(sub.id) === selectedSub)) {
        onSubChange('')
      }
    } else {
      onSubChange('')
    }
  }, [selectedMain, subCategories, selectedSub, onSubChange])

  // Reset sub-subcategories when sub category changes
  useEffect(() => {
    if (selectedSub) {
      if (subSubCategories.length === 0 || !subSubCategories.find((sub) => String(sub.id) === selectedSubSub)) {
        onSubSubChange('')
      }
    } else {
      onSubSubChange('')
    }
  }, [selectedSub, subSubCategories, selectedSubSub, onSubSubChange])

  return (
    <div className="space-y-3">
      <Select value={selectedMain} onValueChange={onMainChange} disabled={disabled}>
        <SelectTrigger
          className={`w-full bg-input border-border text-foreground ${
            errors?.category && !selectedMain ? 'border-destructive' : ''
          }`}
        >
          <SelectValue placeholder="Ana Kategori Seçin *" />
        </SelectTrigger>
        <SelectContent className="dropdown-content">
          {mainCategories.map((cat) => (
            <SelectItem key={cat.id} value={String(cat.id)}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedMain && subCategories.length > 0 && (
        <Select value={selectedSub} onValueChange={onSubChange} disabled={disabled}>
          <SelectTrigger
            className={`w-full bg-input border-border text-foreground ${
              errors?.category && !selectedSub ? 'border-destructive' : ''
            }`}
          >
            <SelectValue placeholder="Alt Kategori Seçin *" />
          </SelectTrigger>
          <SelectContent className="dropdown-content">
            {subCategories.map((subCat) => (
              <SelectItem key={subCat.id} value={String(subCat.id)}>
                {subCat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedSub && subSubCategories.length > 0 && (
        <Select value={selectedSubSub} onValueChange={onSubSubChange} disabled={disabled}>
          <SelectTrigger
            className={`w-full bg-input border-border text-foreground ${
              errors?.category && !selectedSubSub ? 'border-destructive' : ''
            }`}
          >
            <SelectValue placeholder={isSubSubLeaf ? "Kategori Seçildi ✓" : "Detay Kategori Seçin *"} />
          </SelectTrigger>
          <SelectContent className="dropdown-content">
            {subSubCategories.map((subSubCat) => {
              const children = subSubCat.children || subSubCat.subcategories || []
              const isLeaf = children.length === 0
              return (
                <SelectItem key={subSubCat.id} value={String(subSubCat.id)}>
                  {subSubCat.name} {isLeaf && '✓'}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      )}
      
      {selectedSubSub && !isSubSubLeaf && fourthLevelCategories.length > 0 && (
        <Select value={selectedFourthLevel} onValueChange={setSelectedFourthLevel} disabled={disabled}>
          <SelectTrigger
            className={`w-full bg-input border-border text-foreground ${
              errors?.category && !selectedFourthLevel ? 'border-destructive' : ''
            }`}
          >
            <SelectValue placeholder="Son Seviye Kategori Seçin *" />
          </SelectTrigger>
          <SelectContent className="dropdown-content">
            {fourthLevelCategories.map((fourthCat) => {
              const children = fourthCat.children || fourthCat.subcategories || []
              const isLeaf = children.length === 0
              return (
                <SelectItem key={fourthCat.id} value={String(fourthCat.id)}>
                  {fourthCat.name} {isLeaf && '✓'}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      )}
      
      {errors?.category && <p className="text-destructive text-xs mt-1">{errors.category}</p>}
    </div>
  )
}

export default InventoryCategorySelector

