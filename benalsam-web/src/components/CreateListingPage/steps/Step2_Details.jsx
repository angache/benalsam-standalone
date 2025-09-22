import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, Tag, ShieldCheck, X, Settings } from 'lucide-react';
import FormField from '@/components/CreateListingPage/FormField.jsx';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAttributesForCategory } from '@/config/categoryAttributes';

const urgencyOptions = ['Acil', 'Normal', 'Acil Değil'];

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

const Step2_Details = ({ formData, handleInputChange, errors, selectedMainCategory, selectedSubCategory, selectedSubSubCategory }) => {
  // Get category-specific attributes
  const categoryAttributes = getAttributesForCategory(selectedMainCategory, selectedSubCategory, selectedSubSubCategory);
  
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
      <h2 className="text-2xl font-bold text-center">İlan Detaylarını Girin</h2>
      
      <FormField label="İlan Başlığı *" icon={Tag} error={errors.title}>
        <Input type="text" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="Örn: iPhone 14 Pro Arıyorum"
          className={`w-full bg-input ${errors.title ? 'border-destructive' : 'border-border'}`} />
      </FormField>
      
      <FormField label="Açıklama *" error={errors.description}>
        <Textarea value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Aradığınız ürün/hizmet hakkında detaylı bilgi verin..."
          rows={5}
          className={`w-full bg-input resize-none ${errors.description ? 'border-destructive' : 'border-border'}`} />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Bütçe (₺) *" icon={DollarSign} error={errors.budget}>
          <Input type="number" value={formData.budget} onChange={(e) => handleInputChange('budget', e.target.value)} placeholder="0" min="0"
            className={`w-full bg-input ${errors.budget ? 'border-destructive' : 'border-border'}`} />
        </FormField>
        
        <FormField label="Aciliyet" icon={Clock}>
          <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
            <SelectTrigger className="w-full bg-input border-border text-foreground">
              <SelectValue placeholder="Aciliyet Durumu Seçin" />
            </SelectTrigger>
            <SelectContent className="dropdown-content">
              {urgencyOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField label="Kabul Ettiğim Durumlar (Opsiyonel)" icon={ShieldCheck} error={errors.condition}>
        <div className="space-y-3">
          <Select
            value=""
            onValueChange={(value) => {
              if (value && !formData.condition?.includes(value)) {
                // Eğer 'any' varsa onu kaldır, yoksa normal ekle
                const currentConditions = formData.condition || [];
                const filteredConditions = currentConditions.filter(c => c !== 'any');
                const newConditions = [...filteredConditions, value];
                handleInputChange("condition", newConditions);
              }
            }}
          >
            <SelectTrigger className="w-full bg-input border-border text-foreground">
              <SelectValue placeholder="Durum eklemek için seçin" />
            </SelectTrigger>
            <SelectContent className="dropdown-content">
              {conditionOptions
                .filter(option => !formData.condition?.includes(option.value))
                .map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="py-3"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Selected Conditions */}
          <div className="flex flex-wrap gap-2">
            {/* Eğer hiç condition yoksa veya sadece 'any' varsa, 'any' göster */}
            {(!formData.condition || formData.condition.length === 0 || (formData.condition.length === 1 && formData.condition[0] === 'any')) ? (
              <Badge variant="outline" className="flex items-center gap-1 rounded-xl px-2 py-1 border-primary text-primary bg-primary/10 hover:bg-primary/15 transition-colors min-h-[28px]">
                Fark Etmez
              </Badge>
            ) : (
              /* Diğer seçenekler varsa onları göster */
              formData.condition.filter(c => c !== 'any').map((condition) => {
                const option = conditionOptions.find(opt => opt.value === condition);
                return (
                  <Badge key={condition} variant="outline" className="flex items-center gap-1 rounded-xl px-2 py-1 border-primary text-primary bg-primary/10 hover:bg-primary/15 transition-colors min-h-[28px]">
                    {option?.label}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-5 w-4 p-0 inline-flex items-center justify-center text-primary/80 hover:text-primary hover:bg-primary/20"
                      onClick={() => {
                        const newConditions = formData.condition.filter(c => c !== condition);
                        // Eğer hiç condition kalmadıysa, boş array yap (otomatik olarak 'any' gösterilecek)
                        handleInputChange("condition", newConditions);
                      }}
                    >
                      <X className="h-4 w-3" />
                    </Button>
                  </Badge>
                );
              })
            )}
          </div>
        </div>
      </FormField>

      {/* Category-specific Attributes */}
      {Object.keys(categoryAttributes).length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Ürün Özellikleri</h3>
            <span className="text-sm text-muted-foreground">(Opsiyonel)</span>
          </div>
          
          <div className="space-y-6">
            {Object.entries(categoryAttributes).map(([key, attribute]) => (
              <div key={key} className="space-y-3 p-4 border border-border rounded-lg bg-card/50">
                {attribute.type === 'select' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">{attribute.label}</h4>
                      <span className="text-xs text-muted-foreground">
                        {formData.attributes?.[key]?.length || 0} seçili
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attribute.options.map((option) => {
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
                          const option = attribute.options.find(opt => opt.value === selectedValue);
                          return (
                            <span 
                              key={selectedValue}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                            >
                              {option?.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : attribute.type === 'text' ? (
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
                ) : attribute.type === 'number' ? (
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
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Step2_Details;