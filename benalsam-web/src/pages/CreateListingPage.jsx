import React, { useState, useCallback, useMemo, lazy, Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Tag } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores';
import { useAppData } from '@/hooks/useAppData';
import { useCreateListingForm } from '@/components/CreateListingPage/useCreateListingForm.js';
import { checkListingLimit, incrementUserUsage, showPremiumUpgradeToast } from '@/services/premiumService';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Lazy load modal components
const ListingRulesModal = lazy(() => import('@/components/ListingRulesModal.jsx'));
const StockImageSearchModal = lazy(() => import('@/components/CreateListingPage/StockImageSearchModal.jsx'));
const PremiumModal = lazy(() => import('@/components/PremiumModal.jsx'));
import Stepper from '@/components/CreateListingPage/Stepper.jsx';
import StepButtons from '@/components/CreateListingPage/StepButtons.jsx';
import { turkishProvincesAndDistricts } from '@/config/locations';
import { urlToBlob } from '@/lib/utils';
import { compressImage } from '@/lib/imageUtils';

// Modern skeleton component for create listing page
const CreateListingSkeleton = () => (
  <div className="mx-auto max-w-4xl px-4 py-6">
    <div className="space-y-6">
      {/* Stepper Skeleton */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center">
              <div className="w-8 h-8 bg-muted rounded-full"></div>
              {index < 4 && <div className="w-16 h-1 bg-muted mx-2"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Category Path Skeleton */}
      <div className="p-3 bg-muted/50 rounded-lg">
        <div className="h-4 bg-muted rounded w-48"></div>
      </div>

      {/* Content Skeleton */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Buttons Skeleton */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex justify-between">
              <div className="h-10 bg-muted rounded w-24"></div>
              <div className="h-10 bg-muted rounded w-24"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Modern form field skeleton component
const FormFieldSkeleton = ({ label, type = "input" }) => (
  <div className="space-y-2">
    <div className="h-4 bg-muted rounded w-24"></div>
    {type === "input" && <div className="h-10 bg-muted rounded"></div>}
    {type === "textarea" && <div className="h-20 bg-muted rounded"></div>}
    {type === "select" && <div className="h-10 bg-muted rounded"></div>}
    {type === "image" && (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="aspect-square bg-muted rounded"></div>
        ))}
      </div>
    )}
  </div>
);

