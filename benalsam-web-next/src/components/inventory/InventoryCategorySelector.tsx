'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
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

// Helper function to check if category or any of its children match search query
const categoryMatchesSearch = (cat: CategoryWithChildren, query: string): boolean => {
  if (cat.name.toLowerCase().includes(query)) return true
  
  // Check all children recursively
  const children = cat.children || cat.subcategories || []
  return children.some(child => categoryMatchesSearch(child, query))
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
  onLeafCategorySelect = undefined,
}) => {
  const [mainCategories, setMainCategories] = useState<CategoryWithChildren[]>([])
  const [allCategoriesFlat, setAllCategoriesFlat] = useState<CategoryWithChildren[]>([])
  
  // Search states for each level
  const [searchMain, setSearchMain] = useState('')
  const [searchSub, setSearchSub] = useState('')
  const [searchSubSub, setSearchSubSub] = useState('')
  const [searchFourth, setSearchFourth] = useState('')
  
  // Helper function to get full category path (from root to leaf)
  const getCategoryPath = useCallback((cat: CategoryWithChildren): string[] => {
    // If allCategoriesFlat is not loaded yet, return just the category name
    if (!allCategoriesFlat || allCategoriesFlat.length === 0) {
      return [cat.name]
    }
    
    // Try to find the category in the tree structure first
    const findInTree = (categories: CategoryWithChildren[], targetId: string | number, path: string[] = []): string[] | null => {
      for (const category of categories) {
        const currentPath = [...path, category.name]
        
        if (String(category.id) === String(targetId)) {
          return currentPath
        }
        
        const children = category.children || category.subcategories || []
        if (children.length > 0) {
          const found = findInTree(children, targetId, currentPath)
          if (found) return found
        }
      }
      return null
    }
    
    // Try tree-based approach first
    const treePath = findInTree(mainCategories, cat.id)
    if (treePath) {
      return treePath
    }
    
    // Fallback to flat list approach
    const path: string[] = []
    let current: CategoryWithChildren | undefined = cat
    const visited = new Set<string | number>() // Prevent infinite loops
    
    // Build path from leaf to root
    while (current && !visited.has(current.id)) {
      visited.add(current.id)
      path.unshift(current.name) // Add to beginning to maintain root->leaf order
      
      // Find parent using parent_id or by checking if any category has this as child
      if (current.parent_id) {
        const parent = allCategoriesFlat.find(c => String(c.id) === String(current!.parent_id))
        if (parent) {
          current = parent
        } else {
          current = undefined
        }
      } else {
        // Try to find parent by checking if this category is a child of any other category
        const parent = allCategoriesFlat.find(c => {
          const children = c.children || c.subcategories || []
          return children.some(child => String(child.id) === String(current!.id))
        })
        if (parent) {
          current = parent
        } else {
          current = undefined
        }
      }
    }
    
    // If path is empty or only has one item, return at least the category name
    return path.length > 0 ? path : [cat.name]
  }, [allCategoriesFlat, mainCategories])
  
  // Use ref to avoid dependency issues with optional callback
  // Store the callback in a ref to avoid closure issues
  const onLeafCategorySelectRef = useRef<((categoryId: string, pathNames: string[], pathIds: string[]) => void) | undefined>(undefined)
  
  // Update ref on every render to ensure we have the latest callback
  // Using useLayoutEffect to update synchronously before paint
  useLayoutEffect(() => {
    const callback = onLeafCategorySelect
    if (callback && typeof callback === 'function') {
      onLeafCategorySelectRef.current = callback
    } else {
      onLeafCategorySelectRef.current = undefined
    }
  })


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

  // Filtered main categories based on search (includes categories whose children match)
  // Also includes all matching subcategories flattened
  const filteredMainCategories = useMemo(() => {
    if (!searchMain.trim()) return mainCategories
    
    const query = searchMain.toLowerCase()
    const matchingCategories: CategoryWithChildren[] = []
    
    // Recursive function to find all matching categories at any level
    const findMatchingCategories = (categories: CategoryWithChildren[]) => {
      for (const cat of categories) {
        if (categoryMatchesSearch(cat, query)) {
          matchingCategories.push(cat)
        }
        const children = cat.children || cat.subcategories || []
        if (children.length > 0) {
          findMatchingCategories(children)
        }
      }
    }
    
    findMatchingCategories(mainCategories)
    return matchingCategories
  }, [mainCategories, searchMain])

  // Get subcategories for selected main category
  const subCategories = useMemo(() => {
    if (!selectedMain) return []
    const mainCat = allCategoriesFlat.find((cat) => String(cat.id) === selectedMain)
    if (!mainCat) return []
    const children = mainCat.children || mainCat.subcategories || []
    return children
  }, [selectedMain, allCategoriesFlat])
  
  // Filtered sub categories based on search (includes categories whose children match)
  const filteredSubCategories = useMemo(() => {
    if (!searchSub.trim()) return subCategories
    const query = searchSub.toLowerCase()
    return subCategories.filter(cat => categoryMatchesSearch(cat, query))
  }, [subCategories, searchSub])
  
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
  
  // Filtered sub-sub categories based on search (includes categories whose children match)
  const filteredSubSubCategories = useMemo(() => {
    if (!searchSubSub.trim()) return subSubCategories
    const query = searchSubSub.toLowerCase()
    return subSubCategories.filter(cat => categoryMatchesSearch(cat, query))
  }, [subSubCategories, searchSubSub])
  
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
  
  // Filtered 4th level categories based on search (includes categories whose children match)
  const filteredFourthLevelCategories = useMemo(() => {
    if (!searchFourth.trim()) return fourthLevelCategories
    const query = searchFourth.toLowerCase()
    return fourthLevelCategories.filter(cat => categoryMatchesSearch(cat, query))
  }, [fourthLevelCategories, searchFourth])
  
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
    setSearchSub('') // Reset search when main category changes
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
    setSearchSubSub('') // Reset search when sub category changes
  }, [selectedSub, subSubCategories, selectedSubSub, onSubSubChange])
  
  // Reset search when category selection changes
  useEffect(() => {
    setSearchMain('')
  }, [selectedMain])
  
  useEffect(() => {
    setSearchFourth('')
  }, [selectedSubSub])

  // Compute display labels for selected categories (to avoid first-selection UI glitches)
  const selectedMainLabel = useMemo(() => {
    if (!selectedMain) return ''
    const cat = allCategoriesFlat.find((c) => String(c.id) === selectedMain)
    if (!cat) return ''
    return getCategoryPath(cat).join(' > ')
  }, [selectedMain, allCategoriesFlat, getCategoryPath])

  return (
    <div className="space-y-3">
      <Select value={selectedMain} onValueChange={onMainChange} disabled={disabled}>
        <SelectTrigger
          className={`w-full bg-input border-border text-foreground ${
            errors?.category && !selectedMain ? 'border-destructive' : ''
          }`}
        >
          {selectedMainLabel ? (
            <span className="truncate">{selectedMainLabel}</span>
          ) : (
            <SelectValue placeholder="Ana Kategori Seçin *" />
          )}
        </SelectTrigger>
        <SelectContent className="dropdown-content">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ara..."
                value={searchMain}
                onChange={(e) => setSearchMain(e.target.value)}
                className="pl-8 h-8 text-sm"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          {filteredMainCategories.length > 0 ? (
            filteredMainCategories.map((cat) => {
              const fullPath = getCategoryPath(cat)
              const displayPath = fullPath.length > 0 ? fullPath.join(' > ') : cat.name
              return (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {displayPath}
                </SelectItem>
              )
            })
          ) : (
            <div className="p-2 text-sm text-muted-foreground text-center">Sonuç bulunamadı</div>
          )}
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
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ara..."
                  value={searchSub}
                  onChange={(e) => setSearchSub(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            {filteredSubCategories.length > 0 ? (
              filteredSubCategories.map((subCat) => {
                const fullPath = getCategoryPath(subCat)
                return (
                  <SelectItem key={subCat.id} value={String(subCat.id)}>
                    {fullPath.join(' > ')}
                  </SelectItem>
                )
              })
            ) : (
              <div className="p-2 text-sm text-muted-foreground text-center">Sonuç bulunamadı</div>
            )}
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
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ara..."
                  value={searchSubSub}
                  onChange={(e) => setSearchSubSub(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            {filteredSubSubCategories.length > 0 ? (
              filteredSubSubCategories.map((subSubCat) => {
                const children = subSubCat.children || subSubCat.subcategories || []
                const isLeaf = children.length === 0
                const fullPath = getCategoryPath(subSubCat)
                return (
                  <SelectItem key={subSubCat.id} value={String(subSubCat.id)}>
                    {fullPath.join(' > ')} {isLeaf && '✓'}
                  </SelectItem>
                )
              })
            ) : (
              <div className="p-2 text-sm text-muted-foreground text-center">Sonuç bulunamadı</div>
            )}
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
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ara..."
                  value={searchFourth}
                  onChange={(e) => setSearchFourth(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            {filteredFourthLevelCategories.length > 0 ? (
              filteredFourthLevelCategories.map((fourthCat) => {
                const children = fourthCat.children || fourthCat.subcategories || []
                const isLeaf = children.length === 0
                const fullPath = getCategoryPath(fourthCat)
                return (
                  <SelectItem key={fourthCat.id} value={String(fourthCat.id)}>
                    {fullPath.join(' > ')} {isLeaf && '✓'}
                  </SelectItem>
                )
              })
            ) : (
              <div className="p-2 text-sm text-muted-foreground text-center">Sonuç bulunamadı</div>
            )}
          </SelectContent>
        </Select>
      )}
      
      {errors?.category && <p className="text-destructive text-xs mt-1">{errors.category}</p>}
    </div>
  )
}

export default InventoryCategorySelector

