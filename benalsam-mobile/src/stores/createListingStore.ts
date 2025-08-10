import { create } from 'zustand';

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

interface CreateListingState {
  data: CreateListingData;
  setStepData: (step: keyof CreateListingData, value: any) => void;
  reset: () => void;
}

export const useCreateListingStore = create<CreateListingState>((set, get) => ({
  data: {},

  setStepData: (step: keyof CreateListingData, value: any) => {
    set((state) => ({ 
      data: { ...state.data, [step]: value } 
    }));
  },

  reset: () => {
    set({ data: {} });
  },
})); 