// Lazy load step components
const Step1_Category = lazy(() => import('@/components/CreateListingPage/steps/Step1_Category.jsx'));
const Step2_Details = lazy(() => import('@/components/CreateListingPage/steps/Step2_Details.jsx'));
const Step3_Attributes = lazy(() => import('@/components/CreateListingPage/steps/Step3_Attributes.jsx'));
const Step4_Images = lazy(() => import('@/components/CreateListingPage/steps/Step4_Images.jsx'));
const Step5_Location = lazy(() => import('@/components/CreateListingPage/steps/Step5_Location.jsx'));
const Step6_Review = lazy(() => import('@/components/CreateListingPage/steps/Step6_Review.jsx'));
    
    const steps = [
      { name: 'Kategori' },
      { name: 'Detaylar' },
      { name: 'Özellikler' },
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
  // Progress modal state (enterprise-grade UX: non-dismissable until finished)
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [progressPhase, setProgressPhase] = useState('idle'); // idle | uploading | creating | processing | success | error
  const [progressMessage, setProgressMessage] = useState('');
    
      const {
        formData, setFormData, errors, setErrors,
        selectedMainCategory, setSelectedMainCategory,
        selectedSubCategory, setSelectedSubCategory,
        selectedSubSubCategory, setSelectedSubSubCategory,
        handleMainCategoryChange,
        handleSubCategoryChange,
        handleSubSubCategoryChange,
        selectedProvince, setSelectedProvince,
        selectedDistrict, setSelectedDistrict,
        handleInputChange, handlePremiumFeatureChange, handleImageArrayChange, handleRemoveImageFromArray,
        detectLocation,
        validateStep,
        categories,
        isLoadingCategories,
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
    // Open progress modal and run phases
    setIsProgressModalOpen(true);
    setProgressPhase('uploading');
    setProgressMessage('Görseller yükleniyor...');

    try {
      // Phase 1: Upload images (with progress tracking)
      const createdListing = await handleCreateListing(listingData, (progress) => {
        // Upload progress callback - this will update uploadProgress state
        if (progress >= 100) {
          // Upload completed, move to creating phase
          setTimeout(() => {
            setProgressPhase('creating');
            setProgressMessage('İlan kaydediliyor...');
          }, 500);
        }
      });

      // Phase 2: Listing creation completed
      if (createdListing) {
        await incrementUserUsage(currentUser.id, 'listing');

        // Phase 2: Success (directly after creating)
        setTimeout(() => {
          setProgressPhase('success');
          setProgressMessage('İlan başarıyla oluşturuldu. Onaylandıktan sonra yayına alınacak.');
        }, 500);
      } else {
        setProgressPhase('error');
        setProgressMessage('İlan oluşturma tamamlanamadı. Lütfen tekrar deneyin.');
      }
    } catch (e) {
      setProgressPhase('error');
      setProgressMessage('Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.');
    }
      };
    
      const nextStep = () => {
        console.log('🔍 DEBUG: nextStep called', { currentStep, totalSteps: steps.length });
        const allData = { formData, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, selectedProvince, selectedDistrict };
        console.log('🔍 DEBUG: allData', allData);
        
        const isValid = validateStep(currentStep, allData);
        console.log('🔍 DEBUG: validation result', { isValid, currentStep });
        
        if (currentStep < steps.length && isValid) {
          console.log('✅ DEBUG: Moving to next step');
          setCurrentStep(prev => prev + 1);
        } else {
          console.log('❌ DEBUG: Cannot move to next step', { 
            currentStep, 
            totalSteps: steps.length, 
            isValid,
            errors 
          });
        }
      };
    
      const prevStep = () => {
        if (currentStep > 1) {
          setCurrentStep(prev => prev - 1);
          setErrors({});
        }
      };
    
      const handleFinalSubmit = () => {
        if (validateStep(6, { formData })) {
            handleSubmit();
        }
      };
    
      const selectedCategoryPath = [selectedMainCategory, selectedSubCategory, selectedSubSubCategory].filter(Boolean).join(' > ');
      const selectedLocationPath = [selectedProvince, selectedDistrict, formData.neighborhood].filter(Boolean).join(' > ');
    
      if (loadingAuth) {
        return (
          <div className="mx-auto max-w-4xl px-4 py-6">
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="xl" />
            </div>
          </div>
        );
      }
    
      const renderStepContent = () => {
        const StepLoadingSpinner = () => (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-muted-foreground">Adım yükleniyor...</span>
          </div>
        );

        switch (currentStep) {
          case 1:
            return (
              <Suspense fallback={<StepLoadingSpinner />}>
                <Step1_Category 
                  categories={categories}
                  isLoadingCategories={isLoadingCategories}
                  selectedMainCategory={selectedMainCategory} 
                  onMainChange={handleMainCategoryChange} 
                  selectedSubCategory={selectedSubCategory} 
                  onSubChange={handleSubCategoryChange} 
                  selectedSubSubCategory={selectedSubSubCategory} 
                  onSubSubChange={handleSubSubCategoryChange} 
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
                <Step3_Attributes 
                  formData={formData} 
                  handleInputChange={handleInputChange} 
                  errors={errors}
                  selectedMainCategory={selectedMainCategory}
                  selectedSubCategory={selectedSubCategory}
                  selectedSubSubCategory={selectedSubSubCategory}
                />
              </Suspense>
            );
          case 4:
            return (
              <Suspense fallback={<StepLoadingSpinner />}>
                <Step4_Images 
                  formData={formData} 
                  handleImageArrayChange={handleImageArrayChange} 
                  handleRemoveImageFromArray={handleRemoveImageFromArray} 
                  handleInputChange={handleInputChange} 
                  onOpenStockModal={() => setIsStockModalOpen(true)} 
                  errors={errors} 
                />
              </Suspense>
            );
          case 5:
            return (
              <Suspense fallback={<StepLoadingSpinner />}>
                <Step5_Location 
                  selectedProvince={selectedProvince} 
                  setSelectedProvince={setSelectedProvince} 
                  selectedDistrict={selectedDistrict} 
                  setSelectedDistrict={setSelectedDistrict} 
                  formData={formData} 
                  handleInputChange={handleInputChange} 
                  onLocationDetect={handleLocationDetect}
                  detectLocation={detectLocation}
                  errors={errors} 
                />
              </Suspense>
            );
          case 6:
            return (
              <Suspense fallback={<StepLoadingSpinner />}>
                <Step6_Review 
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
          <div className="mx-auto max-w-4xl px-4 py-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Stepper */}
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Stepper currentStep={currentStep} steps={steps} />
              </motion.div>
              
              {/* Category Path */}
              {currentStep > 1 && selectedCategoryPath && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-3 bg-muted/50 rounded-lg text-sm text-center flex items-center justify-center gap-2"
                >
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-muted-foreground">Seçilen Kategori: </span>
                  <span className="font-bold text-primary">{selectedCategoryPath}</span>
                </motion.div>
              )}

              {/* Upload Progress */}
              {isUploading && uploadProgress > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-primary/10 border border-primary/20 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">İlan Yükleniyor...</span>
                    <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </motion.div>
              )}

              {/* Main Content */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
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
                    
                    {/* Step Buttons */}
                    <div className="mt-8 pt-6 border-t border-border">
                      <StepButtons 
                        currentStep={currentStep} 
                        totalSteps={steps.length}
                        onBack={prevStep} 
                        onNext={currentStep === steps.length ? handleFinalSubmit : nextStep} 
                        isSubmitting={isUploading}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Animated Timeline Progress Modal */}
              {isProgressModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md" role="dialog" aria-modal="true">
                  <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        {progressPhase === 'success' ? (
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : progressPhase === 'error' ? (
                          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        ) : (
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {progressPhase === 'success' ? '🎉 İlan Hazır!' : 
                         progressPhase === 'error' ? '❌ Hata Oluştu' : 
                         '🎯 İlanınız Yayına Hazırlanıyor'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{progressMessage}</p>
                    </div>

                    {/* Animated Timeline */}
                    <div className="space-y-6">
                      {/* Step 1: Image Upload */}
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                            progressPhase === 'uploading' ? 'bg-primary text-white scale-110' :
                            progressPhase === 'creating' || progressPhase === 'success' ? 'bg-green-500 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {progressPhase === 'uploading' ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : progressPhase === 'creating' || progressPhase === 'success' ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="text-sm font-semibold">1</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className={`font-medium transition-colors duration-300 ${
                            progressPhase === 'uploading' ? 'text-primary' :
                            progressPhase === 'creating' || progressPhase === 'success' ? 'text-green-600' :
                            'text-muted-foreground'
                          }`}>
                            Görseller yükleniyor...
                          </div>
                          {progressPhase === 'uploading' && (
                            <div className="mt-2">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">{uploadProgress}% tamamlandı</div>
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {progressPhase === 'uploading' ? (
                            <span className="text-xs text-primary font-medium">🔄</span>
                          ) : progressPhase === 'creating' || progressPhase === 'success' ? (
                            <span className="text-xs text-green-600 font-medium">✅</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">⏳</span>
                          )}
                        </div>
                      </div>

                      {/* Connecting Line */}
                      <div className="ml-5 w-px h-6 bg-gradient-to-b from-primary/30 to-muted/30"></div>

                      {/* Step 2: Saving */}
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                            progressPhase === 'creating' ? 'bg-primary text-white scale-110' :
                            progressPhase === 'success' ? 'bg-green-500 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {progressPhase === 'creating' ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : progressPhase === 'success' ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="text-sm font-semibold">2</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className={`font-medium transition-colors duration-300 ${
                            progressPhase === 'creating' ? 'text-primary' :
                            progressPhase === 'success' ? 'text-green-600' :
                            'text-muted-foreground'
                          }`}>
                            İlan kaydediliyor...
                          </div>
                          {progressPhase === 'creating' && (
                            <div className="mt-2">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full animate-pulse" style={{ width: '70%' }} />
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">Veritabanına kaydediliyor</div>
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {progressPhase === 'creating' ? (
                            <span className="text-xs text-primary font-medium">🔄</span>
                          ) : progressPhase === 'success' ? (
                            <span className="text-xs text-green-600 font-medium">✅</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">⏳</span>
                          )}
                        </div>
                      </div>

                      {/* Overall Progress */}
                      <div className="mt-6 pt-4 border-t border-border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Genel İlerleme</span>
                          <span className="text-sm text-muted-foreground">
                            {progressPhase === 'uploading' ? `${Math.round(uploadProgress / 2)}%` :
                             progressPhase === 'creating' ? '75%' :
                             progressPhase === 'success' ? '100%' : '0%'}
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary via-primary/80 to-green-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              width: progressPhase === 'uploading' ? `${uploadProgress / 2}%` :
                                     progressPhase === 'creating' ? '75%' :
                                     progressPhase === 'success' ? '100%' : '0%'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {progressPhase === 'success' && (
                      <div className="mt-8 space-y-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-2">
                            İlanınız onaylandıktan sonra arama sonuçlarında görüntülenecektir.
                          </div>
                        </div>
                        <Button 
                          onClick={() => {
                            setIsProgressModalOpen(false);
                            toast({ title: 'İlan Gönderildi', description: 'Onaylandıktan sonra arama sonuçlarında görünecek.' });
                            navigate(`/profil/${currentUser.id}`);
                          }}
                          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                          🎉 İlanlarıma Git
                        </Button>
                      </div>
                    )}

                    {progressPhase === 'error' && (
                      <div className="mt-8 space-y-4">
                        <Button 
                          onClick={() => {
                            setIsProgressModalOpen(false);
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          Kapat
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
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