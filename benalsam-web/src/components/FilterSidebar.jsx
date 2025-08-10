import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, MapPin, DollarSign, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

const urgencyOptions = ['Acil', 'Normal', 'Acil Değil'];

const FilterSidebar = ({ isOpen, onClose, filters, onFiltersChange }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    onFiltersChange({
      priceRange: [0, 50000],
      location: '',
      urgency: '',
      keywords: ''
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-xs sm:max-w-sm md:max-w-md z-50 glass-effect border-l border-orange-500/20 overflow-y-auto"
          >
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 mr-2" />
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">Filtreler</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white h-7 w-7 sm:h-8 sm:w-8"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                 <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                    Anahtar Kelime
                  </label>
                  <Input
                    type="text"
                    value={filters.keywords || ''}
                    onChange={(e) => handleFilterChange('keywords', e.target.value)}
                    placeholder="Örn: 'az kullanılmış', 'garantili'"
                    className="w-full bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:outline-none input-glow text-xs sm:text-sm lg:text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-3 sm:mb-4">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                    Bütçe Aralığı
                  </label>
                  <div className="px-1 sm:px-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => handleFilterChange('priceRange', value)}
                      max={50000}
                      min={0}
                      step={100}
                      className="mb-3 sm:mb-4"
                    />
                    <div className="flex justify-between text-xs sm:text-sm text-slate-400">
                      <span>₺{filters.priceRange[0].toLocaleString()}</span>
                      <span>₺{filters.priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                    Konum
                  </label>
                  <Input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="Şehir veya ilçe girin"
                    className="w-full bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:outline-none input-glow text-xs sm:text-sm lg:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2 sm:mb-3">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                    Aciliyet
                  </label>
                  <div className="space-y-2">
                    <div
                      onClick={() => handleFilterChange('urgency', '')}
                      className={`p-2 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer transition-all text-xs sm:text-sm lg:text-base ${
                        filters.urgency === '' 
                          ? 'bg-orange-500/20 border border-orange-500/40' 
                          : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-white">Tümü</span>
                    </div>
                    {urgencyOptions.map(option => (
                      <div
                        key={option}
                        onClick={() => handleFilterChange('urgency', option)}
                        className={`p-2 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer transition-all text-xs sm:text-sm lg:text-base ${
                          filters.urgency === option 
                            ? 'bg-orange-500/20 border border-orange-500/40' 
                            : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50'
                        }`}
                      >
                        <span className="text-white">{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-700">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex-1 border-slate-600 text-slate-400 hover:bg-slate-800 text-xs sm:text-sm lg:text-base py-2 sm:py-3"
                >
                  Temizle
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 btn-primary text-white font-semibold text-xs sm:text-sm lg:text-base py-2 sm:py-3"
                >
                  Uygula
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterSidebar;