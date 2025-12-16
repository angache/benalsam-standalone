'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Edit3, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface InventoryItem {
  id: string
  user_id: string
  name: string
  category: string
  description?: string
  main_image_url?: string
  additional_image_urls?: string[]
  image_url?: string
  created_at: string
  updated_at?: string
  condition?: string
  estimated_value?: number
  tags?: string[]
  is_available?: boolean
  is_featured?: boolean
  view_count?: number
  favorite_count?: number
  offer_count?: number
}

interface InventoryItemCardProps {
  item: InventoryItem
  onEdit: (item: InventoryItem) => void
  onDelete: (itemId: string) => void
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item, onEdit, onDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-xl p-4 flex flex-col justify-between border hover:shadow-lg transition-shadow"
    >
      <div>
        <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center mb-3 overflow-hidden relative">
          {item.main_image_url ? (
            <Image
              src={item.main_image_url}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          ) : item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          ) : (
            <ImageIcon className="w-16 h-16 text-muted-foreground" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1 truncate">{item.name}</h3>
        <p className="text-sm text-muted-foreground mb-2 truncate">{item.category}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 h-8 mb-3">{item.description}</p>
        )}
      </div>
      <div className="flex gap-2 mt-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(item)}
          className="flex-1 border-primary/50 text-primary hover:bg-primary/10"
        >
          <Edit3 className="w-3 h-3 mr-1.5" /> Düzenle
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(item.id)}
          className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3 h-3 mr-1.5" /> Sil
        </Button>
      </div>
    </motion.div>
  )
}

export default InventoryItemCard

