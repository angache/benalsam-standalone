import { useState, useCallback, useEffect } from 'react';
import dynamicCategoryService from '@/services/dynamicCategoryService';
import { turkishProvincesAndDistricts } from '@/config/locations';

export const useCreateListingForm = () => {
  // Calculate default expires_at (30 days from now)
  const defaultExpiresAt = new Date();
  defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 30);
  
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
    	  condition: ['any'], // Varsayılan: Fark Etmez
    attributes: {}, // Kategori-specific özellikler
    category_id: null, // Kategori ID'si
    category_path: [], // Hiyerarşik kategori path'i
    expires_at: defaultExpiresAt.toISOString(), // İlan bitiş tarihi
    geolocation: null, // Konum koordinatları
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
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Load categories from dynamic service
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        console.log('🔄 Loading categories for listing form...');
        
        const fetchedCategories = await dynamicCategoryService.getCategoryTree();
        console.log('📦 Categories loaded for form:', fetchedCategories);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error loading categories for form:', error);
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Handle category changes and update category_id and category_path
  const handleMainCategoryChange = useCallback((category) => {
    setSelectedMainCategory(category);
    setSelectedSubCategory('');
    setSelectedSubSubCategory('');
    
    // Update category_id and category_path
    const newCategoryId = category; // Use category name as ID for now
    const newCategoryPath = [category];
    
    console.log('🏷️ Main category changed:', {
      category,
      category_id: newCategoryId,
      category_path: newCategoryPath
    });
    
    setFormData(prev => ({
      ...prev,
      category_id: newCategoryId,
      category_path: newCategoryPath
    }));
  }, []);

  const handleSubCategoryChange = useCallback((subCategory) => {
    setSelectedSubCategory(subCategory);
    setSelectedSubSubCategory('');
    
    // Use current state values instead of closure values
    setFormData(prev => {
      const currentMainCategory = prev.category_path?.[0] || '';
      const newCategoryId = `${currentMainCategory}-${subCategory}`;
      const newCategoryPath = [currentMainCategory, subCategory];
      
      console.log('🏷️ Sub category changed:', {
        mainCategory: currentMainCategory,
        subCategory,
        category_id: newCategoryId,
        category_path: newCategoryPath
      });
      
      return {
        ...prev,
        category_id: newCategoryId,
        category_path: newCategoryPath
      };
    });
  }, []);

  const handleSubSubCategoryChange = useCallback((subSubCategory) => {
    setSelectedSubSubCategory(subSubCategory);
    
    // Use current state values instead of closure values
    setFormData(prev => {
      const currentMainCategory = prev.category_path?.[0] || '';
      const currentSubCategory = prev.category_path?.[1] || '';
      const newCategoryId = `${currentMainCategory}-${currentSubCategory}-${subSubCategory}`;
      const newCategoryPath = [currentMainCategory, currentSubCategory, subSubCategory];
      
      console.log('🏷️ Sub-sub category changed:', {
        mainCategory: currentMainCategory,
        subCategory: currentSubCategory,
        subSubCategory,
        category_id: newCategoryId,
        category_path: newCategoryPath
      });
      
      return {
        ...prev,
        category_id: newCategoryId,
        category_path: newCategoryPath
      };
    });
  }, []);

  // Enhanced reverse geocoding function for Turkish addresses
  const reverseGeocode = useCallback(async (latitude, longitude) => {
    try {
      // Try multiple Nominatim requests with different parameters
      const requests = [
        // Standard request
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=tr`,
        // With zoom level for better accuracy
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=tr&zoom=18`,
        // With country code
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=tr&countrycodes=tr`
      ];

      for (const url of requests) {
        try {
          const response = await fetch(url);
          
          if (!response.ok) continue;
          
          const data = await response.json();
          
          if (data && data.address) {
            const address = data.address;
            
            // Extract Turkish location information with comprehensive mapping
            const province = address.state || address.province || address.region || address.state_district;
            const district = address.city || address.town || address.municipality || address.county || address.city_district;
            const neighborhood = address.suburb || address.village || address.neighbourhood || address.quarter || address.hamlet;
            
            // Parse full address for additional information
            const fullAddress = data.display_name || '';
            console.log('Full address:', fullAddress);
            console.log('Address components:', address);
            
            // Try to extract province and district from full address if not found
            let extractedProvince = province;
            let extractedDistrict = district;
            
            if (!extractedProvince || !extractedDistrict) {
              // Common Turkish province patterns
              const provincePatterns = [
                /([A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+)\s+(?:İli|İl)/,
                /([A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+)\s+(?:il|İL)/
              ];
              
              const districtPatterns = [
                /([A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+)\s+(?:İlçesi|İlçe)/,
                /([A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+)\s+(?:ilçe|İLÇE)/
              ];
              
              for (const pattern of provincePatterns) {
                const match = fullAddress.match(pattern);
                if (match && !extractedProvince) {
                  extractedProvince = match[1];
                  break;
                }
              }
              
              for (const pattern of districtPatterns) {
                const match = fullAddress.match(pattern);
                if (match && !extractedDistrict) {
                  extractedDistrict = match[1];
                  break;
                }
              }
            }
            
            // Special handling for Turkish addresses where province might be missing
            if (!extractedProvince || extractedProvince.includes('Bölgesi')) {
              // Known Turkish province-district mappings
              const provinceDistrictMap = {
                'Çiğli': 'İzmir',
                'Karşıyaka': 'İzmir',
                'Bornova': 'İzmir',
                'Konak': 'İzmir',
                'Buca': 'İzmir',
                'Gaziemir': 'İzmir',
                'Balçova': 'İzmir',
                'Narlıdere': 'İzmir',
                'Güzelbahçe': 'İzmir',
                'Çankaya': 'Ankara',
                'Keçiören': 'Ankara',
                'Mamak': 'Ankara',
                'Sincan': 'Ankara',
                'Etimesgut': 'Ankara',
                'Yenimahalle': 'Ankara',
                'Pursaklar': 'Ankara',
                'Gölbaşı': 'Ankara',
                'Kadıköy': 'İstanbul',
                'Beşiktaş': 'İstanbul',
                'Şişli': 'İstanbul',
                'Beyoğlu': 'İstanbul',
                'Fatih': 'İstanbul',
                'Üsküdar': 'İstanbul',
                'Maltepe': 'İstanbul',
                'Kartal': 'İstanbul',
                'Pendik': 'İstanbul',
                'Tuzla': 'İstanbul',
                'Sancaktepe': 'İstanbul',
                'Sultanbeyli': 'İstanbul',
                'Çekmeköy': 'İstanbul',
                'Ümraniye': 'İstanbul',
                'Ataşehir': 'İstanbul',
                'Bostancı': 'İstanbul',
                'Kozyatağı': 'İstanbul'
              };
              
              // Try to find province from district
              if (extractedDistrict && provinceDistrictMap[extractedDistrict]) {
                extractedProvince = provinceDistrictMap[extractedDistrict];
              } else {
                // Try to extract from full address using common patterns
                const addressParts = fullAddress.split(',');
                for (const part of addressParts) {
                  const trimmedPart = part.trim();
                  if (provinceDistrictMap[trimmedPart]) {
                    extractedProvince = provinceDistrictMap[trimmedPart];
                    break;
                  }
                }
              }
            }
            
            console.log('Extracted address info:', { 
              province: extractedProvince, 
              district: extractedDistrict, 
              neighborhood, 
              fullAddress 
            });
            
            return {
              province: extractedProvince || '',
              district: extractedDistrict || '',
              neighborhood: neighborhood || '',
              fullAddress: fullAddress
            };
          }
        } catch (error) {
          console.warn('Request failed, trying next:', error);
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }, []);

  // Geolocation detection function
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum algılamayı desteklemiyor.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        console.log('Konum algılandı:', { latitude, longitude });
        
        // Show loading state
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          geolocation: {
            latitude: latitude,
            longitude: longitude
          }
        }));

        // Get address information from coordinates
        const addressInfo = await reverseGeocode(latitude, longitude);
        
        if (addressInfo) {
          // Update form with address information
          setFormData(prev => ({
            ...prev,
            neighborhood: addressInfo.neighborhood
          }));

          // Update province and district if found
          if (addressInfo.province) {
            setSelectedProvince(addressInfo.province);
          }
          if (addressInfo.district) {
            setSelectedDistrict(addressInfo.district);
          }

          console.log('Adres bilgisi güncellendi:', addressInfo);
        } else {
          console.log('Adres bilgisi alınamadı, sadece koordinatlar kaydedildi');
        }
      },
      (error) => {
        let errorMessage = 'Konum algılanamadı.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Konum erişimi reddedildi. Lütfen tarayıcı ayarlarından konum iznini verin.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Konum bilgisi mevcut değil.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Konum algılama zaman aşımına uğradı.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [reverseGeocode, setSelectedProvince, setSelectedDistrict]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Calculate expires_at when duration changes
      if (field === 'duration' && value) {
        const durationDays = parseInt(value, 10);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);
        newData.expires_at = expiresAt.toISOString();
      }
      
      // Update geolocation when latitude or longitude changes
      if (field === 'latitude' || field === 'longitude') {
        const latitude = field === 'latitude' ? value : prev.latitude;
        const longitude = field === 'longitude' ? value : prev.longitude;
        
        if (latitude && longitude) {
          newData.geolocation = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          };
        } else {
          newData.geolocation = null;
        }
      }
      
      return newData;
    });
    
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
    console.log('🔍 DEBUG: validateStep called', { step, data });
    const { formData, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, selectedProvince, selectedDistrict } = data;
    const newErrors = {};

    switch(step) {
        case 1: {
            console.log('🔍 DEBUG: Validating step 1 - Category');
            const mainCat = categories.find(cat => cat.name === selectedMainCategory);
            const subCat = mainCat?.subcategories?.find(sub => sub.name === selectedSubCategory);
            if (!selectedMainCategory) newErrors.category = 'Ana kategori seçimi gerekli';
            else if (mainCat?.subcategories?.length > 0 && !selectedSubCategory) newErrors.category = 'Alt kategori seçimi gerekli';
            else if (subCat?.subcategories?.length > 0 && !selectedSubSubCategory) newErrors.category = 'Detay kategori seçimi gerekli';
            break;
        }
        case 2:
            console.log('🔍 DEBUG: Validating step 2 - Details', { 
              title: formData.title, 
              description: formData.description, 
              budget: formData.budget
            });
            if (!formData.title.trim()) newErrors.title = 'Başlık gerekli';
            if (formData.title.trim().length < 5) newErrors.title = 'Başlık en az 5 karakter olmalı';
            if (!formData.description.trim()) newErrors.description = 'Açıklama gerekli';
            if (formData.description.trim().length < 10) newErrors.description = 'Açıklama en az 10 karakter olmalı';
            if (!formData.budget || parseInt(formData.budget, 10) <= 0) newErrors.budget = 'Geçerli bir bütçe girin';
            break;
        case 3:
            console.log('🔍 DEBUG: Validating step 3 - Attributes');
            // Attributes and condition are optional - no validation needed
            break;
        case 4:
            console.log('🔍 DEBUG: Validating step 4 - Images', { imageCount: formData.images.length });
            if (formData.images.length === 0) newErrors.images = 'En az bir görsel yüklemelisiniz.';
            break;
        case 5: {
            console.log('🔍 DEBUG: Validating step 5 - Location', { selectedProvince, selectedDistrict });
            if (!selectedProvince) newErrors.location = 'İl seçimi gerekli';
            const provinceData = turkishProvincesAndDistricts.find(p=>p.name === selectedProvince);
            if (provinceData?.districts?.length > 0 && !selectedDistrict) newErrors.location = 'İlçe seçimi gerekli';
            break;
        }
        case 6:
            console.log('🔍 DEBUG: Validating step 6 - Terms', { acceptTerms: formData.acceptTerms });
             if (!formData.acceptTerms) newErrors.acceptTerms = 'İlan yayınlama kurallarını kabul etmelisiniz.';
            break;
    }

    console.log('🔍 DEBUG: Validation errors', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('🔍 DEBUG: Validation result', { isValid, errorCount: Object.keys(newErrors).length });
    return isValid;
}, []);

  return {
    formData, setFormData,
    selectedMainCategory, setSelectedMainCategory,
    selectedSubCategory, setSelectedSubCategory,
    selectedSubSubCategory, setSelectedSubSubCategory,
    handleMainCategoryChange,
    handleSubCategoryChange,
    handleSubSubCategoryChange,
    categories,
    isLoadingCategories,
    selectedProvince, setSelectedProvince,
    selectedDistrict, setSelectedDistrict,
    errors, setErrors,
    handleInputChange,
    handlePremiumFeatureChange,
    detectLocation,
    handleImageArrayChange,
    handleRemoveImageFromArray,
    validateStep
  };
};