import React, { useState, useCallback, useMemo, lazy, Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Tag } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores';
import { useAppData } from '@/hooks/useAppData';
import { useCreateListingForm } from '@/components/CreateListingPage/useCreateListingForm.js';
import { checkListingLimit, incrementUserUsage, showPremiumUpgradeToast } from '@/services/premiumService';
// Lazy load modal components
const ListingRulesModal = lazy(() => import('@/components/ListingRulesModal.jsx'));
const StockImageSearchModal = lazy(() => import('@/components/CreateListingPage/StockImageSearchModal.jsx'));
const PremiumModal = lazy(() => import('@/components/PremiumModal.jsx'));
import Stepper from '@/components/CreateListingPage/Stepper.jsx';
import StepButtons from '@/components/CreateListingPage/StepButtons.jsx';
import { turkishProvincesAndDistricts } from '@/config/locations';
import { urlToBlob } from '@/lib/utils';
import { compressImage } from '@/lib/imageUtils';

// Lazy load step components
const Step1_Category = lazy(() => import('@/components/CreateListingPage/steps/Step1_Category.jsx'));
const Step2_Details = lazy(() => import('@/components/CreateListingPage/steps/Step2_Details.jsx'));
const Step3_Images = lazy(() => import('@/components/CreateListingPage/steps/Step3_Images.jsx'));
const Step4_Location = lazy(() => import('@/components/CreateListingPage/steps/Step4_Location.jsx'));
const Step5_Review = lazy(() => import('@/components/CreateListingPage/steps/Step5_Review.jsx'));
    
    const steps = [
      { name: 'Kategori' },
      { name: 'Detaylar' },
      { name: 'Görseller' },
      { name: 'Konum' },
      { name: 'Onay' },
    ];
    
    const CreateListingPage = () => {
      const navigate = useNavigate();
      const { currentUser, loadingAuth } = useAuthStore();
      const { handleCreateListing, isUploading, uploadProgress } = useAppData();
      const [currentStep, setCurrentStep] = useState(1);
      const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
      const [isStockModalOpen, setIsStockModalOpen] = useState(false);
      const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    
      const {
        formData, setFormData, errors, setErrors,
        selectedMainCategory, setSelectedMainCategory,
        selectedSubCategory, setSelectedSubCategory,
        selectedSubSubCategory, setSelectedSubSubCategory,
        selectedProvince, setSelectedProvince,
        selectedDistrict, setSelectedDistrict,
        handleInputChange, handlePremiumFeatureChange, handleImageArrayChange, handleRemoveImageFromArray,
        validateStep,
      } = useCreateListingForm();
    
      const handleLocationDetect = useCallback(({ latitude, longitude, province, district, neighborhood }) => {
        const foundProvince = turkishProvincesAndDistricts.find(p => p.name.toLowerCase() === province.toLowerCase());
        if (foundProvince) {
          setSelectedProvince(foundProvince.name);
          const foundDistrict = foundProvince.districts.find(d => d.toLowerCase() === district.toLowerCase());
          if (foundDistrict) setSelectedDistrict(foundDistrict);
          else setSelectedDistrict('');
        } else {
          setSelectedProvince('');
          setSelectedDistrict('');
        }
        setFormData(prev => ({ ...prev, latitude, longitude, neighborhood }));
      }, [setFormData, setSelectedProvince, setSelectedDistrict]);
    
      const stockImageSearchQuery = useMemo(() => {
        const queryParts = [formData.title, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, formData.description.substring(0, 100)];
        return queryParts.filter(Boolean).join(' ');
      }, [formData.title, formData.description, selectedMainCategory, selectedSubCategory, selectedSubSubCategory]);
    
      const handleSelectStockImages = useCallback(async (selectedStockImages) => {
        if (selectedStockImages.length === 0) return;
        const availableSlots = 5 - formData.images.length;
        if (availableSlots <= 0) {
          toast({ title: "Görsel Limiti Dolu", variant: "destructive" });
          return;
        }
        const imagesToProcess = selectedStockImages.slice(0, availableSlots);
        toast({ title: "Görseller İndiriliyor ve Optimize Ediliyor...", description: "Lütfen bekleyin." });
        const newImageObjects = await Promise.all(
          imagesToProcess.map(async (img) => {
            try {
              const blob = await urlToBlob(img.urls.regular);
              const originalFile = new File([blob], `${img.id}.jpg`, { type: 'image/jpeg' });
              const compressedFile = await compressImage(originalFile);
              return { file: compressedFile, preview: URL.createObjectURL(compressedFile), name: compressedFile.name, isUploaded: false };
            } catch (error) {
              toast({ title: "Görsel İndirme/İşleme Hatası", variant: "destructive" });
              return null;
            }
          })
        );
        handleImageArrayChange([...formData.images, ...newImageObjects.filter(Boolean)]);
        toast({ title: "Stok Görseller Eklendi", description: "Seçilen görseller başarıyla eklendi." });
      }, [formData.images, handleImageArrayChange]);
    
      const handleSubmit = async () => {
        if (isUploading) return;
    
        if (!currentUser) {
          toast({ title: "Giriş Gerekli", description: "İlan oluşturmak için giriş yapmalısınız.", variant: "destructive" });
          return;
        }
    
        const canCreateListing = await checkListingLimit(currentUser.id);
        if (!canCreateListing) {
          showPremiumUpgradeToast('listing', 0, 3);
          setIsPremiumModalOpen(true);
          return;
        }
    
        const allData = { formData, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, selectedProvince, selectedDistrict };
        if (!validateStep(5, allData)) {
          toast({ title: "Hata!", description: "Lütfen kuralları kabul edin.", variant: "destructive" });
          return;
        }
    
        const listingData = {
          ...formData,
          budget: parseInt(formData.budget),
          duration: parseInt(formData.duration),
          category: [selectedMainCategory, selectedSubCategory, selectedSubSubCategory].filter(Boolean).join(' > '),
          location: [selectedProvince, selectedDistrict, formData.neighborhood].filter(Boolean).join(' / '),
          geolocation: formData.latitude && formData.longitude ? `POINT(${formData.longitude} ${formData.latitude})` : null,
          contactPreference: formData.contactPreference,
          autoRepublish: formData.autoRepublish,
          acceptTerms: formData.acceptTerms,
          ...formData.premiumFeatures
        };
        
        const createdListing = await handleCreateListing(listingData);
        if (createdListing) {
          await incrementUserUsage(currentUser.id, 'listing');
          toast({ title: "Başarıyla Gönderildi!", description: "İlanınız incelenmek üzere ekibimize gönderildi.", duration: 7000 });
          navigate(`/profil/${currentUser.id}`);
        }
      };
    
      const nextStep = () => {
        const allData = { formData, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, selectedProvince, selectedDistrict };
        if (currentStep < steps.length && validateStep(currentStep, allData)) {
          setCurrentStep(prev => prev + 1);
        }
      };
    
      const prevStep = () => {
        if (currentStep > 1) {
          setCurrentStep(prev => prev - 1);
          setErrors({});
        }
      };
    
      const handleFinalSubmit = () => {
        if (validateStep(5, { formData })) {
            handleSubmit();
        }
      };
    
      const selectedCategoryPath = [selectedMainCategory, selectedSubCategory, selectedSubSubCategory].filter(Boolean).join(' > ');
      const selectedLocationPath = [selectedProvince, selectedDistrict, formData.neighborhood].filter(Boolean).join(' > ');
    
      if (loadingAuth) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        );
      }
    
      const renderStepContent = () => {
        const StepLoadingSpinner = () => (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Adım yükleniyor...</span>
          </div>
        );

        switch (currentStep) {
          case 1:
            return (
              <Suspense fallback={<StepLoadingSpinner />}>
                <Step1_Category 
                  selectedMainCategory={selectedMainCategory} 
                  onMainChange={setSelectedMainCategory} 
                  selectedSubCategory={selectedSubCategory} 
                  onSubChange={setSelectedSubCategory} 
                  selectedSubSubCategory={selectedSubSubCategory} 
                  onSubSubChange={setSelectedSubSubCategory} 
                  errors={errors} 
                />
              </Suspense>
            );
          case 2:
            return (
              <Suspense fallback={<StepLoadingSpinner />}>
                <Step2_Details 
                  formData={formData} 
                  handleInputChange={handleInputChange} 
                  errors={errors} 
                />
              </Suspense>
            );
          case 3:
            return (
              <Suspense fallback={<StepLoadingSpinner />}>
                <Step3_Images 
                  formData={formData} 
                  handleImageArrayChange={handleImageArrayChange} 
                  handleRemoveImageFromArray={handleRemoveImageFromArray} 
                  handleInputChange={handleInputChange} 
                  onOpenStockModal={() => setIsStockModalOpen(true)} 
                  errors={errors} 
                />
              </Suspense>
            );
          case 4:
            return (
              <Suspense fallback={<StepLoadingSpinner />}>
                <Step4_Location 
                  selectedProvince={selectedProvince} 
                  setSelectedProvince={setSelectedProvince} 
                  selectedDistrict={selectedDistrict} 
                  setSelectedDistrict={setSelectedDistrict} 
                  formData={formData} 
                  handleInputChange={handleInputChange} 
                  onLocationDetect={handleLocationDetect} 
                  errors={errors} 
                />
              </Suspense>
            );
          case 5:
            return (
              <Suspense fallback={<StepLoadingSpinner />}>
                <Step5_Review 
                  formData={formData} 
                  handleInputChange={handleInputChange} 
                  handlePremiumFeatureChange={handlePremiumFeatureChange} 
                  selectedCategoryPath={selectedCategoryPath} 
                  selectedLocationPath={selectedLocationPath} 
                  onOpenRulesModal={() => setIsRulesModalOpen(true)} 
                  errors={errors} 
                />
              </Suspense>
            );
          default:
            return null;
        }
      };
    
      return (
        <>
          <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8">
            <div className="mb-10">
              <Stepper currentStep={currentStep} steps={steps} />
            </div>
            
            {currentStep > 1 && selectedCategoryPath && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6 p-3 bg-muted/50 rounded-lg text-sm text-center flex items-center justify-center gap-2"
              >
                <Tag className="w-4 h-4 text-primary" />
                <span className="font-semibold text-muted-foreground">Seçilen Kategori: </span>
                <span className="font-bold text-primary">{selectedCategoryPath}</span>
              </motion.div>
            )}
    
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="p-6 bg-card rounded-2xl shadow-lg"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>
                <StepButtons 
                    currentStep={currentStep} 
                    totalSteps={steps.length}
                    onBack={prevStep} 
                    onNext={currentStep === steps.length ? handleFinalSubmit : nextStep} 
                    isSubmitting={isUploading}
                />
            </motion.div>
          </div>
    
          <Suspense fallback={null}>
            <StockImageSearchModal
              isOpen={isStockModalOpen}
              onOpenChange={setIsStockModalOpen}
              onImagesSelect={handleSelectStockImages}
              initialSearchQuery={stockImageSearchQuery}
            />
          </Suspense>
          <Suspense fallback={null}>
            <ListingRulesModal isOpen={isRulesModalOpen} onOpenChange={setIsRulesModalOpen} />
          </Suspense>
          <Suspense fallback={null}>
            <PremiumModal 
              isOpen={isPremiumModalOpen} 
              onOpenChange={setIsPremiumModalOpen}
              feature="listing"
            />
          </Suspense>
        </>
      );
    };
    
    export default memo(CreateListingPage);