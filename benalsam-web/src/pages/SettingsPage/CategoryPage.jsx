import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Grid,
  Check,
  Save,
  AlertCircle,
  Info,
  Search,
  X
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores';
import { categoriesConfig } from '../../config/categories';

const CategoryPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadDefaultCategory();
  }, []);

  const loadDefaultCategory = async () => {
    try {
      if (!currentUser) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('platform_preferences')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error loading default category:', error);
        return;
      }

      if (profile?.platform_preferences?.default_category) {
        setSelectedCategory(profile.platform_preferences.default_category);
      }
    } catch (error) {
      console.error('Error loading default category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (categoryPath) => {
    triggerHaptic();
    setSelectedCategory(categoryPath);
    setHasChanges(true);
  };

  const handleClearCategory = () => {
    triggerHaptic();
    setSelectedCategory('');
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setIsSaving(true);
      triggerHaptic();

      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('platform_preferences')
        .eq('id', currentUser.id)
        .single();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        alert('Varsayılan kategori kaydedilirken bir hata oluştu.');
        return;
      }

      const updatedPreferences = {
        ...profile?.platform_preferences,
        default_category: selectedCategory || null
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          platform_preferences: updatedPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (updateError) {
        console.error('Error saving default category:', updateError);
        alert('Varsayılan kategori kaydedilirken bir hata oluştu.');
        return;
      }

      setHasChanges(false);
      alert('Varsayılan kategori başarıyla kaydedildi!');
    } catch (error) {
      console.error('Error saving default category:', error);
      alert('Varsayılan kategori kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    if (hasChanges) {
      const confirmed = confirm('Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinizden emin misiniz?');
      if (!confirmed) return;
    }
    navigate('/ayarlar');
  };

  // Filter categories based on search term
  const filteredCategories = categoriesConfig.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.subcategories.some(sub => 
                           sub.name.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    return matchesSearch;
  });

  const renderCategoryCard = (category, isSubcategory = false, parentName = '') => {
    const categoryPath = isSubcategory ? `${parentName} > ${category.name}` : category.name;
    const isSelected = selectedCategory === categoryPath;

    return (
      <motion.div
        key={categoryPath}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleCategorySelect(categoryPath)}
        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
        } ${isSubcategory ? 'ml-6' : ''}`}
      >
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <Check size={12} className="text-white" />
          </div>
        )}

        {/* Category Info */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Grid size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderInfoCard = (title, description, icon) => (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 dark:text-blue-100">{title}</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleGoBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold">Varsayılan Kategori</h1>
        </div>

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`p-2 rounded-lg transition-colors ${
            hasChanges && !isSaving
              ? 'bg-primary text-white hover:bg-primary/80'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={20} />
          )}
        </button>
      </div>

      {/* Info Card */}
      {renderInfoCard(
        'Varsayılan Kategori',
        'Yeni ilan oluştururken bu kategori otomatik olarak seçilir. Kategori seçmezseniz her seferinde manuel seçim yapmanız gerekir.',
        <Grid size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Kategori ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Current Selection */}
      {selectedCategory && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                <Check size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-100">Seçili Kategori</h3>
                <p className="text-sm text-green-700 dark:text-green-300">{selectedCategory}</p>
              </div>
            </div>
            <button
              onClick={handleClearCategory}
              className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded text-sm hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
            >
              Temizle
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8">
            <Grid size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Kategori Bulunamadı</h3>
            <p className="text-gray-500 dark:text-gray-400">Arama teriminizle eşleşen kategori bulunamadı.</p>
          </div>
        ) : (
          filteredCategories.map(category => (
            <div key={category.name} className="space-y-2">
              {/* Main Category */}
              {renderCategoryCard(category)}
              
              {/* Subcategories */}
              {category.subcategories.map(subcategory => 
                renderCategoryCard(subcategory, true, category.name)
              )}
            </div>
          ))
        )}
      </div>

      {/* Category Tips */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
            <Info size={20} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-yellow-900 dark:text-yellow-100">Kategori İpuçları</h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
              <li>• Varsayılan kategori yeni ilan oluştururken otomatik seçilir</li>
              <li>• Kategori seçmezseniz her seferinde manuel seçim yapmanız gerekir</li>
              <li>• Ana kategoriler ve alt kategoriler seçebilirsiniz</li>
              <li>• Arama yaparak istediğiniz kategoriyi hızlıca bulabilirsiniz</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      {hasChanges && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-500 text-white p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} />
            <span>Kaydedilmemiş kategori değişikliği var</span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1 bg-white text-yellow-500 rounded font-medium hover:bg-gray-100 transition-colors"
          >
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default CategoryPage; 