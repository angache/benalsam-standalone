import { useState, useCallback } from 'react';
import { categoriesConfig } from '@/config/categories';
import { turkishProvincesAndDistricts } from '@/config/locations';

export const useCreateListingForm = () => {
  const defaultFormData = {
    title: '',
    description: '',
    budget: '',
    urgency: 'Normal',
    images: [],
    mainImageIndex: -1,
    duration: '30',
    autoRepublish: false,
    contactPreference: 'site_message',
    acceptTerms: false,
    neighborhood: '',
    latitude: null,
    longitude: null,
    premiumFeatures: {
      is_featured: false,
      is_urgent_premium: false,
      is_showcase: false
    }
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState('');
  
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [errors, setErrors] = useState({});

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handlePremiumFeatureChange = useCallback((featureId, enabled) => {
    setFormData(prev => ({
      ...prev,
      premiumFeatures: {
        ...prev.premiumFeatures,
        [featureId]: enabled
      }
    }));
  }, []);
  
  const handleImageArrayChange = useCallback((newImages) => {
    let newMainImageIndex = formData.mainImageIndex;
    if (newImages.length > 0 && formData.mainImageIndex === -1) {
      newMainImageIndex = 0;
    } else if (newImages.length === 0) {
      newMainImageIndex = -1;
    } else if (formData.mainImageIndex >= newImages.length) {
      newMainImageIndex = newImages.length > 0 ? 0 : -1;
    }
    setFormData(prev => ({ ...prev, images: newImages, mainImageIndex: newMainImageIndex }));
     if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  }, [formData.mainImageIndex, errors.images]);

  const handleRemoveImageFromArray = useCallback((indexToRemove) => {
    setFormData(prev => {
      const updatedImages = prev.images.filter((_, index) => index !== indexToRemove);
      let newMainImageIndex = prev.mainImageIndex;
      if (indexToRemove === prev.mainImageIndex) {
        newMainImageIndex = updatedImages.length > 0 ? 0 : -1;
      } else if (indexToRemove < prev.mainImageIndex) {
        newMainImageIndex -=1;
      }
      return { ...prev, images: updatedImages, mainImageIndex: newMainImageIndex };
    });
  }, []);

  const validateStep = useCallback((step, data) => {
    const { formData, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, selectedProvince, selectedDistrict } = data;
    const newErrors = {};

    switch(step) {
        case 1: {
            const mainCat = categoriesConfig.find(cat => cat.name === selectedMainCategory);
            const subCat = mainCat?.subcategories?.find(sub => sub.name === selectedSubCategory);
            if (!selectedMainCategory) newErrors.category = 'Ana kategori seçimi gerekli';
            else if (mainCat?.subcategories?.length > 0 && !selectedSubCategory) newErrors.category = 'Alt kategori seçimi gerekli';
            else if (subCat?.subcategories?.length > 0 && !selectedSubSubCategory) newErrors.category = 'Detay kategori seçimi gerekli';
            break;
        }
        case 2:
            if (!formData.title.trim()) newErrors.title = 'Başlık gerekli';
            if (formData.title.trim().length < 5) newErrors.title = 'Başlık en az 5 karakter olmalı';
            if (!formData.description.trim()) newErrors.description = 'Açıklama gerekli';
            if (formData.description.trim().length < 10) newErrors.description = 'Açıklama en az 10 karakter olmalı';
            if (!formData.budget || parseInt(formData.budget, 10) <= 0) newErrors.budget = 'Geçerli bir bütçe girin';
            break;
        case 3:
            if (formData.images.length === 0) newErrors.images = 'En az bir görsel yüklemelisiniz.';
            break;
        case 4: {
            if (!selectedProvince) newErrors.location = 'İl seçimi gerekli';
            const provinceData = turkishProvincesAndDistricts.find(p=>p.name === selectedProvince);
            if (provinceData?.districts?.length > 0 && !selectedDistrict) newErrors.location = 'İlçe seçimi gerekli';
            break;
        }
        case 5:
             if (!formData.acceptTerms) newErrors.acceptTerms = 'İlan yayınlama kurallarını kabul etmelisiniz.';
            break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
}, []);

  return {
    formData, setFormData,
    selectedMainCategory, setSelectedMainCategory,
    selectedSubCategory, setSelectedSubCategory,
    selectedSubSubCategory, setSelectedSubSubCategory,
    selectedProvince, setSelectedProvince,
    selectedDistrict, setSelectedDistrict,
    errors, setErrors,
    handleInputChange,
    handlePremiumFeatureChange,
    handleImageArrayChange,
    handleRemoveImageFromArray,
    validateStep
  };
};