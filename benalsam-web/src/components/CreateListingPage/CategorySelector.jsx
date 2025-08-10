import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesConfig } from '@/config/categories';

const CategorySelector = ({ selectedMain, onMainChange, selectedSub, onSubChange, selectedSubSub, onSubSubChange, errors, disabled }) => {
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);

  useEffect(() => {
    if (selectedMain) {
      const mainCat = categoriesConfig.find(cat => cat.name === selectedMain);
      setSubCategories(mainCat?.subcategories || []);
      if (!mainCat?.subcategories?.find(sub => sub.name === selectedSub)) {
        onSubChange(''); 
      }
    } else {
      setSubCategories([]);
      onSubChange('');
    }
  }, [selectedMain, onSubChange, selectedSub]);

  useEffect(() => {
    if (selectedSub) {
      const mainCat = categoriesConfig.find(cat => cat.name === selectedMain);
      const subCat = mainCat?.subcategories?.find(sub => sub.name === selectedSub);
      setSubSubCategories(subCat?.subcategories || []);
       if (!subCat?.subcategories?.find(sub => sub.name === selectedSubSub)) {
        onSubSubChange('');
      }
    } else {
      setSubSubCategories([]);
      onSubSubChange('');
    }
  }, [selectedSub, selectedMain, onSubSubChange, selectedSubSub]);

  return (
    <div className="space-y-3">
      <Select value={selectedMain} onValueChange={onMainChange} disabled={disabled}>
        <SelectTrigger className={`w-full bg-input border-border text-foreground ${errors?.category && !selectedMain ? 'border-destructive' : ''}`}>
          <SelectValue placeholder="Ana Kategori Seçin *" />
        </SelectTrigger>
        <SelectContent className="dropdown-content">
          {categoriesConfig.map(cat => <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {selectedMain && subCategories.length > 0 && (
        <Select value={selectedSub} onValueChange={onSubChange} disabled={disabled}>
          <SelectTrigger className={`w-full bg-input border-border text-foreground ${errors?.category && !selectedSub ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="Alt Kategori Seçin *" />
          </SelectTrigger>
          <SelectContent className="dropdown-content">
            {subCategories.map(subCat => <SelectItem key={subCat.name} value={subCat.name}>{subCat.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {selectedSub && subSubCategories.length > 0 && (
        <Select value={selectedSubSub} onValueChange={onSubSubChange} disabled={disabled}>
          <SelectTrigger className={`w-full bg-input border-border text-foreground ${errors?.category && !selectedSubSub ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="Detay Kategori Seçin *" />
          </SelectTrigger>
          <SelectContent className="dropdown-content">
            {subSubCategories.map(subSubCat => <SelectItem key={subSubCat.name} value={subSubCat.name}>{subSubCat.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {errors?.category && <p className="text-destructive text-xs mt-1">{errors.category}</p>}
    </div>
  );
};

export default CategorySelector;