import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import ListingCard from '@/components/ListingCard.jsx';
import { unfollowCategory } from '@/services/supabaseService';
import { findCategoryByName } from '@/config/categories.js';

const CategoryFollowCard = ({ category, listings, currentUserId, onUnfollowCategory, onToggleFavorite }) => {
  const [isUnfollowing, setIsUnfollowing] = useState(false);
  const categoryDetails = findCategoryByName(category.category_name);
  const IconComponent = categoryDetails?.icon || Tag;

  const handleUnfollow = async () => {
    setIsUnfollowing(true);
    const success = await unfollowCategory(currentUserId, category.category_name);
    if (success) {
      onUnfollowCategory(category.category_name);
    }
    setIsUnfollowing(false);
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
      className="glass-effect p-5 rounded-lg shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <IconComponent className="w-8 h-8 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">{category.category_name}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUnfollow}
          disabled={isUnfollowing}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {isUnfollowing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
          Takipten Çık
        </Button>
      </div>
      {listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {listings.map(listing => (
            <ListingCard 
              key={listing.id} 
              listing={listing} 
              size="small" 
              onToggleFavorite={onToggleFavorite}
              currentUser={currentUserId ? {id: currentUserId} : null}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Bu kategoride henüz yeni ilan bulunmuyor.</p>
      )}
    </motion.div>
  );
};

export default CategoryFollowCard;