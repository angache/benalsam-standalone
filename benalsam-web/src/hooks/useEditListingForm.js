import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { categoriesConfig, getCategoryPath } from '@/config/categories';
import { turkishProvincesAndDistricts } from '@/config/locations';
import { updateListing } from '@/services/listingService/mutations';
import { processImagesForSupabase } from '@/services/imageService';
import { useAuthStore } from '@/stores';

export const useEditListingForm = (listingId) => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const defaultFormData = {
    title: '',
    description: '',
    budget: '',
    urgency: 'Normal',
    images: [],
    mainImageIndex: -1,
    duration: '30',
    contactPreference: 'site_message',
    autoRepublish: false,
    neighborhood: '',
    latitude: null,
    longitude: null,
    acceptTerms: true,
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
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchListingData = async () => {
      if (!listingId || !currentUser) {
        setLoadingInitialData(false);
        return;
      }

      setLoadingInitialData(true);
      
      try {
        const { data: listing, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .eq('user_id', currentUser.id)
          .single();

        if (error || !listing) {
          toast({ title: "İlan Bulunamadı", description: "Düzenlenecek ilan bulunamadı veya size ait değil.", variant: "destructive" });
          navigate('/ilanlarim');
          return;
        }

        const initialImages = [];
        if (listing.main_image_url) {
          initialImages.push({ 
            preview: listing.main_image_url, 
            name: 'main_image.jpg', 
            isUploaded: true, 
            url: listing.main_image_url 
          });
        }
        if (listing.additional_image_urls && Array.isArray(listing.additional_image_urls)) {
          listing.additional_image_urls.forEach((url, index) => {
            initialImages.push({ 
              preview: url, 
              name: `additional_image_${index}.jpg`, 
              isUploaded: true, 
              url: url 
            });
          });
        }

        const categoryPath = listing.category?.split(' > ') || [];
        setSelectedMainCategory(categoryPath[0] || '');
        setSelectedSubCategory(categoryPath[1] || '');
        setSelectedSubSubCategory(categoryPath[2] || '');

        const locationPath = listing.location?.split(' / ') || [];
        setSelectedProvince(locationPath[0] || '');
        setSelectedDistrict(locationPath[1] || '');

        setFormData({
          id: listing.id,
          title: listing.title || '',
          description: listing.description || '',
          budget: listing.budget?.toString() || '',
          urgency: listing.urgency || 'Normal',
          images: initialImages,
          mainImageIndex: initialImages.length > 0 ? 0 : -1,
          duration: '30',
          contactPreference: listing.contact_preference || 'site_message',
          autoRepublish: listing.auto_republish || false,
          neighborhood: locationPath[2] || '',
          latitude: null,
          longitude: null,
          acceptTerms: listing.accept_terms !== false,
          premiumFeatures: {
            is_featured: listing.is_featured || false,
            is_urgent_premium: listing.is_urgent_premium || false,
            is_showcase: listing.is_showcase || false
          }
        });
      } catch (error) {
        console.error('Error fetching listing:', error);
        toast({ title: "Hata", description: "İlan bilgileri yüklenirken bir hata oluştu.", variant: "destructive" });
        navigate('/ilanlarim');
      } finally {
        setLoadingInitialData(false);
      }
    };

    fetchListingData();
  }, [listingId, currentUser, navigate]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
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

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "İlan başlığı gerekli.";
    if (!formData.description.trim()) newErrors.description = "Açıklama gerekli.";
    if (!formData.budget || formData.budget <= 0) newErrors.budget = "Geçerli bir bütçe girin.";

    const mainCat = categoriesConfig.find(cat => cat.name === selectedMainCategory);
    const subCat = mainCat?.subcategories?.find(sub => sub.name === selectedSubCategory);

    if (!selectedMainCategory) newErrors.category = 'Ana kategori seçimi gerekli';
    else if (mainCat?.subcategories?.length > 0 && !selectedSubCategory) newErrors.category = 'Alt kategori seçimi gerekli';
    else if (subCat?.subcategories?.length > 0 && !selectedSubSubCategory) newErrors.category = 'Detay kategori seçimi gerekli';

    if (!selectedProvince) newErrors.location = 'İl seçimi gerekli';
    else if (selectedProvince && !selectedDistrict) {
      const province = turkishProvincesAndDistricts.find(p => p.name === selectedProvince);
      if (province && province.districts.length > 0) newErrors.location = 'İlçe seçimi gerekli';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'En az bir görsel yüklemelisiniz.';
    } else if (formData.mainImageIndex === -1 && formData.images.length > 0) {
      setFormData(prev => ({ ...prev, mainImageIndex: 0 }));
    }

    if (!formData.acceptTerms) newErrors.acceptTerms = 'İlan verme kurallarını kabul etmelisiniz.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, selectedProvince, selectedDistrict]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isUploading) return;
    if (!validate()) {
      toast({ title: "Form Hatalı", description: "Lütfen gerekli alanları doldurun.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const categoryPath = getCategoryPath(selectedMainCategory, selectedSubCategory, selectedSubSubCategory);
      const locationPath = [selectedProvince, selectedDistrict, formData.neighborhood].filter(Boolean).join(' / ');

      let mainImageUrl = null;
      let additionalImageUrls = [];

      const hasNewImages = formData.images.some(img => !img.isUploaded);
      
      if (hasNewImages) {
        const { mainImageUrl: processedMainUrl, additionalImageUrls: processedAdditionalUrls } = await processImagesForSupabase(
          formData.images,
          formData.mainImageIndex,
          'item_images',
          'listings',
          currentUser.id,
          categoryPath,
          (progress) => setUploadProgress(progress)
        );
        mainImageUrl = processedMainUrl;
        additionalImageUrls = processedAdditionalUrls;
      } else {
        const mainImage = formData.images[formData.mainImageIndex];
        mainImageUrl = mainImage?.url || null;
        additionalImageUrls = formData.images
          .filter((_, index) => index !== formData.mainImageIndex)
          .map(img => img.url)
          .filter(Boolean);
      }

      const updateData = {
        title: formData.title,
        description: formData.description,
        category: categoryPath,
        budget: parseInt(formData.budget),
        location: locationPath,
        urgency: formData.urgency,
        contactPreference: formData.contactPreference,
        autoRepublish: formData.autoRepublish,
        acceptTerms: formData.acceptTerms,
        geolocation: formData.latitude && formData.longitude ? `POINT(${formData.longitude} ${formData.latitude})` : null,
        mainImageUrl,
        additionalImageUrls,
        ...formData.premiumFeatures
      };

      const result = await updateListing(formData.id, updateData, currentUser.id);
      
      if (result) {
        toast({ title: "Başarılı!", description: "İlanınız başarıyla güncellendi." });
        navigate('/ilanlarim');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating listing:', error);
      toast({ title: "Hata", description: "İlan güncellenirken bir sorun oluştu.", variant: "destructive" });
      return false;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [isUploading, validate, formData, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, selectedProvince, selectedDistrict, navigate, currentUser]);

  return {
    formData,
    setFormData,
    selectedMainCategory, setSelectedMainCategory,
    selectedSubCategory, setSelectedSubCategory,
    selectedSubSubCategory, setSelectedSubSubCategory,
    selectedProvince, setSelectedProvince,
    selectedDistrict, setSelectedDistrict,
    errors,
    loadingInitialData,
    isUploading,
    uploadProgress,
    handleInputChange,
    handlePremiumFeatureChange,
    handleImageArrayChange,
    handleRemoveImageFromArray,
    handleSubmit,
  };
};