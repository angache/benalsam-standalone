import React, { createContext, useContext, useState } from 'react';

export type CreateListingData = {
  category?: string;
  details?: any;
  images?: {
    images: { uri: string; name: string; isUploaded?: boolean; url?: string; isStockImage?: boolean; file?: any }[];
    mainImageIndex: number;
  };
  location?: any;
  confirm?: any;
};

type CreateListingContextType = {
  data: CreateListingData;
  setStepData: (step: keyof CreateListingData, value: any) => void;
  reset: () => void;
};

const CreateListingContext = createContext<CreateListingContextType | undefined>(undefined);

export const CreateListingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<CreateListingData>({});

  const setStepData = (step: keyof CreateListingData, value: any) => {
    console.log('🔍 setStepData - Step:', step);
    console.log('🔍 setStepData - Value:', value);
    console.log('🔍 setStepData - Previous data:', data);
    setData((prev) => {
      const newData = { ...prev, [step]: value };
      console.log('🔍 setStepData - New data:', newData);
      return newData;
    });
  };

  const reset = () => {
    setData({});
  };

  return (
    <CreateListingContext.Provider value={{ data, setStepData, reset }}>
      {children}
    </CreateListingContext.Provider>
  );
};

export const useCreateListingContext = () => {
  const ctx = useContext(CreateListingContext);
  if (!ctx) throw new Error('useCreateListingContext must be used within CreateListingProvider');
  return ctx;
}; 