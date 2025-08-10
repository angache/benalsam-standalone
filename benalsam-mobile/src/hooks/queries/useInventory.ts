import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryItemById,
  fetchUserInventory
} from '../../services/inventoryService';
import { supabase } from '../../services/supabaseClient';
import { ListingWithUser } from '../../services/listingService/core';
import { useAuthStore } from '../../stores';

// ===========================
// QUERY KEYS
// ===========================
export const inventoryKeys = {
  all: ['inventory'] as const,
  items: (userId?: string) => [...inventoryKeys.all, 'items', userId] as const,
  item: (itemId?: string) => [...inventoryKeys.all, 'item', itemId] as const,
  userInventory: (userId?: string) => [...inventoryKeys.all, 'userInventory', userId] as const,
};

// ===========================
// QUERY HOOKS
// ===========================

/**
 * Kullanıcının envanter öğelerini getirir
 */
export const useUserInventoryItems = (userId?: string) => {
  return useQuery({
    queryKey: inventoryKeys.items(userId),
    queryFn: () => fetchInventoryItems(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 dakika
    gcTime: 5 * 60 * 1000, // 5 dakika
  });
};

/**
 * Mevcut kullanıcının envanter öğelerini getirir
 */
export const useMyInventoryItems = () => {
  const { user } = useAuthStore();
  return useUserInventoryItems(user?.id);
};

/**
 * Kullanıcının envanterini (satış ilanlarını) çeker
 */
export const useUserInventory = () => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['user-inventory', user?.id],
    queryFn: async (): Promise<ListingWithUser[]> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles:profiles!listings_user_id_fkey(
            id, name, avatar_url, rating, trust_score
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch user inventory: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
  });
};

/**
 * Kullanıcının envanter kategorilerini analiz eder
 */
export const useInventoryCategories = () => {
  const { data: inventory = [] } = useUserInventory();
  
  // Kategorileri analiz et
  const categoryAnalysis = inventory.reduce((acc, listing) => {
    if (listing.category) {
      acc[listing.category] = (acc[listing.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Kategorileri sayıya göre sırala
  const sortedCategories = Object.entries(categoryAnalysis)
    .sort(([, a], [, b]) => b - a)
    .map(([category]) => category);

  return {
    categories: sortedCategories,
    categoryCounts: categoryAnalysis,
    totalItems: inventory.length,
    hasInventory: inventory.length > 0,
  };
};

/**
 * Belirli bir envanter öğesini ID ile getirir
 */
export const useInventoryItem = (itemId?: string) => {
  return useQuery({
    queryKey: inventoryKeys.item(itemId),
    queryFn: () => getInventoryItemById(itemId!),
    enabled: !!itemId,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
  });
};

// ===========================
// MUTATION HOOKS
// ===========================

/**
 * Envanter öğesi ekleme mutation'ı
 */
export const useAddInventoryItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ itemData, onProgress }: { itemData: any; onProgress?: (progress: number) => void }) =>
      addInventoryItem(itemData, user?.id!, onProgress),
    onMutate: async ({ itemData }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: inventoryKeys.items(user?.id) 
      });

      // Snapshot previous value
      const previousItems = queryClient.getQueryData(inventoryKeys.items(user?.id));

      // Optimistically update with temporary item
      const tempItem = {
        id: 'temp-' + Date.now(),
        ...itemData,
        user_id: user?.id,
        created_at: new Date().toISOString(),
        isOptimistic: true
      };

      queryClient.setQueryData(
        inventoryKeys.items(user?.id),
        (old: any[]) => [tempItem, ...(old || [])]
      );

      return { previousItems };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (user?.id && context?.previousItems) {
        queryClient.setQueryData(inventoryKeys.items(user.id), context.previousItems);
      }
      console.error('Failed to add inventory item:', error);
    },
    onSuccess: (newItem) => {
      // Update cache with real item
      if (user?.id && newItem) {
        queryClient.setQueryData(
          inventoryKeys.items(user.id),
          (old: any[]) => {
            // Remove temp item and add real item
            const withoutTemp = (old || []).filter(item => !item.isOptimistic);
            return [newItem, ...withoutTemp];
          }
        );
        
        // Set individual item cache
        queryClient.setQueryData(inventoryKeys.item(newItem.id), newItem);
      }
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.items(user.id)
        });
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.userInventory(user.id)
        });
      }
    }
  });
};

/**
 * Envanter öğesi güncelleme mutation'ı
 */
