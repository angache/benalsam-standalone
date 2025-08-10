import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NonPremiumView = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="text-center py-12">
        <Crown className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Premium Dashboard</h2>
        <p className="text-muted-foreground mb-6">
          Bu özellik sadece Premium üyeler için kullanılabilir.
        </p>
        <Button 
          onClick={() => window.location.href = '/ayarlar/premium'}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
        >
          <Crown className="w-4 h-4 mr-2" />
          Premium'a Geç
        </Button>
      </div>
    </motion.div>
  );
};

export default NonPremiumView;