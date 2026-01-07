'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/utils/production-logger';

const STORAGE_KEY = 'benalsam_recently_viewed';
const MAX_ITEMS = 20;

export interface RecentlyViewedItem {
  id: string;
  title: string;
  price: number;
  image_url: string;
  viewedAt: string;
}

/**
 * Custom hook for managing recently viewed items.
 * Stores and retrieves recently viewed listings from localStorage.
 * Automatically limits to MAX_ITEMS (20) most recent items.
 * 
 * @returns Object containing items array, addItem function, and clearAll function
 * 
 * @example
 * ```typescript
 * const { items, addItem, clearAll } = useRecentlyViewed()
 * 
 * // Add a viewed item
 * addItem({
 *   id: 'listing-123',
 *   title: 'iPhone 13',
 *   price: 15000,
 *   image_url: 'https://...'
 * })
 * 
 * // Clear all
 * clearAll()
 * ```
 */
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
      logger.error('[useRecentlyViewed] Error loading recently viewed', { error });
    }
  }, []);

  /**
   * Adds an item to the recently viewed list.
   * If the item already exists, it's moved to the top.
   * Automatically maintains MAX_ITEMS limit.
   * 
   * @param item - Item to add (without viewedAt timestamp, which is auto-generated)
   */
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

        // Save to localStorage (outside setState to avoid issues)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
        } catch (storageError) {
          logger.error('[useRecentlyViewed] Error saving recently viewed', { error: storageError });
        }
        
        return newItems;
      });
    } catch (error) {
      logger.error('[useRecentlyViewed] Error adding recently viewed item', { error });
    }
  };

  /**
   * Clears all recently viewed items from both state and localStorage.
   */
  const clearAll = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setItems([]);
    } catch (error) {
      logger.error('[useRecentlyViewed] Error clearing recently viewed', { error });
    }
  };

  return {
    items,
    addItem,
    clearAll
  };
}

