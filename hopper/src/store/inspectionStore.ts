import { create } from 'zustand';

interface InspectionState {
  images: string[];
  addImage: (uri: string) => void;
  removeImage: (index: number) => void;
  clearImages: () => void;
  setImages: (uris: string[]) => void;
}

export const useInspectionStore = create<InspectionState>((set) => ({
  images: [],
  addImage: (uri) => set((state) => {
    // limit to 5 images for safety as per constraints
    if (state.images.length >= 5) return state;
    return { images: [...state.images, uri] };
  }),
  removeImage: (index) => set((state) => ({ 
    images: state.images.filter((_, i) => i !== index) 
  })),
  clearImages: () => set({ images: [] }),
  setImages: (uris) => set({ images: uris }),
}));
