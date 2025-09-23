import React, { useState } from 'react';
import { toast } from '@/components/ui/use-toast.js';
import { Button } from '@/components/ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { followCategory } from '@/services/supabaseService';
// import { categoriesConfig } from '@/config/categories.js'; // Removed - using dynamic categories
import { Loader2, PlusCircle } from 'lucide-react';
import dynamicCategoryService from '@/services/dynamicCategoryService';

const FollowCategoryModal = ({ isOpen, onClose, currentUserId, onCategoryFollowed }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Load categories dynamically
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const fetchedCategories = await dynamicCategoryService.getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = async () => {
    if (!selectedCategory) {
      toast({ title: "Hata", description: "Lütfen bir kategori seçin.", variant: "destructive" });
      return;
    }
    setIsFollowing(true);
    const result = await followCategory(currentUserId, selectedCategory);
    if (result && !result.already_following) {
      onCategoryFollowed(selectedCategory);
      toast({ title: "Başarılı", description: `"${selectedCategory}" kategorisi takip edildi.` });
      onClose();
    } else if (result?.already_following) {
       toast({ title: "Bilgi", description: `"${selectedCategory}" kategorisini zaten takip ediyorsunuz.` });
    }
    setIsFollowing(false);
    setSelectedCategory('');
  };
  
  const renderCategoryOptions = (categories, parentPath = '') => {
    let options = [];
    categories.forEach(cat => {
      const currentPath = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
      options.push(<SelectItem key={currentPath} value={currentPath}>{currentPath}</SelectItem>);
      if (cat.subcategories && cat.subcategories.length > 0) {
        options = options.concat(renderCategoryOptions(cat.subcategories, currentPath));
      }
    });
    return options;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glass-effect">
        <DialogHeader>
          <DialogTitle>Kategori Takip Et</DialogTitle>
          <DialogDescription>
            Yeni ilanlardan haberdar olmak için bir kategori seçin ve takibe alın.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Kategori Seçin" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingCategories ? (
                <div className="p-2 text-center text-muted-foreground">Kategoriler yükleniyor...</div>
              ) : (
                renderCategoryOptions(categories)
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isFollowing}>İptal</Button>
          <Button onClick={handleFollow} disabled={isFollowing || !selectedCategory} className="btn-primary">
            {isFollowing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
            Takip Et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FollowCategoryModal;