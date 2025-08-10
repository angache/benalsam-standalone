import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, Tag } from 'lucide-react';
import FormField from '@/components/CreateListingPage/FormField.jsx';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const urgencyOptions = ['Acil', 'Normal', 'Acil Değil'];

const Step2_Details = ({ formData, handleInputChange, errors }) => {
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
    </motion.div>
  );
};

export default Step2_Details;