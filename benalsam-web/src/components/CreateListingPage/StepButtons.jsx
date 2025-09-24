import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

const StepButtons = ({ currentStep, totalSteps, onBack, onNext, isSubmitting, isUploading }) => {
  const isLastStep = currentStep === totalSteps;
  const isSubmittingOrUploading = isSubmitting || isUploading;
  
  console.log('🔍 DEBUG: StepButtons render', { 
    currentStep, 
    totalSteps, 
    isLastStep, 
    isSubmitting, 
    isUploading, 
    isSubmittingOrUploading 
  });

  return (
    <div className="flex gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={currentStep === 1 || isSubmittingOrUploading}
        className="flex-1"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Geri
      </Button>
      <Button
        type="button"
        onClick={() => {
          console.log('🔍 DEBUG: Next button clicked', { currentStep, isSubmittingOrUploading });
          onNext();
        }}
        disabled={isSubmittingOrUploading}
        className="flex-1 btn-primary"
      >
        {isLastStep ? (
          isSubmittingOrUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Yayınlanıyor...
            </>
          ) : (
            <>
              Onaya Gönder
              <CheckCircle className="w-4 h-4 ml-2" />
            </>
          )
        ) : (
          <>
            İleri
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
};

export default StepButtons;