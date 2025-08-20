import React from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Loader2, ArrowLeft } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { useEditListingForm } from '@/hooks/useEditListingForm';
    import EditFormFields from '@/components/EditListingPage/EditFormFields';
    
    const EditListingPage = () => {
      const { listingId } = useParams();
      const navigate = useNavigate();
      
      const {
        formData, setFormData,
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
      } = useEditListingForm(listingId);
    
      const onSubmit = async (e) => {
        e.preventDefault();
        const result = await handleSubmit(e);
        if (result) {
          navigate('/ilanlarim');
        }
      };
    
      if (loadingInitialData) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
            <span>İlan bilgileri yükleniyor...</span>
          </div>
        );
      }
    
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
        >
          <div className="flex items-center mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">İlanı Düzenle</h1>
          </div>
          
          <form onSubmit={onSubmit} className="glass-effect rounded-2xl p-6">
            <EditFormFields
              formData={formData}
              handleInputChange={handleInputChange}
              handlePremiumFeatureChange={handlePremiumFeatureChange}
              handleImageArrayChange={handleImageArrayChange}
              handleRemoveImageFromArray={handleRemoveImageFromArray}
              errors={errors}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              selectedMainCategory={selectedMainCategory}
              setSelectedMainCategory={setSelectedMainCategory}
              selectedSubCategory={selectedSubCategory}
              setSelectedSubCategory={setSelectedSubCategory}
              selectedSubSubCategory={selectedSubSubCategory}
              setSelectedSubSubCategory={setSelectedSubSubCategory}
              selectedProvince={selectedProvince}
              setSelectedProvince={setSelectedProvince}
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
            />
    
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isUploading}>
                İptal
              </Button>
              <Button type="submit" disabled={isUploading} className="btn-primary">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  'Değişiklikleri Kaydet'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      );
    };
    
    export default EditListingPage;