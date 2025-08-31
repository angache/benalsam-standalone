import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { categoriesConfig, getCategoryPath } from '@/config/categories';
import { useAuthStore } from '@/stores';
import { getInventoryItemById, addInventoryItem, updateInventoryItem, uploadInventoryImages } from '@/services/inventoryBackendService.js';

export const useInventoryForm = (itemId) => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    isUploading, 
    uploadProgress 
  } = useAuthStore();

  const isEditMode = !!itemId;

  const defaultFormData = {
    name: '',
    description: '',
    images: [],
    mainImageIndex: -1,
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState('');
  const [errors, setErrors] = useState({});
  const [loadingInitialData, setLoadingInitialData] = useState(isEditMode); 

  useEffect(() => {
    if (isEditMode && currentUser) { 
      const fetchItemData = async () => {
        setLoadingInitialData(true);
        const item = await getInventoryItemById(itemId);

        if (!item) {
          toast({ title: "Ürün Bulunamadı", description: "Düzenlenecek ürün bulunamadı veya size ait değil.", variant: "destructive" });
          navigate('/envanterim');
          return;
        }
        
        const initialImages = [];
        if (item.main_image_url) {
          initialImages.push({ preview: item.main_image_url, name: 'main_image.jpg', isUploaded: true, url: item.main_image_url });
        }
        (item.additional_image_urls || []).forEach((url, index) => {
          initialImages.push({ preview: url, name: `additional_image_${index}.jpg`, isUploaded: true, url: url });
        });
        
        const categoryPath = item.category?.split(' > ') || [];
        setSelectedMainCategory(categoryPath[0] || '');
        setSelectedSubCategory(categoryPath[1] || '');
        setSelectedSubSubCategory(categoryPath[2] || '');
        
        setFormData({
          id: item.id,
          name: item.name, 
          description: item.description || '', 
          images: initialImages,
          mainImageIndex: initialImages.length > 0 ? initialImages.findIndex(img => img.url === item.main_image_url) : -1,
        });
        setLoadingInitialData(false);
      };
      fetchItemData();
    } else if (!isEditMode) {
      setFormData(defaultFormData);
      setSelectedMainCategory('');
      setSelectedSubCategory('');
      setSelectedSubSubCategory('');
      setErrors({});
      setLoadingInitialData(false); 
    } else if (isEditMode && !currentUser) {
      setLoadingInitialData(false);
    }
  }, [itemId, isEditMode, currentUser, navigate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: ''}));
  }, [errors]);

  const handleImageArrayChange = useCallback((newImages) => {
    setFormData(prev => {
      let newMainImageIndex = prev.mainImageIndex;
      if (newImages.length === 1 && prev.mainImageIndex === -1) {
        newMainImageIndex = 0;
      } else if (newImages.length === 0) {
        newMainImageIndex = -1;
      } else if (prev.mainImageIndex >= newImages.length) {
        newMainImageIndex = newImages.length > 0 ? 0 : -1;
      }
      return { ...prev, images: newImages, mainImageIndex: newMainImageIndex };
    });
  }, []);

  const handleRemoveImageFromArray = useCallback((indexToRemove) => {
    setFormData(prev => {
      const updatedImages = prev.images.filter((_, index) => index !== indexToRemove);
      let newMainImageIndex = prev.mainImageIndex;
      if (indexToRemove === prev.mainImageIndex) {
        newMainImageIndex = updatedImages.length > 0 ? 0 : -1;
      } else if (indexToRemove < prev.mainImageIndex) {
        newMainImageIndex -= 1;
      }
      return { ...prev, images: updatedImages, mainImageIndex: newMainImageIndex };
    });
  }, []);

  const handleSetMainImage = useCallback((index) => {
    setFormData(prev => ({ ...prev, mainImageIndex: index }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Ürün adı gerekli.";
    
    const mainCat = categoriesConfig.find(cat => cat.name === selectedMainCategory);
    const subCat = mainCat?.subcategories?.find(sub => sub.name === selectedSubCategory);

    if (!selectedMainCategory) newErrors.category = 'Ana kategori seçimi gerekli';
    else if (mainCat?.subcategories?.length > 0 && !selectedSubCategory) newErrors.category = 'Alt kategori seçimi gerekli';
    else if (subCat?.subcategories?.length > 0 && !selectedSubSubCategory) newErrors.category = 'Detay kategori seçimi gerekli';
    
    if (formData.images.length === 0) {
        newErrors.images = 'En az bir görsel yüklemelisiniz.';
    } else if (formData.mainImageIndex === -1 && formData.images.length > 0) {
        setFormData(prev => ({...prev, mainImageIndex: 0})); 
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedMainCategory, selectedSubCategory, selectedSubSubCategory]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isUploading) return;
    if (!validate()) {
      toast({ title: "Form Hatalı", description: "Lütfen gerekli alanları doldurun, kategori seçimini tamamlayın ve en az bir görsel ekleyin.", variant: "destructive"});
      return;
    }

    try {
      // Upload images to backend API first
      const imagesToUpload = formData.images.filter(img => !img.isUploaded && img.file);
      let uploadedImages = [];
      
      if (imagesToUpload.length > 0) {
        const files = imagesToUpload.map(img => img.file);
        uploadedImages = await uploadInventoryImages(files);
        console.log('📦 [InventoryForm] Images uploaded to backend:', uploadedImages);
      }

      // Prepare image URLs
      const finalImages = formData.images.map(img => {
        if (img.isUploaded) {
          return img; // Already uploaded image
        } else if (img.file) {
          // New uploaded image
          const uploadedImage = uploadedImages.find(uploaded => uploaded.url);
          return {
            ...img,
            url: uploadedImage?.url || img.preview,
            thumbnailUrl: uploadedImage?.thumbnailUrl,
            mediumUrl: uploadedImage?.mediumUrl,
            isUploaded: true
          };
        }
        return img;
      });

      const categoryPath = getCategoryPath(selectedMainCategory, selectedSubCategory, selectedSubSubCategory);
      
      const submittedData = { 
        ...formData, 
        category: categoryPath,
        images: finalImages,
      };

      let result;
      if (isEditMode) {
        result = await updateInventoryItem(submittedData, currentUser.id);
      } else {
        result = await addInventoryItem(submittedData, currentUser.id);
      }

      if (result) {
        toast({ title: "Başarılı!", description: isEditMode ? "Ürün başarıyla güncellendi." : "Ürün başarıyla eklendi." });
        navigate('/envanterim');
      }
    } catch (error) {
      console.error('Error submitting inventory item:', error);
      toast({ 
        title: "Hata", 
        description: "Ürün kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.", 
        variant: "destructive" 
      });
    }
  }, [isUploading, validate, formData, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, isEditMode, currentUser?.id, navigate]);

  return {
    formData,
    setFormData,
    selectedMainCategory, setSelectedMainCategory,
    selectedSubCategory, setSelectedSubCategory,
    selectedSubSubCategory, setSelectedSubSubCategory,
    errors,
    loadingInitialData, 
    isEditMode,
    isUploading,
    uploadProgress,
    handleChange,
    handleImageArrayChange,
    handleRemoveImageFromArray,
    handleSetMainImage,
    handleSubmit,
  };
};