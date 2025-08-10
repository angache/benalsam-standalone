import React from 'react';
import { motion } from 'framer-motion';
import { Edit3, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InventoryItemCard = ({ item, onEdit, onDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="glass-effect rounded-xl p-4 flex flex-col justify-between card-hover"
    >
      <div>
        <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center mb-3 overflow-hidden">
          {item.main_image_url ? (
            <img src={item.main_image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : item.image_url ? ( 
             <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-16 h-16 text-muted-foreground" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1 truncate">{item.name}</h3>
        <p className="text-sm text-muted-foreground mb-2 truncate">{item.category}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 h-8 mb-3">{item.description}</p>
      </div>
      <div className="flex gap-2 mt-auto">
        <Button variant="outline" size="sm" onClick={() => onEdit(item)} className="flex-1 border-primary/50 text-primary hover:bg-primary/10">
          <Edit3 className="w-3 h-3 mr-1.5" /> Düzenle
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDelete(item.id)} className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10">
          <Trash2 className="w-3 h-3 mr-1.5" /> Sil
        </Button>
      </div>
    </motion.div>
  );
};

export default InventoryItemCard;