export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ itemData, onProgress }: { itemData: any; onProgress?: (progress: number) => void }) =>
      updateInventoryItem(itemData, user?.id!, onProgress),
    onMutate: async ({ itemData }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: inventoryKeys.item(itemData.id) 
      });
      await queryClient.cancelQueries({ 
        queryKey: inventoryKeys.items(user?.id) 
      });

      // Snapshot previous values
      const previousItem = queryClient.getQueryData(inventoryKeys.item(itemData.id));
      const previousItems = queryClient.getQueryData(inventoryKeys.items(user?.id));

      // Optimistically update item
      const updatedItem = {
        ...(previousItem as any),
        ...itemData,
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData(inventoryKeys.item(itemData.id), updatedItem);
      
      // Update in items list
      queryClient.setQueryData(
        inventoryKeys.items(user?.id),
        (old: any[]) => 
          (old || []).map(item => 
            item.id === itemData.id ? updatedItem : item
          )
      );

      return { previousItem, previousItems };
    },
    onError: (error, { itemData }, context) => {
      // Rollback optimistic update
      if (context?.previousItem) {
        queryClient.setQueryData(inventoryKeys.item(itemData.id), context.previousItem);
      }
      if (user?.id && context?.previousItems) {
        queryClient.setQueryData(inventoryKeys.items(user.id), context.previousItems);
      }
      console.error('Failed to update inventory item:', error);
    },
    onSuccess: (updatedItem, { itemData }) => {
      // Update cache with real updated item
      if (updatedItem) {
        queryClient.setQueryData(inventoryKeys.item(itemData.id), updatedItem);
        
        if (user?.id) {
          queryClient.setQueryData(
            inventoryKeys.items(user.id),
            (old: any[]) => 
              (old || []).map(item => 
                item.id === itemData.id ? updatedItem : item
              )
          );
        }
      }
    },
    onSettled: ({ itemData }) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.item(itemData.id)
      });
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.items(user.id)
        });
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.userInventory(user.id)
        });
      }
    }
  });
};

/**
 * Envanter öğesi silme mutation'ı
 */
export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (itemId: string) => deleteInventoryItem(itemId, user?.id!),
    onMutate: async (itemId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: inventoryKeys.items(user?.id) 
      });

      // Snapshot previous value
      const previousItems = queryClient.getQueryData(inventoryKeys.items(user?.id));

      // Optimistically remove item
      queryClient.setQueryData(
        inventoryKeys.items(user?.id),
        (old: any[]) => (old || []).filter(item => item.id !== itemId)
      );

      return { previousItems };
    },
    onError: (error, itemId, context) => {
      // Rollback optimistic update
      if (user?.id && context?.previousItems) {
        queryClient.setQueryData(inventoryKeys.items(user.id), context.previousItems);
      }
      console.error('Failed to delete inventory item:', error);
    },
    onSuccess: (success, itemId) => {
      if (success) {
        // Remove from individual item cache
        queryClient.removeQueries({
          queryKey: inventoryKeys.item(itemId)
        });
      }
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.items(user.id)
        });
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.userInventory(user.id)
        });
      }
    }
  });
};

// ===========================
// HELPER HOOKS
// ===========================

/**
 * Envanter işlemlerini kolaylaştıran helper hook
 */
export const useInventoryActions = () => {
  const addItemMutation = useAddInventoryItem();
  const updateItemMutation = useUpdateInventoryItem();
  const deleteItemMutation = useDeleteInventoryItem();
  const { data: myItems, isLoading } = useMyInventoryItems();

  const addItem = async (itemData: any, onProgress?: (progress: number) => void) => {
    try {
      const result = await addItemMutation.mutateAsync({ itemData, onProgress });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const updateItem = async (itemData: any, onProgress?: (progress: number) => void) => {
    try {
      const result = await updateItemMutation.mutateAsync({ itemData, onProgress });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const result = await deleteItemMutation.mutateAsync(itemId);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const getItemsByCategory = (category: string) => {
    return (myItems || []).filter(item => item.category === category);
  };

  const getItemsCount = () => {
    return (myItems || []).length;
  };

  const getCategoriesWithCounts = () => {
    const categories = new Map<string, number>();
    (myItems || []).forEach(item => {
      const count = categories.get(item.category) || 0;
      categories.set(item.category, count + 1);
    });
    return Array.from(categories.entries()).map(([category, count]) => ({
      category,
      count
    }));
  };

  return {
    // Actions
    addItem,
    updateItem,
    deleteItem,
    
    // Utilities
    getItemsByCategory,
    getItemsCount,
    getCategoriesWithCounts,
    
    // Data
    myItems,
    
    // Loading states
    isLoading,
    isAdding: addItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isDeleting: deleteItemMutation.isPending,
    
    // Errors
    addError: addItemMutation.error,
    updateError: updateItemMutation.error,
    deleteError: deleteItemMutation.error,
  };
}; 