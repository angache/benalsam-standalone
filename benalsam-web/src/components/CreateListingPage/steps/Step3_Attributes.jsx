import React from 'react';
import { motion } from 'framer-motion';
import { Settings, ShieldCheck, X } from 'lucide-react';
import FormField from '@/components/CreateListingPage/FormField.jsx';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import dynamicCategoryService from '@/services/dynamicCategoryService';

const conditionOptions = [
    { value: 'new', label: 'Sadece Yeni', description: 'Hiç kullanılmamış, orijinal ambalajında' },
    { value: 'like_new', label: 'Sıfır Gibi', description: 'Çok az kullanılmış, neredeyse yeni' },
    { value: 'good', label: 'İyi Durumda', description: 'Normal kullanım izleri var, çalışır durumda' },
    { value: 'fair', label: 'Orta Durumda', description: 'Kullanım izleri belirgin, çalışır durumda' },
    { value: 'poor', label: 'Kötü Durumda', description: 'Hasarlı veya çalışmayan' },
    { value: 'for_parts', label: 'Parça İçin', description: 'Sadece parça olarak kullanılabilir' },
    { value: 'new_used', label: 'Yeni + İkinci El', description: 'Hem yeni hem ikinci el kabul ediyorum' },
    { value: 'any', label: 'Fark Etmez', description: 'Herhangi bir durumda olabilir' }
];

const Step3_Attributes = ({ formData, handleInputChange, errors, selectedMainCategory, selectedSubCategory, selectedSubSubCategory }) => {
  // Get category-specific attributes dynamically
  const categoryAttributes = dynamicCategoryService.getAttributesForCategory(selectedMainCategory, selectedSubCategory, selectedSubSubCategory);
  
  // Debug log
  console.log('🔍 DEBUG: Step3_Attributes', {
    selectedMainCategory,
    selectedSubCategory,
    selectedSubSubCategory,
    categoryAttributes,
    attributesLength: categoryAttributes?.length || 0
  });
  
  // Handle attribute changes (multiple selection support)
  const handleAttributeChange = (attributeKey, value) => {
    const currentValues = formData.attributes?.[attributeKey] || [];
    const newValues = currentValues.includes(value) 
      ? currentValues.filter(v => v !== value) // Remove if already selected
      : [...currentValues, value]; // Add if not selected
    const newAttributes = { ...formData.attributes, [attributeKey]: newValues };
    handleInputChange('attributes', newAttributes);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -50 }} 
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">Ürün Özellikleri ve Durumu</h2>
      
      <FormField label="Kabul Ettiğim Durumlar (Opsiyonel)" icon={ShieldCheck} error={errors.condition}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {conditionOptions.map((option) => {
              const isChecked = (formData.condition || []).includes(option.value);
              return (
                <label key={option.value} className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${isChecked ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}>
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const current = formData.condition || [];
                      let next = current;
                      if (checked) {
                        next = [...current.filter(c => c !== 'any'), option.value];
                      } else {
                        next = current.filter(c => c !== option.value);
                      }
                      if (next.length === 0) {
                        next = ['any'];
                      }
                      handleInputChange('condition', next);
                    }}
                  />
                  <div>
                    <Label className="text-sm font-medium">{option.label}</Label>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
          {/* Seçili özet - diğer attribute'lerdeki chip stili ile aynı */}
          <div className="flex flex-wrap gap-1 mt-2">
            {(!formData.condition || formData.condition.length === 0 || (formData.condition.length === 1 && formData.condition[0] === 'any')) ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">Fark Etmez</span>
            ) : (
              formData.condition.filter(c => c !== 'any').map((condition) => {
                const option = conditionOptions.find(opt => opt.value === condition);
                return (
                  <span 
                    key={condition}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {option?.label}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </FormField>

      {/* Category-specific Attributes */}
      {categoryAttributes && categoryAttributes.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Ürün Özellikleri</h3>
            <span className="text-sm text-muted-foreground">(Opsiyonel)</span>
          </div>
          
          <div className="space-y-6">
            {categoryAttributes.map((attribute) => {
              const key = attribute.key;
              // Parse options string to array
              let options = [];
              try {
                options = JSON.parse(attribute.options || '[]');
              } catch (error) {
                console.error('Error parsing options:', error, attribute.options);
                options = [];
              }
              
              return (
              <div key={key} className="space-y-3 p-4 border border-border rounded-lg bg-card/50">
                {attribute.type === 'string' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">{attribute.label}</h4>
                      <span className="text-xs text-muted-foreground">
                        {formData.attributes?.[key]?.length || 0} seçili
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {options.map((optionValue) => {
                        const option = { value: optionValue, label: optionValue };
                        const isSelected = formData.attributes?.[key]?.includes(option.value) || false;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleAttributeChange(key, option.value)}
                            className={`
                              relative flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200
                              ${isSelected 
                                ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                                : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                              }
                            `}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`
                                w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                                ${isSelected 
                                  ? 'border-primary bg-primary' 
                                  : 'border-muted-foreground/30'
                                }
                              `}>
                                {isSelected && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm font-medium">{option.label}</span>
                            </div>
                            
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {formData.attributes?.[key]?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.attributes[key].map((selectedValue) => {
                          return (
                            <span 
                              key={selectedValue}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                            >
                              {selectedValue}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : attribute.type === 'text' ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">{attribute.label}</h4>
                    <Input
                      type="text"
                      value={formData.attributes?.[key]?.[0] || ''}
                      onChange={(e) => {
                        const newAttributes = { ...formData.attributes, [key]: [e.target.value] };
                        handleInputChange('attributes', newAttributes);
                      }}
                      placeholder={attribute.placeholder || `${attribute.label} girin`}
                      className="w-full bg-input border-border text-foreground"
                    />
                  </div>
                ) : attribute.type === 'number' ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">{attribute.label}</h4>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={formData.attributes?.[key]?.[0] || ''}
                        onChange={(e) => {
                          const newAttributes = { ...formData.attributes, [key]: [e.target.value] };
                          handleInputChange('attributes', newAttributes);
                        }}
                        placeholder={attribute.placeholder || `${attribute.label} girin`}
                        className="flex-1 bg-input border-border text-foreground"
                      />
                      {attribute.suffix && (
                        <span className="text-sm text-muted-foreground">{attribute.suffix}</span>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Eğer kategori için özellik yoksa bilgilendirme */}
      {(!categoryAttributes || categoryAttributes.length === 0) && (
        <div className="text-center py-8">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Bu kategori için özel özellik bulunmuyor</h3>
          <p className="text-sm text-muted-foreground">
            Seçtiğiniz kategori için özel ürün özellikleri tanımlanmamış. 
            Sadece ürün durumu seçimi yapabilirsiniz.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Step3_Attributes;
