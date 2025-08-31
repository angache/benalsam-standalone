import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import InventoryItemCard from '@/components/InventoryItemCard';
import { useAuthStore } from '@/stores';
import { fetchInventoryItems, deleteInventoryItem } from '@/services/inventoryBackendService.js';


const InventoryPage = () => { 
  const navigate = useNavigate();
  const { currentUser, loadingAuth } = useAuthStore();
  
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isFetchingInventory, setIsFetchingInventory] = useState(false);

  // Fetch inventory items when component mounts or user changes
  useEffect(() => {
    if (currentUser?.id) {
      setIsFetchingInventory(true);
      
      fetchInventoryItems(currentUser.id)
        .then(items => {
          setInventoryItems(items || []);
        })
        .catch(error => {
          console.error('Error fetching inventory:', error);
          toast({ title: "Hata", description: "Envanter yüklenirken bir sorun oluştu.", variant: "destructive" });
        })
        .finally(() => {
          setIsFetchingInventory(false);
        });
    }
  }, [currentUser?.id]);

  const isLoadingPage = loadingAuth || (currentUser && isFetchingInventory && inventoryItems.length === 0);
  const showEmptyState = !isLoadingPage && !isFetchingInventory && inventoryItems.length === 0 && !!currentUser;


  if (isLoadingPage) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-background p-4 text-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary mb-6" />
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          {loadingAuth ? "Kimlik doğrulanıyor..." : "Envanter yükleniyor..."}
        </h2>
        <p className="text-muted-foreground">Lütfen bekleyin.</p>
      </div>
    );
  }

  const handleDelete = async (itemId) => {
    try {
      console.log('🗑️ [InventoryPage] Deleting item with ID:', itemId);
      console.log('🗑️ [InventoryPage] Current user ID:', currentUser.id);
      
      const success = await deleteInventoryItem(itemId, currentUser.id);
      if (success) {
        setInventoryItems(prev => prev.filter(item => item.id !== itemId));
        toast({ title: "Başarılı", description: "Ürün başarıyla silindi." });
      } else {
        toast({ title: "Silme Başarısız", description: "Ürün silinirken bir hata oluştu.", variant: "destructive"});
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      toast({ title: "Hata", description: "Ürün silinirken bir sorun oluştu.", variant: "destructive"});
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-4 md:mb-0">
          Envanterim
        </h1>
        <Button onClick={() => navigate('/envanter/yeni')} className="btn-primary text-primary-foreground">
          <Plus className="w-5 h-5 mr-2" /> Yeni Ürün Ekle
        </Button>
      </div>
      <p className="text-muted-foreground mb-8 text-center md:text-left">
        Burada sahip olduğunuz ve alım ilanlarına teklif olarak sunabileceğiniz ürünleri yönetebilirsiniz. Bu ürünler herkese açık listelenmez.
      </p>

      {currentUser && isFetchingInventory && inventoryItems.length > 0 && !isLoadingPage && (
         <div className="text-center py-10">
          <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
          <p className="text-muted-foreground">Envanter güncelleniyor...</p>
        </div>
      )}

      {!isFetchingInventory && inventoryItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {inventoryItems.map((item) => (
              <InventoryItemCard 
                key={item.id} 
                item={item} 
                onEdit={(itemToEdit) => navigate(`/envanter/duzenle/${itemToEdit.id}`)} 
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {showEmptyState && (
        <div className="text-center py-20 glass-effect rounded-2xl">
          <Package className="w-20 h-20 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Envanterin boş görünüyor.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Tekliflerde kullanmak üzere sahip olduğun ürünleri buraya ekleyebilirsin.
          </p>
          <Button onClick={() => navigate('/envanter/yeni')} className="btn-primary text-primary-foreground px-8 py-3 text-lg">
            <Plus className="w-5 h-5 mr-2" /> İlk Ürününü Ekle
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default memo(InventoryPage);