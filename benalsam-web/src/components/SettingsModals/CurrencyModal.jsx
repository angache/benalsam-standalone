import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMobileModalLock } from '@/hooks/useMobileModalLock';

const currencies = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
];

const CurrencyModal = ({ isOpen, onClose, selectedCurrency, onCurrencySelect }) => {
  // Scroll lock kaldırıldı - basit modal
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-start justify-center p-4 pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          className="bg-card rounded-lg border shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Para Birimi</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-2">
            {currencies.map((currency) => (
              <motion.button
                key={currency.code}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-3 rounded-lg border transition-colors ${
                  selectedCurrency === currency.code
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-background border-border hover:bg-muted/50'
                }`}
                onClick={() => {
                  onCurrencySelect(currency.code);
                  onClose();
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">{currency.symbol}</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{currency.name}</div>
                      <div className="text-sm text-muted-foreground">{currency.code}</div>
                    </div>
                  </div>
                  {selectedCurrency === currency.code && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CurrencyModal; 