import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PlusCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast.js';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { followCategory } from '@/services/supabaseService';
import { categoriesConfig } from '@/config/categories.js';
import { useAuthStore } from '@/stores';

const FollowCategoryPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = async () => {
    if (!selectedCategory) {
      toast({ title: "Hata", description: "Lütfen bir kategori seçin.", variant: "destructive" });
      return;
    }
    setIsFollowing(true);
    const result = await followCategory(currentUser.id, selectedCategory);
    if (result && !result.already_following) {
      toast({ title: "Başarılı", description: `"${selectedCategory}" kategorisi takip edildi.` });
      navigate(-1);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto px-4 py-12"
    >
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold text-gradient">Kategori Takip Et</h1>
      </div>

      <div className="glass-effect rounded-2xl p-6 space-y-6">
        <p className="text-muted-foreground">
          Yeni ilanlardan haberdar olmak için bir kategori seçin ve takibe alın.
        </p>
        
        <div className="space-y-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full bg-input border-border">
              <SelectValue placeholder="Kategori Seçin" />
            </SelectTrigger>
            <SelectContent>
              {renderCategoryOptions(categoriesConfig)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4 pt-3">
          <Button variant="outline" onClick={() => navigate(-1)} disabled={isFollowing} className="flex-1">
            İptal
          </Button>
          <Button onClick={handleFollow} disabled={isFollowing || !selectedCategory} className="flex-1 btn-primary">
            {isFollowing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
            Takip Et
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default FollowCategoryPage;