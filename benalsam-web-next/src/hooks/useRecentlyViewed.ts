'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'benalsam_recently_viewed';
const MAX_ITEMS = 20;

export interface RecentlyViewedItem {
  id: string;
  title: string;
  price: number;
  image_url: string;
  viewedAt: string;
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed);
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  }, []);

  // Add item to recently viewed
  const addItem = (item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    try {
      setItems(prevItems => {
        // Remove if already exists
        const filtered = prevItems.filter(i => i.id !== item.id);
        
        // Add to beginning with timestamp
        const newItems = [
          { ...item, viewedAt: new Date().toISOString() },
          ...filtered
        ].slice(0, MAX_ITEMS); // Keep only last N items

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
        
        return newItems;
      });
    } catch (error) {
      console.error('Error saving recently viewed:', error);
    }
  };

  // Clear all recently viewed
  const clearAll = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setItems([]);
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
    }
  };

  return {
    items,
    addItem,
    clearAll
  };
}

